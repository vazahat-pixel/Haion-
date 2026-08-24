import client from './api/client';

/** Some endpoints go through the response normaliser, some don't — accept both. */
function unwrap(res) {
  return res.normalized || res.data;
}

function unwrapData(res) {
  return res.normalized?.data ?? res.data?.data;
}

export const companyLedgerService = {
  getList: async ({ page, perPage, from, to, txnType, partyId, linked, search } = {}) => {
    const params = new URLSearchParams();
    if (page) params.append('page', page);
    if (perPage) params.append('perPage', perPage);
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    if (txnType) params.append('txnType', txnType);
    if (partyId) params.append('partyId', partyId);
    if (linked) params.append('linked', linked);
    if (search) params.append('search', search);
    return unwrap(await client.get(`/company-ledger?${params}`));
  },

  getSummary: async ({ from, to } = {}) => {
    const params = new URLSearchParams();
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    return unwrapData(await client.get(`/company-ledger/summary?${params}`));
  },

  getReconciliation: async ({ asOf } = {}) => {
    const params = new URLSearchParams();
    if (asOf) params.append('asOf', asOf);
    return unwrapData(await client.get(`/company-ledger/reconciliation?${params}`));
  },

  getPartyLinked: async (partyId) => unwrapData(await client.get(`/company-ledger/party/${partyId}`)),

  create: async (payload) => unwrapData(await client.post('/company-ledger', payload)),

  void: async (id) => unwrapData(await client.patch(`/company-ledger/${id}/void`)),
};
