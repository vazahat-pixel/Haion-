import client from './api/client';

export const stockMovementsService = {
  getList: async (filters) => (await client.get('/stock-movements', { params: filters })).normalized,
  getSkuHistory: async (sku) => (await client.get(`/stock-movements/sku/${encodeURIComponent(sku)}`)).normalized.data,
};
