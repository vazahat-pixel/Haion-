import client from './api/client';
import { withMockFallback } from '@/utils/withMockFallback';
import { mockService } from './mock.service';

export const dealerDispatchService = {
  getList: (filters) => withMockFallback(
    async () => (await client.get('/dealer/dispatches', { params: filters })).normalized,
    () => mockService.dealerDispatch.getList(filters)
  ),
  getDetail: (id) => withMockFallback(
    async () => (await client.get(`/dealer/dispatches/${id}`)).normalized.data,
    () => mockService.dealerDispatch.getDetail(id)
  ),
};
