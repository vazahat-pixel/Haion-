import client from './api/client';
import { endpoints } from './api/endpoints';

export const productTiersService = {
  getList: async (filters) => (await client.get('/products/tiers/all', { params: filters })).normalized,
  getDetail: async (id) => (await client.get(`/products/tiers/${id}`)).normalized.data,
  create: async (productId, data) =>
    (await client.post(endpoints.products.tiers(productId), data)).normalized.data,
  update: async (productId, tierId, data) =>
    (await client.put(endpoints.products.tier(productId, tierId), data)).normalized.data,
  updateStatus: async (productId, tierId, status) =>
    (await client.patch(`${endpoints.products.tier(productId, tierId)}/status`, { status })).normalized.data,
};
