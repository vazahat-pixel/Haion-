import client from './api/client';
import { endpoints } from './api/endpoints';

export const returnsService = {
  getList: async (filters) => (await client.get(endpoints.returns.list, { params: filters })).normalized,
  getDetail: async (id) => (await client.get(endpoints.returns.detail(id))).normalized.data,
  getTimeline: async (id) => (await client.get(`${endpoints.returns.detail(id)}/timeline`)).normalized.data,
  getKpis: async () => (await client.get(`${endpoints.returns.list}/kpis`)).normalized.data,
  create: async (data) => (await client.post(endpoints.returns.list, data)).normalized.data,
  ship: async (id, notes) => (await client.post(`${endpoints.returns.detail(id)}/ship`, { notes })).normalized.data,
  receive: async (id, body) => (await client.post(`${endpoints.returns.detail(id)}/receive`, body)).normalized.data,
  inspect: async (id, body) => (await client.post(endpoints.returns.inspect(id), body)).normalized.data,
  verify: async (id, body) => (await client.post(`${endpoints.returns.detail(id)}/verify`, body)).normalized.data,
};
