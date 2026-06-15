import client from './api/client';
import { endpoints } from './api/endpoints';
import { withMockFallback } from '@/utils/withMockFallback';
import { mockService } from './mock.service';

export const tasksService = {
  getList: (filters) => withMockFallback(
    async () => (await client.get(endpoints.tasks.list, { params: filters })).normalized,
    () => mockService.tasks.getList(filters)
  ),
  getDetail: (id) => withMockFallback(
    async () => (await client.get(endpoints.tasks.detail(id))).normalized.data,
    () => mockService.tasks.getDetail(id)
  ),
};
