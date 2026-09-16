import mongoose from 'mongoose';
import { ROLES } from '../config/constants.js';

const employeeSchema = new mongoose.Schema(
  {
    empId: { type: String, required: true, unique: true, uppercase: true, trim: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    department: { type: String, required: true, trim: true },
    designation: { type: String, trim: true, default: 'Staff' },
    employmentType: {
      type: String,
      enum: ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN'],
      default: 'FULL_TIME',
    },
    role: { type: String, enum: Object.values(ROLES), required: true },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'ON_LEAVE', 'PROBATION', 'NOTICE_PERIOD', 'RESIGNED', 'TERMINATED'],
      default: 'ACTIVE',
    },
    gender: { type: String, enum: ['MALE', 'FEMALE', 'OTHER'], default: 'MALE' },
    dob: { type: Date, default: null },
    bloodGroup: { type: String, trim: true, default: '' },
    address: { type: String, trim: true, default: '' },
    emergencyContact: {
      name: { type: String, trim: true, default: '' },
      relation: { type: String, trim: true, default: '' },
      phone: { type: String, trim: true, default: '' },
    },
    pan: { type: String, trim: true, uppercase: true, default: '' },
    aadhaar: { type: String, trim: true, default: '' },
    bankDetails: {
      accountNumber: { type: String, trim: true, default: '' },
      ifsc: { type: String, trim: true, uppercase: true, default: '' },
      bankName: { type: String, trim: true, default: '' },
      branchName: { type: String, trim: true, default: '' },
      upiId: { type: String, trim: true, default: '' },
    },
    salaryStructure: {
      ctc: { type: Number, default: 0 },
      basic: { type: Number, default: 0 },
      hra: { type: Number, default: 0 },
      conveyance: { type: Number, default: 0 },
      allowances: { type: Number, default: 0 },
      pfDeduction: { type: Number, default: 0 },
      esiDeduction: { type: Number, default: 0 },
      professionalTax: { type: Number, default: 0 },
      tds: { type: Number, default: 0 },
    },
    leaveBalances: {
      cl: { type: Number, default: 12 }, // Casual Leave
      sl: { type: Number, default: 10 }, // Sick Leave
      el: { type: Number, default: 15 }, // Earned/Privilege Leave
      lwp: { type: Number, default: 0 }, // Leave without pay taken
    },
    probationEndDate: { type: Date, default: null },
    confirmationDate: { type: Date, default: null },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    manager: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
    dealerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Dealer' },
    warehouseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },
    joinedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

employeeSchema.index({ firstName: 'text', lastName: 'text', empId: 'text', email: 'text' });
employeeSchema.virtual('name').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

const Employee = mongoose.model('Employee', employeeSchema);
export default Employee;
