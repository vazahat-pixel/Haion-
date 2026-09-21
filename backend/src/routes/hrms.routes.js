import { Router } from 'express';
import * as ctrl from '../controllers/hrms.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();
router.use(authenticate);

// 1. Dashboard Overview
router.get('/dashboard', ctrl.getHrmsStats);

// 2. Attendance — Manual / Bulk (existing)
router.get('/attendance', ctrl.getAttendanceList);
router.post('/attendance/mark', ctrl.markAttendance);
router.post('/attendance/bulk', ctrl.bulkMarkAttendance);
router.get('/attendance/matrix', ctrl.getMonthlyAttendanceMatrix);

// ── Real-Time Punch Endpoints (GPS / Google Maps) ─────────────────────────────
router.get('/attendance/today', ctrl.getMyAttendanceToday);          // Employee: my status today
router.get('/attendance/reverse-geocode', ctrl.getReverseGeocode);   // Reverse geocode proxy
router.post('/attendance/punch-in', ctrl.punchIn);                   // Employee: GPS punch in
router.post('/attendance/punch-out', ctrl.punchOut);                 // Employee: GPS punch out
router.get('/attendance/live', ctrl.getLiveAttendance);              // HR: Live all-staff monitor
router.patch('/attendance/:id/verify-field', ctrl.verifyFieldAttendance); // HR: Approve/reject field

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
