/**
 * companyLedger.service.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Helper service to add entries to the Company Ledger.
 * Called by salesInvoice, payment, expense, purchase controllers.
 *
 * Party linkage
 * ─────────────
 * A company ledger row that has a counterparty must also exist in that party's
 * own ledger (LedgerEntry), otherwise AR/AP reconciliation silently drifts.
 * `createLinkedCompanyEntry` writes both sides in one transaction and stores a
 * cross-reference on each, so they can be voided together later.
 *
 * Sign convention (identical on both ledgers, see payment.controller.js):
 *   credit → money IN  (received from the party)
 *   debit  → money OUT (paid to the party)
 */
import mongoose from 'mongoose';
import CompanyLedger from '../models/CompanyLedger.model.js';
import LedgerEntry from '../models/LedgerEntry.model.js';
import Party from '../models/Party.model.js';
import { nextSequence } from '../utils/sequence.util.js';

/**
 * Transaction types that always move money against a real counterparty, so a
 * manual entry of this type is rejected unless a Party is linked.
 * The remaining types (EXPENSE, MANUFACTURE, ADJUSTMENT, OPENING_BALANCE) may
 * be purely internal, so linking stays optional there.
 */
export const PARTY_REQUIRED_TXN_TYPES = ['SALE_TO_DEALER', 'PAYMENT_FROM_DEALER', 'PURCHASE'];

/** Company txnType → the party ledger voucher type that means the same thing. */
function voucherTypeFor(txnType, credit) {
  switch (txnType) {
    case 'SALE_TO_DEALER': return 'SALES_INVOICE';
    case 'PAYMENT_FROM_DEALER': return credit > 0 ? 'PAYMENT_IN' : 'PAYMENT_OUT';
    case 'PURCHASE': return credit > 0 ? 'PAYMENT_IN' : 'PURCHASE';
    case 'OPENING_BALANCE': return 'OPENING_BALANCE';
    default: return 'JOURNAL';
  }
}

/**
 * Add a single entry to the company ledger.
 * Automatically computes running balance by looking at last entry.
 */
export async function addCompanyLedgerEntry({
  txnType,
  date = new Date(),
  credit = 0,
  debit = 0,
  description = '',
  partyName = '',
  party = null,
  partyLedgerRef = null,
  referenceNo = '',
  sourceRef = null,
  sourceModel = null,
  paymentMode = '',
  notes = '',
  createdBy = null,
  session = null,
} = {}) {
  // Get last balance
  const lastQuery = CompanyLedger.findOne(
    { isVoided: false },
    { balance: 1 },
    { sort: { date: -1, createdAt: -1 } }
  );
  if (session) lastQuery.session(session);
  const last = await lastQuery.lean();
  const prevBalance = last?.balance ?? 0;
  const balance = Math.round((prevBalance + (Number(credit) || 0) - (Number(debit) || 0)) * 100) / 100;

  const entry = new CompanyLedger({
    txnType,
    date,
    credit,
    debit,
    balance,
    description,
    partyName,
    party,
    partyLedgerRef,
    referenceNo,
    sourceRef,
    sourceModel,
    paymentMode,
    notes,
    createdBy,
  });

  if (session) {
    await entry.save({ session });
  } else {
    await entry.save();
  }
  return entry;
}

/**
 * Create a company ledger entry and, when a party is given, the matching row in
 * that party's ledger — atomically, with both rows pointing at each other.
 *
 * Returns { entry, partyEntry, party } where partyEntry is null for an
 * unlinked (internal) entry.
 */
export async function createLinkedCompanyEntry({
  txnType,
  date = new Date(),
  credit = 0,
  debit = 0,
  description = '',
  partyId = null,
  partyName = '',
  referenceNo = '',
  paymentMode = '',
  notes = '',
  dueDate = null,
  createdBy = null,
}) {
  let party = null;
  if (partyId) {
    party = await Party.findById(partyId).lean();
    if (!party) {
      const err = new Error('Party not found');
      err.statusCode = 404;
      throw err;
    }
  }

  const resolvedName = party?.name || partyName || '';
  const voucherNo = referenceNo || nextSequence('JV');

  let entry = null;
  let partyEntry = null;

  // No party → single write, nothing to keep in sync.
  if (!party) {
    entry = await addCompanyLedgerEntry({
      txnType, date, credit, debit, description,
      partyName: resolvedName, referenceNo, paymentMode, notes, createdBy,
    });
    return { entry, partyEntry: null, party: null };
  }

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      entry = await addCompanyLedgerEntry({
        txnType, date, credit, debit, description,
        partyName: resolvedName,
        party: party._id,
        referenceNo, paymentMode, notes, createdBy,
        session,
      });

      const [created] = await LedgerEntry.create(
        [{
          party: party._id,
          partyName: resolvedName,
          voucherType: voucherTypeFor(txnType, Number(credit) || 0),
          voucherRef: entry._id,
          voucherModel: 'CompanyLedger',
          voucherNo,
          date,
          credit: Number(credit) || 0,
          debit: Number(debit) || 0,
          paymentMode,
          referenceNo,
          notes: notes || description,
          dueDate,
        }],
        { session }
      );
      partyEntry = created;

      entry.partyLedgerRef = created._id;
      await entry.save({ session });
    });
  } finally {
    await session.endSession();
  }

  return { entry, partyEntry, party };
}

/**
 * Void a company ledger entry and its mirrored party ledger row together, so
 * the two ledgers can never disagree about which entries are live.
 */
export async function voidLinkedCompanyEntry(companyLedgerId) {
  const entry = await CompanyLedger.findById(companyLedgerId);
  if (!entry) {
    const err = new Error('Ledger entry not found');
    err.statusCode = 404;
    throw err;
  }
  if (entry.isVoided) return entry;

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      entry.isVoided = true;
      await entry.save({ session });

      await LedgerEntry.updateOne(
        { voucherRef: entry._id, voucherModel: 'CompanyLedger' },
        { $set: { isVoided: true } },
        { session }
      );
    });
  } finally {
    await session.endSession();
  }

  return entry;
}
