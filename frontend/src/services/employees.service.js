import client from './api/client';
import { endpoints } from './api/endpoints';

export const employeesService = {
  getList: async (filters) => (await client.get(endpoints.employees.list, { params: filters })).normalized,
  getDetail: async (id) => (await client.get(endpoints.employees.detail(id))).normalized.data,
  create: async (data) => (await client.post(endpoints.employees.list, data)).normalized.data,
  update: async (id, data) => (await client.patch(endpoints.employees.detail(id), data)).normalized.data,
  getHierarchy: async () => (await client.get(endpoints.employees.hierarchy)).normalized.data,
  getReportingLine: async (id) => (await client.get(endpoints.employees.reportingLine(id))).normalized.data,
  getAssignedDealers: async (employeeId) =>
    (await client.get(endpoints.employees.dealers.list(employeeId))).normalized.data,
  setAssignedDealers: async (employeeId, dealerIds) =>
    (await client.put(endpoints.employees.dealers.update(employeeId), { dealerIds })).normalized.data,
};
