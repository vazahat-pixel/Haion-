import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { connectDatabase, disconnectDatabase } from '../../src/config/database.js';
import { QA_USERS, ensureQaFixture, login, assertSuccess, assertForbidden, loginToken, authed } from '../helpers/qa.harness.js';

before(async () => {
  await connectDatabase();
  await ensureQaFixture();
});

after(async () => {
  await disconnectDatabase();
});

describe('QA — Authentication & role access', () => {
  test('all 9 seed roles can login', async () => {
    for (const [key, cred] of Object.entries(QA_USERS)) {
      const res = await login(cred.email, cred.password);
      assertSuccess(res, `login:${key}`);
      assert.equal(res.body.data.user.role, cred.role, `${key} role mismatch`);
    }
  });

  test('invalid credentials are rejected', async () => {
    const res = await login('admin@haion.com', 'wrong-password-xyz');
    assert.ok([401, 400].includes(res.status), `expected 401/400 got ${res.status}`);
  });

  test('GET /api/auth/me returns profile when authenticated', async () => {
    const { token } = await loginToken(QA_USERS.admin.email);
    const res = await authed(token).get('/api/auth/me');
    assertSuccess(res, 'auth/me');
    assert.equal(res.body.data?.user?.email || res.body.data?.email, QA_USERS.admin.email);
  });

  test('dealer cannot access admin dealer list', async () => {
    const { token } = await loginToken(QA_USERS.dealerAdmin.email);
    const res = await authed(token).get('/api/dealers');
    assertForbidden(res, 'dealer→/dealers');
  });

  test('employee cannot access dealer inventory API', async () => {
    const { token } = await loginToken(QA_USERS.employee.email);
    const res = await authed(token).get('/api/dealer/inventory');
    assertForbidden(res, 'employee→/dealer/inventory');
  });

  test('warehouse manager cannot access RBAC settings', async () => {
    const { token } = await loginToken(QA_USERS.warehouse.email);
    const res = await authed(token).get('/api/rbac/roles');
    assertForbidden(res, 'warehouse→/rbac/roles');
  });
});
