import client from './api/client';

export const gstService = {
  getList: async (filters) => {
    const res = await client.get('/gst', { params: filters });
    return res.normalized;
  },
};
