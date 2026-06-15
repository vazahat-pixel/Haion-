import client from './api/client';
import { endpoints } from './api/endpoints';

export const dealersService = {
  getList: async (filters) => (await client.get(endpoints.dealers.list, { params: filters })).normalized,
  getDetail: async (id) => (await client.get(endpoints.dealers.detail(id))).normalized.data,
  create: async (data) => (await client.post(endpoints.dealers.list, data)).normalized.data,
  updateStatus: async (id, status) =>
    (await client.patch(`${endpoints.dealers.detail(id)}/status`, { status })).normalized.data,
};
