/**
 * companyLedger.controller.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Company (warehouse) ledger — every rupee in / out for the admin/company.
 */
import CompanyLedger, { COMPANY_TXN_TYPES } from '../models/CompanyLedger.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess, sendCreated, sendError, sendPaginated } from '../utils/apiResponse.js';
import { parsePagination } from '../utils/pagination.util.js';
import { toPublicDoc } from '../utils/serialize.util.js';
import { addCompanyLedgerEntry } from '../services/companyLedger.service.js';

function mapEntry(doc) {
  return toPublicDoc(doc);
}

/** GET /api/company-ledger — paginated list with filters */
export const listCompanyLedger = asyncHandler(async (req, res) => {
  const { page, perPage, skip } = parsePagination(req.query);

  const filter = { isVoided: false };
  if (req.query.txnType) filter.txnType = req.query.txnType;
  if (req.query.from || req.query.to) {
    filter.date = {};
    if (req.query.from) filter.date.$gte = new Date(req.query.from);
    if (req.query.to) {
      const toDate = new Date(req.query.to);
      toDate.setHours(23, 59, 59, 999);
      filter.date.$lte = toDate;
    }
  }

  const [rows, total] = await Promise.all([
    CompanyLedger.find(filter).sort({ date: -1, createdAt: -1 }).skip(skip).limit(perPage).lean(),
    CompanyLedger.countDocuments(filter),
  ]);

  return sendPaginated(res, { data: rows.map(mapEntry), total, page, perPage });
});

/** GET /api/company-ledger/summary — totals: credit, debit, balance */
export const getCompanyLedgerSummary = asyncHandler(async (req, res) => {
  const filter = { isVoided: false };
  if (req.query.from || req.query.to) {
    filter.date = {};
    if (req.query.from) filter.date.$gte = new Date(req.query.from);
    if (req.query.to) {
      const toDate = new Date(req.query.to);
      toDate.setHours(23, 59, 59, 999);
      filter.date.$lte = toDate;
    }
  }

  const [agg] = await CompanyLedger.aggregate([
    { $match: filter },
    {
      $group: {
        _id: null,
        totalCredit: { $sum: '$credit' },
        totalDebit: { $sum: '$debit' },
      },
    },
  ]);

  // Get latest running balance
  const last = await CompanyLedger.findOne({ isVoided: false }, { balance: 1 }, { sort: { date: -1, createdAt: -1 } }).lean();

  return sendSuccess(res, {
    data: {
      totalCredit: agg?.totalCredit ?? 0,
      totalDebit: agg?.totalDebit ?? 0,
      closingBalance: last?.balance ?? 0,
      txnTypes: COMPANY_TXN_TYPES,
    },
  });
});

/** GET /api/company-ledger/types — list valid transaction types */
export const getTxnTypes = asyncHandler(async (_req, res) => {
  return sendSuccess(res, { data: COMPANY_TXN_TYPES });
});

/** POST /api/company-ledger — manual journal / adjustment entry */
export const createManualEntry = asyncHandler(async (req, res) => {
  const { txnType, date, credit, debit, description, partyName, referenceNo, paymentMode, notes } = req.body;
  if (!txnType) return sendError(res, { message: 'txnType is required', statusCode: 400 });

  const entry = await addCompanyLedgerEntry({
    txnType: txnType || 'ADJUSTMENT',
    date: date ? new Date(date) : new Date(),
    credit: Number(credit) || 0,
    debit: Number(debit) || 0,
    description,
    partyName,
    referenceNo,
    paymentMode,
    notes,
    createdBy: req.user._id,
  });

  return sendCreated(res, { data: mapEntry(entry.toObject()), message: 'Ledger entry created' });
});
