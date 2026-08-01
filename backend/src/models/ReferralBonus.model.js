import mongoose from 'mongoose';

const referredCustomerSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    bill: { type: mongoose.Schema.Types.ObjectId, ref: 'Bill', required: true },
    activatedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const referralBonusSchema = new mongoose.Schema(
  {
    // The customer who referred others
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true, unique: true },
    dealer: { type: mongoose.Schema.Types.ObjectId, ref: 'Dealer', required: true },

    // Unique referral code for this customer
    referralCode: { type: String, required: true, unique: true, uppercase: true, trim: true },

    // Customers referred using this code (max 2 needed to activate)
    referredCustomers: { type: [referredCustomerSchema], default: [] },

    // Bonus lifecycle
    status: {
      type: String,
      enum: ['PENDING', 'ACTIVE', 'COMPLETED'],
      default: 'PENDING',
    },

    // Bonus financials
    bonusAmount: { type: Number, default: 40000 },    // ₹40,000 total
    monthlyLimit: { type: Number, default: 2500 },    // ₹2,500/month
    totalMonths: { type: Number, default: 16 },       // 16 months
    totalWithdrawn: { type: Number, default: 0 },
    currentMonth: { type: Number, default: 0 },       // how many months processed

    // Timestamps for bonus lifecycle
    activatedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    nextWithdrawalDue: { type: Date, default: null },
  },
  { timestamps: true }
);

referralBonusSchema.index({ dealer: 1, status: 1 });

// Virtual: remaining balance
referralBonusSchema.virtual('remainingBalance').get(function () {
  return Math.max(0, this.bonusAmount - this.totalWithdrawn);
});

referralBonusSchema.set('toJSON', { virtuals: true });
referralBonusSchema.set('toObject', { virtuals: true });

const ReferralBonus = mongoose.model('ReferralBonus', referralBonusSchema);
export default ReferralBonus;
