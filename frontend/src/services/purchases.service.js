import client from './api/client';

export const purchasesService = {
  getList: async (filters) => (await client.get('/purchases', { params: filters })).normalized,
  getDetail: async (id) => (await client.get(`/purchases/${id}`)).normalized.data,
  create: async (data) => (await client.post('/purchases', data)).normalized.data,
  receive: async (id) => (await client.post(`/purchases/${id}/receive`)).normalized.data,
  cancel: async (id) => (await client.post(`/purchases/${id}/cancel`)).normalized.data,
};
