import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema(
  {
    expenseNo: { type: String, required: true, unique: true, uppercase: true, trim: true },
    category: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    vendor: { type: String, trim: true, default: '—' },
    status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING' },
    submittedBy: { type: String, required: true, trim: true },
    submittedByUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    submittedAt: { type: Date, default: Date.now },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
    dedupeKey: { type: String, trim: true, index: true },
    auditTrail: {
      type: [{
        at: { type: Date, default: Date.now },
        by: { type: String, required: true },
        action: { type: String, required: true },
        note: { type: String, default: '' },
      }],
      default: [],
    },
  },
  { timestamps: true }
);

expenseSchema.index({ status: 1, submittedAt: -1 });

const Expense = mongoose.model('Expense', expenseSchema);
export default Expense;
