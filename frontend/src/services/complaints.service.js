import client from './api/client';
import { endpoints } from './api/endpoints';
import { withMockFallback } from '@/utils/withMockFallback';
import { mockService } from './mock.service';

export const complaintsService = {
  getList: (filters) => withMockFallback(
    async () => (await client.get(endpoints.complaints.list, { params: filters })).normalized,
    () => mockService.complaints.getList(filters)
  ),
  getDetail: (id) => withMockFallback(
    async () => (await client.get(endpoints.complaints.detail(id))).normalized.data,
    () => mockService.complaints.getDetail(id)
  ),
  create: (data) => withMockFallback(
    async () => (await client.post(endpoints.complaints.list, data)).normalized.data,
    () => mockService.complaints.create(data)
  ),
  getTimeline: (id) => withMockFallback(
    async () => (await client.get(endpoints.complaints.timeline(id))).normalized.data,
    () => mockService.complaints.getTimeline(id)
  ),
  escalate: (id) => withMockFallback(
    async () => (await client.post(endpoints.complaints.escalate(id))).normalized.data,
    () => mockService.complaints.escalate(id)
  ),
  resolve: (id) => withMockFallback(
    async () => (await client.post(endpoints.complaints.resolve(id))).normalized.data,
    () => mockService.complaints.resolve(id)
  ),
};
