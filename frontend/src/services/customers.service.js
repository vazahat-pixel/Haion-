import client from './api/client';
import { endpoints } from './api/endpoints';

export const customersService = {
  getList: async (filters) => (await client.get(endpoints.customers.list, { params: filters })).normalized,
  getDetail: async (id) => (await client.get(endpoints.customers.detail(id))).normalized.data,
  create: async (data) => (await client.post(endpoints.customers.list, data)).normalized.data,
};
