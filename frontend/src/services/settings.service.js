import client from './api/client';
import { endpoints } from './api/endpoints';

export const settingsService = {
  getGeneral: async () => (await client.get(endpoints.settings.general)).normalized.data,
  updateGeneral: async (data) => (await client.patch(endpoints.settings.general, data)).normalized.data,
  getGst: async () => (await client.get(endpoints.settings.gst)).normalized.data,
  updateGst: async (data) => (await client.patch(endpoints.settings.gst, data)).normalized.data,
  getNotifications: async () => (await client.get(endpoints.settings.notifications)).normalized.data,
  updateNotifications: async (data) => (await client.patch(endpoints.settings.notifications, data)).normalized.data,
};
