import client from './api/client';
import { endpoints } from './api/endpoints';

export const productsService = {
  getList: async (filters) => (await client.get(endpoints.products.list, { params: filters })).normalized,
  getDetail: async (id) => {
    const data = (await client.get(endpoints.products.detail(id))).normalized.data;
    return { ...data, hsn: data.hsn || data.hsnCode, brand: data.brand || data.description?.split(' · ')?.[0] };
  },
  create: async (data) => {
    const payload = {
      sku: data.sku,
      name: data.name,
      category: data.category,
      hsnCode: data.hsn || data.hsnCode,
      imageUrl: data.imageUrl || null,
      description: data.description || [data.brand, data.mrp ? `MRP ₹${data.mrp}` : ''].filter(Boolean).join(' · '),
      status: data.status || 'ACTIVE',
    };
    return (await client.post(endpoints.products.list, payload)).normalized.data;
  },
  update: async (id, data) => {
    const payload = {
      name: data.name,
      category: data.category,
      hsnCode: data.hsn || data.hsnCode,
      imageUrl: data.imageUrl || null,
      description: data.description,
      status: data.status,
    };
    return (await client.put(endpoints.products.detail(id), payload)).normalized.data;
  },
  updateStatus: async (id, status) =>
    (await client.patch(`${endpoints.products.detail(id)}/status`, { status })).normalized.data,
  listTiers: async (productId) => (await client.get(endpoints.products.tiers(productId))).normalized.data,
};

