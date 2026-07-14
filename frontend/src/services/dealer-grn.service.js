import client from './api/client';

export const dealerGrnService = {
  getList: async (filters) => (await client.get('/dealer/grn', { params: filters })).normalized,
  getDetail: async (id) => (await client.get(`/dealer/grn/${id}`)).normalized.data,
  confirm: async (id, receivedItems) =>
    (await client.post(`/dealer/grn/${id}/confirm`, { receivedItems })).normalized,
};
