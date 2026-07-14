import client from './api/client';

export const dealerTeamService = {
  getList: async (filters) => (await client.get('/dealer/team', { params: filters })).normalized,
  getDetail: async (id) => (await client.get(`/dealer/team/${id}`)).normalized.data,
  create: async (data) => (await client.post('/dealer/team', data)).normalized.data,
  update: async (id, data) => (await client.put(`/dealer/team/${id}`, data)).normalized.data,
  deactivate: async (id) => (await client.delete(`/dealer/team/${id}`)).normalized.data,
  getPerformance: async () => (await client.get('/dealer/team-performance')).normalized.data,
  getLeaderboard: async () => (await client.get('/dealer/team-leaderboard')).normalized.data,
};
