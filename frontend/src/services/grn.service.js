import client from './api/client';
import { endpoints } from './api/endpoints';

export const grnService = {
  getList: async (filters) => (await client.get(endpoints.grn.list, { params: filters })).normalized,
  getDetail: async (id) => (await client.get(endpoints.grn.detail(id))).normalized.data,
  create: async (data) => (await client.post(endpoints.grn.list, data)).normalized.data,
  verify: async (id) => (await client.patch(`${endpoints.grn.detail(id)}/verify`)).normalized.data,
  reject: async (id, reason) => (await client.patch(`${endpoints.grn.detail(id)}/reject`, { reason })).normalized.data,
};
