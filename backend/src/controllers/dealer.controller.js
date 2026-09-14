import Dealer from '../models/Dealer.model.js';
import DealerInventory from '../models/DealerInventory.model.js';
import DealerTeamMember from '../models/DealerTeamMember.model.js';
import Bill from '../models/Bill.model.js';
import User from '../models/User.model.js';
import { ROLES } from '../config/constants.js';
import { sendDealerWelcomeEmail } from '../services/email.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess, sendCreated, sendError, sendPaginated } from '../utils/apiResponse.js';
import { parsePagination, buildSearchFilter } from '../utils/pagination.util.js';
import { mapDealer, mapDealerInventory, mapDealerTeamMember } from '../utils/docMapper.util.js';
import { nextSequence } from '../utils/sequence.util.js';

async function ensureDealerUniqueness({ code, gstin, email, phone, excludeId }) {
  const checks = [];
  if (code) checks.push({ code: String(code).toUpperCase().trim() });
  if (gstin) checks.push({ gstin: String(gstin).toUpperCase().trim() });
  if (email) checks.push({ email: String(email).toLowerCase().trim() });
  if (phone) checks.push({ phone: String(phone).trim() });
  if (!checks.length) return;
  const query = { $or: checks };
  if (excludeId) query._id = { $ne: excludeId };
  const duplicate = await Dealer.findOne(query).lean();
  if (duplicate) {
    throw Object.assign(new Error('Dealer already exists with same code/GSTIN/email/phone'), { statusCode: 409 });
  }
}

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
  const dealerCode = body.code || nextSequence('DLR');
  const dealerEmail = (body.email || body.contactEmail || '').toLowerCase().trim();
  const dealerPhone = (body.phone || body.contactPhone || '').trim();

  await ensureDealerUniqueness({
    code: dealerCode,
    gstin: body.gstin,
    email: dealerEmail,
    phone: dealerPhone,
  });

  const rawPassword = body.password?.trim() || `Haion@${Math.floor(1000 + Math.random() * 9000)}`;

  const dealer = await Dealer.create({
    code: dealerCode,
    name: body.name,
    city: body.city,
    state: body.state,
    gstin: body.gstin,
    email: dealerEmail,
    phone: dealerPhone,
    creditLimit: body.creditLimit ?? 0,
    documentUrl: body.documentUrl || null,
    documents: Array.isArray(body.documents) ? body.documents : (body.documentUrl ? [{ type: 'GENERAL', label: 'Primary document', url: body.documentUrl }] : []),
    gstExpiryDate: body.gstExpiryDate || null,
    logoUrl: body.logoUrl || null,
    status: body.status || 'PENDING_ONBOARDING',
  });

  // Create or link User account for Dealer Portal login
  let user = null;
  if (dealerEmail) {
    user = await User.findOne({ email: dealerEmail });
    if (!user) {
      const hashedPassword = await User.hashPassword(rawPassword);
      user = await User.create({
        email: dealerEmail,
        password: hashedPassword,
        firstName: (body.contactName || body.name || 'Dealer').split(' ')[0],
        lastName: (body.contactName || body.name || 'Dealer').split(' ').slice(1).join(' ') || 'Owner',
        phone: dealerPhone || '0000000000',
        role: ROLES.DEALER_ADMIN,
        dealerId: dealer._id,
        isActive: true,
      });
    } else {
      user.dealerId = dealer._id;
      user.role = ROLES.DEALER_ADMIN;
      if (body.password) {
        user.password = await User.hashPassword(rawPassword);
      }
      await user.save();
    }
  }

  // Send Welcome Email with credentials directly to the dealer
  let emailSent = false;
  if (dealerEmail) {
    try {
      const emailRes = await sendDealerWelcomeEmail({
        to: dealerEmail,
        dealerName: dealer.name,
        dealerCode: dealer.code,
        email: dealerEmail,
        password: rawPassword,
      });
      emailSent = !emailRes?.error;
    } catch (err) {
      console.error('[dealer:welcome-email:err]', err.message);
    }
  }

  return sendCreated(res, {
    data: {
      ...mapDealer(dealer.toObject()),
      credentials: {
        email: dealerEmail,
        temporaryPassword: rawPassword,
        emailSent,
      },
    },
    message: emailSent
      ? 'Dealer created and login credentials emailed successfully'
      : 'Dealer created and login account generated',
  });
});

export const updateDealer = asyncHandler(async (req, res) => {
  const allowed = ['name', 'city', 'state', 'gstin', 'email', 'phone', 'creditLimit', 'documentUrl', 'documents', 'logoUrl', 'gstExpiryDate', 'region', 'tier'];
  const update = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) update[key] = req.body[key];
  }
  await ensureDealerUniqueness({
    code: req.body.code,
    gstin: update.gstin,
    email: update.email,
    phone: update.phone,
    excludeId: req.params.id,
  });
  const dealer = await Dealer.findByIdAndUpdate(req.params.id, update, { new: true }).lean();
  if (!dealer) return sendError(res, { message: 'Dealer not found', statusCode: 404 });
  return sendSuccess(res, { data: mapDealer(dealer), message: 'Dealer updated' });
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
