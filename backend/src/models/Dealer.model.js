import mongoose from 'mongoose';

const dealerSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    gstin: { type: String, required: true, trim: true, uppercase: true },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    creditLimit: { type: Number, default: 0 },
    outstanding: { type: Number, default: 0 },
    teamSize: { type: Number, default: 0 },
    status: { type: String, enum: ['ACTIVE', 'PENDING_ONBOARDING', 'SUSPENDED'], default: 'PENDING_ONBOARDING' },
    documentUrl: { type: String, default: null },
    logoUrl: { type: String, default: null },
    onboardedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

dealerSchema.index({ name: 'text', code: 'text', gstin: 1 });

const Dealer = mongoose.model('Dealer', dealerSchema);
export default Dealer;
