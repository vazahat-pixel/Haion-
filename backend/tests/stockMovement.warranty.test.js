import { test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';

// These tests only verify auth/access-control guards — no DB connection required.
// Authenticated endpoints return 401 from the JWT middleware (before any DB query).
// Public endpoints return non-401 even if DB is unavailable (e.g. 200 or 500).

test('GET /api/stock-movements requires auth', async () => {
  const res = await request(app).get('/api/stock-movements');
  assert.equal(res.status, 401);
});

test('GET /api/stock-movements/sku/MOT-001 requires auth', async () => {
  const res = await request(app).get('/api/stock-movements/sku/MOT-001');
  assert.equal(res.status, 401);
});

test('GET /api/warranty/:id/certificate requires auth', async () => {
  const res = await request(app).get('/api/warranty/507f1f77bcf86cd799439011/certificate');
  assert.equal(res.status, 401);
});

test('GET /api/warranty/lookup is public (no auth header)', async () => {
  const res = await request(app).get('/api/warranty/lookup?billNo=BILL-TEST');
  assert.notEqual(res.status, 401);
});

test('POST /api/complaints/public is public (no auth header)', async () => {
  const res = await request(app).post('/api/complaints/public').send({
    customer: 'Test User',
    product: 'Motor 5HP',
    description: 'Product not working after one week of use',
  });
  assert.notEqual(res.status, 401);
});
