import mongoose from 'mongoose';

const reportDeliverySchema = new mongoose.Schema(
  {
    reportType: { type: String, enum: ['DAILY', 'WEEKLY', 'MONTHLY'], required: true },
    recipientType: { type: String, enum: ['ADMIN', 'DEALER', 'EMPLOYEE', 'MANAGER', 'SERVICE'], required: true },
    recipientEmail: { type: String, required: true },
    recipientUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['PENDING', 'SENT', 'FAILED'], default: 'PENDING' },
    sentAt: { type: Date },
    retryCount: { type: Number, default: 0 },
    nextRetryAt: { type: Date },
    lastError: { type: String },
    subject: { type: String },
    reportData: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

reportDeliverySchema.index({ reportType: 1, recipientType: 1, createdAt: -1 });

const ReportDelivery = mongoose.model('ReportDelivery', reportDeliverySchema);
export default ReportDelivery;
