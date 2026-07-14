import client from './api/client';
import { endpoints } from './api/endpoints';

export const ordersService = {
  getList: async (filters) => (await client.get(endpoints.orders.list, { params: filters })).normalized,
  getDetail: async (id) => (await client.get(endpoints.orders.detail(id))).normalized.data,
  getTracking: async (id) => (await client.get(endpoints.orders.tracking(id))).normalized.data,
};
