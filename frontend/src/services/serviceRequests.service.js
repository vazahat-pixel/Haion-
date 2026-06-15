import client from './api/client';
import { endpoints } from './api/endpoints';
import { withMockFallback } from '@/utils/withMockFallback';
import { mockService } from './mock.service';

export const serviceRequestsService = {
  getList: (filters) => withMockFallback(
    async () => (await client.get(endpoints.serviceRequests.list, { params: filters })).normalized,
    () => mockService.serviceRequests.getList(filters)
  ),
  getDetail: (id) => withMockFallback(
    async () => (await client.get(endpoints.serviceRequests.detail(id))).normalized.data,
    () => mockService.serviceRequests.getDetail(id)
  ),
  create: (data) => withMockFallback(
    async () => (await client.post(endpoints.serviceRequests.list, data)).normalized.data,
    () => mockService.serviceRequests.create(data)
  ),
  getTimeline: (id) => withMockFallback(
    async () => (await client.get(`${endpoints.serviceRequests.detail(id)}/timeline`)).normalized.data,
    () => mockService.serviceRequests.getTimeline(id)
  ),
};
