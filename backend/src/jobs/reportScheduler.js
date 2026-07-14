import cron from 'node-cron';
import Bill from '../models/Bill.model.js';
import ServiceRequest from '../models/ServiceRequest.model.js';
import SpareRequest from '../models/SpareRequest.model.js';
import Dealer from '../models/Dealer.model.js';
import Employee from '../models/Employee.model.js';
import User from '../models/User.model.js';
import ReportDelivery from '../models/ReportDelivery.model.js';
import { sendEmail } from '../services/email.service.js';
import { ROLES } from '../config/constants.js';

const MAX_RETRY = 3;

function startOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfWeek(date = new Date()) {
  const d = startOfDay(date);
  const day = d.getDay();
  const diff = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - diff);
  return d;
}

function startOfMonth(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

async function aggregateAdmin(since) {
  const [revenue, openTickets, openSpares] = await Promise.all([
    Bill.aggregate([
      { $match: { status: 'PAID', paidAt: { $gte: since } } },
      { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } },
    ]),
    ServiceRequest.countDocuments({ status: { $nin: ['CLOSED', 'CANCELLED'] } }),
    SpareRequest.countDocuments({ status: { $nin: ['COMPLETED', 'REJECTED', 'CANCELLED'] } }),
  ]);
  return {
    revenue: revenue[0]?.total || 0,
    bills: revenue[0]?.count || 0,
    openTickets,
    openSpares,
    periodStart: since.toISOString().slice(0, 10),
  };
}

async function aggregateDealer(dealerId, since) {
  const [revenue, bills] = await Promise.all([
    Bill.aggregate([
      { $match: { dealer: dealerId, status: 'PAID', paidAt: { $gte: since } } },
      { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } },
    ]),
    Bill.countDocuments({ dealer: dealerId, createdAt: { $gte: since } }),
  ]);
  return {
    revenue: revenue[0]?.total || 0,
    paidBills: revenue[0]?.count || 0,
    totalBills: bills,
    periodStart: since.toISOString().slice(0, 10),
  };
}

async function aggregateEmployee(employeeId, since) {
  const employee = await Employee.findById(employeeId).lean();
  if (!employee) return null;

  const dealerIds = employee.dealerId
    ? [employee.dealerId]
    : (await Employee.find({ manager: employeeId, status: 'ACTIVE' }).select('dealerId').lean())
        .map((e) => e.dealerId)
        .filter(Boolean);

  if (dealerIds.length === 0) {
    return { revenue: 0, paidBills: 0, assignedDealers: 0, periodStart: since.toISOString().slice(0, 10) };
  }

  const revenue = await Bill.aggregate([
    { $match: { dealer: { $in: dealerIds }, status: 'PAID', paidAt: { $gte: since } } },
    { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } },
  ]);

  return {
    revenue: revenue[0]?.total || 0,
    paidBills: revenue[0]?.count || 0,
    assignedDealers: dealerIds.length,
    periodStart: since.toISOString().slice(0, 10),
  };
}

async function aggregateService() {
  const [openTickets, pendingSpares, inProgress] = await Promise.all([
    ServiceRequest.countDocuments({ status: { $nin: ['CLOSED', 'CANCELLED'] } }),
    SpareRequest.countDocuments({ status: { $in: ['PENDING', 'APPROVED', 'DISPATCHED'] } }),
    ServiceRequest.countDocuments({ status: { $in: ['IN_PROGRESS', 'PARTS_ORDERED', 'PARTS_RECEIVED'] } }),
  ]);
  return { openTickets, pendingSpares, inProgress };
}

function buildHtml(reportType, recipientType, data) {
  const title = `Haion ERP — ${reportType} ${recipientType} Report`;
  const rows = Object.entries(data)
    .filter(([k]) => k !== 'periodStart')
    .map(([k, v]) => `<p><strong>${k}:</strong> ${typeof v === 'number' && k.toLowerCase().includes('revenue') ? `₹${v.toLocaleString('en-IN')}` : v}</p>`)
    .join('');
  return `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <h2 style="color:#4f46e5">${title}</h2>
      ${data.periodStart ? `<p>Period from: ${data.periodStart}</p>` : ''}
      ${rows}
      <p style="color:#64748b;font-size:12px">Generated ${new Date().toLocaleString()}</p>
    </div>`;
}

async function deliverReport(reportType, recipientType, email, data, name = '') {
  const delivery = await ReportDelivery.create({
    reportType,
    recipientType,
    recipientEmail: email,
    subject: `Haion ${reportType} ${recipientType} Report${name ? ` — ${name}` : ''}`,
    reportData: data,
    status: 'PENDING',
  });

  try {
    await sendEmail({
      to: email,
      subject: delivery.subject,
      html: buildHtml(reportType, recipientType, data),
    });
    delivery.status = 'SENT';
    delivery.sentAt = new Date();
    await delivery.save();
  } catch (err) {
    delivery.status = 'FAILED';
    delivery.retryCount += 1;
    delivery.lastError = err.message;
    if (delivery.retryCount <= MAX_RETRY) {
      const delayMins = Math.min(60, 5 * (2 ** (delivery.retryCount - 1)));
      delivery.nextRetryAt = new Date(Date.now() + delayMins * 60 * 1000);
    } else {
      delivery.nextRetryAt = undefined;
    }
    await delivery.save();
  }
}

async function retryFailedDeliveries() {
  const now = new Date();
  const failed = await ReportDelivery.find({
    status: 'FAILED',
    retryCount: { $lt: MAX_RETRY },
    nextRetryAt: { $lte: now },
  }).limit(50);

  for (const delivery of failed) {
    try {
      await sendEmail({
        to: delivery.recipientEmail,
        subject: delivery.subject,
        html: buildHtml(delivery.reportType, delivery.recipientType, delivery.reportData || {}),
      });
      delivery.status = 'SENT';
      delivery.sentAt = new Date();
      delivery.lastError = undefined;
      delivery.nextRetryAt = undefined;
      await delivery.save();
    } catch (err) {
      delivery.status = 'FAILED';
      delivery.retryCount += 1;
      delivery.lastError = err.message;
      if (delivery.retryCount <= MAX_RETRY) {
        const delayMins = Math.min(60, 5 * (2 ** (delivery.retryCount - 1)));
        delivery.nextRetryAt = new Date(Date.now() + delayMins * 60 * 1000);
      } else {
        delivery.nextRetryAt = undefined;
      }
      await delivery.save();
    }
  }
}

async function deliverAdminReport(reportType, since) {
  const data = await aggregateAdmin(since);
  const adminEmail = process.env.ADMIN_REPORT_EMAIL || 'admin@haion.com';
  await deliverReport(reportType, 'ADMIN', adminEmail, data, 'Admin');
}

async function deliverDealerReports(reportType, since) {
  const dealers = await Dealer.find({ status: 'ACTIVE', email: { $exists: true, $ne: '' } }).lean();
  await Promise.all(dealers.map(async (dealer) => {
    const data = await aggregateDealer(dealer._id, since);
    await deliverReport(reportType, 'DEALER', dealer.email, { ...data, dealerName: dealer.name }, dealer.name);
  }));
}

async function deliverEmployeeReports(reportType, since) {
  const employees = await Employee.find({ status: 'ACTIVE', role: ROLES.EMPLOYEE }).lean();
  await Promise.all(employees.map(async (emp) => {
    const data = await aggregateEmployee(emp._id, since);
    if (!data) return;
    await deliverReport(reportType, 'EMPLOYEE', emp.email, data, `${emp.firstName} ${emp.lastName}`);
  }));
}

async function deliverManagerReports(reportType, since) {
  const managers = await Employee.find({ status: 'ACTIVE', role: ROLES.MANAGER }).lean();
  await Promise.all(managers.map(async (mgr) => {
    const data = await aggregateEmployee(mgr._id, since);
    if (!data) return;
    await deliverReport(reportType, 'MANAGER', mgr.email, data, `${mgr.firstName} ${mgr.lastName}`);
  }));
}

async function deliverServiceReports(reportType) {
  const data = await aggregateService();
  const users = await User.find({ role: ROLES.SERVICE_CENTER, isActive: true }).select('email firstName lastName').lean();
  const recipients = users.length > 0
    ? users
    : [{ email: process.env.SERVICE_REPORT_EMAIL || 'service@haion.com', firstName: 'Service', lastName: 'Center' }];

  await Promise.all(recipients.map((u) =>
    deliverReport(reportType, 'SERVICE', u.email, data, `${u.firstName} ${u.lastName}`)
  ));
}

async function runScheduledReports(reportType, sinceFn) {
  const since = sinceFn();
  await deliverAdminReport(reportType, since);
  await deliverDealerReports(reportType, since);
  await deliverEmployeeReports(reportType, since);
  await deliverManagerReports(reportType, since);
  await deliverServiceReports(reportType);
}

export function startReportScheduler() {
  cron.schedule('0 8 * * *', () => runScheduledReports('DAILY', () => startOfDay()));
  cron.schedule('0 8 * * 1', () => runScheduledReports('WEEKLY', () => startOfWeek()));
  cron.schedule('0 8 1 * *', () => runScheduledReports('MONTHLY', () => startOfMonth()));
  cron.schedule('*/10 * * * *', () => retryFailedDeliveries());
}
