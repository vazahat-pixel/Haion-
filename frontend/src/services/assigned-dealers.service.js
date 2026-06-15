import client from './api/client';
import { withMockFallback } from '@/utils/withMockFallback';
import { mockService } from './mock.service';

export const assignedDealersService = {
  getList: (filters) => withMockFallback(
    async () => (await client.get('/employee/assigned-dealers', { params: filters })).normalized,
    () => mockService.assignedDealers.getList(filters)
  ),
  getDetail: (id) => withMockFallback(
    async () => (await client.get(`/employee/assigned-dealers/${id}`)).normalized.data,
    () => mockService.assignedDealers.getDetail(id)
  ),
};
