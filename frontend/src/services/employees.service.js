import client from './api/client';
import { endpoints } from './api/endpoints';

export const employeesService = {
  getList: async (filters) => (await client.get(endpoints.employees.list, { params: filters })).normalized,
  getDetail: async (id) => (await client.get(endpoints.employees.detail(id))).normalized.data,
  create: async (data) => (await client.post(endpoints.employees.list, data)).normalized.data,
  update: async (id, data) => (await client.patch(endpoints.employees.detail(id), data)).normalized.data,
};
