import mongoose from 'mongoose';

const referralWithdrawalSchema = new mongoose.Schema(
  {
    referralBonus: { type: mongoose.Schema.Types.ObjectId, ref: 'ReferralBonus', required: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    dealer: { type: mongoose.Schema.Types.ObjectId, ref: 'Dealer', required: true },

    // Which month (1 to 16)
    month: { type: Number, required: true, min: 1, max: 16 },

    amount: { type: Number, required: true, default: 2500 },

    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'PAID', 'REJECTED'],
      default: 'PENDING',
    },

    // Bank details snapshot at time of withdrawal (from customer profile)
    bankAccountNo: { type: String, trim: true, default: '' },
    bankIFSC: { type: String, trim: true, default: '' },
    bankName: { type: String, trim: true, default: '' },
    bankAccountHolder: { type: String, trim: true, default: '' },

    processedAt: { type: Date, default: null },
    processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    adminNote: { type: String, trim: true, default: '' },

    // Auto-generated reference
    withdrawalRef: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

referralWithdrawalSchema.index({ referralBonus: 1, month: 1 }, { unique: true });
referralWithdrawalSchema.index({ customer: 1, status: 1 });
referralWithdrawalSchema.index({ dealer: 1, status: 1 });

const ReferralWithdrawal = mongoose.model('ReferralWithdrawal', referralWithdrawalSchema);
export default ReferralWithdrawal;
