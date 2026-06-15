import client from './api/client';
import { withMockFallback } from '@/utils/withMockFallback';
import { mockService } from './mock.service';

export const dealerInventoryService = {
  getList: (filters) => withMockFallback(
    async () => (await client.get('/dealer/inventory', { params: filters })).normalized,
    () => mockService.dealerInventory.getList(filters)
  ),
  getDetail: (id) => withMockFallback(
    async () => (await client.get(`/dealer/inventory/${id}`)).normalized.data,
    () => mockService.dealerInventory.getDetail(id)
  ),
};
