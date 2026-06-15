import Dealer from '../models/Dealer.model.js';
import DealerInventory from '../models/DealerInventory.model.js';
import DealerTeamMember from '../models/DealerTeamMember.model.js';
import Bill from '../models/Bill.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess, sendCreated, sendError, sendPaginated } from '../utils/apiResponse.js';
import { parsePagination, buildSearchFilter } from '../utils/pagination.util.js';
import { mapDealer, mapDealerInventory, mapDealerTeamMember } from '../utils/docMapper.util.js';
import { nextSequence } from '../utils/sequence.util.js';

export const listDealers = asyncHandler(async (req, res) => {
  const { page, perPage, skip, sort } = parsePagination(req.query);
  const filter = { ...buildSearchFilter(req.query.search, ['name', 'code', 'city', 'gstin']) };
  if (req.query.status) filter.status = req.query.status;

  const [data, total] = await Promise.all([
    Dealer.find(filter).sort(sort).skip(skip).limit(perPage).lean(),
    Dealer.countDocuments(filter),
  ]);
  return sendPaginated(res, { data: data.map(mapDealer), total, page, perPage });
});

export const getDealer = asyncHandler(async (req, res) => {
  const dealer = await Dealer.findById(req.params.id).lean();
  if (!dealer) return sendError(res, { message: 'Dealer not found', statusCode: 404 });
  return sendSuccess(res, { data: mapDealer(dealer) });
});

export const createDealer = asyncHandler(async (req, res) => {
  const body = req.body;
  const dealer = await Dealer.create({
    code: body.code || nextSequence('DLR'),
    name: body.name,
    city: body.city,
    state: body.state,
    gstin: body.gstin,
    email: body.email || body.contactEmail,
    phone: body.phone || body.contactPhone,
    creditLimit: body.creditLimit ?? 0,
    documentUrl: body.documentUrl || null,
    logoUrl: body.logoUrl || null,
    status: body.status || 'PENDING_ONBOARDING',
  });
  return sendCreated(res, { data: mapDealer(dealer.toObject()), message: 'Dealer created' });
});

export const updateDealerStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const allowed = ['ACTIVE', 'PENDING_ONBOARDING', 'SUSPENDED'];
  if (!allowed.includes(status)) {
    return sendError(res, { message: 'Invalid status', statusCode: 400 });
  }
  const update = { status };
  if (status === 'ACTIVE') update.onboardedAt = new Date();
  const dealer = await Dealer.findByIdAndUpdate(req.params.id, update, { new: true }).lean();
  if (!dealer) return sendError(res, { message: 'Dealer not found', statusCode: 404 });
  return sendSuccess(res, { data: mapDealer(dealer), message: 'Dealer status updated' });
});

export const getDealerInventory = asyncHandler(async (req, res) => {
  const items = await DealerInventory.find({ dealer: req.params.id }).lean();
  return sendSuccess(res, { data: items.map(mapDealerInventory) });
});

export const getDealerTeam = asyncHandler(async (req, res) => {
  const dealerId = req.params.id;
  const members = await DealerTeamMember.find({ dealer: dealerId, status: 'ACTIVE' }).lean();
  return sendSuccess(res, { data: members.map(mapDealerTeamMember) });
});

export const getDealerPerformance = asyncHandler(async (req, res) => {
  const dealerId = req.params.id;
  const dealer = await Dealer.findById(dealerId).lean();
  if (!dealer) return sendError(res, { message: 'Dealer not found', statusCode: 404 });

  const [salesAgg, team] = await Promise.all([
    Bill.aggregate([
      { $match: { dealer: dealer._id, status: 'PAID' } },
      { $group: { _id: null, revenue: { $sum: '$total' }, bills: { $sum: 1 } } },
    ]),
    DealerTeamMember.countDocuments({ dealer: dealerId, status: 'ACTIVE' }),
  ]);

  return sendSuccess(res, {
    data: {
      dealer: mapDealer(dealer),
      revenue: salesAgg[0]?.revenue || 0,
      bills: salesAgg[0]?.bills || 0,
      outstanding: dealer.outstanding,
      teamSize: team || dealer.teamSize,
      creditLimit: dealer.creditLimit,
    },
  });
});
