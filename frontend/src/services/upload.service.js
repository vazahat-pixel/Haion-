import client from './api/client';
import { endpoints } from './api/endpoints';

export const uploadService = {
  upload: async (file) => {
    const form = new FormData();
    form.append('file', file);
    const res = await client.post(endpoints.upload, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.normalized.data;
  },
};
