import client from './api/client';

export const employeePerformanceService = {
  get: async (role) => (await client.get('/employee/performance', { params: { role } })).normalized.data,
  getAnalytics: async () => (await client.get('/employee/dealer-analytics')).normalized.data,
};
