import { test, before, after, describe } from 'node:test';
import { connectDatabase, disconnectDatabase } from '../../src/config/database.js';
import { QA_USERS, ensureQaFixture, loginToken, authed, assertSuccess } from '../helpers/qa.harness.js';

let employeeToken;
let managerToken;
let supportToken;
let serviceToken;
let customerToken;

before(async () => {
  await connectDatabase();
  await ensureQaFixture();
  ({ token: employeeToken } = await loginToken(QA_USERS.employee.email));
  ({ token: managerToken } = await loginToken(QA_USERS.manager.email));
  ({ token: supportToken } = await loginToken(QA_USERS.support.email));
  ({ token: serviceToken } = await loginToken(QA_USERS.service.email));
  ({ token: customerToken } = await loginToken(QA_USERS.customer.email));
});

after(async () => {
  await disconnectDatabase();
});

describe('QA — Employee panel API smoke', () => {
  const EMPLOYEE_SMOKE = [
    { path: '/api/employee/assigned-dealers', label: 'Assigned dealers' },
    { path: '/api/employee/performance', label: 'Performance' },
    { path: '/api/tasks', label: 'Tasks' },
    { path: '/api/employee/dealer-analytics', label: 'Dealer analytics' },
  ];

  for (const { path, label } of EMPLOYEE_SMOKE) {
    test(`EMPLOYEE: ${label}`, async () => {
      const res = await authed(employeeToken).get(path);
      assertSuccess(res, label);
    });
  }

  test('MANAGER: team dealers rollup', async () => {
    const res = await authed(managerToken).get('/api/employee/team-dealers');
    assertSuccess(res, 'team-dealers');
  });

  test('MANAGER: approvals queue', async () => {
    const res = await authed(managerToken).get('/api/approvals');
    assertSuccess(res, 'approvals');
  });
});

describe('QA — Service panel API smoke', () => {
  test('CUSTOMER_SUPPORT: service dashboard', async () => {
    const res = await authed(supportToken).get('/api/analytics/dashboard/service');
    assertSuccess(res, 'service dashboard');
  });

  for (const { path, label } of [
    { path: '/api/complaints', label: 'Complaints' },
    { path: '/api/service-requests', label: 'Service tickets' },
  ]) {
    test(`CUSTOMER_SUPPORT: ${label}`, async () => {
      const res = await authed(supportToken).get(path);
      assertSuccess(res, label);
    });
  }

  for (const { path, label } of [
    { path: '/api/spares', label: 'Spare parts' },
    { path: '/api/returns', label: 'Defective returns' },
    { path: '/api/service-requests', label: 'Service tickets' },
  ]) {
    test(`SERVICE_CENTER: ${label}`, async () => {
      const res = await authed(serviceToken).get(path);
      assertSuccess(res, label);
    });
  }
});

describe('QA — Customer panel API smoke', () => {
  test('CUSTOMER: portal hub', async () => {
    const res = await authed(customerToken).get('/api/customer-panel/hub');
    assertSuccess(res, 'customer hub');
  });

  test('CUSTOMER: notifications', async () => {
    const res = await authed(customerToken).get('/api/customer-panel/notifications');
    assertSuccess(res, 'customer notifications');
  });

  test('CUSTOMER: orders', async () => {
    const res = await authed(customerToken).get('/api/orders');
    assertSuccess(res, 'customer orders');
  });
});
