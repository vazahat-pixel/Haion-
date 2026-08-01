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

const partUsedSchema = new mongoose.Schema(
  {
    sku: { type: String, required: true, uppercase: true },
    name: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, default: 0 },
    isDefective: { type: Boolean, default: false },
    addedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const jobCardSchema = new mongoose.Schema(
  {
    jobCardNo: { type: String, required: true, unique: true, uppercase: true },
    complaint: { type: mongoose.Schema.Types.ObjectId, ref: 'Complaint', required: true },
    source: {
      type: String,
      enum: ['CUSTOMER_PANEL', 'TOLL_FREE', 'WALK_IN'],
      default: 'CUSTOMER_PANEL',
    },
    customer: {
      name: { type: String, required: true },
      phone: { type: String },
      email: { type: String },
      address: { type: String },
      customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    },
    product: {
      name: { type: String, required: true },
      serialNo: { type: String, uppercase: true },
      billNo: { type: String, uppercase: true },
    },
    complaintDescription: { type: String },
    serviceCenter: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceCenter' },
    serviceCenterName: { type: String },
    assignedEngineer: {
      name: { type: String },
      phone: { type: String },
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    },
    warrantyStatus: {
      isWarranty: { type: Boolean, default: false },
      costType: { type: String, enum: ['FOC', 'PAID'], default: 'FOC' },
      status: { type: String },
      reason: { type: String },
    },
    partsUsed: { type: [partUsedSchema], default: [] },
    labourCharges: { type: Number, default: 0, min: 0 },
    totalAmount: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: ['OPEN', 'IN_PROGRESS', 'WAITING_PARTS', 'REPAIRED', 'RESOLVED', 'CLOSED', 'CANCELLED'],
      default: 'OPEN',
    },
    customerFeedback: {
      rating: { type: Number, min: 1, max: 5 },
      comment: { type: String },
      submittedAt: { type: Date },
    },
    timeline: { type: [timelineEntrySchema], default: [] },
    resolvedAt: { type: Date },
    closedAt: { type: Date },
  },
  { timestamps: true }
);

jobCardSchema.index({ jobCardNo: 1 });
jobCardSchema.index({ complaint: 1 });
jobCardSchema.index({ status: 1, createdAt: -1 });

const JobCard = mongoose.model('JobCard', jobCardSchema);
export default JobCard;
