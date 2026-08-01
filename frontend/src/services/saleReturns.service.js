import client from './api/client';
import { endpoints } from './api/endpoints';

export const saleReturnsService = {
  getList: async (filters) =>
    (await client.get(endpoints.saleReturns.list, { params: filters })).normalized,

  getDetail: async (id) =>
    (await client.get(endpoints.saleReturns.detail(id))).normalized.data,

  create: async (data) =>
    (await client.post(endpoints.saleReturns.list, data)).normalized.data,

  void: async (id, data) =>
    (await client.post(endpoints.saleReturns.void(id), data)).normalized.data,
};
