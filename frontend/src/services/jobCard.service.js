import client from './api/client';

export const jobCardService = {
  getList: async (params) => (await client.get('/job-cards', { params })).normalized,
  getDetail: async (id) => (await client.get(`/job-cards/${id}`)).normalized.data,
  getByComplaint: async (complaintId) => (await client.get(`/job-cards/complaint/${complaintId}`)).normalized.data,
  create: async (data) => (await client.post('/job-cards', data)).normalized.data,
  consumeParts: async (id, data) => (await client.patch(`/job-cards/${id}/parts`, data)).normalized.data,
  markDefective: async (id, data) => (await client.patch(`/job-cards/${id}/defective`, data)).normalized.data,
  updateStatus: async (id, data) => (await client.patch(`/job-cards/${id}/status`, data)).normalized.data,
  submitFeedback: async (id, data) => (await client.post(`/job-cards/${id}/feedback`, data)).normalized.data,
};
