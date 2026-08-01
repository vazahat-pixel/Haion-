import mongoose from 'mongoose';
import Payment from '../models/Payment.model.js';
import LedgerEntry from '../models/LedgerEntry.model.js';
import SalesInvoice from '../models/SalesInvoice.model.js';
import Purchase from '../models/Purchase.model.js';
import Party from '../models/Party.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess, sendCreated, sendError, sendPaginated } from '../utils/apiResponse.js';
import { parsePagination, buildSearchFilter } from '../utils/pagination.util.js';
import { toPublicDoc } from '../utils/serialize.util.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

function mapPayment(doc) {
  return toPublicDoc(doc);
}

async function generatePaymentNo(type) {
  const prefix = type === 'PAYMENT_IN' ? 'PYIN' : 'PYOUT';
  const year = new Date().getFullYear();
  const last = await Payment.findOne(
    { type, sequenceNumber: { $exists: true } },
    { sequenceNumber: 1 },
    { sort: { sequenceNumber: -1 } }
  ).lean();
  const seq = (last?.sequenceNumber || 0) + 1;
  const padded = String(seq).padStart(4, '0');
  return { paymentNo: `${prefix}-${year}-${padded}`, sequenceNumber: seq };
}

// ── List Payments ─────────────────────────────────────────────────────────────

export const listPayments = asyncHandler(async (req, res) => {
  const { page, perPage, skip, sort } = parsePagination(req.query);
  const filter = {
    ...buildSearchFilter(req.query.search, ['paymentNo', 'partyName', 'referenceNo']),
  };
  if (req.query.type) filter.type = req.query.type;
  if (req.query.partyId) filter.party = req.query.partyId;
  if (req.query.status) filter.status = req.query.status;
  if (req.query.paymentMode) filter.paymentMode = req.query.paymentMode;
  if (req.query.from || req.query.to) {
    filter.paymentDate = {};
    if (req.query.from) filter.paymentDate.$gte = new Date(req.query.from);
    if (req.query.to) filter.paymentDate.$lte = new Date(req.query.to);
  }

  const [rows, total] = await Promise.all([
    Payment.find(filter).sort(sort).skip(skip).limit(perPage).lean(),
    Payment.countDocuments(filter),
  ]);
  return sendPaginated(res, { data: rows.map(mapPayment), total, page, perPage });
});

// ── Get Single Payment ────────────────────────────────────────────────────────

export const getPayment = asyncHandler(async (req, res) => {
  const doc = await Payment.findById(req.params.id).lean();
  if (!doc) return sendError(res, { message: 'Payment not found', statusCode: 404 });
  return sendSuccess(res, { data: mapPayment(doc) });
});

// ── Get Next Payment Number ───────────────────────────────────────────────────

export const getNextPaymentNo = asyncHandler(async (req, res) => {
  const type = req.query.type === 'PAYMENT_OUT' ? 'PAYMENT_OUT' : 'PAYMENT_IN';
  const { paymentNo } = await generatePaymentNo(type);
  return sendSuccess(res, { data: { paymentNo } });
});

// ── Create Payment In ─────────────────────────────────────────────────────────

export const createPaymentIn = asyncHandler(async (req, res) => {
  const {
    partyId,
    amount,
    discount = 0,
    paymentDate,
    paymentMode = 'CASH',
    referenceNo = '',
    notes = '',
    settledInvoices = [],
  } = req.body;

  if (!partyId) return sendError(res, { message: 'Party is required', statusCode: 400 });
  if (!amount || amount <= 0) return sendError(res, { message: 'Amount must be > 0', statusCode: 400 });

  const party = await Party.findById(partyId).lean();
  if (!party) return sendError(res, { message: 'Party not found', statusCode: 404 });

  const session = await mongoose.startSession();
  try {
    let payment;
    await session.withTransaction(async () => {
      const { paymentNo, sequenceNumber } = await generatePaymentNo('PAYMENT_IN');
      const netAmount = Math.max(0, amount - discount);

      // Enrich settled invoices and update SalesInvoice balances
      const enrichedSettled = [];
      for (const item of settledInvoices) {
        if (!item.invoice || !item.amountReceived) continue;
        const inv = await SalesInvoice.findById(item.invoice).session(session);
        if (!inv) continue;
        const received = Number(item.amountReceived) || 0;
        const tds = Number(item.tds) || 0;
        const disc = Number(item.discount) || 0;
        inv.amountReceived = (inv.amountReceived || 0) + received;
        inv.balanceAmount = Math.max(0, inv.total - inv.amountReceived);
        if (inv.balanceAmount === 0) inv.status = 'PAID';
        await inv.save({ session });
        enrichedSettled.push({
          invoice: inv._id,
          invoiceNo: inv.invoiceNo,
          invoiceAmount: inv.total,
          tds,
          discount: disc,
          amountReceived: received,
        });
      }

      [payment] = await Payment.create(
        [{
          paymentNo,
          sequenceNumber,
          type: 'PAYMENT_IN',
          party: partyId,
          partyName: party.name,
          amount,
          discount,
          netAmount,
          paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
          paymentMode,
          referenceNo,
          notes,
          settledInvoices: enrichedSettled,
          createdBy: req.user._id,
        }],
        { session }
      );

      // Create ledger entry — credit (we received money from party)
      await LedgerEntry.create(
        [{
          party: partyId,
          partyName: party.name,
          voucherType: 'PAYMENT_IN',
          voucherRef: payment._id,
          voucherModel: 'Payment',
          voucherNo: paymentNo,
          date: paymentDate ? new Date(paymentDate) : new Date(),
          credit: netAmount,
          debit: 0,
          paymentMode,
          referenceNo,
          notes,
        }],
        { session }
      );
    });

    return sendCreated(res, { data: mapPayment(payment.toObject()), message: 'Payment In recorded' });
  } finally {
    await session.endSession();
  }
});

// ── Create Payment Out ────────────────────────────────────────────────────────

export const createPaymentOut = asyncHandler(async (req, res) => {
  const {
    partyId,
    amount,
    discount = 0,
    paymentDate,
    paymentMode = 'CASH',
    referenceNo = '',
    notes = '',
    settledPurchases = [],
  } = req.body;

  if (!partyId) return sendError(res, { message: 'Party is required', statusCode: 400 });
  if (!amount || amount <= 0) return sendError(res, { message: 'Amount must be > 0', statusCode: 400 });

  const party = await Party.findById(partyId).lean();
  if (!party) return sendError(res, { message: 'Party not found', statusCode: 404 });

  const session = await mongoose.startSession();
  try {
    let payment;
    await session.withTransaction(async () => {
      const { paymentNo, sequenceNumber } = await generatePaymentNo('PAYMENT_OUT');
      const netAmount = Math.max(0, amount - discount);

      // Enrich settled purchases and update Purchase balances
      const enrichedSettled = [];
      for (const item of settledPurchases) {
        if (!item.purchase || !item.amountPaid) continue;
        const pur = await Purchase.findById(item.purchase).session(session);
        if (!pur) continue;
        const paid = Number(item.amountPaid) || 0;
        const disc = Number(item.discount) || 0;
        pur.amountPaid = (pur.amountPaid || 0) + paid;
        pur.balanceAmount = Math.max(0, pur.total - pur.amountPaid);
        await pur.save({ session });
        enrichedSettled.push({
          purchase: pur._id,
          purchaseNo: pur.purchaseNo,
          purchaseAmount: pur.total,
          discount: disc,
          amountPaid: paid,
        });
      }

      [payment] = await Payment.create(
        [{
          paymentNo,
          sequenceNumber,
          type: 'PAYMENT_OUT',
          party: partyId,
          partyName: party.name,
          amount,
          discount,
          netAmount,
          paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
          paymentMode,
          referenceNo,
          notes,
          settledPurchases: enrichedSettled,
          createdBy: req.user._id,
        }],
        { session }
      );

      // Create ledger entry — debit (we paid money to party)
      await LedgerEntry.create(
        [{
          party: partyId,
          partyName: party.name,
          voucherType: 'PAYMENT_OUT',
          voucherRef: payment._id,
          voucherModel: 'Payment',
          voucherNo: paymentNo,
          date: paymentDate ? new Date(paymentDate) : new Date(),
          credit: 0,
          debit: netAmount,
          paymentMode,
          referenceNo,
          notes,
        }],
        { session }
      );
    });

    return sendCreated(res, { data: mapPayment(payment.toObject()), message: 'Payment Out recorded' });
  } finally {
    await session.endSession();
  }
});

// ── Cancel Payment ────────────────────────────────────────────────────────────

export const cancelPayment = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.id);
  if (!payment) return sendError(res, { message: 'Payment not found', statusCode: 404 });
  if (payment.status === 'CANCELLED') return sendError(res, { message: 'Payment already cancelled', statusCode: 400 });

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      // Reverse invoice settlements for PAYMENT_IN
      if (payment.type === 'PAYMENT_IN') {
        for (const item of payment.settledInvoices || []) {
          const inv = await SalesInvoice.findById(item.invoice).session(session);
          if (!inv) continue;
          inv.amountReceived = Math.max(0, (inv.amountReceived || 0) - (item.amountReceived || 0));
          inv.balanceAmount = Math.max(0, inv.total - inv.amountReceived);
          if (inv.status === 'PAID' && inv.balanceAmount > 0) inv.status = 'SENT';
          await inv.save({ session });
        }
      }

      // Reverse purchase settlements for PAYMENT_OUT
      if (payment.type === 'PAYMENT_OUT') {
        for (const item of payment.settledPurchases || []) {
          const pur = await Purchase.findById(item.purchase).session(session);
          if (!pur) continue;
          pur.amountPaid = Math.max(0, (pur.amountPaid || 0) - (item.amountPaid || 0));
          pur.balanceAmount = Math.max(0, pur.total - pur.amountPaid);
          await pur.save({ session });
        }
      }

      payment.status = 'CANCELLED';
      await payment.save({ session });

      // Void the ledger entry
      await LedgerEntry.updateOne(
        { voucherRef: payment._id, voucherModel: 'Payment' },
        { $set: { isVoided: true } },
        { session }
      );
    });

    return sendSuccess(res, { data: mapPayment(payment.toObject()), message: 'Payment cancelled and settlements reversed' });
  } finally {
    await session.endSession();
  }
});

// ── Party Ledger (Statement) ──────────────────────────────────────────────────

export const getPartyLedger = asyncHandler(async (req, res) => {
  const { partyId } = req.params;

  const party = await Party.findById(partyId).lean();
  if (!party) return sendError(res, { message: 'Party not found', statusCode: 404 });

  const filter = { party: partyId, isVoided: false };
  if (req.query.from || req.query.to) {
    filter.date = {};
    if (req.query.from) filter.date.$gte = new Date(req.query.from);
    if (req.query.to) filter.date.$lte = new Date(req.query.to);
  }

  const entries = await LedgerEntry.find(filter).sort({ date: 1, createdAt: 1 }).lean();

  // Compute running balance
  let runningBalance = party.openingBalance || 0;
  const rows = entries.map((e, idx) => {
    runningBalance = runningBalance + (e.debit || 0) - (e.credit || 0);
    return {
      ...toPublicDoc(e),
      srNo: idx + 1,
      balance: runningBalance,
    };
  });

  // Summary stats
  const totalCredit = entries.reduce((s, e) => s + (e.credit || 0), 0);
  const totalDebit = entries.reduce((s, e) => s + (e.debit || 0), 0);
  const finalBalance = (party.openingBalance || 0) + totalDebit - totalCredit;

  return sendSuccess(res, {
    data: {
      party: toPublicDoc(party),
      openingBalance: party.openingBalance || 0,
      totalCredit,
      totalDebit,
      balance: finalBalance,
      entries: rows,
    },
  });
});

// ── Get Pending Invoices for Party (for settlement) ───────────────────────────

export const getPartyPendingInvoices = asyncHandler(async (req, res) => {
  const { partyId } = req.params;
  const party = await Party.findById(partyId).lean();
  if (!party) return sendError(res, { message: 'Party not found', statusCode: 404 });

  // Get sales invoices linked to this party's name (for PAYMENT_IN)
  const invoices = await SalesInvoice.find({
    dealerName: party.name,
    status: { $in: ['SENT', 'DRAFT'] },
    balanceAmount: { $gt: 0 },
  })
    .select('invoiceNo total amountReceived balanceAmount dueDate status invoiceDate')
    .sort({ invoiceDate: 1 })
    .lean();

  return sendSuccess(res, { data: invoices.map(toPublicDoc) });
});

// ── Get Pending Purchases for Party (for settlement) ─────────────────────────

export const getPartyPendingPurchases = asyncHandler(async (req, res) => {
  const { partyId } = req.params;

  const purchases = await Purchase.find({
    party: partyId,
    status: { $in: ['PENDING', 'RECEIVED'] },
    balanceAmount: { $gt: 0 },
  })
    .select('purchaseNo total amountPaid balanceAmount dueDate status purchaseInvDate')
    .sort({ purchaseInvDate: 1 })
    .lean();

  return sendSuccess(res, { data: purchases.map(toPublicDoc) });
});
