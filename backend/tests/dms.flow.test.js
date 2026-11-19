/**
 * DMS end-to-end API flow. Runs ONLY against an in-memory MongoDB (never MONGODB_URI).
 * Masters → opening stock → PO → approval → invoice against PO → dispatch → receive
 * → retail customer bill (serial) → customer return → payment + approval → ledger
 * → scoping for a non-admin DMS user → cancel restores stock → dashboard.
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
import { fyLabel } from '../src/dms/services/core.service.js';

let mem;
let adminToken;
const ctx = {};
const api = (token = adminToken) => ({
  get: (u) => request(app).get(`/api/dms${u}`).set('Authorization', `Bearer ${token}`),
  post: (u, b) => request(app).post(`/api/dms${u}`).set('Authorization', `Bearer ${token}`).send(b),
  put: (u, b) => request(app).put(`/api/dms${u}`).set('Authorization', `Bearer ${token}`).send(b),
});
const ok = (res, code = 200) => {
  assert.equal(res.status, code, `${res.req?.method} ${res.req?.path} → ${res.status} ${JSON.stringify(res.body)}`);
  return res.body.data;
};

before(async () => {
  if (mongoose.connection.readyState) await mongoose.disconnect();
  mem = await MongoMemoryServer.create();
  await mongoose.connect(mem.getUri(), { dbName: 'dms_test' });
  const admin = await User.create({
    email: 'dms-admin@test.local', password: await User.hashPassword('Password123!'), firstName: 'Dms', lastName: 'Admin', phone: '9000000001', role: 'MASTER_ADMIN', isActive: true,
  });
  adminToken = jwt.sign({ userId: admin._id }, env.jwtAccessSecret, { expiresIn: '1h' });
  await Promise.all(Object.values(mongoose.models).filter((m) => m.collection.collectionName.startsWith('dms_')).map((m) => m.init()));
});

after(async () => {
  await mongoose.disconnect();
  await mem?.stop();
});

test('unauthenticated access is rejected', async () => {
  const res = await request(app).get('/api/dms/me');
  assert.equal(res.status, 401);
});

test('masters: brand, category, HSN, products, locations', async () => {
  const a = api();
  ctx.brand = ok(await a.post('/masters/brand', { name: 'Haion' }), 201);
  ctx.cat = ok(await a.post('/masters/category', { name: 'MOBILE' }), 201);
  ok(await a.post('/hsn', { hsnCode: '85171300', description: 'Phones', cgst: 9, sgst: 9 }), 201);
  const dupHsn = await a.post('/hsn', { hsnCode: '85171300', cgst: 9, sgst: 9 });
  assert.equal(dupHsn.status, 409);
  ctx.pPlain = ok(await a.post('/products', { productCode: 'acc01', name: 'Charger', category: ctx.cat._id, brand: ctx.brand._id, hsnCode: '85171300' }), 201);
  assert.equal(ctx.pPlain.productCode, 'ACC01');
  ctx.pSer = ok(await a.post('/products', { productCode: 'PH01', name: 'Phone X', category: ctx.cat._id, brand: ctx.brand._id, hsnCode: '85171300', isSerialized: true }), 201);
  const badHsn = await a.post('/products', { productCode: 'BAD', name: 'Bad', category: ctx.cat._id, brand: ctx.brand._id, hsnCode: '0000' });
  assert.equal(badHsn.status, 422);

  const base = { state: 'Uttar Pradesh', stateCode: 'UP', city: 'Noida', billingAddress: 'B-32 Sector 57' };
  ctx.ho = ok(await a.post('/locations', { ...base, name: 'Test HO', locationType: 'Head Office', docPrefix: 'SKD' }), 201);
  assert.equal(ctx.ho.code, 'INHOUP001');
  ctx.br = ok(await a.post('/locations', { ...base, city: 'Agra', name: 'Test Branch', locationType: 'Branch', docPrefix: 'AGR', parent: ctx.ho._id, creditLimit: 500000 }), 201);
  assert.equal(ctx.br.code, 'INBRUP001');
  ctx.dl = ok(await a.post('/locations', { state: 'Maharashtra', stateCode: 'MH', city: 'Mumbai', billingAddress: 'Andheri', name: 'Test Dealer', locationType: 'Dealer', docPrefix: 'MUM', parent: ctx.br._id }), 201);
  assert.equal(ctx.dl.code, 'DEDLMH001');
  ctx.courier = ok(await a.post('/masters/courier', { name: 'DTDC', attrs: { city: 'Gurgaon' } }), 201);
});

test('opening stock adds OK/Damage/Missing and registers serials', async () => {
  const inv = ok(await api().post('/invoices', {
    kind: 'OPENING', from: ctx.ho._id,
    lines: [
      { product: ctx.pPlain._id, qty: 100, okQty: 98, damageQty: 2, price: 100 },
      { product: ctx.pSer._id, qty: 3, price: 10000, serials: ['IMEI001', 'IMEI002', 'IMEI003'] },
    ],
  }), 201);
  assert.match(inv.invoiceNo, new RegExp(`^OPN/${fyLabel()}/SKD/0001$`));
  const dup = await api().post('/invoices', { kind: 'OPENING', from: ctx.ho._id, lines: [{ product: ctx.pSer._id, qty: 1, price: 1, serials: ['imei001'] }] });
  assert.equal(dup.status, 422, 'duplicate serial must be refused');
  const stock = ok(await api().get(`/reports/inventory?location=${ctx.ho._id}`));
  const plain = stock.find((s) => s.productCode === 'ACC01');
  assert.deepEqual([plain.okQty, plain.damageQty], [98, 2]);
});

test('PO → approval → invoice against PO → dispatch → receive', async () => {
  const a = api();
  const po = ok(await a.post('/po', { fromLocation: ctx.br._id, toLocation: ctx.ho._id, lines: [{ product: ctx.pPlain._id, qty: 10, price: 150, discountPerUnit: 10 }] }), 201);
  assert.equal(po.poNo, 'INBRUP001PO1');
  assert.equal(po.status, 'PFA');
  assert.equal(po.grandTotal, 1400);
  ctx.po = po;

  const noRemark = await a.post(`/po/${po._id}/approve`, { action: 'Approved' });
  assert.equal(noRemark.status, 422);
  const early = await a.post(`/invoices/against-po/${po._id}`, { lines: [{ lineId: po.lines[0]._id, qty: 1 }] });
  assert.equal(early.status, 422, 'cannot invoice a PFA PO');
  ok(await a.post(`/po/${po._id}/approve`, { action: 'Approved', remark: 'ok' }));

  const inv = ok(await a.post(`/invoices/against-po/${po._id}`, { lines: [{ lineId: po.lines[0]._id, qty: 6 }] }), 201);
  assert.equal(inv.invoiceNo, `SKD/${fyLabel()}/0001`);
  assert.equal(inv.status, 'Pending');
  // intra-state (UP→UP) → CGST+SGST 9% each on 6 × 140 = 840
  assert.equal(inv.lines[0].cgstAmt, 75.6);
  assert.equal(inv.lines[0].igstAmt, 0);
  assert.equal(inv.grandTotal, 991.2);
  ctx.inv = inv;

  const over = await a.post(`/invoices/against-po/${po._id}`, { lines: [{ lineId: po.lines[0]._id, qty: 5 }] });
  assert.equal(over.status, 422, 'bill qty above pending must fail');
  const poNow = ok(await a.get(`/po/${po._id}`));
  assert.equal(poNow.status, 'Processed');
  assert.equal(poNow.lines[0].pendingQty, 4);

  const bad = await a.post(`/invoices/${inv._id}/dispatch`, { docketNo: '1' });
  assert.equal(bad.status, 422);
  assert.ok(bad.body.errors.courier);
  ok(await a.post(`/invoices/${inv._id}/dispatch`, {
    courier: ctx.courier._id, docketNo: 'D1', dispatchDate: '2026-11-19', logisticPerson: 'Ram', transportMode: 'By Road',
    contactNo: '9876543210', carrierNo: 'UP16AB1234', deliveryAddress: 'Agra', remark: 'sent',
  }));

  const wrongSum = await a.post(`/invoices/${inv._id}/receive`, { remark: 'x', lines: [{ lineId: inv.lines[0]._id, okQty: 5, damageQty: 0, missingQty: 0 }] });
  assert.equal(wrongSum.status, 422);
  const rec = ok(await a.post(`/invoices/${inv._id}/receive`, { remark: 'received', lines: [{ lineId: inv.lines[0]._id, okQty: 5, damageQty: 1, missingQty: 0 }] }));
  assert.equal(rec.status, 'Received');

  const hoStock = ok(await a.get(`/reports/inventory?location=${ctx.ho._id}`)).find((s) => s.productCode === 'ACC01');
  const brStock = ok(await a.get(`/reports/inventory?location=${ctx.br._id}`)).find((s) => s.productCode === 'ACC01');
  assert.equal(hoStock.okQty, 92);
  assert.deepEqual([brStock.okQty, brStock.damageQty], [5, 1]);
});

test('retail customer bill sells a serial; customer return brings it back', async () => {
  const a = api();
  const cust = ok(await a.post('/customers', { name: 'Ravi', phone: '9999999999', state: 'Uttar Pradesh', stateCode: 'UP', city: 'Noida', location: ctx.ho._id }), 201);
  const noSerial = await a.post('/invoices', { kind: 'RETAIL_CUSTOMER', from: ctx.ho._id, to: cust._id, lines: [{ product: ctx.pSer._id, qty: 1, price: 12000 }] });
  assert.equal(noSerial.status, 422, 'serialized product needs serials');
  const bill = ok(await a.post('/invoices', { kind: 'RETAIL_CUSTOMER', from: ctx.ho._id, to: cust._id, lines: [{ product: ctx.pSer._id, qty: 1, price: 12000, serials: ['IMEI002'] }] }), 201);
  let [s] = ok(await a.post('/invoices/serials/track', { serials: ['IMEI002'] }));
  assert.equal(s.status, 'SOLD');
  const again = await a.post('/invoices', { kind: 'RETAIL_CUSTOMER', from: ctx.ho._id, to: cust._id, lines: [{ product: ctx.pSer._id, qty: 1, price: 12000, serials: ['IMEI002'] }] });
  assert.equal(again.status, 422, 'sold serial cannot be sold again');

  ok(await a.post('/invoices', { kind: 'CUSTOMER_RETURN', from: cust._id, to: ctx.ho._id, sourceInvoice: bill._id, lines: [{ product: ctx.pSer._id, qty: 1, price: 12000, serials: ['IMEI002'] }] }), 201);
  [s] = ok(await a.post('/invoices/serials/track', { serials: ['IMEI002'] }));
  assert.equal(s.status, 'IN_STOCK');
  assert.equal(String(s.location._id), String(ctx.ho._id));

  const paid = ok(await a.post(`/invoices/${bill._id}/payment`, { amount: bill.grandTotal, payMode: 'CASH' }));
  assert.equal(paid.status, 'Completed');
});

test('payment receive → approval → party ledger and outstanding', async () => {
  const a = api();
  const p = ok(await a.post('/payments', { fromLocation: ctx.br._id, toLocation: ctx.ho._id, payMode: 'CASH', amount: 500, remark: 'part' }), 201);
  assert.match(p.docNo, new RegExp(`^RECP/${fyLabel()}/SKD/0002$`));
  assert.equal(p.status, 'PFA');
  const tooMuch = await a.post(`/payments/${p._id}/approve`, { action: 'Approve', receivedAmount: 600, remark: 'x' });
  assert.equal(tooMuch.status, 422);
  ok(await a.post(`/payments/${p._id}/approve`, { action: 'Approve', receivedAmount: 500, remark: 'ok' }));
  const led = ok(await a.get(`/reports/party-ledger?location=${ctx.ho._id}`));
  assert.equal(led.closing, 491.2); // 991.2 invoice − 500 payment
  const credit = ok(await a.get(`/po/credit/${ctx.br._id}`));
  assert.equal(credit.available, 500000 - 491.2);
});

test('non-admin DMS user: login by Login ID, page rights and location scoping', async () => {
  const a = api();
  const prof = ok(await a.post('/users', { displayName: 'Dealer User', email: 'dealer.user@test.local', phone: '9000000002', password: 'Password123!', userType: 'Location User', location: ctx.dl._id, pages: ['po', 'home'] }), 201);
  assert.match(prof.loginId, /^DEUSR/);
  const login = await request(app).post('/api/auth/login').send({ email: prof.loginId, password: 'Password123!' });
  assert.equal(login.status, 200, JSON.stringify(login.body));
  const dTok = login.body.data.accessToken;
  const me = ok(await api(dTok).get('/me'));
  assert.equal(me.isAdmin, false);
  const pos = ok(await api(dTok).get('/po'));
  assert.equal(pos.length, 0, 'dealer must not see branch POs');
  assert.equal((await api(dTok).get('/locations')).status, 403, 'no Location Master page right');
  assert.equal((await api(dTok).get(`/po/${ctx.po._id}`)).status, 404);
  const foreign = await api(dTok).post('/po', { fromLocation: ctx.br._id, toLocation: ctx.ho._id, lines: [{ product: ctx.pPlain._id, qty: 1, price: 1 }] });
  assert.equal(foreign.status, 403, 'cannot raise PO for another location');
  ok(await api(dTok).post('/po', { fromLocation: ctx.dl._id, toLocation: ctx.br._id, lines: [{ product: ctx.pPlain._id, qty: 1, price: 1 }] }), 201);
});

test('cancelling a pending invoice restores stock and reverses ledger', async () => {
  const a = api();
  const inv = ok(await a.post(`/invoices/against-po/${ctx.po._id}`, { lines: [{ lineId: ctx.po.lines[0]._id, qty: 4 }] }), 201);
  let ho = ok(await a.get(`/reports/inventory?location=${ctx.ho._id}`)).find((s) => s.productCode === 'ACC01');
  assert.equal(ho.okQty, 88);
  ok(await a.post(`/invoices/${inv._id}/cancel`, { remark: 'wrong' }));
  ho = ok(await a.get(`/reports/inventory?location=${ctx.ho._id}`)).find((s) => s.productCode === 'ACC01');
  assert.equal(ho.okQty, 92);
  const led = ok(await a.get(`/reports/party-ledger?location=${ctx.ho._id}`));
  assert.equal(led.closing, 491.2);
  const received = await a.post(`/invoices/${ctx.inv._id}/cancel`, {});
  assert.equal(received.status, 422, 'received invoice cannot be cancelled');
});

test('stock transfer needs approval before stock moves', async () => {
  const a = api();
  const stn = ok(await a.post('/invoices', { kind: 'STN', from: ctx.ho._id, to: ctx.br._id, lines: [{ product: ctx.pPlain._id, qty: 2, price: 100 }] }), 201);
  assert.equal(stn.status, 'PFA');
  assert.match(stn.invoiceNo, /^STN\//);
  let ho = ok(await a.get(`/reports/inventory?location=${ctx.ho._id}`)).find((s) => s.productCode === 'ACC01');
  assert.equal(ho.okQty, 92);
  ok(await a.post(`/invoices/${stn._id}/approve`, { action: 'Approved', remark: 'go' }));
  ho = ok(await a.get(`/reports/inventory?location=${ctx.ho._id}`)).find((s) => s.productCode === 'ACC01');
  assert.equal(ho.okQty, 90);
  const tooBig = await a.post('/invoices', { kind: 'STN', from: ctx.ho._id, to: ctx.br._id, lines: [{ product: ctx.pPlain._id, qty: 1000, price: 1 }] });
  assert.equal(tooBig.status, 422);
});

test('dashboard aggregates', async () => {
  const d = ok(await api().get('/reports/dashboard'));
  assert.ok(d.tiles.sale.amount > 0);
  assert.equal(d.tiles.collection.amount, 500);
  assert.ok(Array.isArray(d.topModels));
});

test('vendor PO → receive creates a received local purchase with stock + serials', async () => {
  const a = api();
  const vendor = ok(await a.post('/vendors', { name: 'Supplier One', city: 'Noida', state: 'Uttar Pradesh', stateCode: 'UP', phone: '9000000009' }), 201);
  assert.equal(vendor.code, 'VNDR1');
  const vpo = ok(await a.post('/po', { poType: 'VENDOR', fromLocation: ctx.ho._id, toVendor: vendor._id, lines: [{ product: ctx.pSer._id, qty: 2, price: 9000 }] }), 201);
  assert.equal(vpo.status, 'Approved');
  assert.equal(vpo.poNo, 'INHOUP001VPO1');
  const noRef = await a.post(`/invoices/from-vendor-po/${vpo._id}`, { lines: [{ lineId: vpo.lines[0]._id, okQty: 2 }] });
  assert.equal(noRef.status, 422);
  const tooMany = await a.post(`/invoices/from-vendor-po/${vpo._id}`, { refNo: 'V-1', lines: [{ lineId: vpo.lines[0]._id, okQty: 3 }] });
  assert.equal(tooMany.status, 422);
  const doc = ok(await a.post(`/invoices/from-vendor-po/${vpo._id}`, { refNo: 'V-1', lines: [{ lineId: vpo.lines[0]._id, okQty: 2, serials: ['VS001', 'VS002'] }] }), 201);
  assert.equal(doc.status, 'Received');
  assert.equal(ok(await a.get(`/po/${vpo._id}`)).status, 'Received');
  const [s] = ok(await a.post('/invoices/serials/track', { serials: ['VS001'] }));
  assert.equal(s.status, 'IN_STOCK');
  const again = await a.post(`/invoices/from-vendor-po/${vpo._id}`, { refNo: 'V-2', lines: [{ lineId: vpo.lines[0]._id, okQty: 1 }] });
  assert.equal(again.status, 422, 'received PO cannot be received twice');
});

test('change password verifies the old password', async () => {
  const user = await User.create({ email: 'pw@test.local', password: await User.hashPassword('OldPass123!'), firstName: 'P', lastName: 'W', phone: '9000000010', role: 'MASTER_ADMIN', isActive: true });
  const tok = jwt.sign({ userId: user._id }, env.jwtAccessSecret, { expiresIn: '1h' });
  assert.equal((await api(tok).post('/change-password', { oldPassword: 'wrong', newPassword: 'NewPass123!' })).status, 422);
  assert.equal((await api(tok).post('/change-password', { oldPassword: 'OldPass123!', newPassword: 'short' })).status, 422);
  ok(await api(tok).post('/change-password', { oldPassword: 'OldPass123!', newPassword: 'NewPass123!' }));
  const login = await request(app).post('/api/auth/login').send({ email: 'pw@test.local', password: 'NewPass123!' });
  assert.equal(login.status, 200);
});

test('uploads are all-or-nothing: one bad line rejects the whole document and changes no stock', async () => {
  const a = api();
  const { DmsInvoice } = await import('../src/dms/models/txn.models.js');
  const { DmsStock, DmsSerial } = await import('../src/dms/models/txn.models.js');
  const before = { inv: await DmsInvoice.countDocuments(), stock: await DmsStock.find().lean(), ser: await DmsSerial.countDocuments() };
  const bad = [
    { product: ctx.pPlain._id, qty: 5, price: 10 },
    { product: ctx.pSer._id, qty: 2, price: 10, serials: ['UPL-1', 'UPL-1'] }, // duplicate serial inside the file
  ];
  assert.equal((await a.post('/invoices', { kind: 'OPENING', from: ctx.ho._id, lines: bad })).status, 422);
  assert.equal((await a.post('/invoices', { kind: 'OPENING', from: ctx.ho._id, lines: [{ product: ctx.pPlain._id, qty: 5, price: 10 }, { product: '000000000000000000000000', qty: 1, price: 1 }] })).status, 422, 'unknown product');
  assert.equal((await a.post('/invoices', { kind: 'OPENING', from: ctx.ho._id, lines: [{ product: ctx.pPlain._id, qty: 5, price: 10 }, { product: ctx.pSer._id, qty: 1, price: 10, serials: ['IMEI001'] }] })).status, 422, 'serial already exists');
  const after = { inv: await DmsInvoice.countDocuments(), stock: await DmsStock.find().lean(), ser: await DmsSerial.countDocuments() };
  assert.equal(after.inv, before.inv, 'no document created');
  assert.equal(after.ser, before.ser, 'no serial created');
  assert.deepEqual(after.stock.map((s) => [s.okQty, s.damageQty]), before.stock.map((s) => [s.okQty, s.damageQty]), 'stock untouched');
});

test('business dates use India time, not UTC (attendance day, financial year)', async () => {
  const { fyLabel, localDay } = await import('../src/dms/services/core.service.js');
  assert.equal(localDay(new Date('2026-03-31T19:00:00Z')), '2026-04-01', '00:30 IST on 1 April');
  assert.equal(fyLabel(new Date('2026-03-31T19:00:00Z')), '26-27', 'first minutes of the new FY');
  assert.equal(fyLabel(new Date('2026-03-31T18:00:00Z')), '25-26', '23:30 IST on 31 March');
  assert.equal(localDay(new Date('2026-11-18T20:00:00Z')), '2026-11-19');
});

test('STN distribution: one source to many destinations, total checked first, all-or-nothing', async () => {
  const a = api();
  const before = ok(await a.get('/invoices?kind=STN&perPage=100')).length;
  const tooMuch = await a.post('/invoices/stn-distribution', { from: ctx.ho._id, docType: 'DELIVERY CHALLAN', rows: [
    { to: ctx.br._id, lines: [{ product: ctx.pPlain._id, qty: 60, price: 10 }] },
    { to: ctx.dl._id, lines: [{ product: ctx.pPlain._id, qty: 60, price: 10 }] },
  ] });
  assert.equal(tooMuch.status, 422, 'each row fits but the total exceeds stock');
  assert.equal(ok(await a.get('/invoices?kind=STN&perPage=100')).length, before, 'nothing created');
  const r = ok(await a.post('/invoices/stn-distribution', { from: ctx.ho._id, docType: 'DELIVERY CHALLAN', rows: [
    { to: ctx.br._id, lines: [{ product: ctx.pPlain._id, qty: 2, price: 10 }] },
    { to: ctx.dl._id, lines: [{ product: ctx.pPlain._id, qty: 3, price: 10 }] },
  ] }), 201);
  assert.match(r.batch, /^DIST\/\d+$/);
  assert.equal(r.documents.length, 2);
  const listed = ok(await a.get('/invoices?kind=STN&distribution=1&perPage=100'));
  assert.equal(listed.length, 2);
  assert.ok(listed.every((d) => d.status === 'PFA' && d.refNo === r.batch));
});
