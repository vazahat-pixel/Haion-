import client from './api/client';
import { endpoints } from './api/endpoints';

export const complaintsService = {
  getList: async (filters) => (await client.get(endpoints.complaints.list, { params: filters })).normalized,
  getDetail: async (id) => (await client.get(endpoints.complaints.detail(id))).normalized.data,
  create: async (data) => (await client.post(endpoints.complaints.list, data)).normalized.data,
  getTimeline: async (id) => (await client.get(endpoints.complaints.timeline(id))).normalized.data,
  escalate: async (id) => (await client.post(endpoints.complaints.escalate(id))).normalized.data,
  resolve: async (id) => (await client.post(endpoints.complaints.resolve(id))).normalized.data,
  createPublic: async (data) => (await client.post('/complaints/public', data)).normalized.data,
  validateBill: async (params) => (await client.get('/complaints/public/validate-bill', { params })).normalized.data,
  lookupContact: async (params) => (await client.get('/complaints/public/lookup-contact', { params })).normalized.data,
};
