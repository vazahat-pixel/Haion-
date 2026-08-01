import client from './api/client';
import { endpoints } from './api/endpoints';

export const paymentsService = {
  getList: async (filters) =>
    (await client.get(endpoints.payments.list, { params: filters })).normalized,

  getNextNumber: async (type = 'PAYMENT_IN') =>
    (await client.get(endpoints.payments.nextNumber, { params: { type } })).normalized.data,

  getDetail: async (id) =>
    (await client.get(endpoints.payments.detail(id))).normalized.data,

  createPaymentIn: async (data) =>
    (await client.post(endpoints.payments.paymentIn, data)).normalized.data,

  createPaymentOut: async (data) =>
    (await client.post(endpoints.payments.paymentOut, data)).normalized.data,

  cancel: async (id) =>
    (await client.post(endpoints.payments.cancel(id))).normalized.data,

  getLedger: async (partyId, filters) =>
    (await client.get(endpoints.payments.ledger(partyId), { params: filters })).normalized.data,

  getPendingInvoices: async (partyId) =>
    (await client.get(endpoints.payments.pendingInvoices(partyId))).normalized.data,

  getPendingPurchases: async (partyId) =>
    (await client.get(endpoints.payments.pendingPurchases(partyId))).normalized.data,
};
