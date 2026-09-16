import mongoose from 'mongoose';

const earningsSchema = new mongoose.Schema(
  {
    basic: { type: Number, default: 0, min: 0 },
    hra: { type: Number, default: 0, min: 0 },
    conveyance: { type: Number, default: 0, min: 0 },
    allowances: { type: Number, default: 0, min: 0 },
    bonus: { type: Number, default: 0, min: 0 },
    overtimePay: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const deductionsSchema = new mongoose.Schema(
  {
    pf: { type: Number, default: 0, min: 0 },
    esi: { type: Number, default: 0, min: 0 },
    professionalTax: { type: Number, default: 0, min: 0 },
    tds: { type: Number, default: 0, min: 0 },
    lwpDeduction: { type: Number, default: 0, min: 0 },
    otherDeductions: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const payrollSchema = new mongoose.Schema(
  {
    payrollMonth: { type: String, required: true, index: true }, // Format "YYYY-MM", e.g. "2026-09"
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    employeeName: { type: String, required: true, trim: true },
    empId: { type: String, required: true, uppercase: true, trim: true },
    department: { type: String, trim: true },
    designation: { type: String, trim: true },
    pan: { type: String, trim: true, default: '' },
    bankDetails: {
      accountNumber: { type: String, trim: true, default: '' },
      ifsc: { type: String, trim: true, default: '' },
      bankName: { type: String, trim: true, default: '' },
    },

    totalDaysInMonth: { type: Number, default: 30 },
    presentDays: { type: Number, default: 0 },
    paidLeaveDays: { type: Number, default: 0 },
    unpaidLeaveDays: { type: Number, default: 0 },
    effectiveWorkingDays: { type: Number, default: 0 },

    earnings: { type: earningsSchema, default: () => ({}) },
    grossSalary: { type: Number, default: 0, min: 0 },

    deductions: { type: deductionsSchema, default: () => ({}) },
    totalDeductions: { type: Number, default: 0, min: 0 },

    netSalary: { type: Number, default: 0, min: 0 },

    paymentStatus: {
      type: String,
      enum: ['DRAFT', 'PROCESSED', 'PAID'],
      default: 'PROCESSED',
    },
    paymentDate: { type: Date, default: null },
    paymentMode: { type: String, default: 'BANK_TRANSFER' },
    referenceNo: { type: String, default: '' },

    companyLedgerRef: { type: mongoose.Schema.Types.ObjectId, ref: 'CompanyLedger', default: null },
    notes: { type: String, default: '' },
    generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

payrollSchema.index({ payrollMonth: 1, employee: 1 }, { unique: true });
payrollSchema.index({ payrollMonth: 1, department: 1 });
payrollSchema.index({ paymentStatus: 1 });

const Payroll = mongoose.model('Payroll', payrollSchema);
export default Payroll;
