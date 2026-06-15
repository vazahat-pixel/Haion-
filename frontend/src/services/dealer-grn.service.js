import client from './api/client';
import { withMockFallback } from '@/utils/withMockFallback';
import { mockService } from './mock.service';

export const dealerGrnService = {
  getList: (filters) => withMockFallback(
    async () => (await client.get('/dealer/grn', { params: filters })).normalized,
    () => mockService.dealerGrn.getList(filters)
  ),
  getDetail: (id) => withMockFallback(
    async () => (await client.get(`/dealer/grn/${id}`)).normalized.data,
    () => mockService.dealerGrn.getDetail(id)
  ),
  confirm: (id) => withMockFallback(
    async () => (await client.post(`/dealer/grn/${id}/confirm`)).normalized.data,
    () => mockService.dealerGrn.confirm(id)
  ),
};
