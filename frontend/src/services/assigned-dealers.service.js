import client from './api/client';

export const assignedDealersService = {
  getList: async (filters) => (await client.get('/employee/assigned-dealers', { params: filters })).normalized,
  getTeamList: async (filters) => (await client.get('/employee/team-dealers', { params: filters })).normalized,
  getDetail: async (id) => (await client.get(`/employee/assigned-dealers/${id}`)).normalized.data,
};
