import mongoose from 'mongoose';

const leaveRequestSchema = new mongoose.Schema(
  {
    requestNo: { type: String, required: true, unique: true, uppercase: true },
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    employeeName: { type: String, trim: true },
    empId: { type: String, uppercase: true, trim: true },
    department: { type: String, trim: true },
    leaveType: {
      type: String,
      enum: ['CASUAL', 'SICK', 'EARNED', 'UNPAID', 'OTHER'],
      default: 'CASUAL',
      required: true,
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    daysCount: { type: Number, required: true, min: 0.5 },
    reason: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'],
      default: 'PENDING',
    },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    reviewerName: { type: String, default: '' },
    reviewRemarks: { type: String, default: '' },
    reviewedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

leaveRequestSchema.index({ employee: 1, status: 1 });
leaveRequestSchema.index({ status: 1, startDate: -1 });

const LeaveRequest = mongoose.model('LeaveRequest', leaveRequestSchema);
export default LeaveRequest;
