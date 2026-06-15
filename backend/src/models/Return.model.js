import mongoose from 'mongoose';

const returnSchema = new mongoose.Schema(
  {
    returnNo: { type: String, required: true, unique: true, uppercase: true },
    product: { type: String, required: true },
    serialNo: { type: String, required: true, uppercase: true },
    reason: { type: String, required: true },
    status: { type: String, enum: ['REQUESTED', 'RECEIVED', 'INSPECTED', 'APPROVED', 'REJECTED'], default: 'REQUESTED' },
    inspectionNotes: { type: String },
    receivedAt: { type: Date },
    inspectedAt: { type: Date },
    warranty: { type: mongoose.Schema.Types.ObjectId, ref: 'Warranty' },
  },
  { timestamps: true }
);

const Return = mongoose.model('Return', returnSchema);
export default Return;
