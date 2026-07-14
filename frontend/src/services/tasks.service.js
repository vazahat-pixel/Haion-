import client from './api/client';
import { endpoints } from './api/endpoints';

export const tasksService = {
  getList: async (filters) => (await client.get(endpoints.tasks.list, { params: filters })).normalized,
  getDetail: async (id) => (await client.get(endpoints.tasks.detail(id))).normalized.data,
};
