import client from './api/client';

export const storeAdminService = {
  getOrders: async (params) => (await client.get('/store/orders', { params })).normalized,
  getOrder: async (id) => (await client.get(`/store/orders/${id}`)).normalized.data,
  updateStatus: async (id, payload) =>
    (await client.patch(`/store/orders/${id}/status`, payload)).normalized.data,
  getAnalyticsSummary: async () => (await client.get('/store/analytics/summary')).normalized.data,
  getAnalyticsChart: async (days = 30) =>
    (await client.get('/store/analytics/chart', { params: { days } })).normalized.data,
  getTopProducts: async (limit = 10) =>
    (await client.get('/store/analytics/top-products', { params: { limit } })).normalized.data,
};
