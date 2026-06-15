import client from './api/client';
import { endpoints } from './api/endpoints';

export const notificationsService = {
  getList: async (filters) => (await client.get(endpoints.notifications.list, { params: filters })).normalized,
  getUnreadCount: async () => (await client.get(endpoints.notifications.unreadCount)).normalized.data,
  markRead: async (id) => (await client.post(endpoints.notifications.markRead(id))).normalized.data,
  markAllRead: async () => (await client.post(endpoints.notifications.markAllRead)).normalized.data,
};
