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

const spareRequestSchema = new mongoose.Schema(
  {
    requestNo: { type: String, required: true, unique: true, uppercase: true },
    partName: { type: String, required: true },
    sku: { type: String, uppercase: true },
    quantity: { type: Number, required: true, min: 1 },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'DISPATCHED', 'RECEIVED', 'COMPLETED', 'REJECTED'],
      default: 'PENDING',
    },
    requestedBy: { type: String, required: true },
    requestedUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    complaint: { type: mongoose.Schema.Types.ObjectId, ref: 'Complaint' },
    serviceRequest: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceRequest' },
    notes: { type: String },
    approvedBy: { type: String },
    approvedAt: { type: Date },
    dispatchedAt: { type: Date },
    receivedAt: { type: Date },
    completedAt: { type: Date },
    deliveredTo: { type: String },
    warehouseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },
    warehouseDeducted: { type: Boolean, default: false },
    timeline: { type: [timelineEntrySchema], default: [] },
    rejectionReason: { type: String },
    overdue: { type: Boolean, default: false },
    overdueAt: { type: Date },
  },
  { timestamps: true }
);

spareRequestSchema.index({ status: 1, createdAt: -1 });
spareRequestSchema.index({ overdue: 1, status: 1 });

const SpareRequest = mongoose.model('SpareRequest', spareRequestSchema);
export default SpareRequest;
