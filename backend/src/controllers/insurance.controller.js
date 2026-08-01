import mongoose from 'mongoose';
import InsuranceClaim from '../models/InsuranceClaim.model.js';
import InsuranceWalletTransaction from '../models/InsuranceWalletTransaction.model.js';
import Dealer from '../models/Dealer.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess, sendCreated, sendError, sendPaginated } from '../utils/apiResponse.js';
import { parsePagination, buildSearchFilter } from '../utils/pagination.util.js';
import { toPublicDoc } from '../utils/serialize.util.js';

function mapClaim(doc) {
  return toPublicDoc(doc);
}

function mapDealerWallet(doc) {
  return {
    id: String(doc._id),
    code: doc.code,
    name: doc.name,
    city: doc.city,
    state: doc.state,
    insuranceWalletBalance: doc.insuranceWalletBalance || 0,
  };
}

async function generateClaimNo() {
  const year = new Date().getFullYear();
  const last = await InsuranceClaim.findOne(
    { sequenceNumber: { $exists: true } },
    { sequenceNumber: 1 },
    { sort: { sequenceNumber: -1 } }
  ).lean();
  const seq = (last?.sequenceNumber || 0) + 1;
  return { claimNo: `INSC-${year}-${String(seq).padStart(4, '0')}`, sequenceNumber: seq };
}

// ── Wallets ───────────────────────────────────────────────────────────────────

/** GET /api/insurance/wallets — Admin: list all dealer wallet balances */
export const listWallets = asyncHandler(async (req, res) => {
  const { page, perPage, skip, sort } = parsePagination(req.query);
  const filter = buildSearchFilter(req.query.search, ['name', 'code', 'city']);

  const [rows, total] = await Promise.all([
    Dealer.find(filter).select('code name city state insuranceWalletBalance').sort(sort).skip(skip).limit(perPage).lean(),
    Dealer.countDocuments(filter),
  ]);
  return sendPaginated(res, { data: rows.map(mapDealerWallet), total, page, perPage });
});

/** GET /api/insurance/wallets/:dealerId — Admin or the dealer themselves */
export const getDealerWallet = asyncHandler(async (req, res) => {
  const { dealerId } = req.params;
  if (req.user.dealerId && String(req.user.dealerId) !== String(dealerId)) {
    return sendError(res, { message: 'Not authorized to view this wallet', statusCode: 403 });
  }

  const dealer = await Dealer.findById(dealerId).select('code name city state insuranceWalletBalance').lean();
  if (!dealer) return sendError(res, { message: 'Dealer not found', statusCode: 404 });

  const transactions = await InsuranceWalletTransaction.find({ dealer: dealerId })
    .sort({ date: -1, createdAt: -1 })
    .limit(200)
    .lean();

  return sendSuccess(res, {
    data: { ...mapDealerWallet(dealer), transactions: transactions.map(toPublicDoc) },
  });
});

/** POST /api/insurance/wallets/:dealerId/topup — Admin credits a dealer's insurance wallet */
export const topUpWallet = asyncHandler(async (req, res) => {
  const { dealerId } = req.params;
  const { amount, referenceNo = '', notes = '' } = req.body;

  if (!amount || amount <= 0) return sendError(res, { message: 'Amount must be > 0', statusCode: 400 });

  const dealer = await Dealer.findById(dealerId);
  if (!dealer) return sendError(res, { message: 'Dealer not found', statusCode: 404 });

  const session = await mongoose.startSession();
  try {
    let transaction;
    await session.withTransaction(async () => {
      const balanceAfter = (dealer.insuranceWalletBalance || 0) + Number(amount);

      [transaction] = await InsuranceWalletTransaction.create(
        [{
          dealer: dealer._id,
          dealerName: dealer.name,
          type: 'CREDIT',
          amount: Number(amount),
          balanceAfter,
          referenceNo,
          notes,
          createdBy: req.user._id,
        }],
        { session }
      );

      dealer.insuranceWalletBalance = balanceAfter;
      await dealer.save({ session });
    });

    return sendCreated(res, {
      data: { ...mapDealerWallet(dealer.toObject()), transaction: toPublicDoc(transaction.toObject()) },
      message: 'Insurance wallet topped up',
    });
  } finally {
    await session.endSession();
  }
});

// ── Claims ────────────────────────────────────────────────────────────────────

/** GET /api/insurance/claims — Admin sees all (optional dealerId/status filters); dealer sees own */
export const listClaims = asyncHandler(async (req, res) => {
  const { page, perPage, skip, sort } = parsePagination(req.query);
  const filter = buildSearchFilter(req.query.search, ['claimNo', 'customerName', 'product', 'policyNo']);

  if (req.user.dealerId) {
    filter.dealer = req.user.dealerId;
  } else if (req.query.dealerId) {
    filter.dealer = req.query.dealerId;
  }
  if (req.query.status) filter.status = req.query.status;

  const [rows, total] = await Promise.all([
    InsuranceClaim.find(filter).sort(sort).skip(skip).limit(perPage).lean(),
    InsuranceClaim.countDocuments(filter),
  ]);
  return sendPaginated(res, { data: rows.map(mapClaim), total, page, perPage });
});

/** GET /api/insurance/claims/:id */
export const getClaim = asyncHandler(async (req, res) => {
  const filter = { _id: req.params.id };
  if (req.user.dealerId) filter.dealer = req.user.dealerId;

  const doc = await InsuranceClaim.findOne(filter).lean();
  if (!doc) return sendError(res, { message: 'Claim not found', statusCode: 404 });
  return sendSuccess(res, { data: mapClaim(doc) });
});

/** POST /api/insurance/claims — Dealer submits a claim for a customer */
export const createClaim = asyncHandler(async (req, res) => {
  const dealerId = req.user.dealerId || req.body.dealerId;
  if (!dealerId) return sendError(res, { message: 'Dealer context required', statusCode: 403 });

  const {
    customerName, customerPhone = '', product, serialNo = '', policyNo = '',
    incidentDate, claimAmount, description = '',
  } = req.body;

  if (!customerName) return sendError(res, { message: 'Customer name is required', statusCode: 400 });
  if (!product) return sendError(res, { message: 'Product is required', statusCode: 400 });
  if (!claimAmount || claimAmount <= 0) return sendError(res, { message: 'Claim amount must be > 0', statusCode: 400 });

  const dealer = await Dealer.findById(dealerId).lean();
  if (!dealer) return sendError(res, { message: 'Dealer not found', statusCode: 404 });

  const { claimNo, sequenceNumber } = await generateClaimNo();

  const doc = await InsuranceClaim.create({
    claimNo,
    sequenceNumber,
    dealer: dealer._id,
    dealerName: dealer.name,
    customerName,
    customerPhone,
    product,
    serialNo,
    policyNo,
    incidentDate: incidentDate ? new Date(incidentDate) : undefined,
    claimAmount: Number(claimAmount),
    description,
    status: 'SUBMITTED',
    timeline: [{ title: 'Claim submitted', description: `Submitted by ${dealer.name}`, variant: 'default', by: req.user.name || dealer.name }],
    createdBy: req.user._id,
  });

  return sendCreated(res, { data: mapClaim(doc.toObject()), message: 'Insurance claim submitted' });
});

/** PATCH /api/insurance/claims/:id/review — Admin approves or rejects a claim */
export const reviewClaim = asyncHandler(async (req, res) => {
  const { action, notes = '' } = req.body;
  if (!['APPROVE', 'REJECT'].includes(action)) {
    return sendError(res, { message: 'Action must be APPROVE or REJECT', statusCode: 400 });
  }

  const doc = await InsuranceClaim.findById(req.params.id);
  if (!doc) return sendError(res, { message: 'Claim not found', statusCode: 404 });
  if (!['SUBMITTED', 'UNDER_REVIEW'].includes(doc.status)) {
    return sendError(res, { message: `Claim is already ${doc.status.toLowerCase()}`, statusCode: 400 });
  }

  const newStatus = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';
  doc.status = newStatus;
  doc.reviewNotes = notes;
  doc.reviewedBy = req.user._id;
  doc.reviewedAt = new Date();
  doc.timeline.push({
    title: newStatus === 'APPROVED' ? 'Claim approved' : 'Claim rejected',
    description: notes,
    variant: newStatus === 'APPROVED' ? 'success' : 'danger',
    by: req.user.name || 'Admin',
  });
  await doc.save();

  return sendSuccess(res, { data: mapClaim(doc.toObject()), message: `Claim ${newStatus.toLowerCase()}` });
});

/** POST /api/insurance/claims/:id/pay — Admin sends the virtual payment (debits dealer's insurance wallet) */
export const payClaim = asyncHandler(async (req, res) => {
  const doc = await InsuranceClaim.findById(req.params.id);
  if (!doc) return sendError(res, { message: 'Claim not found', statusCode: 404 });
  if (doc.status !== 'APPROVED') {
    return sendError(res, { message: 'Only approved claims can be paid', statusCode: 400 });
  }

  const dealer = await Dealer.findById(doc.dealer);
  if (!dealer) return sendError(res, { message: 'Dealer not found', statusCode: 404 });
  if ((dealer.insuranceWalletBalance || 0) < doc.claimAmount) {
    return sendError(res, { message: 'Insufficient insurance wallet balance — please top-up the dealer wallet first', statusCode: 400 });
  }

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const balanceAfter = (dealer.insuranceWalletBalance || 0) - doc.claimAmount;

      const [transaction] = await InsuranceWalletTransaction.create(
        [{
          dealer: dealer._id,
          dealerName: dealer.name,
          type: 'DEBIT',
          amount: doc.claimAmount,
          balanceAfter,
          claim: doc._id,
          notes: `Insurance claim payout — ${doc.claimNo}`,
          createdBy: req.user._id,
        }],
        { session }
      );

      dealer.insuranceWalletBalance = balanceAfter;
      await dealer.save({ session });

      doc.status = 'PAID';
      doc.paidAmount = doc.claimAmount;
      doc.paidAt = new Date();
      doc.walletTransaction = transaction._id;
      doc.timeline.push({
        title: 'Virtual payment sent',
        description: `₹${doc.claimAmount} credited to ${dealer.name}'s insurance wallet payout`,
        variant: 'success',
        by: req.user.name || 'Admin',
      });
      await doc.save({ session });
    });

    return sendSuccess(res, { data: mapClaim(doc.toObject()), message: 'Virtual payment sent to dealer' });
  } finally {
    await session.endSession();
  }
});
