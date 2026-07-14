import client from './api/client';
import { endpoints } from './api/endpoints';

export const warrantyService = {
  getList: async (filters) => (await client.get(endpoints.warranty.list, { params: filters })).normalized,
  getDetail: async (id) => (await client.get(endpoints.warranty.detail(id))).normalized.data,
  lookupBySerial: async (serial) =>
    (await client.get(endpoints.warranty.eligibility, { params: { serial } })).normalized.data,
  publicLookup: async ({ billNo, serial }) =>
    (await client.get('/warranty/lookup', { params: { billNo, serial } })).normalized.data,
  downloadCertificate: async (id) => {
    try {
      const response = await client.get(`${endpoints.warranty.detail(id)}/certificate/pdf`, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `warranty-${id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      return true;
    } catch {
      const data = (await client.get(`${endpoints.warranty.detail(id)}/certificate`)).normalized.data;
      const html = data.certificateHtml || '';
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = data.filename || `warranty-${data.serialNo}.html`;
      a.click();
      URL.revokeObjectURL(url);
      return data;
    }
  },
};
