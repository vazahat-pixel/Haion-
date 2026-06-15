import client from './api/client';
import { endpoints } from './api/endpoints';

export const analyticsService = {
  getDashboard: async (panel, filters) => {
    const res = await client.get(endpoints.analytics.dashboard(panel), { params: filters });
    return res.normalized.data;
  },
  getRevenue: async (filters) => {
    const res = await client.get(endpoints.analytics.revenue, { params: filters });
    return res.normalized.data;
  },
  getComplaints: async (filters) => {
    const res = await client.get(endpoints.analytics.complaints, { params: filters });
    return res.normalized.data;
  },
};
