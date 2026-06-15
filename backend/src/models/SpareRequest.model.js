import mongoose from 'mongoose';

const spareRequestSchema = new mongoose.Schema(
  {
    requestNo: { type: String, required: true, unique: true, uppercase: true },
    partName: { type: String, required: true },
    sku: { type: String, uppercase: true },
    quantity: { type: Number, required: true, min: 1 },
    status: { type: String, enum: ['PENDING', 'APPROVED', 'DISPATCHED', 'REJECTED'], default: 'PENDING' },
    requestedBy: { type: String, required: true },
    requestedUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    complaint: { type: mongoose.Schema.Types.ObjectId, ref: 'Complaint' },
    notes: { type: String },
  },
  { timestamps: true }
);

const SpareRequest = mongoose.model('SpareRequest', spareRequestSchema);
export default SpareRequest;
