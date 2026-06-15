import client from './api/client';
import { endpoints } from './api/endpoints';

export const expensesService = {
  getList: async (filters) => (await client.get('/expenses', { params: filters })).normalized,
  getDetail: async (id) => (await client.get(`/expenses/${id}`)).normalized.data,
  create: async (data) => (await client.post('/expenses', data)).normalized.data,
  updateStatus: async (id, status) =>
    (await client.patch(`/expenses/${id}/status`, { status })).normalized.data,
};
