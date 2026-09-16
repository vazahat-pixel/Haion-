import client from './api/client';

export const serviceCenterBillingService = {
  getInvoices: async (params) => (await client.get('/service-centers/invoices', { params })).normalized,
  getInvoiceDetail: async (id) => (await client.get(`/service-centers/invoices/${id}`)).normalized.data,
  createInvoice: async (data) => (await client.post('/service-centers/invoices', data)).normalized.data,
  recordPayment: async (id, data) => (await client.post(`/service-centers/invoices/${id}/payments`, data)).normalized.data,
};
