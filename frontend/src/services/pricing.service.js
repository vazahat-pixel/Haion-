import client from './api/client';

export const pricingService = {
  getList: async (filters) => (await client.get('/pricing', { params: filters })).normalized,
  getDetail: async (id) => (await client.get(`/pricing/${id}`)).normalized.data,
  create: async (data) => (await client.post('/pricing', data)).normalized.data,
  update: async (id, data) => (await client.patch(`/pricing/${id}`, data)).normalized.data,
};
