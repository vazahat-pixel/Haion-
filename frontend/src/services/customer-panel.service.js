import client from './api/client';

export const customerPanelService = {
  getConfig: async () => (await client.get('/customer-panel/config')).normalized.data,
  access: async (payload) => (await client.post('/customer-panel/access', payload)).normalized.data,
  refresh: async (payload) => (await client.post('/customer-panel/refresh', payload)).normalized.data,
  getMyHub: async () => (await client.get('/customer-panel/hub')).normalized.data,
  updateProfile: async (data) => (await client.patch('/customer-panel/profile', data)).normalized.data,
  getNotifications: async () => (await client.get('/customer-panel/notifications')).normalized.data,
  getComplaint: async (id) => (await client.get(`/customer-panel/complaints/${id}`)).normalized.data,
  getBill: async (billNo) => (await client.get(`/customer-panel/bills/${billNo}`)).normalized.data,
};
