import { test, before, after, describe } from 'node:test';
import { connectDatabase, disconnectDatabase } from '../../src/config/database.js';
import { QA_USERS, ensureQaFixture, loginToken, authed, assertSuccess } from '../helpers/qa.harness.js';

let adminToken;
let warehouseToken;

before(async () => {
  await connectDatabase();
  await ensureQaFixture();
  ({ token: adminToken } = await loginToken(QA_USERS.admin.email));
  ({ token: warehouseToken } = await loginToken(QA_USERS.warehouse.email));
});

after(async () => {
  await disconnectDatabase();
});

const ADMIN_SMOKE = [
  { path: '/api/analytics/dashboard/admin', label: 'Admin dashboard KPIs' },
  { path: '/api/dealers', label: 'Dealers list' },
  { path: '/api/inventory', label: 'Warehouse inventory' },
  { path: '/api/grn', label: 'GRN list' },
  { path: '/api/dispatch', label: 'Dispatch list' },
  { path: '/api/stock-movements', label: 'Stock movements' },
  { path: '/api/employees', label: 'Employees' },
  { path: '/api/expenses', label: 'Expenses' },
  { path: '/api/approvals', label: 'Approvals' },
  { path: '/api/reports', label: 'Reports' },
  { path: '/api/store/orders', label: 'Website store orders' },
  { path: '/api/store/analytics/summary', label: 'Store analytics' },
  { path: '/api/complaints', label: 'Complaints' },
  { path: '/api/service-requests', label: 'Service requests' },
  { path: '/api/spares', label: 'Spare requests' },
  { path: '/api/returns', label: 'Defective returns' },
  { path: '/api/notifications', label: 'Notifications' },
  { path: '/api/audit', label: 'Audit logs' },
  { path: '/api/settings/general', label: 'Settings' },
];

describe('QA — Admin panel API smoke', () => {
  for (const { path, label } of ADMIN_SMOKE) {
    test(`MASTER_ADMIN: ${label}`, async () => {
      const res = await authed(adminToken).get(path);
      assertSuccess(res, label);
    });
  }
});

const WAREHOUSE_SMOKE = [
  { path: '/api/warehouses', label: 'Warehouses' },
  { path: '/api/inventory', label: 'Inventory' },
  { path: '/api/grn', label: 'GRN' },
  { path: '/api/dispatch', label: 'Dispatch' },
  { path: '/api/stock-movements', label: 'Stock movements' },
];

describe('QA — Warehouse manager scoped admin', () => {
  for (const { path, label } of WAREHOUSE_SMOKE) {
    test(`WAREHOUSE_MANAGER: ${label}`, async () => {
      const res = await authed(warehouseToken).get(path);
      assertSuccess(res, label);
    });
  }
});
