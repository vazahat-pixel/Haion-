import mongoose from 'mongoose';

const dealerReportSchema = new mongoose.Schema(
  {
    dealer: { type: mongoose.Schema.Types.ObjectId, ref: 'Dealer', required: true },
    title: { type: String, required: true, trim: true },
    type: { type: String, required: true, trim: true },
    period: { type: String, trim: true },
    revenue: { type: Number, default: 0, min: 0 },
    bills: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: ['IN_PROGRESS', 'COMPLETED', 'FAILED'], default: 'COMPLETED' },
  },
  { timestamps: true }
);

dealerReportSchema.index({ dealer: 1, createdAt: -1 });

const DealerReport = mongoose.model('DealerReport', dealerReportSchema);
export default DealerReport;
