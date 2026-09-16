import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema(
  {
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    employeeName: { type: String, trim: true },
    empId: { type: String, uppercase: true, trim: true },
    department: { type: String, trim: true },
    date: { type: Date, required: true }, // Normalized to midnight UTC or day string
    dateString: { type: String, required: true, index: true }, // Format YYYY-MM-DD
    checkIn: { type: String, default: null }, // e.g. "09:30 AM" or "09:30"
    checkOut: { type: String, default: null }, // e.g. "06:30 PM"
    totalHours: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['PRESENT', 'ABSENT', 'HALF_DAY', 'LATE', 'ON_LEAVE', 'HOLIDAY', 'WEEK_OFF'],
      default: 'PRESENT',
    },
    overtimeHours: { type: Number, default: 0 },
    markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    remarks: { type: String, default: '' },
  },
  { timestamps: true }
);

attendanceSchema.index({ employee: 1, dateString: 1 }, { unique: true });
attendanceSchema.index({ dateString: 1, status: 1 });
attendanceSchema.index({ department: 1, dateString: 1 });

const Attendance = mongoose.model('Attendance', attendanceSchema);
export default Attendance;
