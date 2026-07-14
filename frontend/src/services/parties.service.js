import client from './api/client';

export const partiesService = {
  getList: async (filters) => (await client.get('/parties', { params: filters })).normalized,
  getDetail: async (id) => (await client.get(`/parties/${id}`)).normalized.data,
  create: async (data) => (await client.post('/parties', data)).normalized.data,
  update: async (id, data) => (await client.patch(`/parties/${id}`, data)).normalized.data,
  updateStatus: async (id, status) =>
    (await client.patch(`/parties/${id}/status`, { status })).normalized.data,
};
