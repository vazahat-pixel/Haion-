import client from './api/client';

export const hrmsService = {
  // 1. Dashboard
  getDashboardStats: async () => (await client.get('/hrms/dashboard')).normalized.data,

  // 2. Attendance — Manual / Bulk
  getAttendanceList: async (params) => (await client.get('/hrms/attendance', { params })).normalized,
  markAttendance: async (data) => (await client.post('/hrms/attendance/mark', data)).normalized.data,
  bulkMarkAttendance: async (data) => (await client.post('/hrms/attendance/bulk', data)).normalized.data,
  getMonthlyMatrix: async (params) => (await client.get('/hrms/attendance/matrix', { params })).normalized.data,

  // 3. Real-Time Punch (GPS + Google Maps)
  getMyAttendanceToday: async () => (await client.get('/hrms/attendance/today')).normalized.data,
  reverseGeocode: async (lat, lng) => (await client.get('/hrms/attendance/reverse-geocode', { params: { lat, lng } })).normalized.data,
  punchIn: async (data) => (await client.post('/hrms/attendance/punch-in', data)).normalized,
  punchOut: async (data) => (await client.post('/hrms/attendance/punch-out', data)).normalized,
  getLiveAttendance: async (params) => (await client.get('/hrms/attendance/live', { params })).normalized,
  verifyFieldAttendance: async (id, data) => (await client.patch(`/hrms/attendance/${id}/verify-field`, data)).normalized.data,

  // 4. Leaves
  getLeaveRequests: async (params) => (await client.get('/hrms/leaves', { params })).normalized,
  createLeaveRequest: async (data) => (await client.post('/hrms/leaves', data)).normalized.data,
  reviewLeaveRequest: async (id, data) => (await client.post(`/hrms/leaves/${id}/review`, data)).normalized.data,

  // 5. Payroll
  generatePayroll: async (data) => (await client.post('/hrms/payroll/generate', data)).normalized.data,
  getPayrolls: async (params) => (await client.get('/hrms/payroll', { params })).normalized,
  getPayrollDetail: async (id) => (await client.get(`/hrms/payroll/${id}`)).normalized.data,
  disbursePayroll: async (id, data) => (await client.post(`/hrms/payroll/${id}/disburse`, data)).normalized.data,

  // 6. Departments
  getDepartments: async () => (await client.get('/hrms/departments')).normalized.data,
  createDepartment: async (data) => (await client.post('/hrms/departments', data)).normalized.data,
  updateDepartment: async (id, data) => (await client.put(`/hrms/departments/${id}`, data)).normalized.data,
};
