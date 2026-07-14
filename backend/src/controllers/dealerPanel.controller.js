import DealerInventory from '../models/DealerInventory.model.js';
import Dispatch from '../models/Dispatch.model.js';
import Bill from '../models/Bill.model.js';
import mongoose from 'mongoose';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess, sendError, sendPaginated } from '../utils/apiResponse.js';
import { parsePagination, buildSearchFilter } from '../utils/pagination.util.js';
import DealerTeamMember from '../models/DealerTeamMember.model.js';
import Report from '../models/Report.model.js';
import { mapDealerInventory, mapDispatch, mapDealerTeamMember, mapReport } from '../utils/docMapper.util.js';
import { runReport, getCatalog } from '../services/reports/reportRunner.service.js';
import { priceCatalogForDealer } from '../services/pricingEngine.service.js';

function dealerIdFromUser(user) {
  return user.dealerId;
}

const HSN_RATES = { '8501': 18, '8537': 18, '8413': 18, '4010': 12 };

export const getBillingCatalog = asyncHandler(async (req, res) => {
  const dealerId = dealerIdFromUser(req.user);
  if (!dealerId) return sendError(res, { message: 'Dealer context required', statusCode: 403 });

  const catalog = await priceCatalogForDealer(dealerId);
  const enriched = catalog.map((item) => ({
    ...item,
    gstRate: item.gstRate || HSN_RATES[item.hsn] || 18,
    pricingRuleApplied: item.appliedRules?.some((r) => r.source !== 'Base') ?? false,
  }));

  return sendSuccess(res, { data: enriched });
});

export const listDealerInventory = asyncHandler(async (req, res) => {  const dealerId = dealerIdFromUser(req.user);
  if (!dealerId) return sendError(res, { message: 'Dealer context required', statusCode: 403 });

  const { page, perPage, skip, sort } = parsePagination(req.query);
  const filter = { dealer: dealerId, ...buildSearchFilter(req.query.search, ['name', 'sku']) };
  const [data, total] = await Promise.all([
    DealerInventory.find(filter).sort(sort).skip(skip).limit(perPage).lean(),
    DealerInventory.countDocuments(filter),
  ]);
  return sendPaginated(res, { data: data.map(mapDealerInventory), total, page, perPage });
});

export const getDealerInventoryItem = asyncHandler(async (req, res) => {
  const dealerId = dealerIdFromUser(req.user);
  const item = await DealerInventory.findOne({ _id: req.params.id, dealer: dealerId }).lean();
  if (!item) return sendError(res, { message: 'Item not found', statusCode: 404 });
  return sendSuccess(res, { data: mapDealerInventory(item) });
});

export const listDealerDispatches = asyncHandler(async (req, res) => {
  const dealerId = dealerIdFromUser(req.user);
  if (!dealerId) return sendError(res, { message: 'Dealer context required', statusCode: 403 });

  const { page, perPage, skip, sort } = parsePagination(req.query);
  const filter = { dealer: dealerId, ...buildSearchFilter(req.query.search, ['dispatchNo']) };
  const [rows, total] = await Promise.all([
    Dispatch.find(filter).populate('warehouse', 'code').sort(sort).skip(skip).limit(perPage).lean(),
    Dispatch.countDocuments(filter),
  ]);
  return sendPaginated(res, { data: rows.map(mapDispatch), total, page, perPage });
});

export const getDealerDispatch = asyncHandler(async (req, res) => {
  const dealerId = dealerIdFromUser(req.user);
  const doc = await Dispatch.findOne({ _id: req.params.id, dealer: dealerId })
    .populate('warehouse', 'code').lean();
  if (!doc) return sendError(res, { message: 'Dispatch not found', statusCode: 404 });
  return sendSuccess(res, { data: mapDispatch(doc) });
});

export const getDealerDispatchTracking = asyncHandler(async (req, res) => {
  const dealerId = dealerIdFromUser(req.user);
  const doc = await Dispatch.findOne({ _id: req.params.id, dealer: dealerId }).select('timeline').lean();
  if (!doc) return sendError(res, { message: 'Dispatch not found', statusCode: 404 });
  const events = (doc.timeline || []).map((e) => ({
    id: String(e._id),
    title: e.title,
    description: e.description,
    timestamp: e.timestamp,
    variant: e.variant,
  }));
  return sendSuccess(res, { data: events });
});

export const listDealerGRN = asyncHandler(async (req, res) => {
  const dealerId = dealerIdFromUser(req.user);
  if (!dealerId) return sendError(res, { message: 'Dealer context required', statusCode: 403 });

  const { page, perPage, skip, sort } = parsePagination(req.query);
  const filter = {
    dealer: dealerId,
    status: { $in: ['IN_TRANSIT', 'DELIVERED'] },
    ...buildSearchFilter(req.query.search, ['dispatchNo']),
  };
  const [rows, total] = await Promise.all([
    Dispatch.find(filter).populate('warehouse', 'code').sort(sort).skip(skip).limit(perPage).lean(),
    Dispatch.countDocuments(filter),
  ]);
  const data = rows.map((d) => ({
    ...mapDispatch(d),
    grnNo: `DGRN-${d.dispatchNo}`,
    status: d.dealerConfirmedAt ? 'VERIFIED' : 'PENDING_VERIFICATION',
  }));
  return sendPaginated(res, { data, total, page, perPage });
});

export const getDealerGRN = asyncHandler(async (req, res) => {
  const dealerId = dealerIdFromUser(req.user);
  const doc = await Dispatch.findOne({ _id: req.params.id, dealer: dealerId }).populate('warehouse', 'code').lean();
  if (!doc) return sendError(res, { message: 'GRN not found', statusCode: 404 });
  return sendSuccess(res, {
    data: {
      ...mapDispatch(doc),
      grnNo: `DGRN-${doc.dispatchNo}`,
      status: doc.dealerConfirmedAt ? 'VERIFIED' : 'PENDING_VERIFICATION',
      lineItems: doc.lineItems,
    },
  });
});

export const listDealerTeam = asyncHandler(async (req, res) => {
  const dealerId = dealerIdFromUser(req.user);
  if (!dealerId) return sendError(res, { message: 'Dealer context required', statusCode: 403 });

  const { page, perPage, skip, sort } = parsePagination(req.query);
  const filter = { dealer: dealerId };
  if (req.query.status) filter.status = req.query.status;
  else filter.status = 'ACTIVE';
  const [rows, total] = await Promise.all([
    DealerTeamMember.find(filter).sort(sort).skip(skip).limit(perPage).lean(),
    DealerTeamMember.countDocuments(filter),
  ]);

  const enriched = await Promise.all(rows.map(async (member) => {
    const agg = await Bill.aggregate([
      { $match: { dealer: new mongoose.Types.ObjectId(String(dealerId)), teamMember: member._id, status: 'PAID' } },
      { $group: { _id: null, achieved: { $sum: '$total' }, bills: { $sum: 1 } } },
    ]);
    const achieved = agg[0]?.achieved || 0;
    const target = member.target || 500000;
    return {
      ...mapDealerTeamMember(member),
      achieved,
      bills: agg[0]?.bills || 0,
      achievementPct: target > 0 ? Math.round((achieved / target) * 100) : 0,
    };
  }));

  return sendPaginated(res, { data: enriched, total, page, perPage });
});

export const getDealerTeamMember = asyncHandler(async (req, res) => {
  const dealerId = dealerIdFromUser(req.user);
  if (!dealerId) return sendError(res, { message: 'Dealer context required', statusCode: 403 });
  const doc = await DealerTeamMember.findOne({ _id: req.params.id, dealer: dealerId }).lean();
  if (!doc) return sendError(res, { message: 'Team member not found', statusCode: 404 });
  return sendSuccess(res, { data: mapDealerTeamMember(doc) });
});

export const createTeamMember = asyncHandler(async (req, res) => {
  const dealerId = dealerIdFromUser(req.user);
  if (!dealerId) return sendError(res, { message: 'Dealer context required', statusCode: 403 });

  const doc = await DealerTeamMember.create({
    dealer: dealerId,
    name: req.body.name,
    role: req.body.role || 'Sales Executive',
    email: req.body.email,
    target: req.body.target ?? 500000,
    achieved: req.body.achieved ?? 0,
    status: 'ACTIVE',
  });
  return sendCreated(res, { data: mapDealerTeamMember(doc.toObject()), message: 'Team member added' });
});

export const updateTeamMember = asyncHandler(async (req, res) => {
  const dealerId = dealerIdFromUser(req.user);
  if (!dealerId) return sendError(res, { message: 'Dealer context required', statusCode: 403 });

  const doc = await DealerTeamMember.findOneAndUpdate(
    { _id: req.params.id, dealer: dealerId },
    {
      name: req.body.name,
      role: req.body.role,
      email: req.body.email,
      target: req.body.target,
      achieved: req.body.achieved,
    },
    { new: true, runValidators: true }
  ).lean();
  if (!doc) return sendError(res, { message: 'Team member not found', statusCode: 404 });
  return sendSuccess(res, { data: mapDealerTeamMember(doc), message: 'Team member updated' });
});

export const deactivateTeamMember = asyncHandler(async (req, res) => {
  const dealerId = dealerIdFromUser(req.user);
  if (!dealerId) return sendError(res, { message: 'Dealer context required', statusCode: 403 });

  const doc = await DealerTeamMember.findOneAndUpdate(
    { _id: req.params.id, dealer: dealerId },
    { status: 'INACTIVE' },
    { new: true }
  ).lean();
  if (!doc) return sendError(res, { message: 'Team member not found', statusCode: 404 });
  return sendSuccess(res, { data: mapDealerTeamMember(doc), message: 'Team member deactivated' });
});

export const getTeamPerformance = asyncHandler(async (req, res) => {
  const dealerId = dealerIdFromUser(req.user);
  if (!dealerId) return sendError(res, { message: 'Dealer context required', statusCode: 403 });

  const members = await DealerTeamMember.find({ dealer: dealerId, status: 'ACTIVE' }).lean();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const memberStats = await Promise.all(members.map(async (m) => {
    const [allTime, thisMonth] = await Promise.all([
      Bill.aggregate([
        { $match: { dealer: new mongoose.Types.ObjectId(String(dealerId)), teamMember: m._id, status: 'PAID' } },
        { $group: { _id: null, revenue: { $sum: '$total' }, count: { $sum: 1 } } },
      ]),
      Bill.aggregate([
        { $match: { dealer: new mongoose.Types.ObjectId(String(dealerId)), teamMember: m._id, status: 'PAID', paidAt: { $gte: monthStart } } },
        { $group: { _id: null, revenue: { $sum: '$total' }, count: { $sum: 1 } } },
      ]),
    ]);
    const achieved = allTime[0]?.revenue || 0;
    const monthlyRevenue = thisMonth[0]?.revenue || 0;
    const target = m.target || 500000;
    return {
      id: String(m._id),
      name: m.name,
      role: m.role,
      target,
      achieved,
      monthlyRevenue,
      bills: allTime[0]?.count || 0,
      achievementPct: target > 0 ? Math.round((achieved / target) * 100) : 0,
    };
  }));

  const monthlyTrend = [];
  for (let i = 5; i >= 0; i -= 1) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
    // eslint-disable-next-line no-await-in-loop
    const agg = await Bill.aggregate([
      { $match: { dealer: new mongoose.Types.ObjectId(String(dealerId)), status: 'PAID', paidAt: { $gte: start, $lte: end } } },
      { $group: { _id: null, revenue: { $sum: '$total' } } },
    ]);
    monthlyTrend.push({ name: start.toLocaleString('en', { month: 'short' }), value: agg[0]?.revenue || 0 });
  }

  return sendSuccess(res, {
    data: {
      members: memberStats,
      monthlyTrend,
      totalTarget: memberStats.reduce((s, m) => s + m.target, 0),
      totalAchieved: memberStats.reduce((s, m) => s + m.achieved, 0),
    },
  });
});

export const getTeamLeaderboard = asyncHandler(async (req, res) => {
  const dealerId = dealerIdFromUser(req.user);
  if (!dealerId) return sendError(res, { message: 'Dealer context required', statusCode: 403 });

  const members = await DealerTeamMember.find({ dealer: dealerId, status: 'ACTIVE' }).lean();
  const ranked = await Promise.all(members.map(async (m) => {
    const agg = await Bill.aggregate([
      { $match: { dealer: new mongoose.Types.ObjectId(String(dealerId)), teamMember: m._id, status: 'PAID' } },
      { $group: { _id: null, revenue: { $sum: '$total' }, orders: { $sum: 1 } } },
    ]);
    const revenue = agg[0]?.revenue || 0;
    const target = m.target || 500000;
    return {
      id: String(m._id),
      name: m.name,
      revenue,
      orders: agg[0]?.orders || 0,
      achievementPct: target > 0 ? Math.round((revenue / target) * 100) : 0,
      growth: 0,
    };
  }));

  ranked.sort((a, b) => b.revenue - a.revenue);
  return sendSuccess(res, { data: ranked });
});

export const getDealerReportCatalog = asyncHandler(async (req, res) => {
  const dealerId = dealerIdFromUser(req.user);
  if (!dealerId) return sendError(res, { message: 'Dealer context required', statusCode: 403 });
  return sendSuccess(res, { data: getCatalog(req.user) });
});

export const runDealerReport = asyncHandler(async (req, res) => {
  const dealerId = dealerIdFromUser(req.user);
  if (!dealerId) return sendError(res, { message: 'Dealer context required', statusCode: 403 });

  const { reportCode, fromDate, toDate } = req.body;
  if (!reportCode) return sendError(res, { message: 'reportCode is required', statusCode: 400 });

  try {
    const result = await runReport({
      reportCode,
      fromDate,
      toDate,
      user: req.user,
      save: true,
    });
    return sendSuccess(res, {
      data: mapReport(result),
      message: `${result.title} generated from database`,
    });
  } catch (err) {
    return sendError(res, {
      message: err.message || 'Failed to generate report',
      statusCode: err.statusCode || 500,
    });
  }
});

export const getDealerReport = asyncHandler(async (req, res) => {
  const dealerId = dealerIdFromUser(req.user);
  if (!dealerId) return sendError(res, { message: 'Dealer context required', statusCode: 403 });

  const doc = await Report.findOne({
    _id: req.params.id,
    dealer: dealerId,
    reportCode: { $exists: true },
    'data.meta.source': 'database',
  }).lean();
  if (!doc) return sendError(res, { message: 'Report not found', statusCode: 404 });
  return sendSuccess(res, { data: mapReport(doc) });
});

export const listDealerReports = asyncHandler(async (req, res) => {
  const dealerId = dealerIdFromUser(req.user);
  if (!dealerId) return sendError(res, { message: 'Dealer context required', statusCode: 403 });

  const { page, perPage, skip, sort } = parsePagination(req.query);
  const filter = {
    dealer: dealerId,
    reportCode: { $exists: true, $ne: null },
    'data.meta.source': 'database',
  };
  if (req.query.status) filter.status = req.query.status;

  const [rows, total] = await Promise.all([
    Report.find(filter).sort(sort).skip(skip).limit(perPage).lean(),
    Report.countDocuments(filter),
  ]);
  return sendPaginated(res, { data: rows.map(mapReport), total, page, perPage });
});

