import client from './api/client';
import { endpoints } from './api/endpoints';

export const auditService = {
  getList: async (filters) => (await client.get(endpoints.audit.list, { params: filters })).normalized,
  getDetail: async (id) => (await client.get(endpoints.audit.detail(id))).normalized.data,
};
