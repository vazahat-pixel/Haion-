import client from './api/client';
import { endpoints } from './api/endpoints';

export const reportsService = {
  getList: async (filters) => (await client.get(endpoints.reports.list, { params: filters })).normalized,
  getDetail: async (id) => (await client.get(endpoints.reports.detail(id))).normalized.data,
  create: async (data) => (await client.post(endpoints.reports.list, data)).normalized.data,
};
