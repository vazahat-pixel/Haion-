import client from './api/client';

export const brandsService = {
  getList: async (filters) => (await client.get('/brands', { params: filters })).normalized,
  getDetail: async (id) => (await client.get(`/brands/${id}`)).normalized.data,
  create: async (data) => (await client.post('/brands', data)).normalized.data,
  update: async (id, data) => (await client.patch(`/brands/${id}`, data)).normalized.data,
};
