import mongoose from 'mongoose';

const timelineEntrySchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    variant: { type: String, enum: ['default', 'success', 'warning', 'danger'], default: 'default' },
    at: { type: Date, default: Date.now },
    by: { type: String },
  },
  { _id: false }
);

export const INSURANCE_CLAIM_STATUSES = ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'PAID', 'CLOSED'];

const insuranceClaimSchema = new mongoose.Schema(
  {
    claimNo: { type: String, required: true, unique: true, uppercase: true, trim: true },
    sequenceNumber: { type: Number, default: 1 },
    dealer: { type: mongoose.Schema.Types.ObjectId, ref: 'Dealer', required: true },
    dealerName: { type: String, required: true, trim: true },
    customerName: { type: String, required: true, trim: true },
    customerPhone: { type: String, trim: true, default: '' },
    product: { type: String, required: true, trim: true },
    serialNo: { type: String, trim: true, default: '' },
    policyNo: { type: String, trim: true, default: '' },
    incidentDate: { type: Date },
    claimAmount: { type: Number, required: true, min: 0 },
    description: { type: String, maxlength: 2000, default: '' },
    status: { type: String, enum: INSURANCE_CLAIM_STATUSES, default: 'SUBMITTED' },
    reviewNotes: { type: String, maxlength: 1000, default: '' },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
    paidAmount: { type: Number, default: 0 },
    paidAt: { type: Date },
    walletTransaction: { type: mongoose.Schema.Types.ObjectId, ref: 'InsuranceWalletTransaction' },
    timeline: { type: [timelineEntrySchema], default: [] },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

insuranceClaimSchema.index({ dealer: 1, status: 1, createdAt: -1 });
insuranceClaimSchema.index({ claimNo: 1 });
insuranceClaimSchema.index({ customerName: 'text', product: 'text', policyNo: 'text' });

const InsuranceClaim = mongoose.model('InsuranceClaim', insuranceClaimSchema);
export default InsuranceClaim;
