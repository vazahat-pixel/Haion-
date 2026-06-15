import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    type: { type: String, required: true, trim: true },
    author: { type: String, required: true, trim: true },
    authorUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    dealer: { type: mongoose.Schema.Types.ObjectId, ref: 'Dealer' },
    period: { type: String, trim: true },
    status: { type: String, enum: ['IN_PROGRESS', 'COMPLETED', 'FAILED'], default: 'IN_PROGRESS' },
    summary: { type: String, trim: true },
    data: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

reportSchema.index({ type: 1, createdAt: -1 });

const Report = mongoose.model('Report', reportSchema);
export default Report;
