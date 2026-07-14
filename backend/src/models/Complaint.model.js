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

const complaintSchema = new mongoose.Schema(
  {
    ticketNo: { type: String, required: true, unique: true, uppercase: true },
    customer: { type: String, required: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    phone: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    billNo: { type: String, trim: true, uppercase: true },
    product: { type: String, required: true },
    serialNo: { type: String, trim: true },
    priority: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], default: 'MEDIUM' },
    status: { type: String, enum: ['OPEN', 'IN_PROGRESS', 'ESCALATED', 'RESOLVED', 'CLOSED'], default: 'OPEN' },
    assignedTo: { type: String },
    assignedUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    description: { type: String },
    resolution: { type: String },
    warrantyEligible: { type: Boolean },
    warrantyStatus: { type: String },
    warrantyReason: { type: String },
    timeline: { type: [timelineEntrySchema], default: [] },
    resolvedAt: { type: Date },
  },
  { timestamps: true }
);

complaintSchema.index({ status: 1, priority: 1, createdAt: -1 });

const Complaint = mongoose.model('Complaint', complaintSchema);
export default Complaint;
