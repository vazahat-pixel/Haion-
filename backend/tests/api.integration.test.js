import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';

let server;

after(() => {
  if (server) server.close();
});

test('GET /api/health', async () => {
  const res = await request(app).get('/api/health');
  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
});

test('GET /api/address/pincode/302001 requires auth', async () => {
  const res = await request(app).get('/api/address/pincode/302001');
  assert.equal(res.status, 401);
});

test('POST /api/auth/login rejects invalid credentials', async () => {
  const res = await request(app).post('/api/auth/login').send({ email: 'nobody@test.com', password: 'wrong' });
  assert.ok([401, 400, 422].includes(res.status));
});
