import mongoose from 'mongoose';
import Employee from '../models/Employee.model.js';
import Attendance from '../models/Attendance.model.js';
import LeaveRequest from '../models/LeaveRequest.model.js';
import Payroll from '../models/Payroll.model.js';
import Department from '../models/Department.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess, sendCreated, sendError, sendPaginated } from '../utils/apiResponse.js';
import { parsePagination, buildSearchFilter } from '../utils/pagination.util.js';
import { toPublicDoc } from '../utils/serialize.util.js';
import { nextSequence } from '../utils/sequence.util.js';
import { addCompanyLedgerEntry } from '../services/companyLedger.service.js';

// Seed default departments if empty
async function ensureDefaultDepartments() {
  const count = await Department.countDocuments();
  if (count === 0) {
    await Department.insertMany([
      { code: 'OPS', name: 'Operations', designations: ['Operations Lead', 'Coordinator', 'Field Supervisor'] },
      { code: 'SALES', name: 'Sales & Marketing', designations: ['Area Sales Manager', 'Sales Executive', 'Business Dev Specialist'] },
      { code: 'MFG', name: 'Manufacturing & Assembly', designations: ['Plant Supervisor', 'Assembly Line Lead', 'Quality Inspector', 'Technician'] },
      { code: 'WHS', name: 'Warehouse & Logistics', designations: ['Warehouse Manager', 'Dispatcher', 'Inventory Clerk', 'Loader'] },
      { code: 'SVC', name: 'Service & Technical Support', designations: ['Service Center Incharge', 'EV Diagnostic Technician', 'Battery Specialist', 'Customer Support Rep'] },
      { code: 'FIN', name: 'Finance & Accounts', designations: ['Accountant', 'Billing Specialist', 'Finance Manager'] },
      { code: 'HR', name: 'Human Resources', designations: ['HR Manager', 'Talent Acquisition', 'Payroll Specialist'] },
    ]);
  }
}

// ── 1. HRMS Overview Dashboard Statistics ────────────────────────────────────
export const getHrmsStats = asyncHandler(async (req, res) => {
  await ensureDefaultDepartments();

  const totalEmployees = await Employee.countDocuments();
  const activeEmployees = await Employee.countDocuments({ status: 'ACTIVE' });
  const probationEmployees = await Employee.countDocuments({ status: 'PROBATION' });

  // Today's Date String YYYY-MM-DD
  const todayStr = new Date().toISOString().split('T')[0];

  const todayRecords = await Attendance.find({ dateString: todayStr }).lean();
  const presentCount = todayRecords.filter((r) => ['PRESENT', 'LATE'].includes(r.status)).length;
  const absentCount = todayRecords.filter((r) => r.status === 'ABSENT').length;
  const halfDayCount = todayRecords.filter((r) => r.status === 'HALF_DAY').length;
  const onLeaveCount = todayRecords.filter((r) => r.status === 'ON_LEAVE').length;

  const attendancePercentage = activeEmployees > 0 ? Math.round((presentCount / activeEmployees) * 100) : 0;

  // Pending Leave Requests
  const pendingLeavesCount = await LeaveRequest.countDocuments({ status: 'PENDING' });

  // Current Month Payroll
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const payrolls = await Payroll.find({ payrollMonth: currentMonth }).lean();
  const totalPayrollCost = payrolls.reduce((acc, p) => acc + (p.netSalary || 0), 0);
  const paidPayrollCount = payrolls.filter((p) => p.paymentStatus === 'PAID').length;

  // Department Distribution
  const deptAggregation = await Employee.aggregate([
    { $match: { status: { $ne: 'TERMINATED' } } },
    { $group: { _id: '$department', count: { $sum: 1 } } },
  ]);

  return sendSuccess(res, {
    data: {
      totalEmployees,
      activeEmployees,
      probationEmployees,
      today: {
        date: todayStr,
        present: presentCount,
        absent: absentCount,
        halfDay: halfDayCount,
        onLeave: onLeaveCount,
        attendancePercentage,
        totalMarked: todayRecords.length,
      },
      pendingLeaves: pendingLeavesCount,
      payroll: {
        month: currentMonth,
        totalCost: totalPayrollCost,
        generatedCount: payrolls.length,
        paidCount: paidPayrollCount,
      },
      departments: deptAggregation.map((d) => ({ name: d._id || 'General', count: d.count })),
    },
  });
});

// ── 2. Attendance Management ──────────────────────────────────────────────────
export const markAttendance = asyncHandler(async (req, res) => {
  const { employeeId, date, status = 'PRESENT', checkIn = '09:30 AM', checkOut = '06:30 PM', overtimeHours = 0, remarks = '' } = req.body;

  if (!employeeId) return sendError(res, { message: 'Employee ID is required', statusCode: 400 });

  const emp = await Employee.findById(employeeId);
  if (!emp) return sendError(res, { message: 'Employee not found', statusCode: 404 });

  const targetDate = date ? new Date(date) : new Date();
  const dateStr = targetDate.toISOString().split('T')[0];

  let record = await Attendance.findOne({ employee: emp._id, dateString: dateStr });
  if (record) {
    record.status = status;
    record.checkIn = checkIn;
    record.checkOut = checkOut;
    record.overtimeHours = Number(overtimeHours) || 0;
    record.remarks = remarks;
    record.markedBy = req.user?._id;
    await record.save();
  } else {
    record = await Attendance.create({
      employee: emp._id,
      employeeName: `${emp.firstName} ${emp.lastName}`,
      empId: emp.empId,
      department: emp.department,
      date: targetDate,
      dateString: dateStr,
      status,
      checkIn,
      checkOut,
      totalHours: status === 'PRESENT' ? 8 : status === 'HALF_DAY' ? 4 : 0,
      overtimeHours: Number(overtimeHours) || 0,
      remarks,
      markedBy: req.user?._id,
    });
  }

  return sendSuccess(res, {
    data: toPublicDoc(record.toObject()),
    message: `Attendance marked as ${status} for ${emp.firstName} ${emp.lastName}`,
  });
});

export const bulkMarkAttendance = asyncHandler(async (req, res) => {
  const { date, records = [] } = req.body;
  if (!Array.isArray(records) || records.length === 0) {
    return sendError(res, { message: 'No records provided', statusCode: 400 });
  }

  const targetDate = date ? new Date(date) : new Date();
  const dateStr = targetDate.toISOString().split('T')[0];

  const results = [];
  for (const item of records) {
    if (!item.employeeId) continue;
    const emp = await Employee.findById(item.employeeId);
    if (!emp) continue;

    const status = item.status || 'PRESENT';
    let rec = await Attendance.findOne({ employee: emp._id, dateString: dateStr });
    if (rec) {
      rec.status = status;
      rec.checkIn = item.checkIn || rec.checkIn || '09:30 AM';
      rec.checkOut = item.checkOut || rec.checkOut || '06:30 PM';
      rec.overtimeHours = Number(item.overtimeHours) || 0;
      rec.remarks = item.remarks || '';
      await rec.save();
      results.push(rec);
    } else {
      rec = await Attendance.create({
        employee: emp._id,
        employeeName: `${emp.firstName} ${emp.lastName}`,
        empId: emp.empId,
        department: emp.department,
        date: targetDate,
        dateString: dateStr,
        status,
        checkIn: item.checkIn || '09:30 AM',
        checkOut: item.checkOut || '06:30 PM',
        totalHours: status === 'PRESENT' ? 8 : status === 'HALF_DAY' ? 4 : 0,
        overtimeHours: Number(item.overtimeHours) || 0,
        remarks: item.remarks || '',
        markedBy: req.user?._id,
      });
      results.push(rec);
    }
  }

  return sendSuccess(res, {
    data: results.map(toPublicDoc),
    message: `Attendance marked for ${results.length} staff members.`,
  });
});

export const getAttendanceList = asyncHandler(async (req, res) => {
  const { page, perPage, skip, sort } = parsePagination(req.query);
  const filter = {};

  if (req.query.dateString) {
    filter.dateString = req.query.dateString;
  }
  if (req.query.status) {
    filter.status = req.query.status;
  }
  if (req.query.department) {
    filter.department = req.query.department;
  }
  if (req.query.employeeId) {
    filter.employee = req.query.employeeId;
  }
  if (req.query.search) {
    Object.assign(filter, buildSearchFilter(req.query.search, ['employeeName', 'empId', 'department']));
  }

  const [rows, total] = await Promise.all([
    Attendance.find(filter).sort(sort || { dateString: -1 }).skip(skip).limit(perPage).lean(),
    Attendance.countDocuments(filter),
  ]);

  return sendPaginated(res, { data: rows.map(toPublicDoc), total, page, perPage });
});

export const getMonthlyAttendanceMatrix = asyncHandler(async (req, res) => {
  const { month = new Date().toISOString().slice(0, 7), department } = req.query; // YYYY-MM
  const empFilter = { status: { $ne: 'TERMINATED' } };
  if (department) empFilter.department = department;

  const employees = await Employee.find(empFilter).sort({ department: 1, firstName: 1 }).lean();

  // Find all attendance records for this month
  const regex = new RegExp(`^${month}`);
  const attendanceRecords = await Attendance.find({ dateString: regex }).lean();

  // Map employeeId -> { dateString: status }
  const attMap = {};
  attendanceRecords.forEach((r) => {
    const key = String(r.employee);
    if (!attMap[key]) attMap[key] = {};
    attMap[key][r.dateString] = {
      status: r.status,
      checkIn: r.checkIn,
      checkOut: r.checkOut,
      overtimeHours: r.overtimeHours,
    };
  });

  const matrix = employees.map((emp) => {
    const empRecords = attMap[String(emp._id)] || {};
    let present = 0;
    let absent = 0;
    let halfDay = 0;
    let leaves = 0;

    Object.values(empRecords).forEach((item) => {
      if (['PRESENT', 'LATE'].includes(item.status)) present++;
      if (item.status === 'ABSENT') absent++;
      if (item.status === 'HALF_DAY') halfDay++;
      if (item.status === 'ON_LEAVE') leaves++;
    });

    return {
      employeeId: emp._id,
      empId: emp.empId,
      name: `${emp.firstName} ${emp.lastName}`,
      department: emp.department,
      designation: emp.designation || 'Staff',
      records: empRecords,
      summary: { present, absent, halfDay, leaves },
    };
  });

  return sendSuccess(res, { data: { month, matrix } });
});

// ── 3. Leave Management ───────────────────────────────────────────────────────
export const listLeaveRequests = asyncHandler(async (req, res) => {
  const { page, perPage, skip, sort } = parsePagination(req.query);
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.employeeId) filter.employee = req.query.employeeId;
  if (req.query.search) {
    Object.assign(filter, buildSearchFilter(req.query.search, ['requestNo', 'employeeName', 'empId', 'department']));
  }

  const [rows, total] = await Promise.all([
    LeaveRequest.find(filter).sort(sort || { createdAt: -1 }).skip(skip).limit(perPage).lean(),
    LeaveRequest.countDocuments(filter),
  ]);

  return sendPaginated(res, { data: rows.map(toPublicDoc), total, page, perPage });
});

export const createLeaveRequest = asyncHandler(async (req, res) => {
  const { employeeId, leaveType = 'CASUAL', startDate, endDate, daysCount = 1, reason = '' } = req.body;

  if (!employeeId || !startDate || !endDate || !reason) {
    return sendError(res, { message: 'Employee, dates, and reason are required', statusCode: 400 });
  }

  const emp = await Employee.findById(employeeId);
  if (!emp) return sendError(res, { message: 'Employee not found', statusCode: 404 });

  const requestNo = nextSequence('LVR');
  const doc = await LeaveRequest.create({
    requestNo,
    employee: emp._id,
    employeeName: `${emp.firstName} ${emp.lastName}`,
    empId: emp.empId,
    department: emp.department,
    leaveType,
    startDate: new Date(startDate),
    endDate: new Date(endDate),
    daysCount: Number(daysCount) || 1,
    reason,
    status: 'PENDING',
  });

  return sendCreated(res, {
    data: toPublicDoc(doc.toObject()),
    message: `Leave request ${requestNo} submitted successfully.`,
  });
});

export const reviewLeaveRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { action, remarks = '' } = req.body; // 'APPROVE' or 'REJECT'

  if (!['APPROVE', 'REJECT'].includes(action)) {
    return sendError(res, { message: 'Action must be APPROVE or REJECT', statusCode: 400 });
  }

  const doc = await LeaveRequest.findById(id);
  if (!doc) return sendError(res, { message: 'Leave request not found', statusCode: 404 });

  if (doc.status !== 'PENDING') {
    return sendError(res, { message: `Request is already ${doc.status}`, statusCode: 400 });
  }

  const isApproved = action === 'APPROVE';
  doc.status = isApproved ? 'APPROVED' : 'REJECTED';
  doc.reviewedBy = req.user?._id;
  doc.reviewerName = req.user?.firstName || 'Admin';
  doc.reviewRemarks = remarks;
  doc.reviewedAt = new Date();
  await doc.save();

  // Deduct balance on approval
  if (isApproved) {
    const emp = await Employee.findById(doc.employee);
    if (emp) {
      const typeKey = doc.leaveType.toLowerCase(); // 'casual' -> 'cl', 'sick' -> 'sl', 'earned' -> 'el'
      const mapKey = typeKey.startsWith('c') ? 'cl' : typeKey.startsWith('s') ? 'sl' : typeKey.startsWith('e') ? 'el' : 'lwp';
      if (emp.leaveBalances && emp.leaveBalances[mapKey] !== undefined) {
        emp.leaveBalances[mapKey] = Math.max(0, emp.leaveBalances[mapKey] - doc.daysCount);
        await emp.save();
      }
    }
  }

  return sendSuccess(res, {
    data: toPublicDoc(doc.toObject()),
    message: `Leave request ${isApproved ? 'approved' : 'rejected'} successfully.`,
  });
});

// ── 4. Payroll & Payslip Engine ───────────────────────────────────────────────
export const generateMonthlyPayroll = asyncHandler(async (req, res) => {
  const { month } = req.body; // "YYYY-MM"
  if (!month) return sendError(res, { message: 'Payroll month (YYYY-MM) is required', statusCode: 400 });

  const activeEmployees = await Employee.find({ status: { $in: ['ACTIVE', 'PROBATION'] } }).lean();
  if (activeEmployees.length === 0) {
    return sendError(res, { message: 'No active employees found to run payroll', statusCode: 400 });
  }

  const [yearStr, monthStr] = month.split('-');
  const daysInMonth = new Date(Number(yearStr), Number(monthStr), 0).getDate();

  const results = [];
  for (const emp of activeEmployees) {
    const sal = emp.salaryStructure || {};
    const ctc = Number(sal.ctc) || 25000;
    const basic = Number(sal.basic) || Math.round(ctc * 0.5);
    const hra = Number(sal.hra) || Math.round(ctc * 0.2);
    const conveyance = Number(sal.conveyance) || 1600;
    const allowances = Number(sal.allowances) || Math.max(0, ctc - (basic + hra + conveyance));
    const gross = basic + hra + conveyance + allowances;

    const pf = Number(sal.pfDeduction) || (basic > 15000 ? 1800 : Math.round(basic * 0.12));
    const esi = Number(sal.esiDeduction) || (gross <= 21000 ? Math.round(gross * 0.0075) : 0);
    const pt = Number(sal.professionalTax) || 200;
    const tds = Number(sal.tds) || 0;
    const totalDeductions = pf + esi + pt + tds;
    const netSalary = Math.max(0, gross - totalDeductions);

    let payrollRecord = await Payroll.findOne({ payrollMonth: month, employee: emp._id });
    if (payrollRecord) {
      payrollRecord.totalDaysInMonth = daysInMonth;
      payrollRecord.earnings = { basic, hra, conveyance, allowances, bonus: 0, overtimePay: 0 };
      payrollRecord.grossSalary = gross;
      payrollRecord.deductions = { pf, esi, professionalTax: pt, tds, lwpDeduction: 0, otherDeductions: 0 };
      payrollRecord.totalDeductions = totalDeductions;
      payrollRecord.netSalary = netSalary;
      await payrollRecord.save();
      results.push(payrollRecord);
    } else {
      payrollRecord = await Payroll.create({
        payrollMonth: month,
        employee: emp._id,
        employeeName: `${emp.firstName} ${emp.lastName}`,
        empId: emp.empId,
        department: emp.department,
        designation: emp.designation || 'Staff',
        pan: emp.pan || '',
        bankDetails: emp.bankDetails || {},
        totalDaysInMonth: daysInMonth,
        presentDays: daysInMonth - 4, // standard month default
        paidLeaveDays: 0,
        unpaidLeaveDays: 0,
        effectiveWorkingDays: daysInMonth - 4,
        earnings: { basic, hra, conveyance, allowances, bonus: 0, overtimePay: 0 },
        grossSalary: gross,
        deductions: { pf, esi, professionalTax: pt, tds, lwpDeduction: 0, otherDeductions: 0 },
        totalDeductions,
        netSalary,
        paymentStatus: 'PROCESSED',
        generatedBy: req.user?._id,
      });
      results.push(payrollRecord);
    }
  }

  return sendSuccess(res, {
    data: results.map(toPublicDoc),
    message: `Generated monthly payroll for ${results.length} employees for ${month}.`,
  });
});

export const listPayrolls = asyncHandler(async (req, res) => {
  const { page, perPage, skip, sort } = parsePagination(req.query);
  const filter = {};
  if (req.query.month) filter.payrollMonth = req.query.month;
  if (req.query.employeeId) filter.employee = req.query.employeeId;
  if (req.query.paymentStatus) filter.paymentStatus = req.query.paymentStatus;
  if (req.query.search) {
    Object.assign(filter, buildSearchFilter(req.query.search, ['employeeName', 'empId', 'department']));
  }

  const [rows, total] = await Promise.all([
    Payroll.find(filter).sort(sort || { createdAt: -1 }).skip(skip).limit(perPage).lean(),
    Payroll.countDocuments(filter),
  ]);

  return sendPaginated(res, { data: rows.map(toPublicDoc), total, page, perPage });
});

export const getPayrollDetail = asyncHandler(async (req, res) => {
  const doc = await Payroll.findById(req.params.id).populate('employee').lean();
  if (!doc) return sendError(res, { message: 'Payroll record not found', statusCode: 404 });
  return sendSuccess(res, { data: toPublicDoc(doc) });
});

export const disbursePayroll = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { paymentMode = 'BANK_TRANSFER', referenceNo = '', notes = '' } = req.body;

  const doc = await Payroll.findById(id);
  if (!doc) return sendError(res, { message: 'Payroll record not found', statusCode: 404 });

  doc.paymentStatus = 'PAID';
  doc.paymentDate = new Date();
  doc.paymentMode = paymentMode;
  doc.referenceNo = referenceNo || `PAY-${doc.payrollMonth}-${doc.empId}`;
  doc.notes = notes;

  // Automatically record Expense in Company Ledger!
  try {
    const ledgerEntry = await addCompanyLedgerEntry({
      txnType: 'EXPENSE',
      date: doc.paymentDate,
      credit: 0,
      debit: doc.netSalary,
      description: `Staff Salary Disbursed: ${doc.employeeName} (${doc.empId}) - Month ${doc.payrollMonth} via ${paymentMode}`,
      partyName: doc.employeeName,
      referenceNo: doc.referenceNo,
      sourceRef: doc._id,
      sourceModel: 'Expense',
      paymentMode,
      notes: `Gross: ₹${doc.grossSalary}, Deductions: ₹${doc.totalDeductions}, Net Paid: ₹${doc.netSalary}`,
      createdBy: req.user?._id,
    });
    doc.companyLedgerRef = ledgerEntry._id;
  } catch (ledgerErr) {
    console.error('[CompanyLedger] Failed to record salary expense in company ledger:', ledgerErr);
  }

  await doc.save();

  return sendSuccess(res, {
    data: toPublicDoc(doc.toObject()),
    message: `Salary of ₹${doc.netSalary.toLocaleString()} disbursed to ${doc.employeeName} and recorded in Company Ledger!`,
  });
});

// ── 5. Departments & Designations CRUD ────────────────────────────────────────
export const listDepartments = asyncHandler(async (req, res) => {
  await ensureDefaultDepartments();
  const departments = await Department.find().sort({ name: 1 }).lean();

  // Attach live employee counts per department
  const counts = await Employee.aggregate([
    { $match: { status: { $ne: 'TERMINATED' } } },
    { $group: { _id: '$department', count: { $sum: 1 } } },
  ]);
  const countMap = {};
  counts.forEach((c) => {
    countMap[c._id] = c.count;
  });

  const enriched = departments.map((d) => ({
    ...toPublicDoc(d),
    employeeCount: countMap[d.name] || 0,
  }));

  return sendSuccess(res, { data: enriched });
});

export const createDepartment = asyncHandler(async (req, res) => {
  const { code, name, headOfDepartment, designations = [], description } = req.body;
  if (!name) return sendError(res, { message: 'Department name is required', statusCode: 400 });

  const depCode = code ? code.toUpperCase().trim() : nextSequence('DEP');
  const doc = await Department.create({
    code: depCode,
    name: name.trim(),
    headOfDepartment: headOfDepartment || '',
    designations: Array.isArray(designations) ? designations : [],
    description: description || '',
  });

  return sendCreated(res, { data: toPublicDoc(doc.toObject()), message: 'Department created successfully' });
});

export const updateDepartment = asyncHandler(async (req, res) => {
  const doc = await Department.findById(req.params.id);
  if (!doc) return sendError(res, { message: 'Department not found', statusCode: 404 });

  const allowed = ['name', 'headOfDepartment', 'designations', 'description', 'status'];
  allowed.forEach((k) => {
    if (req.body[k] !== undefined) doc[k] = req.body[k];
  });
  await doc.save();

  return sendSuccess(res, { data: toPublicDoc(doc.toObject()), message: 'Department updated successfully' });
});
