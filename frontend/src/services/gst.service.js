import client from './api/client';
import { endpoints } from './api/endpoints';

export const gstService = {
  getList: async (filters) => {
    const res = await client.get('/gst', { params: filters });
    return res.normalized;
  },
  validateGstin: async (gstin) =>
    (await client.get(endpoints.gst.validate(gstin))).normalized.data,
};
