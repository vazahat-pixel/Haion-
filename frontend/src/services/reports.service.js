import client from './api/client';
import { endpoints } from './api/endpoints';

export const reportsService = {
  getList: async (filters) => (await client.get(endpoints.reports.list, { params: filters })).normalized,
  getCatalog: async () => {
    const res = (await client.get(endpoints.reports.catalog)).normalized.data;
    return {
      reports: res?.reports || res || [],
      categories: res?.categories || [...new Set((res?.reports || res || []).map((r) => r.category))],
    };
  },
  run: async (data) => (await client.post(endpoints.reports.run, data)).normalized.data,
  preview: async (code, params) => (await client.get(endpoints.reports.preview(code), { params })).normalized.data,
  getDetail: async (id) => (await client.get(endpoints.reports.detail(id))).normalized.data,
  getDeliveries: async (filters) => (await client.get('/reports/deliveries', { params: filters })).normalized,
};
