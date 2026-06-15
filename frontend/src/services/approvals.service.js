import client from './api/client';
import { endpoints } from './api/endpoints';

export const approvalsService = {
  getList: async (filters) => (await client.get(endpoints.approvals.list, { params: filters })).normalized,
  getDetail: async (id) => (await client.get(endpoints.approvals.detail(id))).normalized.data,
  getPendingCount: async () => (await client.get(endpoints.approvals.pendingCount)).normalized.data,
  update: async (id, data) => (await client.patch(endpoints.approvals.detail(id), data)).normalized.data,
};
