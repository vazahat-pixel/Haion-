import client from './api/client';
import { endpoints } from './api/endpoints';
import { withMockFallback } from '@/utils/withMockFallback';
import { mockService } from './mock.service';

export const ordersService = {
  getList: (filters) => withMockFallback(
    async () => (await client.get(endpoints.orders.list, { params: filters })).normalized,
    () => mockService.orders.getList(filters)
  ),
  getDetail: (id) => withMockFallback(
    async () => (await client.get(endpoints.orders.detail(id))).normalized.data,
    () => mockService.orders.getDetail(id)
  ),
};
