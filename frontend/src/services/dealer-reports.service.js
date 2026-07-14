import client from './api/client';

export const dealerReportsService = {
  getList: async (filters) => (await client.get('/dealer/reports', { params: filters })).normalized,
  getCatalog: async () => {
    const res = (await client.get('/dealer/reports/catalog')).normalized.data;
    return {
      reports: res?.reports || [],
      categories: res?.categories || [...new Set((res?.reports || []).map((r) => r.category))],
    };
  },
  run: async (data) => (await client.post('/dealer/reports/run', data)).normalized.data,
  getDetail: async (id) => (await client.get(`/dealer/reports/${id}`)).normalized.data,
};
