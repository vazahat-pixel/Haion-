import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema(
  {
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    employeeName: { type: String, trim: true },
    empId: { type: String, uppercase: true, trim: true },
    department: { type: String, trim: true },

    // ── Date fields (keep backward compat with manual/bulk marking) ──────────
    date: { type: Date, required: true },
    dateString: { type: String, required: true, index: true }, // YYYY-MM-DD

    // ── Status & Hours (existing payroll logic untouched) ────────────────────
    checkIn: { type: String, default: null },   // formatted "09:30 AM" (manual/bulk)
    checkOut: { type: String, default: null },  // formatted "06:30 PM"
    totalHours: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['PRESENT', 'ABSENT', 'HALF_DAY', 'LATE', 'ON_LEAVE', 'HOLIDAY', 'WEEK_OFF'],
      default: 'PRESENT',
    },
    overtimeHours: { type: Number, default: 0 },
    markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    remarks: { type: String, default: '' },

    // ── Real-Time Punch (new — all optional so existing data is safe) ────────
    workMode: {
      type: String,
      enum: ['OFFICE', 'FIELD', 'REMOTE', 'MANUAL'],
      default: 'MANUAL',
    },
    checkInTime: { type: Date, default: null },   // Exact UTC timestamp at punch-in
    checkOutTime: { type: Date, default: null },  // Exact UTC timestamp at punch-out
    isPunchedIn: { type: Boolean, default: false }, // true while shift is active

    // ── GPS: Check-In Location (Google Maps Geocoding API reverse-geocoded) ──
    checkInLocation: {
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null },
      accuracy: { type: Number, default: null },          // GPS accuracy in meters
      address: { type: String, default: '' },              // Full formatted address
      distanceMeters: { type: Number, default: null },     // Distance from workplace
      isWithinGeofence: { type: Boolean, default: null },  // true if within radius
    },

    // ── GPS: Check-Out Location ───────────────────────────────────────────────
    checkOutLocation: {
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null },
      accuracy: { type: Number, default: null },
      address: { type: String, default: '' },
    },

    // ── Assigned Workplace (snapshot at punch time) ───────────────────────────
    workplace: {
      workplaceType: {
        type: String,
        enum: ['HEADQUARTERS', 'DEALER', 'WAREHOUSE', 'SERVICE_CENTER', 'CUSTOM', ''],
        default: '',
      },
      refId: { type: mongoose.Schema.Types.ObjectId, default: null },
      name: { type: String, default: '' },
      address: { type: String, default: '' },
      coordinates: {
        latitude: { type: Number, default: null },
        longitude: { type: Number, default: null },
      },
      geofenceRadiusMeters: { type: Number, default: 250 },
    },

    // ── Field Visit Details (workMode === 'FIELD') ────────────────────────────
    fieldDetails: {
      clientName: { type: String, default: '' },
      siteName: { type: String, default: '' },
      purpose: { type: String, default: '' },
      remarks: { type: String, default: '' },
      verificationStatus: {
        type: String,
        enum: ['PENDING', 'APPROVED', 'REJECTED'],
        default: 'PENDING',
      },
      verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      verifiedAt: { type: Date, default: null },
    },
  },
  { timestamps: true }
);

attendanceSchema.index({ employee: 1, dateString: 1 }, { unique: true });
attendanceSchema.index({ dateString: 1, status: 1 });
attendanceSchema.index({ department: 1, dateString: 1 });
attendanceSchema.index({ isPunchedIn: 1, dateString: 1 });            // Live monitor
attendanceSchema.index({ workMode: 1, dateString: 1 });               // Mode-based filtering
attendanceSchema.index({ 'fieldDetails.verificationStatus': 1 });     // Pending field verifications

const Attendance = mongoose.model('Attendance', attendanceSchema);
export default Attendance;
