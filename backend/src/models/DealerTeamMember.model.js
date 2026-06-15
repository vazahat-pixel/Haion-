import mongoose from 'mongoose';

const dealerTeamSchema = new mongoose.Schema(
  {
    dealer: { type: mongoose.Schema.Types.ObjectId, ref: 'Dealer', required: true },
    name: { type: String, required: true, trim: true },
    role: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
    target: { type: Number, default: 500000, min: 0 },
    achieved: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
  },
  { timestamps: true }
);

dealerTeamSchema.index({ dealer: 1, email: 1 });

const DealerTeamMember = mongoose.model('DealerTeamMember', dealerTeamSchema);
export default DealerTeamMember;
