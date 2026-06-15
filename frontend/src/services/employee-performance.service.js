import client from './api/client';
import { withMockFallback } from '@/utils/withMockFallback';
import { mockService } from './mock.service';

export const employeePerformanceService = {
  get: (role) => withMockFallback(
    async () => (await client.get('/employee/performance', { params: { role } })).normalized.data,
    () => mockService.employeePerformance.get(role)
  ),
  getAnalytics: () => withMockFallback(
    async () => (await client.get('/employee/dealer-analytics')).normalized.data,
    () => mockService.dealerAnalytics.get()
  ),
};
