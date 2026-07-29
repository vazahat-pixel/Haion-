import client from './api/client';

export const dealerOrdersService = {
  getList: async (filters) => (await client.get('/dealer-orders', { params: filters })).normalized,
  getDetail: async (id) => (await client.get(`/dealer-orders/${id}`)).normalized.data,
  create: async (data) => (await client.post('/dealer-orders', data)).normalized.data,
  updateStatus: async (id, status, adminNotes) =>
    (await client.patch(`/dealer-orders/${id}/status`, { status, adminNotes })).normalized.data,
};
