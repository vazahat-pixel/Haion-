import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema(
  {
    dealer: { type: mongoose.Schema.Types.ObjectId, ref: 'Dealer', required: true },
    code: { type: String, required: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    address: { type: String, trim: true },
    gstin: { type: String, trim: true, uppercase: true, default: '' },
    totalPurchases: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
    lastOrderAt: { type: Date },
    assignedSalesMember: { type: mongoose.Schema.Types.ObjectId, ref: 'DealerTeamMember' },

    // ── KYC Fields (stored masked - only last 4 digits visible) ──────────────
    aadhaarNo: { type: String, trim: true, default: '' },        // e.g. "XXXX-XXXX-1234"
    panNo: { type: String, trim: true, uppercase: true, default: '' }, // e.g. "ABCDE1234F"
    bankAccountNo: { type: String, trim: true, default: '' },    // masked
    bankIFSC: { type: String, trim: true, uppercase: true, default: '' },
    bankName: { type: String, trim: true, default: '' },
    bankAccountHolder: { type: String, trim: true, default: '' },

    // ── Referral Fields ───────────────────────────────────────────────────────
    referralCode: { type: String, sparse: true, uppercase: true, trim: true },
    referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', default: null },
  },
  { timestamps: true }
);

customerSchema.index({ dealer: 1, code: 1 }, { unique: true });
customerSchema.index({ dealer: 1, name: 'text', phone: 'text', email: 'text' });
customerSchema.index({ referralCode: 1 }, { sparse: true });

const Customer = mongoose.model('Customer', customerSchema);
export default Customer;
