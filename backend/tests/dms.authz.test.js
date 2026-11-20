/**
 * Authorization matrix. A DMS user with NO page rights must be refused everywhere (server-side, not just hidden
 * in the menu), and a user may not read or act on another location's records. In-memory MongoDB only.
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../src/app.js';
import { env } from '../src/config/env.js';
import User from '../src/models/User.model.js';

let mem;
let adminTok;
const ctx = {};
const api = (t) => ({
  get: (u) => request(app).get(`/api/dms${u}`).set('Authorization', `Bearer ${t}`),
  post: (u, b = {}) => request(app).post(`/api/dms${u}`).set('Authorization', `Bearer ${t}`).send(b),
  put: (u, b = {}) => request(app).put(`/api/dms${u}`).set('Authorization', `Bearer ${t}`).send(b),
});
const ok = (res, code = 200) => {
  assert.equal(res.status, code, `${res.req?.method} ${res.req?.path} → ${res.status} ${JSON.stringify(res.body)}`);
  return res.body.data;
};

before(async () => {
  if (mongoose.connection.readyState) await mongoose.disconnect();
  mem = await MongoMemoryServer.create();
  await mongoose.connect(mem.getUri(), { dbName: 'dms_authz_test' });
  const admin = await User.create({ email: 'az-admin@test.local', password: await User.hashPassword('Password123!'), firstName: 'A', lastName: 'Z', phone: '9200000001', role: 'MASTER_ADMIN', isActive: true });
  adminTok = jwt.sign({ userId: admin._id }, env.jwtAccessSecret, { expiresIn: '1h' });
  const a = api(adminTok);
  const base = { state: 'Uttar Pradesh', stateCode: 'UP', city: 'Noida', billingAddress: 'B-32' };
  ctx.ho = ok(await a.post('/locations', { ...base, name: 'HO', locationType: 'Head Office', docPrefix: 'HO' }), 201);
  ctx.b1 = ok(await a.post('/locations', { ...base, name: 'Branch One', city: 'Agra', locationType: 'Branch', docPrefix: 'B1', parent: ctx.ho._id }), 201);
  ctx.b2 = ok(await a.post('/locations', { ...base, name: 'Branch Two', city: 'Jaipur', locationType: 'Branch', docPrefix: 'B2', parent: ctx.ho._id }), 201);
  const brand = ok(await a.post('/masters/brand', { name: 'B' }), 201);
  const cat = ok(await a.post('/masters/category', { name: 'C' }), 201);
  ok(await a.post('/hsn', { hsnCode: '1111', cgst: 9, sgst: 9 }), 201);
  ctx.prod = ok(await a.post('/products', { productCode: 'P1', name: 'Prod', category: cat._id, brand: brand._id, hsnCode: '1111' }), 201);
  ok(await a.post('/invoices', { kind: 'OPENING', from: ctx.ho._id, lines: [{ product: ctx.prod._id, qty: 100, price: 10 }] }), 201);
  const mk = async (name, email, phone, location, pages) => {
    const p = ok(await a.post('/users', { displayName: name, email, phone, password: 'Password123!', userType: 'Location User', location, pages }), 201);
    const u = await User.findOne({ email });
    return { profile: p, tok: jwt.sign({ userId: u._id }, env.jwtAccessSecret, { expiresIn: '1h' }) };
  };
  ctx.none = await mk('No Rights', 'none@test.local', '9200000002', ctx.b1._id, []);
  const sales = ['home', 'po', 'po_approval', 'corporate', 'retail', 'receive', 'dispatch', 'payment_receive', 'payment_approval', 'r_ledger', 'r_inventory'];
  ctx.u1 = await mk('B1 User', 'b1@test.local', '9200000003', ctx.b1._id, sales);
  ctx.u2 = await mk('B2 User', 'b2@test.local', '9200000004', ctx.b2._id, sales);
});
after(async () => { await mongoose.disconnect(); await mem?.stop(); });

test('a user with no page rights is refused on every read endpoint (403)', async () => {
  const n = api(ctx.none.tok);
  const gets = [
    '/masters/brand', '/masters/city', '/masters/account', '/locations', `/locations/${ctx.b1._id}`, '/hsn', '/products', '/vendors', '/customers', '/prices', '/schemes', '/users',
    '/po', '/po?poType=VENDOR', '/po?queue=approval', `/po/credit/${ctx.b1._id}`,
    '/invoices?kind=CORPORATE', '/invoices?kind=RETAIL_CUSTOMER', '/invoices?kind=STN', '/invoices?kind=OPENING', '/invoices?queue=receive', '/invoices?queue=dispatch', '/invoices?queue=approval', '/invoices',
    '/payments', '/payments?kind=ADJUSTMENT', '/payments?queue=approval',
    '/reports/inventory', '/reports/aging', `/reports/stock-ledger?location=${ctx.b1._id}`, `/reports/party-ledger?location=${ctx.b1._id}`, '/reports/documents', '/reports/dashboard',
    '/x/dash-yearly?year=2026', '/x/dash-monthly?year=2026&month=1', '/x/dash-lead', '/x/collection?date=2026-11-19', `/x/payment-status?type=Payable&location=${ctx.b1._id}`,
    `/x/price-drop?product=${ctx.prod._id}`, '/x/party-master', '/x/isd', '/x/serial-activation', '/x/track-distance?user=x', '/x/other-requests?type=Apply%20for%20Loan',
    '/entities/lead', '/entities/quote', '/entities/target', '/entities/pjp', '/entities/beat', '/entities/deviation', '/entities/expense', '/entities/query', '/entities/appfeedback',
    '/entities/apptask', '/entities/attendance', '/entities/tada', '/entities/department', '/entities/employee', '/entities/holiday', '/entities/leave', '/entities/leave?view=mine',
    '/entities/claim', '/entities/salary', '/entities/salary?view=mine', '/entities/attendance-today',
  ];
  const leaks = [];
  for (const u of gets) {
    // eslint-disable-next-line no-await-in-loop
    const r = await n.get(u);
    if (r.status !== 403) leaks.push(`${u} → ${r.status}`);
  }
  assert.deepEqual(leaks, [], `endpoints reachable without a page right:\n${leaks.join('\n')}`);
});

test('a user with no page rights is refused on every write endpoint (403)', async () => {
  const n = api(ctx.none.tok);
  const lines = [{ product: ctx.prod._id, qty: 1, price: 1 }];
  const posts = [
    ['/po', { fromLocation: ctx.b1._id, toLocation: ctx.ho._id, lines }], ['/invoices', { kind: 'OPENING', from: ctx.b1._id, lines }], ['/invoices', { kind: 'STN', from: ctx.b1._id, to: ctx.ho._id, lines }],
    ['/payments', { kind: 'RECEIPT', fromLocation: ctx.b1._id, toLocation: ctx.ho._id, payMode: 'CASH', amount: 5 }], ['/payments', { kind: 'ADJUSTMENT', fromLocation: ctx.b1._id, toLocation: ctx.ho._id, payMode: 'CASH', amount: 5, adjustType: 'CR' }],
    ['/masters/brand', { name: 'X' }], ['/hsn', { hsnCode: '2', cgst: 1, sgst: 1 }], ['/locations', { name: 'x' }], ['/users', { displayName: 'x' }], ['/products', {}], ['/vendors', { name: 'v' }], ['/customers', {}],
    ['/entities/lead', { partyName: 'x', area: 'y' }], ['/entities/leavetype', { typeOfLeave: 'x', noOfDays: 1 }], ['/entities/attendance-punch', { kind: 'in' }], ['/entities/salary-generate', {}], ['/entities/beat-upload', { rows: [{}] }],
    ['/x/serial-activate', { product: ctx.prod._id, serials: ['A'] }], ['/x/delivery-bulk', { rows: [{}] }], ['/invoices/serials/track', { serials: ['A'] }], ['/change-password', {}],
  ];
  const ok403 = new Set(['/change-password']); // any authenticated DMS user may change their own password (422 on bad input)
  const leaks = [];
  for (const [u, b] of posts) {
    // eslint-disable-next-line no-await-in-loop
    const r = await n.post(u, b);
    if (ok403.has(u) ? r.status >= 500 : r.status !== 403) leaks.push(`${u} → ${r.status}`);
  }
  assert.deepEqual(leaks, [], `write endpoints reachable without a page right:\n${leaks.join('\n')}`);
});

test('cross-location isolation: a branch user cannot read or act on another branch', async () => {
  const a = api(adminTok); const u1 = api(ctx.u1.tok); const u2 = api(ctx.u2.tok);
  const po = ok(await u1.post('/po', { fromLocation: ctx.b1._id, toLocation: ctx.ho._id, lines: [{ product: ctx.prod._id, qty: 5, price: 10 }] }), 201);
  assert.equal((await u2.post('/po', { fromLocation: ctx.b1._id, toLocation: ctx.ho._id, lines: [{ product: ctx.prod._id, qty: 5, price: 10 }] })).status, 403, 'cannot raise a PO for another location');
  assert.equal((await u2.get(`/po/${po._id}`)).status, 404);
  assert.equal(ok(await u2.get('/po')).length, 0);
  assert.equal(ok(await u1.get('/po')).length, 1);
  assert.equal((await u2.post(`/po/${po._id}/cancel`, {})).status, 404, 'existence is not revealed');
  assert.equal((await u1.post(`/po/${po._id}/approve`, { action: 'Approved', remark: 'self' })).status, 403, 'requesting branch cannot approve its own PO (approval side is the supplier)');
  ok(await a.post(`/po/${po._id}/approve`, { action: 'Approved', remark: 'ok' }));
  const inv = ok(await a.post(`/invoices/against-po/${po._id}`, { lines: [{ lineId: po.lines[0]._id, qty: 5 }] }), 201);
  assert.equal((await u2.get(`/invoices/${inv._id}`)).status, 404);
  assert.equal((await u2.post(`/invoices/${inv._id}/receive`, { remark: 'x', lines: [] })).status, 404);
  assert.equal((await u2.post(`/invoices/${inv._id}/cancel`, {})).status, 404);
  assert.equal(ok(await u1.get(`/invoices/${inv._id}`))._id, inv._id);
  const pay = ok(await u1.post('/payments', { kind: 'RECEIPT', fromLocation: ctx.b1._id, toLocation: ctx.ho._id, payMode: 'CASH', amount: 10 }), 201);
  assert.equal((await u2.get(`/payments/${pay._id}`)).status, 404);
  assert.equal((await u2.post(`/payments/${pay._id}/approve`, { action: 'Approve', remark: 'x' })).status, 404);
  assert.equal((await u1.post(`/payments/${pay._id}/approve`, { action: 'Approve', remark: 'self-approve' })).status, 403, 'payer cannot approve its own receipt (receiver approves)');
  assert.equal((await u2.get(`/reports/party-ledger?location=${ctx.b1._id}`)).status, 403);
  assert.equal(ok(await u2.get(`/reports/inventory?location=${ctx.b2._id}`)).length, 0);
  assert.equal((await u2.get(`/reports/inventory?location=${ctx.b1._id}`)).status, 403);
  assert.equal((await u1.get('/masters/brand')).status, 403, 'sales role has no master rights');
  assert.equal((await u1.get('/users')).status, 403);
});

test('forged tokens, inactive users and non-DMS users are refused', async () => {
  assert.equal((await request(app).get('/api/dms/me')).status, 401);
  assert.equal((await request(app).get('/api/dms/me').set('Authorization', 'Bearer not-a-token')).status, 401);
  const outsider = await User.create({ email: 'out@test.local', password: await User.hashPassword('Password123!'), firstName: 'O', lastName: 'S', phone: '9200000009', role: 'CUSTOMER', isActive: true });
  const t = jwt.sign({ userId: outsider._id }, env.jwtAccessSecret, { expiresIn: '1h' });
  assert.equal((await api(t).get('/me')).status, 403, 'a Haion customer has no DMS access');
  const wrong = jwt.sign({ userId: outsider._id }, 'x'.repeat(40), { expiresIn: '1h' });
  assert.equal((await api(wrong).get('/me')).status, 401);
  await User.updateOne({ _id: (await User.findOne({ email: 'b1@test.local' }))._id }, { isActive: false });
  assert.equal((await api(ctx.u1.tok).get('/me')).status, 401, 'deactivated user is locked out immediately');
});

test('Update User Permission rights: Region / Location Type narrow the locations, Brand narrows the products', async () => {
  const a = api(adminTok);
  ok(await a.put(`/locations/${ctx.b1._id}`, { region: 'EAST' }));
  ok(await a.put(`/locations/${ctx.b2._id}`, { region: 'WEST' }));
  // a Sales Head without a location sees every location of the ticked region
  const sh = ok(await a.post('/users', { displayName: 'Sales Head', email: 'sh@test.local', phone: '9200000005', password: 'Password123!', userType: 'Sales Head', pages: ['home', 'r_inventory'], scopes: { regions: ['EAST'] } }), 201);
  const shTok = jwt.sign({ userId: (await User.findOne({ email: 'sh@test.local' }))._id }, env.jwtAccessSecret, { expiresIn: '1h' });
  let locs = ok(await api(shTok).get('/lookups')).locations.map((l) => l._id);
  assert.deepEqual(locs, [ctx.b1._id]);
  // changing the rights to WEST switches the visible locations
  ok(await a.put(`/users/${sh._id}`, { scopes: { regions: ['WEST'] } }));
  locs = ok(await api(shTok).get('/lookups')).locations.map((l) => l._id);
  assert.deepEqual(locs, [ctx.b2._id]);
  // Location Type: HO user limited to Branch sees HO itself plus the branches below it
  const ho = ok(await a.post('/users', { displayName: 'HO User', email: 'hou@test.local', phone: '9200000006', password: 'Password123!', userType: 'Location User', location: ctx.ho._id, pages: ['home'], scopes: { locationTypes: ['Branch'], regions: ['EAST'] } }), 201);
  const hoTok = jwt.sign({ userId: (await User.findOne({ email: 'hou@test.local' }))._id }, env.jwtAccessSecret, { expiresIn: '1h' });
  locs = ok(await api(hoTok).get('/lookups')).locations.map((l) => l._id).sort();
  assert.deepEqual(locs, [ctx.ho._id, ctx.b1._id].sort());
  // Brand right: a brand with no products → no products offered
  const other = ok(await a.post('/masters/brand', { name: 'Other Brand' }), 201);
  ok(await a.put(`/users/${ho._id}`, { scopes: { brands: [other._id] } }));
  assert.equal(ok(await api(hoTok).get('/lookups')).products.length, 0);
  // history records the changes
  const h = ok(await a.get(`/users/${ho._id}/history`)).history.map((x) => x.change);
  assert.equal(h.at(-1), 'Created');
  assert.match(h[0], /Region \/ Location \/ Category \/ Brand/);
});

test('report filters: Product Category / Brand / Product and Inventory Type narrow the rows', async () => {
  const a = api(adminTok);
  const all = ok(await a.get('/reports/inventory'));
  assert.ok(all.some((r) => String(r.productId) === ctx.prod._id), 'opening stock is listed');
  const other = ok(await a.post('/masters/brand', { name: 'Filter Brand' }), 201);
  assert.equal(ok(await a.get(`/reports/inventory?brand=${other._id}`)).length, 0, 'a brand with no products has no stock rows');
  assert.ok(ok(await a.get(`/reports/inventory?product=${ctx.prod._id}`)).every((r) => String(r.productId) === ctx.prod._id));
  assert.equal(ok(await a.get('/reports/inventory?inventoryType=IMEI%20INVENTORY')).length, 0, 'the test product is not serialized');
  assert.ok(ok(await a.get('/reports/inventory?inventoryType=QTY%20INVENTORY')).length > 0);
  const docs = ok(await a.get(`/reports/documents?kind=OPENING&brand=${other._id}`));
  assert.equal(docs.length, 0);
  assert.ok(ok(await a.get(`/reports/documents?kind=OPENING&product=${ctx.prod._id}`)).length > 0);
});
