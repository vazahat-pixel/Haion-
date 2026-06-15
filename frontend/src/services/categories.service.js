import client from './api/client';

export const categoriesService = {
  getList: async (filters) => (await client.get('/categories', { params: filters })).normalized,
  getDetail: async (id) => (await client.get(`/categories/${id}`)).normalized.data,
  create: async (data) => (await client.post('/categories', data)).normalized.data,
  update: async (id, data) => (await client.patch(`/categories/${id}`, data)).normalized.data,
};
