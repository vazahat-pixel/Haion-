import mongoose from 'mongoose';

const serviceRequestSchema = new mongoose.Schema(
  {
    requestNo: { type: String, required: true, unique: true, uppercase: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    customerName: { type: String },
    product: { type: String, required: true },
    serialNo: { type: String, trim: true },
    issue: { type: String, required: true },
    status: { type: String, enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'], default: 'OPEN' },
    complaint: { type: mongoose.Schema.Types.ObjectId, ref: 'Complaint' },
    warranty: { type: mongoose.Schema.Types.ObjectId, ref: 'Warranty' },
    resolvedAt: { type: Date },
  },
  { timestamps: true }
);

const ServiceRequest = mongoose.model('ServiceRequest', serviceRequestSchema);
export default ServiceRequest;
