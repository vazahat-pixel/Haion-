import mongoose from 'mongoose';

const approvalSchema = new mongoose.Schema(
  {
    type: { type: String, required: true, trim: true },
    requester: { type: String, required: true, trim: true },
    requesterUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    dealer: { type: mongoose.Schema.Types.ObjectId, ref: 'Dealer' },
    amount: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING' },
    description: { type: String, trim: true },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
    reviewNotes: { type: String, trim: true },
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

approvalSchema.index({ status: 1, submittedAt: -1 });

const Approval = mongoose.model('Approval', approvalSchema);
export default Approval;
