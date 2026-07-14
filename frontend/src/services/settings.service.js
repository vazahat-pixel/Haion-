import client from './api/client';
import { endpoints } from './api/endpoints';

export const settingsService = {
  getGeneral: async () => (await client.get(endpoints.settings.general)).normalized.data,
  updateGeneral: async (data) => (await client.patch(endpoints.settings.general, data)).normalized.data,
  getGst: async () => (await client.get(endpoints.settings.gst)).normalized.data,
  updateGst: async (data) => (await client.patch(endpoints.settings.gst, data)).normalized.data,
  getNotifications: async () => (await client.get(endpoints.settings.notifications)).normalized.data,
  updateNotifications: async (data) => (await client.patch(endpoints.settings.notifications, data)).normalized.data,
  getCustomerPortal: async () => (await client.get(endpoints.settings.customerPortal)).normalized.data,
  updateCustomerPortal: async (data) => (await client.patch(endpoints.settings.customerPortal, data)).normalized.data,
  getCaReports: async () => (await client.get(endpoints.settings.caReports)).normalized.data,
  updateCaReports: async (data) => (await client.patch(endpoints.settings.caReports, data)).normalized.data,
  getBusiness: async () => (await client.get(endpoints.settings.business)).normalized.data,
  updateBusiness: async (data) => (await client.patch(endpoints.settings.business, data)).normalized.data,
  getProfileBundle: async () => (await client.get(endpoints.settings.businessBundle)).normalized.data,
  getInvoice: async () => (await client.get(endpoints.settings.invoice)).normalized.data,
  updateInvoice: async (data) => (await client.patch(endpoints.settings.invoice, data)).normalized.data,
  getPrint: async () => (await client.get(endpoints.settings.print)).normalized.data,
  updatePrint: async (data) => (await client.patch(endpoints.settings.print, data)).normalized.data,
};
