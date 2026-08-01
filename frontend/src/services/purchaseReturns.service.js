import client from './api/client';
import { endpoints } from './api/endpoints';

export const purchaseReturnsService = {
  getList: async (filters) =>
    (await client.get(endpoints.purchaseReturns.list, { params: filters })).normalized,

  getDetail: async (id) =>
    (await client.get(endpoints.purchaseReturns.detail(id))).normalized.data,

  create: async (data) =>
    (await client.post(endpoints.purchaseReturns.list, data)).normalized.data,

  ship: async (id, data) =>
    (await client.post(endpoints.purchaseReturns.ship(id), data)).normalized.data,

  receive: async (id, data) =>
    (await client.post(endpoints.purchaseReturns.receive(id), data)).normalized.data,

  reject: async (id, data) =>
    (await client.post(endpoints.purchaseReturns.reject(id), data)).normalized.data,
};
