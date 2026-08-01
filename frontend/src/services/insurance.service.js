import client from './api/client';
import { endpoints } from './api/endpoints';

export const insuranceService = {
  getWallets: async (filters) =>
    (await client.get(endpoints.insurance.wallets, { params: filters })).normalized,

  getWallet: async (dealerId) =>
    (await client.get(endpoints.insurance.walletDetail(dealerId))).normalized.data,

  topUpWallet: async (dealerId, data) =>
    (await client.post(endpoints.insurance.topup(dealerId), data)).normalized.data,

  getClaims: async (filters) =>
    (await client.get(endpoints.insurance.claims, { params: filters })).normalized,

  getClaim: async (id) =>
    (await client.get(endpoints.insurance.claimDetail(id))).normalized.data,

  createClaim: async (data) =>
    (await client.post(endpoints.insurance.claims, data)).normalized.data,

  reviewClaim: async (id, data) =>
    (await client.patch(endpoints.insurance.review(id), data)).normalized.data,

  payClaim: async (id) =>
    (await client.post(endpoints.insurance.pay(id))).normalized.data,
};
