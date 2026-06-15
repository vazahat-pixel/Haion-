import client from './api/client';
import { endpoints } from './api/endpoints';

export const warehousesService = {
  getList: async (filters) => (await client.get(endpoints.warehouses.list, { params: filters })).normalized,
  getDetail: async (id) => (await client.get(endpoints.warehouses.detail(id))).normalized.data,
  create: async (data) => (await client.post(endpoints.warehouses.list, data)).normalized.data,
  update: async (id, data) => (await client.patch(endpoints.warehouses.detail(id), data)).normalized.data,
};
