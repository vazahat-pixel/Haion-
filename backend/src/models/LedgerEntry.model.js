import mongoose from 'mongoose';

export const LEDGER_VOUCHER_TYPES = [
  'PAYMENT_IN',
  'PAYMENT_OUT',
  'SALES_INVOICE',
  'PURCHASE',
  'OPENING_BALANCE',
  'JOURNAL',
];

const ledgerEntrySchema = new mongoose.Schema(
  {
    party: { type: mongoose.Schema.Types.ObjectId, ref: 'Party', required: true, index: true },
    partyName: { type: String, required: true, trim: true },
    voucherType: { type: String, required: true, enum: LEDGER_VOUCHER_TYPES },
    // Reference to the source document
    voucherRef: { type: mongoose.Schema.Types.ObjectId, refPath: 'voucherModel' },
    voucherModel: {
      type: String,
      enum: ['Payment', 'SalesInvoice', 'Purchase'],
      default: null,
    },
    voucherNo: { type: String, trim: true, default: '' },
    date: { type: Date, default: Date.now, index: true },
    // Credit = money RECEIVED FROM party (reduces our receivable / increases payable)
    credit: { type: Number, default: 0, min: 0 },
    // Debit = money PAID TO party (increases our receivable / reduces payable)
    debit: { type: Number, default: 0, min: 0 },
    paymentMode: { type: String, default: '' },
    referenceNo: { type: String, trim: true, default: '' },
    notes: { type: String, default: '' },
    dueDate: { type: Date, default: null },
    isVoided: { type: Boolean, default: false },
  },
  { timestamps: true }
);

ledgerEntrySchema.index({ party: 1, date: 1 });
ledgerEntrySchema.index({ voucherRef: 1 });

const LedgerEntry = mongoose.model('LedgerEntry', ledgerEntrySchema);
export default LedgerEntry;
