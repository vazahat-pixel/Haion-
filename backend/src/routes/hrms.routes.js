import { Router } from 'express';
import * as ctrl from '../controllers/hrms.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();
router.use(authenticate);

// 1. Dashboard Overview
router.get('/dashboard', ctrl.getHrmsStats);

// 2. Attendance
router.get('/attendance', ctrl.getAttendanceList);
router.post('/attendance/mark', ctrl.markAttendance);
router.post('/attendance/bulk', ctrl.bulkMarkAttendance);
router.get('/attendance/matrix', ctrl.getMonthlyAttendanceMatrix);

// 3. Leave Requests
router.get('/leaves', ctrl.listLeaveRequests);
router.post('/leaves', ctrl.createLeaveRequest);
router.post('/leaves/:id/review', ctrl.reviewLeaveRequest);

// 4. Payroll Engine & Payslips
router.post('/payroll/generate', ctrl.generateMonthlyPayroll);
router.get('/payroll', ctrl.listPayrolls);
router.get('/payroll/:id', ctrl.getPayrollDetail);
router.post('/payroll/:id/disburse', ctrl.disbursePayroll);

// 5. Departments & Designations
router.get('/departments', ctrl.listDepartments);
router.post('/departments', ctrl.createDepartment);
router.put('/departments/:id', ctrl.updateDepartment);

export default router;
