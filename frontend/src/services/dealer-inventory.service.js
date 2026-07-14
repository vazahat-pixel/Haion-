import client from './api/client';

export const dealerInventoryService = {
  getList: async (filters) => (await client.get('/dealer/inventory', { params: filters })).normalized,
  getDetail: async (id) => (await client.get(`/dealer/inventory/${id}`)).normalized.data,
};
