import client from './api/client';
import { endpoints } from './api/endpoints';

export const referralService = {
  // Customer panel
  getMyBonus: async () => (await client.get(endpoints.referrals.myBonus)).normalized.data,
  requestWithdrawal: async () => (await client.post(endpoints.referrals.requestWithdrawal)).normalized,

  // Admin
  getAdminStats: async () => (await client.get(endpoints.referrals.adminStats)).normalized.data,
  getAdminList: async (filters) => (await client.get(endpoints.referrals.adminList, { params: filters })).normalized,
  getAdminDetail: async (id) => (await client.get(endpoints.referrals.adminDetail(id))).normalized.data,
  getAdminWithdrawals: async (filters) =>
    (await client.get(endpoints.referrals.adminWithdrawals, { params: filters })).normalized,
  processWithdrawal: async (id, data) =>
    (await client.patch(endpoints.referrals.adminProcessWithdrawal(id), data)).normalized.data,
};
