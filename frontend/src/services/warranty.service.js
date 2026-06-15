import client from './api/client';
import { endpoints } from './api/endpoints';
import { withMockFallback } from '@/utils/withMockFallback';
import { mockService } from './mock.service';

export const warrantyService = {
  getList: (filters) => withMockFallback(
    async () => (await client.get(endpoints.warranty.list, { params: filters })).normalized,
    () => mockService.warranty.getList(filters)
  ),
  getDetail: (id) => withMockFallback(
    async () => (await client.get(endpoints.warranty.detail(id))).normalized.data,
    () => mockService.warranty.getDetail(id)
  ),
  lookupBySerial: (serial) => withMockFallback(
    async () => (await client.get(endpoints.warranty.eligibility, { params: { serial } })).normalized.data,
    () => mockService.warranty.lookupBySerial(serial)
  ),
  downloadCertificate: (id) => withMockFallback(
    async () => (await client.get(`${endpoints.warranty.detail(id)}/certificate`)).normalized.data,
    () => mockService.warranty.downloadCertificate(id)
  ),
};
