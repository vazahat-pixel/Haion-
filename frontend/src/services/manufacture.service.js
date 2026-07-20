import client from './api/client';

export const manufactureService = {
  getList: async (filters) => (await client.get('/manufacture', { params: filters })).normalized,
  getDetail: async (id) => (await client.get(`/manufacture/${id}`)).normalized.data,
  getMaterials: async (warehouseId) =>
    (await client.get('/manufacture/materials', { params: { warehouseId } })).normalized.data,
  create: async (data) => (await client.post('/manufacture', data)).normalized.data,
};
