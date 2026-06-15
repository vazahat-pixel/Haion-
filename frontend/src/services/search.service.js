import client from './api/client';
import { endpoints } from './api/endpoints';

export const searchService = {
  global: async (q) => {
    const res = await client.get(endpoints.search.global, { params: { q } });
    return res.normalized.data;
  },
};
