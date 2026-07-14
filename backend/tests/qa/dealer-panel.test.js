import { test, before, after, describe } from 'node:test';
import { connectDatabase, disconnectDatabase } from '../../src/config/database.js';
import { QA_USERS, ensureQaFixture, loginToken, authed, assertSuccess } from '../helpers/qa.harness.js';

let dealerAdminToken;
let dealerSalesToken;

before(async () => {
  await connectDatabase();
  await ensureQaFixture();
  ({ token: dealerAdminToken } = await loginToken(QA_USERS.dealerAdmin.email));
  ({ token: dealerSalesToken } = await loginToken(QA_USERS.dealerSales.email));
});

after(async () => {
  await disconnectDatabase();
});

const DEALER_ADMIN_SMOKE = [
  { path: '/api/analytics/dashboard/dealer', label: 'Dealer dashboard' },
  { path: '/api/dealer/inventory', label: 'Dealer inventory' },
  { path: '/api/dealer/dispatches', label: 'Inbound dispatches' },
  { path: '/api/dealer/grn', label: 'Dealer GRN queue' },
  { path: '/api/dealer/billing-catalog', label: 'Billing catalog' },
  { path: '/api/billing', label: 'Bills' },
  { path: '/api/invoices', label: 'Invoices' },
  { path: '/api/warranty', label: 'Warranties' },
  { path: '/api/customers', label: 'Dealer customers' },
  { path: '/api/dealer/team', label: 'Dealer team' },
  { path: '/api/dealer/reports', label: 'Dealer reports' },
];

describe('QA — Dealer admin panel API smoke', () => {
  for (const { path, label } of DEALER_ADMIN_SMOKE) {
    test(`DEALER_ADMIN: ${label}`, async () => {
      const res = await authed(dealerAdminToken).get(path);
      assertSuccess(res, label);
    });
  }
});

const DEALER_SALES_SMOKE = [
  { path: '/api/dealer/inventory', label: 'Dealer inventory' },
  { path: '/api/dealer/billing-catalog', label: 'Billing catalog' },
  { path: '/api/billing', label: 'Bills' },
];

describe('QA — Dealer sales panel API smoke', () => {
  for (const { path, label } of DEALER_SALES_SMOKE) {
    test(`DEALER_SALES: ${label}`, async () => {
      const res = await authed(dealerSalesToken).get(path);
      assertSuccess(res, label);
    });
  }
});
