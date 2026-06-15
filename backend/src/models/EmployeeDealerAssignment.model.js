import mongoose from 'mongoose';

const assignmentSchema = new mongoose.Schema(
  {
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    dealer: { type: mongoose.Schema.Types.ObjectId, ref: 'Dealer', required: true },
    target: { type: Number, default: 500000, min: 0 },
    zone: { type: String, enum: ['GREEN', 'YELLOW', 'RED'], default: 'YELLOW' },
    lastVisit: { type: Date },
    contactName: { type: String, trim: true },
    contactPhone: { type: String, trim: true },
  },
  { timestamps: true }
);

assignmentSchema.index({ employee: 1, dealer: 1 }, { unique: true });

const EmployeeDealerAssignment = mongoose.model('EmployeeDealerAssignment', assignmentSchema);
export default EmployeeDealerAssignment;
