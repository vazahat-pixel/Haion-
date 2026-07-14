import mongoose from 'mongoose';

const timelineEntrySchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    variant: { type: String, enum: ['default', 'success', 'warning', 'danger', 'info'], default: 'default' },
    at: { type: Date, default: Date.now },
    by: { type: String },
  },
  { _id: false }
);

const noteSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    addedBy: { type: String },
    addedByUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    addedAt: { type: Date, default: Date.now },
    attachmentUrl: { type: String },
    attachmentName: { type: String },
  },
  { _id: true }
);

const serviceRequestSchema = new mongoose.Schema(
  {
    requestNo: { type: String, required: true, unique: true, uppercase: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    customerName: { type: String },
    product: { type: String, required: true },
    serialNo: { type: String, trim: true },
    billNo: { type: String, trim: true, uppercase: true },
    issue: { type: String, required: true },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'MEDIUM',
    },
    status: {
      type: String,
      enum: ['NEW', 'ASSIGNED', 'IN_PROGRESS', 'WAITING_PARTS', 'PARTS_RECEIVED', 'RESOLVED', 'CLOSED', 'CANCELLED'],
      default: 'NEW',
    },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    assignedToName: { type: String },
    serviceCenter: { type: String },
    complaint: { type: mongoose.Schema.Types.ObjectId, ref: 'Complaint' },
    warranty: { type: mongoose.Schema.Types.ObjectId, ref: 'Warranty' },
    warrantyValid: { type: Boolean, default: false },
    resolvedAt: { type: Date },
    closedAt: { type: Date },
    resolvedNotes: { type: String },
    timeline: { type: [timelineEntrySchema], default: [] },
    notes: { type: [noteSchema], default: [] },
    estimatedCompletion: { type: Date },
  },
  { timestamps: true }
);

serviceRequestSchema.index({ status: 1, priority: 1, createdAt: -1 });
serviceRequestSchema.index({ customer: 1, status: 1 });
serviceRequestSchema.index({ assignedTo: 1, status: 1 });

const ServiceRequest = mongoose.model('ServiceRequest', serviceRequestSchema);
export default ServiceRequest;
