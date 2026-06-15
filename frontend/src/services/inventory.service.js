import client from './api/client';
import { endpoints } from './api/endpoints';

export const inventoryService = {
  getList: async (filters) => (await client.get(endpoints.inventory.list, { params: filters })).normalized,
  getDetail: async (id) => (await client.get(endpoints.inventory.detail(id))).normalized.data,
  create: async (data) => (await client.post(endpoints.inventory.list, data)).normalized.data,
  update: async (id, data) => (await client.patch(endpoints.inventory.detail(id), data)).normalized.data,
  getLowStock: async () => (await client.get(endpoints.inventory.lowStock)).normalized.data,
};
