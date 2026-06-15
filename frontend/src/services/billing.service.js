import client from './api/client';
import { endpoints } from './api/endpoints';

export const billingService = {
  getList: async (filters) => (await client.get(endpoints.billing.list, { params: filters })).normalized,
  getDetail: async (id) => (await client.get(endpoints.billing.detail(id))).normalized.data,
  create: async (data) => (await client.post(endpoints.billing.list, data)).normalized.data,
  getNextBillNumber: async () => (await client.get(endpoints.billing.nextBillNumber)).normalized.data,
  send: async (id) => (await client.post(endpoints.billing.send(id))).normalized.data,
  markPaid: async (id) => (await client.post(endpoints.billing.markPaid(id))).normalized.data,
  cancel: async (id) => (await client.post(endpoints.billing.cancel(id))).normalized.data,
};
