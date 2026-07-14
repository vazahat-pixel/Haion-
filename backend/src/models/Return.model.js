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

const returnSchema = new mongoose.Schema(
  {
    returnNo: { type: String, required: true, unique: true, uppercase: true },
    product: { type: String, required: true },
    serialNo: { type: String, required: true, uppercase: true },
    reason: { type: String, required: true },
    status: {
      type: String,
      enum: ['EXPECTED', 'SHIPPED', 'RECEIVED', 'VERIFIED', 'REJECTED', 'OVERDUE'],
      default: 'EXPECTED',
    },
    inspectionNotes: { type: String },
    shippedAt: { type: Date },
    receivedAt: { type: Date },
    inspectedAt: { type: Date },
    verifiedAt: { type: Date },
    overdueAt: { type: Date },
    overdue: { type: Boolean, default: false },
    warranty: { type: mongoose.Schema.Types.ObjectId, ref: 'Warranty' },
    spareRequest: { type: mongoose.Schema.Types.ObjectId, ref: 'SpareRequest' },
    serviceRequest: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceRequest' },
    complaint: { type: mongoose.Schema.Types.ObjectId, ref: 'Complaint' },
    returnedBy: { type: String },
    timeline: { type: [timelineEntrySchema], default: [] },
    conditionOnArrival: { type: String, enum: ['GOOD', 'DAMAGED', 'DEFECTIVE', 'UNKNOWN'], default: 'UNKNOWN' },
  },
  { timestamps: true }
);

returnSchema.index({ status: 1, createdAt: -1 });
returnSchema.index({ overdue: 1, status: 1 });

const Return = mongoose.model('Return', returnSchema);
export default Return;
