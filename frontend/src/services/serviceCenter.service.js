import client from './api/client';

export const serviceCenterService = {
  getList: async (params) => (await client.get('/service-centers', { params })).normalized,
  getDetail: async (id) => (await client.get(`/service-centers/${id}`)).normalized.data,
  create: async (data) => (await client.post('/service-centers', data)).normalized.data,
  update: async (id, data) => (await client.put(`/service-centers/${id}`, data)).normalized.data,
  getInventory: async (id, params) => (await client.get(`/service-centers/${id}/inventory`, { params })).normalized,
  upsertInventoryItem: async (id, data) => (await client.post(`/service-centers/${id}/inventory`, data)).normalized.data,
};
