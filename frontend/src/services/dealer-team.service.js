import client from './api/client';
import { withMockFallback } from '@/utils/withMockFallback';
import { mockService } from './mock.service';

export const dealerTeamService = {
  getList: (filters) => withMockFallback(
    async () => (await client.get('/dealer/team', { params: filters })).normalized,
    () => mockService.team.getList(filters)
  ),
};
