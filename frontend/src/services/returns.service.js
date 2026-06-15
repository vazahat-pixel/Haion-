import client from './api/client';
import { endpoints } from './api/endpoints';
import { withMockFallback } from '@/utils/withMockFallback';
import { mockService } from './mock.service';

export const returnsService = {
  getList: (filters) => withMockFallback(
    async () => (await client.get(endpoints.returns.list, { params: filters })).normalized,
    () => mockService.returns.getList(filters)
  ),
  getDetail: (id) => withMockFallback(
    async () => (await client.get(endpoints.returns.detail(id))).normalized.data,
    () => mockService.returns.getDetail(id)
  ),
  getWorkflow: (id) => withMockFallback(
    async () => (await client.get(`${endpoints.returns.detail(id)}/workflow`)).normalized.data,
    () => mockService.returns.getWorkflow(id)
  ),
  advanceWorkflow: (id) => withMockFallback(
    async () => (await client.post(`${endpoints.returns.inspect(id)}`)).normalized.data,
    () => mockService.returns.advanceWorkflow(id)
  ),
};
