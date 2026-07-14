import client from './api/client';
import { endpoints } from './api/endpoints';

export const sparesService = {
  getList: async (filters) => (await client.get(endpoints.spares.list, { params: filters })).normalized,
  getDetail: async (id) => (await client.get(endpoints.spares.detail(id))).normalized.data,
  getTimeline: async (id) => (await client.get(`${endpoints.spares.detail(id)}/timeline`)).normalized.data,
  getKpis: async () => (await client.get(`${endpoints.spares.list}/kpis`)).normalized.data,
  create: async (data) => (await client.post(endpoints.spares.request, data)).normalized.data,
  approve: async (id, notes) => (await client.post(`${endpoints.spares.detail(id)}/approve`, { notes })).normalized.data,
  reject: async (id, reason) => (await client.post(`${endpoints.spares.detail(id)}/reject`, { reason })).normalized.data,
  dispatch: async (id, body) => (await client.post(`${endpoints.spares.detail(id)}/dispatch`, body)).normalized.data,
  receive: async (id, notes) => (await client.post(`${endpoints.spares.detail(id)}/receive`, { notes })).normalized.data,
  complete: async (id, notes) => (await client.post(`${endpoints.spares.detail(id)}/complete`, { notes })).normalized.data,
};
