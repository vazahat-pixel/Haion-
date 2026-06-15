import client from './api/client';
import { endpoints } from './api/endpoints';

export const dispatchService = {
  getList: async (filters) => (await client.get(endpoints.dispatch.list, { params: filters })).normalized,
  getDetail: async (id) => (await client.get(endpoints.dispatch.detail(id))).normalized.data,
  getTracking: async (id) => (await client.get(endpoints.dispatch.tracking(id))).normalized.data,
  create: async (data) => (await client.post(endpoints.dispatch.list, data)).normalized.data,
  updateStatus: async (id, status) =>
    (await client.patch(`${endpoints.dispatch.detail(id)}/status`, { status })).normalized.data,
};
