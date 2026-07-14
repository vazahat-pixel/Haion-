import cmsPublicClient from './api/cmsPublicClient';

export const storePublicService = {
  getConfig: async () => (await cmsPublicClient.get('/store/config')).normalized.data,
  checkout: async (payload) => (await cmsPublicClient.post('/store/checkout', payload)).normalized.data,
  verifyPayment: async (payload) => (await cmsPublicClient.post('/store/payments/verify', payload)).normalized.data,
  trackOrder: async (orderNo, phone) =>
    (await cmsPublicClient.get(`/store/orders/track/${encodeURIComponent(orderNo)}`, { params: { phone } })).normalized.data,
};
