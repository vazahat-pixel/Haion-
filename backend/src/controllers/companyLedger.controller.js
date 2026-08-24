/**
 * companyLedger.controller.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Company (warehouse) ledger — every rupee in / out for the admin/company.
 */
import CompanyLedger, { COMPANY_TXN_TYPES } from '../models/CompanyLedger.model.js';
import LedgerEntry from '../models/LedgerEntry.model.js';
import SalesInvoice from '../models/SalesInvoice.model.js';
import Purchase from '../models/Purchase.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess, sendCreated, sendError, sendPaginated } from '../utils/apiResponse.js';
import { parsePagination, buildSearchFilter } from '../utils/pagination.util.js';
import { toPublicDoc } from '../utils/serialize.util.js';
import {
  createLinkedCompanyEntry,
  voidLinkedCompanyEntry,
  PARTY_REQUIRED_TXN_TYPES,
} from '../services/companyLedger.service.js';

const DAY_MS = 24 * 60 * 60 * 1000;

function mapEntry(doc) {
  const out = toPublicDoc(doc);
  // `party` may be a raw id or a populated document depending on the query.
  if (out.party && typeof out.party === 'object') {
    out.party = {
      id: String(out.party._id ?? out.party.id),
      name: out.party.name,
      code: out.party.code,
      type: out.party.type,
    };
  } else if (out.party) {
    out.party = { id: String(out.party) };
  } else {
    out.party = null;
  }
  out.isPartyLinked = Boolean(out.party);
  return out;
}

/** Shared date-range filter from ?from / ?to. */
function applyDateRange(filter, query, field = 'date') {
  if (!query.from && !query.to) return filter;
  filter[field] = {};
  if (query.from) filter[field].$gte = new Date(query.from);
  if (query.to) {
    const toDate = new Date(query.to);
    toDate.setHours(23, 59, 59, 999);
    filter[field].$lte = toDate;
  }
  return filter;
}

/** GET /api/company-ledger — paginated list with filters */
export const listCompanyLedger = asyncHandler(async (req, res) => {
  const { page, perPage, skip } = parsePagination(req.query);

  const filter = { isVoided: false };
  if (req.query.txnType) filter.txnType = req.query.txnType;
  if (req.query.partyId) filter.party = req.query.partyId;
  if (req.query.linked === 'true') filter.party = { $ne: null };
  if (req.query.linked === 'false') filter.party = null;
  applyDateRange(filter, req.query);
  Object.assign(filter, buildSearchFilter(req.query.search, ['description', 'partyName', 'referenceNo']));

  const [rows, total] = await Promise.all([
    CompanyLedger.find(filter)
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(perPage)
      .populate('party', 'name code type')
      .lean(),
    CompanyLedger.countDocuments(filter),
  ]);

  return sendPaginated(res, { data: rows.map(mapEntry), total, page, perPage });
});

/** GET /api/company-ledger/summary — totals: credit, debit, balance */
export const getCompanyLedgerSummary = asyncHandler(async (req, res) => {
  const filter = { isVoided: false };
  applyDateRange(filter, req.query);

  const [agg] = await CompanyLedger.aggregate([
    { $match: filter },
    {
      $group: {
        _id: null,
        totalCredit: { $sum: '$credit' },
        totalDebit: { $sum: '$debit' },
        linkedCount: { $sum: { $cond: [{ $ifNull: ['$party', false] }, 1, 0] } },
        unlinkedCount: { $sum: { $cond: [{ $ifNull: ['$party', false] }, 0, 1] } },
      },
    },
  ]);

  // Closing balance is summed from every live entry up to the end of the range
  // rather than read off the newest row's stored `balance`, because voiding an
  // entry does not rewrite the running balance of the rows that follow it.
  const closingFilter = { isVoided: false };
  if (req.query.to) {
    const toDate = new Date(req.query.to);
    toDate.setHours(23, 59, 59, 999);
    closingFilter.date = { $lte: toDate };
  }
  const [closingAgg] = await CompanyLedger.aggregate([
    { $match: closingFilter },
    { $group: { _id: null, net: { $sum: { $subtract: ['$credit', '$debit'] } } } },
  ]);

  return sendSuccess(res, {
    data: {
      totalCredit: agg?.totalCredit ?? 0,
      totalDebit: agg?.totalDebit ?? 0,
      closingBalance: Math.round((closingAgg?.net ?? 0) * 100) / 100,
      linkedCount: agg?.linkedCount ?? 0,
      unlinkedCount: agg?.unlinkedCount ?? 0,
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
  const {
    txnType, date, credit, debit, description,
    partyId, partyName, referenceNo, paymentMode, notes, dueDate,
  } = req.body;

  if (!txnType) return sendError(res, { message: 'txnType is required', statusCode: 400 });
  if (!COMPANY_TXN_TYPES.includes(txnType)) {
    return sendError(res, { message: `txnType must be one of: ${COMPANY_TXN_TYPES.join(', ')}`, statusCode: 400 });
  }

  const creditAmt = Number(credit) || 0;
  const debitAmt = Number(debit) || 0;
  if (creditAmt < 0 || debitAmt < 0) {
    return sendError(res, { message: 'Amounts cannot be negative', statusCode: 400 });
  }
  if (creditAmt === 0 && debitAmt === 0) {
    return sendError(res, { message: 'Enter a credit (in) or debit (out) amount', statusCode: 400 });
  }
  if (creditAmt > 0 && debitAmt > 0) {
    return sendError(res, { message: 'An entry can be either credit or debit, not both', statusCode: 400 });
  }

  // Party-facing money movement must name a real party, otherwise the entry
  // never reaches that party's ledger and AR/AP goes out of sync.
  if (!partyId && PARTY_REQUIRED_TXN_TYPES.includes(txnType)) {
    return sendError(res, {
      message: `A party must be selected for ${txnType} entries so the party ledger stays in sync`,
      statusCode: 400,
    });
  }

  try {
    const { entry, partyEntry } = await createLinkedCompanyEntry({
      txnType,
      date: date ? new Date(date) : new Date(),
      credit: creditAmt,
      debit: debitAmt,
      description,
      partyId: partyId || null,
      partyName,
      referenceNo,
      paymentMode,
      notes,
      dueDate: dueDate ? new Date(dueDate) : null,
      createdBy: req.user._id,
    });

    return sendCreated(res, {
      data: {
        ...mapEntry(entry.toObject()),
        partyLedgerEntry: partyEntry ? toPublicDoc(partyEntry.toObject()) : null,
      },
      message: partyEntry
        ? 'Ledger entry created and posted to the party ledger'
        : 'Ledger entry created',
    });
  } catch (err) {
    if (err.statusCode === 404) return sendError(res, { message: err.message, statusCode: 404 });
    throw err;
  }
});

/** PATCH /api/company-ledger/:id/void — void the entry and its party ledger twin */
export const voidEntry = asyncHandler(async (req, res) => {
  try {
    const entry = await voidLinkedCompanyEntry(req.params.id);
    return sendSuccess(res, { data: mapEntry(entry.toObject()), message: 'Ledger entry voided on both ledgers' });
  } catch (err) {
    if (err.statusCode === 404) return sendError(res, { message: err.message, statusCode: 404 });
    throw err;
  }
});

/**
 * GET /api/company-ledger/party/:partyId — every company ledger row that is
 * linked to one party, next to that party's own ledger rows. Lets an admin
 * confirm the two ledgers actually agree.
 */
export const getPartyLinkedEntries = asyncHandler(async (req, res) => {
  const { partyId } = req.params;

  const [companyRows, partyRows] = await Promise.all([
    CompanyLedger.find({ party: partyId, isVoided: false }).sort({ date: -1, createdAt: -1 }).lean(),
    LedgerEntry.find({ party: partyId, isVoided: false }).sort({ date: -1, createdAt: -1 }).lean(),
  ]);

  const companyCredit = companyRows.reduce((s, r) => s + (r.credit || 0), 0);
  const companyDebit = companyRows.reduce((s, r) => s + (r.debit || 0), 0);
  const mirrored = partyRows.filter((r) => r.voucherModel === 'CompanyLedger');

  return sendSuccess(res, {
    data: {
      companyEntries: companyRows.map(mapEntry),
      partyEntries: partyRows.map(toPublicDoc),
      totals: {
        companyCredit,
        companyDebit,
        partyCredit: partyRows.reduce((s, r) => s + (r.credit || 0), 0),
        partyDebit: partyRows.reduce((s, r) => s + (r.debit || 0), 0),
        mirroredCount: mirrored.length,
        companyEntryCount: companyRows.length,
      },
    },
  });
});

// ── Reconciliation (AR / AP ageing) ───────────────────────────────────────────

/**
 * Ageing pipeline shared by receivables and payables.
 * `dateField` is the document date and `termsField` the credit period in days;
 * an explicit dueDate on the document wins over date + terms.
 */
function agingPipeline({ match, groupBy, nameField, dateField, termsField, asOf }) {
  const effectiveDue = {
    $ifNull: [
      '$dueDate',
      { $add: [`$${dateField}`, { $multiply: [{ $ifNull: [`$${termsField}`, 0] }, DAY_MS] }] },
    ],
  };
  const daysOverdue = {
    $floor: { $divide: [{ $subtract: [asOf, effectiveDue] }, DAY_MS] },
  };
  const bucket = (lo, hi) => ({
    $cond: [
      hi === null
        ? { $gt: ['$daysOverdue', lo] }
        : { $and: [{ $gt: ['$daysOverdue', lo] }, { $lte: ['$daysOverdue', hi] }] },
      '$balanceAmount',
      0,
    ],
  });

  return [
    { $match: match },
    { $addFields: { daysOverdue } },
    {
      $group: {
        _id: `$${groupBy}`,
        name: { $first: `$${nameField}` },
        outstanding: { $sum: '$balanceAmount' },
        docCount: { $sum: 1 },
        oldestDays: { $max: '$daysOverdue' },
        current: { $sum: { $cond: [{ $lte: ['$daysOverdue', 0] }, '$balanceAmount', 0] } },
        d1_30: { $sum: bucket(0, 30) },
        d31_60: { $sum: bucket(30, 60) },
        d61_90: { $sum: bucket(60, 90) },
        d90plus: { $sum: bucket(90, null) },
      },
    },
    { $sort: { outstanding: -1 } },
  ];
}

function shapeAgingRows(rows, kind) {
  return rows.map((r) => ({
    id: String(r._id),
    name: r.name || '—',
    kind,
    outstanding: Math.round((r.outstanding || 0) * 100) / 100,
    docCount: r.docCount || 0,
    oldestDays: Math.max(0, r.oldestDays || 0),
    buckets: {
      current: Math.round((r.current || 0) * 100) / 100,
      d1_30: Math.round((r.d1_30 || 0) * 100) / 100,
      d31_60: Math.round((r.d31_60 || 0) * 100) / 100,
      d61_90: Math.round((r.d61_90 || 0) * 100) / 100,
      d90plus: Math.round((r.d90plus || 0) * 100) / 100,
    },
  }));
}

/**
 * GET /api/company-ledger/reconciliation
 * Receivables (unpaid sales invoices, by dealer) and payables (unpaid purchase
 * bills, by party), bucketed by how far past due they are, plus the manual
 * journal entries posted against each party.
 */
export const getReconciliation = asyncHandler(async (req, res) => {
  const asOf = req.query.asOf ? new Date(req.query.asOf) : new Date();

  const [receivableRows, payableRows, manualRows] = await Promise.all([
    SalesInvoice.aggregate(
      agingPipeline({
        // Same "still owed" definition the payment screen uses when it lists
        // pending invoices, so the two views never disagree.
        match: { balanceAmount: { $gt: 0 }, status: { $in: ['SENT', 'DRAFT'] } },
        groupBy: 'dealer',
        nameField: 'dealerName',
        dateField: 'invoiceDate',
        termsField: 'paymentTermsDays',
        asOf,
      })
    ),
    Purchase.aggregate(
      agingPipeline({
        match: { balanceAmount: { $gt: 0 }, status: { $ne: 'CANCELLED' } },
        groupBy: 'party',
        nameField: 'partyName',
        dateField: 'purchaseInvDate',
        termsField: 'paymentTermsDays',
        asOf,
      })
    ),
    // Manual company-ledger entries that were mirrored into a party ledger.
    LedgerEntry.aggregate([
      { $match: { voucherModel: 'CompanyLedger', isVoided: false } },
      {
        $group: {
          _id: '$party',
          name: { $first: '$partyName' },
          credit: { $sum: '$credit' },
          debit: { $sum: '$debit' },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]),
  ]);

  const receivables = shapeAgingRows(receivableRows, 'AR');
  const payables = shapeAgingRows(payableRows, 'AP');
  const sum = (rows, pick) => Math.round(rows.reduce((s, r) => s + pick(r), 0) * 100) / 100;

  return sendSuccess(res, {
    data: {
      asOf,
      receivables,
      payables,
      manualAdjustments: manualRows.map((r) => ({
        partyId: String(r._id),
        partyName: r.name || '—',
        credit: Math.round((r.credit || 0) * 100) / 100,
        debit: Math.round((r.debit || 0) * 100) / 100,
        net: Math.round(((r.credit || 0) - (r.debit || 0)) * 100) / 100,
        entryCount: r.count || 0,
      })),
      totals: {
        totalReceivable: sum(receivables, (r) => r.outstanding),
        totalPayable: sum(payables, (r) => r.outstanding),
        netPosition: sum(receivables, (r) => r.outstanding) - sum(payables, (r) => r.outstanding),
        overdueReceivable: sum(receivables, (r) => r.outstanding - r.buckets.current),
        overduePayable: sum(payables, (r) => r.outstanding - r.buckets.current),
      },
    },
  });
});
