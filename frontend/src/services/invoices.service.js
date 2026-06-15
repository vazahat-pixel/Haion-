import client from './api/client';
import { endpoints } from './api/endpoints';

export const invoicesService = {
  getList: async (filters) => (await client.get(endpoints.invoices.list, { params: filters })).normalized,
  getDetail: async (id) => (await client.get(endpoints.invoices.detail(id))).normalized.data,
  downloadPdf: async (id, invoiceNo = 'invoice') => {
    const res = await client.get(`${endpoints.invoices.pdf(id)}?download=true&format=pdf`, { responseType: 'blob' });
    const blob = new Blob([res.data], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${invoiceNo}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  },
};
