import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { connectDatabase, disconnectDatabase } from '../src/config/database.js';
import { ensureQaFixture, loginToken, authed, QA_USERS } from './helpers/qa.harness.js';
import CompanyLedger from '../src/models/CompanyLedger.model.js';
import LedgerEntry from '../src/models/LedgerEntry.model.js';
import Dealer from '../src/models/Dealer.model.js';
import Party from '../src/models/Party.model.js';
import Expense from '../src/models/Expense.model.js';

/** Shared party for the linkage tests below. */
async function ensureLinkParty() {
  let party = await Party.findOne({ code: 'PTY-QA-LINK' });
  if (!party) {
    party = await Party.create({
      code: 'PTY-QA-LINK',
      name: 'QA Linkage Supplier',
      type: 'SUPPLIER',
      phone: '9876500111',
      city: 'Jaipur',
      state: 'Rajasthan',
      status: 'ACTIVE',
    });
  }
  return party;
}

let adminToken;

before(async () => {
  await connectDatabase();
  await ensureQaFixture();
  const session = await loginToken(QA_USERS.admin.email);
  adminToken = session.token;
});

after(async () => {
  await disconnectDatabase();
});

test('Company Ledger: GET /api/company-ledger/types returns valid txn types', async () => {
  const api = authed(adminToken);
  const res = await api.get('/api/company-ledger/types');
  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.ok(Array.isArray(res.body.data));
  assert.ok(res.body.data.includes('SALE_TO_DEALER'));
  assert.ok(res.body.data.includes('PAYMENT_FROM_DEALER'));
  assert.ok(res.body.data.includes('PURCHASE'));
  assert.ok(res.body.data.includes('EXPENSE'));
  assert.ok(res.body.data.includes('ADJUSTMENT'));
  assert.ok(res.body.data.includes('OPENING_BALANCE'));
});

test('Company Ledger: POST /api/company-ledger creates manual entry', async () => {
  const api = authed(adminToken);
  const res = await api.post('/api/company-ledger', {
    txnType: 'OPENING_BALANCE',
    credit: 100000,
    debit: 0,
    description: 'Initial Company Opening Balance',
    partyName: 'Company Capital',
    referenceNo: 'OB-001',
  });
  assert.equal(res.status, 201);
  assert.equal(res.body.success, true);
  assert.equal(res.body.data.txnType, 'OPENING_BALANCE');
  assert.equal(res.body.data.credit, 100000);
  assert.ok(res.body.data.balance >= 100000);
});

test('Company Ledger: GET /api/company-ledger returns paginated entries', async () => {
  const api = authed(adminToken);
  const res = await api.get('/api/company-ledger?page=1&perPage=10');
  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.ok(Array.isArray(res.body.data));
  assert.ok(res.body.data.length > 0);
  assert.ok(res.body.pagination);
  assert.ok(res.body.pagination.total >= 1);
});

test('Company Ledger: GET /api/company-ledger/summary returns financial totals', async () => {
  const api = authed(adminToken);
  const res = await api.get('/api/company-ledger/summary');
  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.ok(res.body.data.totalCredit >= 100000);
  assert.ok(typeof res.body.data.closingBalance === 'number');
});

test('Company Ledger: Creating Sales Invoice records SALE_TO_DEALER entry', async () => {
  const api = authed(adminToken);
  const dealer = await Dealer.findOne({ code: 'DLR-QA' });

  const invRes = await api.post('/api/sales-invoices', {
    dealerId: dealer._id,
    invoiceDate: new Date().toISOString(),
    lineItems: [
      {
        sku: 'SKU-QA-001',
        name: 'QA Test Motor',
        quantity: 2,
        unitPrice: 10000,
        gstRate: 18,
        discount: 0,
      },
    ],
  });
  assert.equal(invRes.status, 201);
  const invoiceId = invRes.body.data.id;
  const invoiceNo = invRes.body.data.invoiceNo;

  const ledgerEntry = await CompanyLedger.findOne({
    sourceRef: invoiceId,
    sourceModel: 'SalesInvoice',
    txnType: 'SALE_TO_DEALER',
  });
  assert.ok(ledgerEntry, 'CompanyLedger entry should be created for sales invoice');
  assert.equal(ledgerEntry.referenceNo, invoiceNo);
  assert.ok(ledgerEntry.credit > 0);
});

test('Company Ledger: Creating Payment In records PAYMENT_FROM_DEALER entry and cancelling voids it', async () => {
  const api = authed(adminToken);
  let party = await Party.findOne({ code: 'PTY-QA-001' });
  if (!party) {
    party = await Party.create({
      code: 'PTY-QA-001',
      name: 'QA Test Dealer Party',
      type: 'DEALER',
      phone: '9876599999',
      city: 'Jaipur',
      state: 'Rajasthan',
      status: 'ACTIVE',
    });
  }

  const payRes = await api.post('/api/payments/in', {
    partyId: party._id,
    amount: 15000,
    discount: 0,
    paymentMode: 'BANK_TRANSFER',
    referenceNo: `TXN-${Date.now()}`,
    notes: 'Test Payment Received from Dealer',
  });
  assert.equal(payRes.status, 201);
  const paymentId = payRes.body.data.id;
  const paymentNo = payRes.body.data.paymentNo;

  let ledgerEntry = await CompanyLedger.findOne({
    sourceRef: paymentId,
    sourceModel: 'Payment',
    txnType: 'PAYMENT_FROM_DEALER',
  });
  assert.ok(ledgerEntry, 'CompanyLedger entry should be created for Payment In');
  assert.equal(ledgerEntry.credit, 15000);
  assert.equal(ledgerEntry.isVoided, false);

  // Cancel payment via POST /api/payments/:id/cancel
  const cancelRes = await api.post(`/api/payments/${paymentId}/cancel`, { note: 'Cancelled test payment' });
  assert.equal(cancelRes.status, 200);

  ledgerEntry = await CompanyLedger.findOne({ sourceRef: paymentId, sourceModel: 'Payment' });
  assert.ok(ledgerEntry.isVoided, 'CompanyLedger entry should be marked isVoided: true');
});

test('Company Ledger: Approving Expense records EXPENSE entry', async () => {
  const api = authed(adminToken);
  const uniqueTag = Date.now();

  const expRes = await api.post('/api/expenses', {
    category: 'Logistics',
    description: `Freight charges ${uniqueTag}`,
    amount: 3500,
    vendor: `Vendor-${uniqueTag}`,
  });
  assert.equal(expRes.status, 201);
  const expenseId = expRes.body.data.id;

  // Approve expense
  const approveRes = await api.patch(`/api/expenses/${expenseId}/status`, {
    status: 'APPROVED',
    note: 'Approved for reimbursement',
  });
  assert.equal(approveRes.status, 200);

  const ledgerEntry = await CompanyLedger.findOne({
    sourceRef: expenseId,
    sourceModel: 'Expense',
    txnType: 'EXPENSE',
  });
  assert.ok(ledgerEntry, 'CompanyLedger entry should be created for approved expense');
  assert.equal(ledgerEntry.debit, 3500);
  assert.equal(ledgerEntry.partyName, `Vendor-${uniqueTag}`);
});

// ── Party linkage ─────────────────────────────────────────────────────────────

test('Company Ledger: manual entry with a party posts to the party ledger too', async () => {
  const api = authed(adminToken);
  const party = await ensureLinkParty();
  const ref = `JV-LINK-${Date.now()}`;

  const res = await api.post('/api/company-ledger', {
    txnType: 'ADJUSTMENT',
    partyId: String(party._id),
    debit: 2500,
    description: 'Rate difference credit note',
    referenceNo: ref,
  });
  assert.equal(res.status, 201);
  assert.equal(res.body.data.isPartyLinked, true);
  assert.equal(res.body.data.party.id, String(party._id));
  assert.ok(res.body.data.partyLedgerEntry, 'response should carry the mirrored party ledger entry');

  const companyEntry = await CompanyLedger.findById(res.body.data.id);
  assert.ok(companyEntry.partyLedgerRef, 'company entry should cross-reference the party entry');

  const partyEntry = await LedgerEntry.findOne({
    voucherRef: companyEntry._id,
    voucherModel: 'CompanyLedger',
  });
  assert.ok(partyEntry, 'a party ledger row should mirror the manual company entry');
  assert.equal(String(partyEntry.party), String(party._id));
  assert.equal(partyEntry.debit, 2500);
  assert.equal(partyEntry.credit, 0);
  assert.equal(partyEntry.voucherNo, ref);
  assert.equal(String(companyEntry.partyLedgerRef), String(partyEntry._id));
});

test('Company Ledger: party-facing txn types are rejected without a party', async () => {
  const api = authed(adminToken);
  const res = await api.post('/api/company-ledger', {
    txnType: 'PURCHASE',
    debit: 1000,
    description: 'Unlinked purchase attempt',
  });
  assert.equal(res.status, 400);
  assert.match(res.body.message, /party must be selected/i);
});

test('Company Ledger: manual entry rejects blank and double-sided amounts', async () => {
  const api = authed(adminToken);

  const blank = await api.post('/api/company-ledger', { txnType: 'ADJUSTMENT', description: 'no amount' });
  assert.equal(blank.status, 400);

  const both = await api.post('/api/company-ledger', {
    txnType: 'ADJUSTMENT',
    credit: 500,
    debit: 500,
    description: 'both sides',
  });
  assert.equal(both.status, 400);
  assert.match(both.body.message, /either credit or debit/i);
});

test('Company Ledger: internal entry without a party stays unlinked', async () => {
  const api = authed(adminToken);
  const res = await api.post('/api/company-ledger', {
    txnType: 'ADJUSTMENT',
    debit: 750,
    description: 'Internal rounding adjustment',
  });
  assert.equal(res.status, 201);
  assert.equal(res.body.data.isPartyLinked, false);
  assert.equal(res.body.data.partyLedgerEntry, null);

  const mirrored = await LedgerEntry.findOne({ voucherRef: res.body.data.id, voucherModel: 'CompanyLedger' });
  assert.equal(mirrored, null, 'an unlinked entry must not create a party ledger row');
});

test('Company Ledger: voiding a linked entry voids both sides', async () => {
  const api = authed(adminToken);
  const party = await ensureLinkParty();

  const created = await api.post('/api/company-ledger', {
    txnType: 'ADJUSTMENT',
    partyId: String(party._id),
    credit: 1200,
    description: 'Entry to be voided',
  });
  assert.equal(created.status, 201);
  const entryId = created.body.data.id;

  const voided = await api.patch(`/api/company-ledger/${entryId}/void`);
  assert.equal(voided.status, 200);

  const companyEntry = await CompanyLedger.findById(entryId);
  assert.equal(companyEntry.isVoided, true);

  const partyEntry = await LedgerEntry.findOne({ voucherRef: entryId, voucherModel: 'CompanyLedger' });
  assert.equal(partyEntry.isVoided, true, 'party ledger twin must be voided alongside');
});

test('Company Ledger: list can filter by party and by linkage state', async () => {
  const api = authed(adminToken);
  const party = await ensureLinkParty();

  const byParty = await api.get(`/api/company-ledger?partyId=${party._id}&perPage=50`);
  assert.equal(byParty.status, 200);
  assert.ok(byParty.body.data.length > 0);
  assert.ok(byParty.body.data.every((r) => r.party?.id === String(party._id)));

  const unlinked = await api.get('/api/company-ledger?linked=false&perPage=50');
  assert.equal(unlinked.status, 200);
  assert.ok(unlinked.body.data.every((r) => r.isPartyLinked === false));
});

test('Company Ledger: GET /api/company-ledger/party/:partyId shows both ledgers agreeing', async () => {
  const api = authed(adminToken);
  const party = await ensureLinkParty();

  const res = await api.get(`/api/company-ledger/party/${party._id}`);
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.body.data.companyEntries));
  assert.ok(Array.isArray(res.body.data.partyEntries));
  assert.equal(
    res.body.data.totals.mirroredCount,
    res.body.data.totals.companyEntryCount,
    'every live company entry for this party should have a party ledger twin'
  );
});

test('Company Ledger: reconciliation returns aged receivables and payables', async () => {
  const api = authed(adminToken);
  const res = await api.get('/api/company-ledger/reconciliation');
  assert.equal(res.status, 200);

  const { receivables, payables, manualAdjustments, totals } = res.body.data;
  assert.ok(Array.isArray(receivables));
  assert.ok(Array.isArray(payables));
  assert.ok(Array.isArray(manualAdjustments));
  assert.equal(typeof totals.totalReceivable, 'number');
  assert.equal(typeof totals.totalPayable, 'number');
  assert.equal(
    Math.round((totals.totalReceivable - totals.totalPayable) * 100) / 100,
    Math.round(totals.netPosition * 100) / 100
  );

  for (const row of [...receivables, ...payables]) {
    const bucketSum = Object.values(row.buckets).reduce((s, v) => s + v, 0);
    assert.equal(
      Math.round(bucketSum * 100) / 100,
      Math.round(row.outstanding * 100) / 100,
      `ageing buckets for ${row.name} must add up to its outstanding total`
    );
  }
});
