import client from './api/client';
import { endpoints } from './api/endpoints';
import { withMockFallback } from '@/utils/withMockFallback';
import { mockService } from './mock.service';

export const sparesService = {
  getList: (filters) => withMockFallback(
    async () => (await client.get(endpoints.spares.list, { params: filters })).normalized,
    () => mockService.spares.getList(filters)
  ),
  getDetail: (id) => withMockFallback(
    async () => (await client.get(endpoints.spares.detail(id))).normalized.data,
    () => mockService.spares.getDetail(id)
  ),
  getWorkflow: (id) => withMockFallback(
    async () => (await client.get(`${endpoints.spares.detail(id)}/workflow`)).normalized.data,
    () => mockService.spares.getWorkflow(id)
  ),
  advanceWorkflow: (id) => withMockFallback(
    async () => (await client.post(`${endpoints.spares.detail(id)}/advance`)).normalized.data,
    () => mockService.spares.advanceWorkflow(id)
  ),
};
