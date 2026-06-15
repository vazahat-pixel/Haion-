import client from './api/client';
import { withMockFallback } from '@/utils/withMockFallback';
import { mockService } from './mock.service';

export const dealerReportsService = {
  getList: (filters) => withMockFallback(
    async () => (await client.get('/dealer/reports', { params: filters })).normalized,
    () => mockService.dealerReports.getList(filters)
  ),
};
