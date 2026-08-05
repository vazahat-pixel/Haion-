/**
 * companyLedger.service.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Helper service to add entries to the Company Ledger.
 * Called by salesInvoice, payment, expense, purchase controllers.
 */
import CompanyLedger from '../models/CompanyLedger.model.js';

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
  referenceNo = '',
  sourceRef = null,
  sourceModel = null,
  paymentMode = '',
  notes = '',
  createdBy = null,
  session = null,
} = {}) {
  // Get last balance
  const last = await CompanyLedger.findOne(
    { isVoided: false },
    { balance: 1 },
    { sort: { date: -1, createdAt: -1 } }
  ).lean();
  const prevBalance = last?.balance ?? 0;
  const balance = prevBalance + credit - debit;

  const entry = new CompanyLedger({
    txnType,
    date,
    credit,
    debit,
    balance,
    description,
    partyName,
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
