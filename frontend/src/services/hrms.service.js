import client from './api/client';

export const hrmsService = {
  // 1. Dashboard
  getDashboardStats: async () => (await client.get('/hrms/dashboard')).normalized.data,

  // 2. Attendance
  getAttendanceList: async (params) => (await client.get('/hrms/attendance', { params })).normalized,
  markAttendance: async (data) => (await client.post('/hrms/attendance/mark', data)).normalized.data,
  bulkMarkAttendance: async (data) => (await client.post('/hrms/attendance/bulk', data)).normalized.data,
  getMonthlyMatrix: async (params) => (await client.get('/hrms/attendance/matrix', { params })).normalized.data,

  // 3. Leaves
  getLeaveRequests: async (params) => (await client.get('/hrms/leaves', { params })).normalized,
  createLeaveRequest: async (data) => (await client.post('/hrms/leaves', data)).normalized.data,
  reviewLeaveRequest: async (id, data) => (await client.post(`/hrms/leaves/${id}/review`, data)).normalized.data,

  // 4. Payroll
  generatePayroll: async (data) => (await client.post('/hrms/payroll/generate', data)).normalized.data,
  getPayrolls: async (params) => (await client.get('/hrms/payroll', { params })).normalized,
  getPayrollDetail: async (id) => (await client.get(`/hrms/payroll/${id}`)).normalized.data,
  disbursePayroll: async (id, data) => (await client.post(`/hrms/payroll/${id}/disburse`, data)).normalized.data,

  // 5. Departments
  getDepartments: async () => (await client.get('/hrms/departments')).normalized.data,
  createDepartment: async (data) => (await client.post('/hrms/departments', data)).normalized.data,
  updateDepartment: async (id, data) => (await client.put(`/hrms/departments/${id}`, data)).normalized.data,
};
