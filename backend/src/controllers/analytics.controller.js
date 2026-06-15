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
import Expense from '../models/Expense.model.js';
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
  ] = await Promise.all([
    Bill.aggregate([{ $match: { status: 'PAID' } }, { $group: { _id: null, revenue: { $sum: '$total' }, orders: { $sum: 1 } } }]),
    Dealer.countDocuments({ status: 'ACTIVE' }),
    Complaint.countDocuments({ status: { $in: ['OPEN', 'IN_PROGRESS', 'ESCALATED'] } }),
    Inventory.countDocuments({ quantity: { $lte: 15 }, isDeleted: false }),
    GRN.countDocuments({ status: 'PENDING_VERIFICATION' }),
    Dispatch.countDocuments({ status: { $in: ['PACKED', 'IN_TRANSIT'] } }),
  ]);
  const revenue = paidBills[0]?.revenue || 0;
  const orders = paidBills[0]?.orders || 0;
  return { revenue, dealers, complaints: openComplaints, orders, lowStock, pendingGrn, pendingDispatch };
}

async function dealerKpis(dealerId) {
  if (!dealerId) return { sales: 0, bills: 0, outstanding: 0, team: 0, pendingGrn: 2, dispatches: 0 };
  const [salesAgg, bills, dealer, dispatches] = await Promise.all([
    Bill.aggregate([
      { $match: { dealer: dealerId, status: 'PAID' } },
      { $group: { _id: null, sales: { $sum: '$total' }, bills: { $sum: 1 } } },
    ]),
    Bill.countDocuments({ dealer: dealerId, status: { $in: ['SENT', 'DRAFT'] } }),
    Dealer.findById(dealerId).select('outstanding teamSize').lean(),
    Dispatch.countDocuments({ dealer: dealerId, status: { $in: ['IN_TRANSIT', 'PACKED'] } }),
  ]);
  return {
    sales: salesAgg[0]?.sales || 0,
    bills: salesAgg[0]?.bills || 0,
    outstanding: dealer?.outstanding || 0,
    team: dealer?.teamSize || 0,
    pendingGrn: 2,
    dispatches,
    sentBills: bills,
  };
}

async function serviceKpis() {
  const [openComplaints, spareRequests, returns, tickets] = await Promise.all([
    Complaint.countDocuments({ status: { $in: ['OPEN', 'IN_PROGRESS', 'ESCALATED'] } }),
    SpareRequest.countDocuments({ status: 'PENDING' }),
    Return.countDocuments({ status: { $in: ['REQUESTED', 'RECEIVED'] } }),
    Complaint.countDocuments({}),
  ]);
  return { openComplaints, spareRequests, returns, tickets, slaBreaches: 0, pendingParts: spareRequests };
}

async function customerKpis(userId) {
  const [warranties, serviceRequests, orders, spentAgg] = await Promise.all([
    Warranty.countDocuments({ status: 'ACTIVE' }),
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
      charts = { primary: await revenueChart(), secondary: await expenseChart() };
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
      kpis = await customerKpis(req.user._id);
      charts = { primary: await customerSpendChart(req.user._id), secondary: [] };
      break;
    case 'employee':
      kpis = { tasks: await Task.countDocuments({ status: { $ne: 'COMPLETED' } }), approvals: 0, reports: 0, team: 6, dealers: await Dealer.countDocuments({ status: 'ACTIVE' }), greenZone: 14, redZone: 4 };
      charts = { primary: await employeePerformanceChart(), secondary: [] };
      break;
    default:
      kpis = await adminKpis();
      charts = { primary: await revenueChart(), secondary: await expenseChart() };
  }

  return sendSuccess(res, { data: { kpis, activities: [], alerts: [], charts, panel } });
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
