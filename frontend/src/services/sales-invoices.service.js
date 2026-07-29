import client from './api/client';

export const salesInvoicesService = {
  getList: async (filters) => (await client.get('/sales-invoices', { params: filters })).normalized,
  getDetail: async (id) => (await client.get(`/sales-invoices/${id}`)).normalized.data,
  getNextNumber: async (prefix = 'SI') => (await client.get('/sales-invoices/next-number', { params: { prefix } })).normalized.data,
  create: async (data) => (await client.post('/sales-invoices', data)).normalized.data,
  update: async (id, data) => (await client.put(`/sales-invoices/${id}`, data)).normalized.data,
  cancel: async (id) => (await client.post(`/sales-invoices/${id}/cancel`)).normalized.data,
  getPdfUrl: (id) => `/sales-invoices/${id}/pdf`,
};
