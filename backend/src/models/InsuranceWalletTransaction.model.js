import mongoose from 'mongoose';

export const INSURANCE_WALLET_TXN_TYPES = ['CREDIT', 'DEBIT'];

const insuranceWalletTransactionSchema = new mongoose.Schema(
  {
    dealer: { type: mongoose.Schema.Types.ObjectId, ref: 'Dealer', required: true },
    dealerName: { type: String, required: true, trim: true },
    type: { type: String, required: true, enum: INSURANCE_WALLET_TXN_TYPES },
    amount: { type: Number, required: true, min: 0 },
    balanceAfter: { type: Number, required: true },
    claim: { type: mongoose.Schema.Types.ObjectId, ref: 'InsuranceClaim', default: null },
    referenceNo: { type: String, trim: true, default: '' },
    notes: { type: String, maxlength: 1000, default: '' },
    date: { type: Date, default: Date.now },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

insuranceWalletTransactionSchema.index({ dealer: 1, date: -1 });

const InsuranceWalletTransaction = mongoose.model('InsuranceWalletTransaction', insuranceWalletTransactionSchema);
export default InsuranceWalletTransaction;
