import client from './api/client';

export const dealerDispatchService = {
  getList: async (filters) => (await client.get('/dealer/dispatches', { params: filters })).normalized,
  getDetail: async (id) => (await client.get(`/dealer/dispatches/${id}`)).normalized.data,
  getTracking: async (id) => (await client.get(`/dealer/dispatches/${id}/tracking`)).normalized.data,
};
