import Bill from '../models/Bill.model.js';
import Complaint from '../models/Complaint.model.js';
import Dealer from '../models/Dealer.model.js';
import Inventory from '../models/Inventory.model.js';
import GRN from '../models/GRN.model.js';
import Dispatch from '../models/Dispatch.model.js';
import SpareRequest from '../models/SpareRequest.model.js';
import Return from '../models/Return.model.js';
import Warranty from '../models/Warranty.model.js';
import ServiceRequest from '../models/ServiceRequest.model.js';
import Task from '../models/Task.model.js';
import Order from '../models/Order.model.js';
import WebsiteOrder from '../models/WebsiteOrder.model.js';
import Expense from '../models/Expense.model.js';
import Employee from '../models/Employee.model.js';
import EmployeeDealerAssignment from '../models/EmployeeDealerAssignment.model.js';
import mongoose from 'mongoose';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';

async function revenueChart(months = 6) {
  const data = [];
  const now = new Date();
  for (let i = months - 1; i >= 0; i -= 1) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
    const agg = await Bill.aggregate([
      { $match: { status: 'PAID', paidAt: { $gte: start, $lte: end } } },
      { $group: { _id: null, revenue: { $sum: '$total' } } },
    ]);
    data.push({
      name: start.toLocaleString('en', { month: 'short' }),
      value: agg[0]?.revenue || 0,
    });
  }
  return data;
}

async function expenseChart() {
  const rows = await Expense.aggregate([
    { $match: { status: 'APPROVED' } },
    { $group: { _id: '$category', value: { $sum: '$amount' } } },
    { $sort: { value: -1 } },
    { $limit: 6 },
  ]);
  return rows.map((r) => ({ name: r._id, value: r.value }));
}

async function employeePerformanceChart() {
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const data = [];
  for (let i = 6; i >= 0; i -= 1) {
    const start = new Date();
    start.setDate(start.getDate() - i);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setHours(23, 59, 59, 999);
    const done = await Task.countDocuments({ status: 'COMPLETED', updatedAt: { $gte: start, $lte: end } });
    data.push({ name: dayNames[start.getDay()], value: done });
  }
  return data;
}

async function serviceTicketsChart() {
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const data = [];
  for (let i = 6; i >= 0; i -= 1) {
    const start = new Date();
    start.setDate(start.getDate() - i);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setHours(23, 59, 59, 999);
    const resolved = await Complaint.countDocuments({ status: 'RESOLVED', updatedAt: { $gte: start, $lte: end } });
    data.push({ name: dayNames[start.getDay()], value: resolved });
  }
  return data;
}

async function customerSpendChart(userId) {
  const data = [];
  const now = new Date();
  for (let i = 5; i >= 0; i -= 1) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
    const agg = await Order.aggregate([
      { $match: { customer: userId, status: { $ne: 'CANCELLED' }, createdAt: { $gte: start, $lte: end } } },
      { $group: { _id: null, value: { $sum: '$total' } } },
    ]);
    data.push({ name: start.toLocaleString('en', { month: 'short' }), value: agg[0]?.value || 0 });
  }
  return data;
}

async function dealerWeeklySales(dealerId) {
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const data = [];
  for (let i = 6; i >= 0; i -= 1) {
    const start = new Date();
    start.setDate(start.getDate() - i);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setHours(23, 59, 59, 999);
    const agg = await Bill.aggregate([
      { $match: { dealer: dealerId, status: 'PAID', paidAt: { $gte: start, $lte: end } } },
      { $group: { _id: null, value: { $sum: '$total' } } },
    ]);
    data.push({ name: dayNames[start.getDay()], value: agg[0]?.value || 0 });
  }
  return data;
}

async function adminKpis() {
  const [
    paidBills, dealers, openComplaints, lowStock, pendingGrn, pendingDispatch,
    storeSummary,
  ] = await Promise.all([
    Bill.aggregate([{ $match: { status: 'PAID' } }, { $group: { _id: null, revenue: { $sum: '$total' }, orders: { $sum: 1 } } }]),
    Dealer.countDocuments({ status: 'ACTIVE' }),
    Complaint.countDocuments({ status: { $in: ['OPEN', 'IN_PROGRESS', 'ESCALATED'] } }),
    Inventory.countDocuments({ quantity: { $lte: 15 }, isDeleted: false }),
    GRN.countDocuments({ status: 'PENDING_VERIFICATION' }),
    Dispatch.countDocuments({ status: { $in: ['PACKED', 'IN_TRANSIT'] } }),
    (async () => {
      const { storeSalesSummary } = await import('../services/store.service.js');
      return storeSalesSummary();
    })(),
  ]);
  const revenue = paidBills[0]?.revenue || 0;
  const orders = paidBills[0]?.orders || 0;
  return {
    revenue,
    dealers,
    complaints: openComplaints,
    orders,
    lowStock,
    pendingGrn,
    pendingDispatch,
    storeRevenue: storeSummary.monthRevenue || 0,
    storeOrders: storeSummary.monthOrders || 0,
    storeTodayRevenue: storeSummary.todayRevenue || 0,
    storeTodayOrders: storeSummary.todayOrders || 0,
    storePendingCod: storeSummary.pendingCod || 0,
    storeOnlinePaid: storeSummary.onlinePaid || 0,
  };
}

async function dealerKpis(dealerId) {
  if (!dealerId) return { sales: 0, bills: 0, outstanding: 0, team: 0, pendingGrn: 0, dispatches: 0 };
  const [salesAgg, bills, dealer, dispatches, pendingGrn] = await Promise.all([
    Bill.aggregate([
      { $match: { dealer: dealerId, status: 'PAID' } },
      { $group: { _id: null, sales: { $sum: '$total' }, bills: { $sum: 1 } } },
    ]),
    Bill.countDocuments({ dealer: dealerId, status: { $in: ['SENT', 'DRAFT'] } }),
    Dealer.findById(dealerId).select('outstanding teamSize').lean(),
    Dispatch.countDocuments({ dealer: dealerId, status: { $in: ['IN_TRANSIT', 'DISPATCHED', 'PACKED'] } }),
    Dispatch.countDocuments({
      dealer: dealerId,
      dealerConfirmedAt: null,
      status: { $in: ['IN_TRANSIT', 'DELIVERED', 'DISPATCHED'] },
    }),
  ]);
  return {
    sales: salesAgg[0]?.sales || 0,
    bills: salesAgg[0]?.bills || 0,
    outstanding: dealer?.outstanding || 0,
    team: dealer?.teamSize || 0,
    pendingGrn,
    dispatches,
    sentBills: bills,
  };
}

function deriveZone(achievementPct) {
  if (achievementPct >= 100) return 'GREEN';
  if (achievementPct >= 75) return 'YELLOW';
  return 'RED';
}

async function assignmentZoneStats(employeeId) {
  const assignments = await EmployeeDealerAssignment.find({ employee: employeeId }).lean();
  const details = await Promise.all(assignments.map(async (row) => {
    const dealerId = row.dealer;
    const agg = await Bill.aggregate([
      { $match: { dealer: new mongoose.Types.ObjectId(String(dealerId)), status: 'PAID' } },
      { $group: { _id: null, achieved: { $sum: '$total' } } },
    ]);
    const target = row.target || 500000;
    const achieved = agg[0]?.achieved || 0;
    const achievementPct = target > 0 ? Math.round((achieved / target) * 100) : 0;
    return row.zone || deriveZone(achievementPct);
  }));
  return {
    greenZone: details.filter((z) => z === 'GREEN').length,
    yellowZone: details.filter((z) => z === 'YELLOW').length,
    redZone: details.filter((z) => z === 'RED').length,
    dealerCount: assignments.length,
  };
}

async function managerKpis(user) {
  let employee = null;
  if (user.employeeId) employee = await Employee.findById(user.employeeId).lean();
  if (!employee) employee = await Employee.findOne({ user: user._id }).lean();
  if (!employee) {
    return { team: 0, dealers: 0, greenZone: 0, redZone: 0, tasks: 0, revenue: 0 };
  }

  const teamMembers = await Employee.find({ manager: employee._id, status: 'ACTIVE' }).lean();
  const employeeIds = [employee._id, ...teamMembers.map((m) => m._id)];
  const assignments = await EmployeeDealerAssignment.find({ employee: { $in: employeeIds } }).lean();

  const dealerIds = [...new Set(assignments.map((a) => String(a.dealer)))];
  const [revenueAgg, tasks] = await Promise.all([
    Bill.aggregate([
      { $match: { dealer: { $in: dealerIds.map((id) => new mongoose.Types.ObjectId(id)) }, status: 'PAID' } },
      { $group: { _id: null, revenue: { $sum: '$total' } } },
    ]),
    Task.countDocuments({ status: { $ne: 'COMPLETED' } }),
  ]);

  let greenZone = 0;
  let redZone = 0;
  for (const assignment of assignments) {
    const [salesAgg] = await Bill.aggregate([
      { $match: { dealer: assignment.dealer, status: 'PAID' } },
      { $group: { _id: null, achieved: { $sum: '$total' } } },
    ]);
    const achieved = salesAgg?.achieved || 0;
    const target = assignment.target || 500000;
    const pct = target > 0 ? (achieved / target) * 100 : 0;
    if (pct >= 100) greenZone += 1;
    else if (pct < 75) redZone += 1;
  }

  return {
    team: teamMembers.length,
    dealers: dealerIds.length,
    greenZone,
    redZone,
    tasks,
    revenue: revenueAgg[0]?.revenue || 0,
  };
}

async function employeeKpis(user) {
  let employee = null;
  if (user.employeeId) employee = await Employee.findById(user.employeeId).lean();
  if (!employee) employee = await Employee.findOne({ user: user._id }).lean();

  const zones = employee ? await assignmentZoneStats(employee._id) : { greenZone: 0, yellowZone: 0, redZone: 0, dealerCount: 0 };
  const [tasks, pendingApprovals] = await Promise.all([
    Task.countDocuments({ status: { $ne: 'COMPLETED' } }),
    Complaint.countDocuments({ status: { $in: ['OPEN', 'ESCALATED'] } }),
  ]);

  return {
    tasks,
    approvals: pendingApprovals,
    reports: 0,
    team: zones.dealerCount,
    dealers: zones.dealerCount,
    greenZone: zones.greenZone,
    yellowZone: zones.yellowZone,
    redZone: zones.redZone,
  };
}

async function buildAlerts(panel, user) {
  const alerts = [];
  const staleCutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const dispatchFilter = user?.dealerId ? { dealer: user.dealerId } : {};

  if (['admin', 'dealer'].includes(panel)) {
    const staleGrn = await Dispatch.countDocuments({
      ...dispatchFilter,
      dealerConfirmedAt: null,
      status: { $in: ['IN_TRANSIT', 'DELIVERED', 'DISPATCHED'] },
      updatedAt: { $lte: staleCutoff },
    });
    if (staleGrn > 0) {
      alerts.push({
        id: 'stale-grn',
        title: `${staleGrn} dispatch(es) awaiting dealer GRN (>7 days)`,
        variant: 'warning',
      });
    }
  }

  if (['admin', 'service'].includes(panel)) {
    const spareCutoff = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
    await SpareRequest.updateMany(
      {
        status: 'DISPATCHED',
        dispatchedAt: { $lte: spareCutoff },
        receivedAt: null,
        overdue: { $ne: true },
      },
      { $set: { overdue: true, overdueAt: new Date() } }
    );
    const [overdueSpares, overdueReturns] = await Promise.all([
      SpareRequest.countDocuments({ overdue: true }),
      Return.countDocuments({ overdue: true }),
    ]);
    if (overdueSpares > 0) {
      alerts.push({ id: 'overdue-spares', title: `${overdueSpares} spare dispatch(es) overdue`, variant: 'danger' });
    }
    if (overdueReturns > 0) {
      alerts.push({ id: 'overdue-returns', title: `${overdueReturns} defective return(s) overdue`, variant: 'danger' });
    }
  }

  if (panel === 'admin') {
    const lowStock = await Inventory.countDocuments({ quantity: { $lte: 15 }, isDeleted: false });
    if (lowStock > 0) {
      alerts.push({ id: 'low-stock', title: `${lowStock} SKU(s) at or below reorder level`, variant: 'warning' });
    }
  }

  return alerts;
}

async function serviceKpis() {
  const spareCutoff = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
  await SpareRequest.updateMany(
    {
      status: 'DISPATCHED',
      dispatchedAt: { $lte: spareCutoff },
      receivedAt: null,
      overdue: { $ne: true },
    },
    { $set: { overdue: true, overdueAt: new Date() } }
  );
  const [openComplaints, spareRequests, returns, tickets, overdueSpares, overdueReturns] = await Promise.all([
    Complaint.countDocuments({ status: { $in: ['OPEN', 'IN_PROGRESS', 'ESCALATED'] } }),
    SpareRequest.countDocuments({ status: 'PENDING' }),
    Return.countDocuments({ status: { $in: ['EXPECTED', 'OVERDUE'] } }),
    Complaint.countDocuments({}),
    SpareRequest.countDocuments({ overdue: true }),
    Return.countDocuments({ overdue: true }),
  ]);
  return {
    openComplaints,
    spareRequests,
    returns,
    tickets,
    slaBreaches: 0,
    pendingParts: spareRequests,
    overdueSpares,
    overdueReturns,
  };
}

async function customerKpis(userId, user) {
  const Customer = (await import('../models/Customer.model.js')).default;
  let profile = null;
  if (user?.email) profile = await Customer.findOne({ email: user.email.toLowerCase() }).lean();
  if (!profile && user?.phone) profile = await Customer.findOne({ phone: user.phone }).lean();

  const warrantyFilter = profile
    ? { $or: [{ customer: profile._id }, { customerName: profile.name }] }
    : {};

  const [warranties, serviceRequests, orders, spentAgg] = await Promise.all([
    Warranty.countDocuments({ ...warrantyFilter, status: 'ACTIVE' }),
    ServiceRequest.countDocuments({ customer: userId }),
    Order.countDocuments({ customer: userId, status: { $ne: 'CANCELLED' } }),
    Order.aggregate([
      { $match: { customer: userId, status: { $in: ['DELIVERED', 'IN_TRANSIT', 'CONFIRMED'] } } },
      { $group: { _id: null, spent: { $sum: '$total' } } },
    ]),
  ]);
  return { orders, warranties, serviceRequests, spent: spentAgg[0]?.spent || 0 };
}

export const getDashboard = asyncHandler(async (req, res) => {
  const panel = req.params.panel;
  let kpis = {};
  let charts = { primary: [], secondary: [] };

  switch (panel) {
    case 'admin':
      kpis = await adminKpis();
      {
        const { storeSalesChart } = await import('../services/store.service.js');
        const storeChart = await storeSalesChart(30);
        charts = {
          primary: await revenueChart(),
          secondary: await expenseChart(),
          store: storeChart,
        };
      }
      break;
    case 'dealer':
      kpis = await dealerKpis(req.user.dealerId);
      if (req.user.dealerId) {
        charts = { primary: await dealerWeeklySales(req.user.dealerId), secondary: [] };
      }
      break;
    case 'service':
      kpis = await serviceKpis();
      charts = { primary: await serviceTicketsChart(), secondary: [] };
      break;
    case 'customer':
      kpis = await customerKpis(req.user._id, req.user);
      charts = { primary: await customerSpendChart(req.user._id), secondary: [] };
      break;
    case 'employee':
      kpis = await employeeKpis(req.user);
      charts = { primary: await employeePerformanceChart(), secondary: [] };
      break;
    case 'manager':
      kpis = await managerKpis(req.user);
      charts = { primary: await employeePerformanceChart(), secondary: [] };
      break;
    default:
      kpis = await adminKpis();
      charts = { primary: await revenueChart(), secondary: await expenseChart() };
  }

  const alerts = await buildAlerts(panel, req.user);
  return sendSuccess(res, { data: { kpis, activities: [], alerts, charts, panel } });
});

export const getKpis = asyncHandler(async (req, res) => {
  const kpis = await adminKpis();
  return sendSuccess(res, { data: kpis });
});

export const getRevenue = asyncHandler(async (req, res) => {
  return sendSuccess(res, { data: await revenueChart(6) });
});

export const getOrdersAnalytics = asyncHandler(async (req, res) => {
  const [orderCount, billCount] = await Promise.all([
    Order.countDocuments({ status: { $ne: 'CANCELLED' } }),
    Bill.countDocuments({ status: 'PAID' }),
  ]);
  return sendSuccess(res, { data: { orders: orderCount, bills: billCount } });
});
