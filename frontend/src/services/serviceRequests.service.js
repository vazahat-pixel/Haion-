import client from './api/client';
import { endpoints } from './api/endpoints';

export const serviceRequestsService = {
  getKpis: async () => (await client.get(`${endpoints.serviceRequests.list}/kpis`)).normalized.data,
  lookupWarranty: async (params) => (await client.get(`${endpoints.serviceRequests.list}/warranty-lookup`, { params })).normalized.data,
  getList: async (filters) => (await client.get(endpoints.serviceRequests.list, { params: filters })).normalized,
  getDetail: async (id) => (await client.get(endpoints.serviceRequests.detail(id))).normalized.data,
  create: async (data) => (await client.post(endpoints.serviceRequests.list, data)).normalized.data,
  update: async (id, data) => (await client.put(endpoints.serviceRequests.detail(id), data)).normalized.data,
  assign: async (id, body) => (await client.post(`${endpoints.serviceRequests.detail(id)}/assign`, body)).normalized.data,
  updateStatus: async (id, status, notes) => (await client.post(`${endpoints.serviceRequests.detail(id)}/status`, { status, notes })).normalized.data,
  addNote: async (id, body) => (await client.post(`${endpoints.serviceRequests.detail(id)}/notes`, body)).normalized.data,
  getTimeline: async (id) => (await client.get(`${endpoints.serviceRequests.detail(id)}/timeline`)).normalized.data,
  close: async (id, body) => {
    try {
      return (await client.post(`${endpoints.serviceRequests.detail(id)}/close`, body)).normalized.data;
    } catch (err) {
      const data = err?.response?.data;
      if (err?.response?.status === 409 && data?.data?.missingDefectiveReturn) {
        const conflict = new Error(data.message);
        conflict.code = 'MISSING_DEFECTIVE_RETURN';
        conflict.meta = data.data;
        throw conflict;
      }
      throw err;
    }
  },
};
