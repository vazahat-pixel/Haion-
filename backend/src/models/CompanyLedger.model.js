import mongoose from 'mongoose';

export const COMPANY_TXN_TYPES = [
  'SALE_TO_DEALER',       // Admin sells to dealer (Sales Invoice)
  'PAYMENT_FROM_DEALER',  // Dealer pays admin (Payment received)
  'PURCHASE',             // Admin buys stock / raw material
  'EXPENSE',              // Operating expense (salary, rent, etc.)
  'MANUFACTURE',          // Manufacturing cost entry
  'ADJUSTMENT',           // Manual correction / journal
  'OPENING_BALANCE',      // Initial balance entry
];

const companyLedgerSchema = new mongoose.Schema(
  {
    txnType: {
      type: String,
      required: true,
      enum: COMPANY_TXN_TYPES,
      index: true,
    },
    date: { type: Date, default: Date.now, index: true },
    // Credit = money coming IN to the company
    credit: { type: Number, default: 0, min: 0 },
    // Debit = money going OUT of the company
    debit: { type: Number, default: 0, min: 0 },
    // Running balance (computed at insert time)
    balance: { type: Number, default: 0 },
    description: { type: String, trim: true, default: '' },
    partyName: { type: String, trim: true, default: '' },  // dealer / vendor name
    // Hard link to the Party master. Null means the entry is internal (no
    // counterparty) or predates party linking — partyName is then free text.
    party: { type: mongoose.Schema.Types.ObjectId, ref: 'Party', default: null },
    // The mirrored party-ledger row, so both sides can be voided together.
    partyLedgerRef: { type: mongoose.Schema.Types.ObjectId, ref: 'LedgerEntry', default: null },
    referenceNo: { type: String, trim: true, default: '' }, // invoice / bill / expense no
    // Polymorphic ref to source document
    sourceRef: { type: mongoose.Schema.Types.ObjectId, refPath: 'sourceModel', default: null },
    sourceModel: {
      type: String,
      enum: ['SalesInvoice', 'Payment', 'Expense', 'Purchase', 'Manufacture', null],
      default: null,
    },
    paymentMode: { type: String, default: '' },
    notes: { type: String, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    isVoided: { type: Boolean, default: false },
  },
  { timestamps: true }
);

companyLedgerSchema.index({ date: -1 });
companyLedgerSchema.index({ txnType: 1, date: -1 });
companyLedgerSchema.index({ sourceRef: 1 });
companyLedgerSchema.index({ party: 1, date: -1 });

const CompanyLedger = mongoose.model('CompanyLedger', companyLedgerSchema);
export default CompanyLedger;
