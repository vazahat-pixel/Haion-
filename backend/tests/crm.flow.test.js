/**
 * Service CRM (CANCRM V6) end-to-end API flow.
 * Runs against in-memory MongoDB (never MONGODB_URI).
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
let adminToken;
const ctx = {};

const dmsApi = (token = adminToken) => ({
  post: (u, b) => request(app).post(`/api/dms${u}`).set('Authorization', `Bearer ${token}`).send(b),
});

const crmApi = (token = adminToken) => ({
  get: (u) => request(app).get(`/api/service-crm${u}`).set('Authorization', `Bearer ${token}`),
  post: (u, b) => request(app).post(`/api/service-crm${u}`).set('Authorization', `Bearer ${token}`).send(b),
  put: (u, b) => request(app).put(`/api/service-crm${u}`).set('Authorization', `Bearer ${token}`).send(b),
  del: (u) => request(app).delete(`/api/service-crm${u}`).set('Authorization', `Bearer ${token}`),
});

const ok = (res, code = 200) => {
  assert.equal(res.status, code, `${res.req?.method} ${res.req?.path} → ${res.status} ${JSON.stringify(res.body)}`);
  return res.body.data;
};

before(async () => {
  if (mongoose.connection.readyState) await mongoose.disconnect();
  mem = await MongoMemoryServer.create();
  await mongoose.connect(mem.getUri(), { dbName: 'crm_test' });
  const admin = await User.create({
    email: 'crm-admin@test.local',
    password: await User.hashPassword('Password123!'),
    firstName: 'CRM',
    lastName: 'Admin',
    phone: '9000000099',
    role: 'MASTER_ADMIN',
    isActive: true,
  });
  adminToken = jwt.sign({ userId: admin._id }, env.jwtAccessSecret, { expiresIn: '1h' });
  await Promise.all(
    Object.values(mongoose.models)
      .filter((m) => m.collection.collectionName.startsWith('dms_') || m.collection.collectionName.startsWith('crm_'))
      .map((m) => m.init()),
  );
});

after(async () => {
  await mongoose.disconnect();
  await mem?.stop();
});

test('unauthenticated access is rejected', async () => {
  const res = await request(app).get('/api/service-crm/me');
  assert.equal(res.status, 401);
});

test('shared DMS masters + CRM models, parts, users, and lookups', async () => {
  const d = dmsApi();
  ctx.brand = ok(await d.post('/masters/brand', { name: 'Lazer' }), 201);
  ctx.product = ok(await d.post('/masters/category', { name: 'MIXER GRINDER' }), 201);
  ctx.state = ok(await d.post('/masters/state', { name: 'Uttar Pradesh' }), 201);
  ctx.city = ok(await d.post('/masters/city', { name: 'Noida', parent: ctx.state._id }), 201);

  ctx.wh = ok(await d.post('/locations', {
    name: 'Lazer India WH',
    locationType: 'WH',
    state: 'Uttar Pradesh',
    stateCode: 'UP',
    city: 'Noida',
    billingAddress: 'Sector 63 Noida',
    pincode: '201301',
    docPrefix: 'CWH',
  }), 201);

  ctx.asp = ok(await d.post('/locations', {
    name: 'Test Service ASP',
    locationType: 'ASP',
    state: 'Uttar Pradesh',
    stateCode: 'UP',
    city: 'Noida',
    billingAddress: 'Sector 18 Noida',
    pincode: '201301',
    docPrefix: 'PY',
  }), 201);

  ctx.vendor = ok(await d.post('/vendors', { name: 'Motor Parts Vendor', city: 'Delhi', state: 'Delhi', stateCode: 'DL' }), 201);

  const c = crmApi();
  ctx.model = ok(await c.post('/models', {
    product: ctx.product._id,
    brand: ctx.brand._id,
    modelCode: 'LZMG750',
    modelName: 'Lazer Tornado 750W',
    customerWarrantyDays: 730,
    serviceCharges: 250,
  }), 201);

  ctx.part = ok(await c.post('/parts', {
    product: ctx.product._id,
    brand: ctx.brand._id,
    models: [ctx.model._id],
    partcode: 'MTR750',
    partName: '750W Copper Motor',
    purchasePrice: 400,
    locationPrice: 500,
    customerPrice: 750,
    partCategory: 'Component',
  }), 201);

  ok(await c.post('/masters/voc', { code: 'VOC01', name: 'Not Powering On' }), 201);
  ok(await c.post('/masters/fault', { code: 'FLT01', name: 'Motor Burnt' }), 201);
  ok(await c.post('/masters/repairAction', { code: 'REP01', name: 'Motor Replaced' }), 201);

  ctx.ccUser = ok(await c.post('/users', { loginId: 'CC001', displayName: 'Anju CC', password: 'Password123!', userType: 'Call Center' }), 201);
  ctx.aspUser = ok(await c.post('/users', { loginId: 'PY0003', displayName: 'Test Service', password: 'Password123!', userType: 'ASP', location: ctx.asp._id }), 201);
  ctx.engUser = ok(await c.post('/users', { loginId: 'PY0003U1', displayName: 'Ramesh Engineer', password: 'Password123!', userType: 'Engineer', location: ctx.asp._id }), 201);
  ctx.whUser = ok(await c.post('/users', { loginId: 'CWH47', displayName: 'Lazer WH', password: 'Password123!', userType: 'WH', location: ctx.wh._id }), 201);

  const lk = ok(await c.get('/lookups'));
  assert.ok(lk.brands.length >= 1);
  assert.ok(lk.models.length >= 1);
  assert.ok(lk.parts.length >= 1);
});

test('WH Local GRN stocks fresh parts', async () => {
  const res = await crmApi().post('/grn/local', {
    shipTo: ctx.wh._id,
    supplier: ctx.vendor._id,
    items: [{ part: ctx.part._id, qty: 10, price: 400 }],
  });
  const grn = ok(res, 201);
  assert.equal(grn.status, 'Received');

  const stk = ok(await crmApi().get(`/stock?location=${ctx.wh._id}`));
  assert.equal(stk[0].fresh, 10);
});

test('full E2E job flow: Call Booking → Ack → Visit → Assign → PNA → WH Dispatch → Stock In → Repair → Handover → Claim', async () => {
  // Login as Call Center user via Login ID
  const ccLogin = await request(app).post('/api/auth/login').send({ email: 'CC001', password: 'Password123!' });
  assert.equal(ccLogin.status, 200);
  const ccToken = ccLogin.body.data.accessToken;

  const aspLogin = await request(app).post('/api/auth/login').send({ email: 'PY0003', password: 'Password123!' });
  assert.equal(aspLogin.status, 200);
  const aspToken = aspLogin.body.data.accessToken;

  const whLogin = await request(app).post('/api/auth/login').send({ email: 'CWH47', password: 'Password123!' });
  assert.equal(whLogin.status, 200);
  const whToken = whLogin.body.data.accessToken;

  // 1. Call Booking
  const job = ok(await crmApi(ccToken).post('/jobs', {
    customerName: 'Rahul Sharma',
    contactNo: '9876543210',
    address: 'Sector 15',
    state: 'Uttar Pradesh',
    city: 'Noida',
    pincode: '201301',
    assignLocation: ctx.asp._id,
    product: ctx.product._id,
    brand: ctx.brand._id,
    model: ctx.model._id,
    serialNo: 'LZSN1001',
    voc: 'Not Powering On',
  }), 201);
  assert.equal(job.status, 'Open');
  assert.match(job.happyCode, /^HC\d{6}$/);

  // 2. ASP Acknowledge, Visit, Assign Engineer
  ok(await crmApi(aspToken).post(`/jobs/${job._id}/acknowledge`, { acknowledge: 'Accepted', remark: 'OK' }));
  ok(await crmApi(aspToken).post(`/jobs/${job._id}/appointment`, { visitDate: '2026-11-27', visitTime: '11:00', approvedBy: 'Rahul' }));
  ok(await crmApi(aspToken).post(`/jobs/${job._id}/assign`, { engineerId: ctx.engUser._id }));

  // 3. Spare Part Unavailable → PNA Bucket → Raise PNA PO
  const pnaJob = ok(await crmApi(aspToken).post(`/jobs/${job._id}/repair`, {
    repairStatus: 'Spare Part Unavailable',
    pendingParts: [{ part: ctx.part._id, qty: 1 }],
    remark: 'Motor burnt, need replacement',
  }));
  assert.equal(pnaJob.status, 'PNA');

  const bucket = ok(await crmApi(aspToken).get('/pna-bucket'));
  assert.equal(bucket.length, 1);

  const po = ok(await crmApi(aspToken).post('/pna-bucket/raise-po', {
    bucketIds: [bucket[0]._id],
    toLocation: ctx.wh._id,
  }), 201);
  assert.equal(po.poType, 'PNA');

  // 4. WH Dispatches PNA PO
  const disp = ok(await crmApi(whToken).post(`/po/${po._id}/dispatch`, {
    docType: 'Invoice',
    courierName: 'DTDC',
    docketNo: 'DTDC999',
  }), 201);
  assert.equal(disp.status, 'Dispatched');

  // 5. ASP Receives Stock In
  const rec = ok(await crmApi(aspToken).post(`/dispatches/${disp._id}/receive`, { remark: 'Received OK' }));
  assert.equal(rec.status, 'Received');

  // 6. ASP Issues Part to Engineer & Completes Repair
  ok(await crmApi(aspToken).post('/stock/issue-engineer', {
    engineerId: ctx.engUser._id,
    jobNo: job.jobNo,
    items: [{ part: ctx.part._id, qty: 1 }],
  }), 201);

  const doneJob = ok(await crmApi(aspToken).post(`/jobs/${job._id}/repair`, {
    repairStatus: 'Repair Done',
    closeType: 'Serial No',
    repairDetails: [{ faultCode: 'FLT01', repairCode: 'REP01', part: ctx.part._id, qty: 1 }],
    remark: 'Motor replaced and tested',
  }));
  assert.equal(doneJob.status, 'Repair Done');

  // 7. Handover + Happy Calling
  const closed = ok(await crmApi(aspToken).post(`/jobs/${job._id}/handover`, {
    confirmBy: 'Rahul Sharma',
    contactNo: '9876543210',
    rating: 5,
    remark: 'Working fine',
  }));
  assert.equal(closed.status, 'Handover');
  assert.equal(closed.subStatus, 'Set Delivered');

  ok(await crmApi(ccToken).post(`/jobs/${job._id}/happy-call`, { rating: 5, remark: 'Customer happy' }));

  // 8. Engineer Faulty Return → ASP Faulty P2C Dispatch → WH Receive
  ok(await crmApi(aspToken).post('/stock/return-engineer', {
    engineerId: ctx.engUser._id,
    stockKind: 'defective',
    items: [{ part: ctx.part._id, qty: 1 }],
  }));

  const faultyDisp = ok(await crmApi(aspToken).post('/dispatches', {
    docType: 'Faulty Dispatch',
    toLocation: ctx.wh._id,
    courierName: 'BlueDart',
    docketNo: 'BD123',
    items: [{ part: ctx.part._id, qty: 1, jobNo: job.jobNo }],
  }), 201);
  ok(await crmApi(whToken).post(`/dispatches/${faultyDisp._id}/receive`, {}));

  // 9. Payment + Claim + Ledger
  const pay = ok(await crmApi(aspToken).post('/payments', {
    toLocation: ctx.wh._id,
    amount: 500,
    mode: 'NEFT',
    ddChequeNo: 'UTR12345',
  }), 201);
  ok(await crmApi(whToken).post(`/payments/${pay._id}/receive`, { decision: 'Received' }));

  ok(await crmApi().post('/masters/claimRate', { name: 'Repair Done Local', product: ctx.product._id, brand: ctx.brand._id, attrs: { aspPrice: 300, partnerPrice: 120, areaType: 'Local', jobStatus: 'Repair Done', fromTat: 0, toTat: 48, claimPct: '100' } }), 201);
  const now = new Date();
  const claim = ok(await crmApi().post('/claims/generate', {
    month: now.getMonth() + 1,
    year: now.getFullYear(),
    locationId: ctx.asp._id,
    claimType: 'Labour',
  }), 201);
  assert.equal(claim.jobs.length, 1);
  assert.equal(claim.totalAmount, 300);
  const dup = await crmApi().post('/claims/generate', { month: now.getMonth() + 1, year: now.getFullYear(), locationId: ctx.asp._id, claimType: 'Labour' });
  assert.equal(dup.status, 409, 'same month claim must not be generated twice');
  ok(await crmApi().post(`/claims/${claim._id}/approve`, {}));

  const accStatus = ok(await crmApi().get('/accounts/status'));
  const aspAcc = accStatus.find((a) => String(a._id) === String(ctx.asp._id));
  assert.equal(aspAcc.claimAc, 300);
});

const tokenOf = async (loginId, password = 'Password123!') => {
  const r = await request(app).post('/api/auth/login').send({ email: loginId, password });
  assert.equal(r.status, 200, `login ${loginId}`);
  return r.body.data.accessToken;
};

test('role and location rules: panels cannot act outside their role', async () => {
  const [cc, asp, wh] = [await tokenOf('CC001'), await tokenOf('PY0003'), await tokenOf('CWH47')];
  const eng = await tokenOf('PY0003U1');
  assert.equal((await crmApi(eng).get('/me')).status, 403, 'field staff cannot open the web panel');
  const asp2 = ok(await dmsApi().post('/locations', { name: 'Other ASP', locationType: 'ASP', state: 'Uttar Pradesh', stateCode: 'UP', city: 'Noida', billingAddress: 'Sector 1', pincode: '201301', docPrefix: 'OA' }), 201);
  ok(await crmApi().post('/users', { loginId: 'OASP01', displayName: 'Other ASP', password: 'Password123!', userType: 'ASP', location: asp2._id }), 201);
  const other = await tokenOf('OASP01');
  const job = ok(await crmApi(cc).post('/jobs', {
    customerName: 'Rule Check', contactNo: '9876500000', address: 'X', state: 'Uttar Pradesh', city: 'Noida', pincode: '201301',
    assignLocation: ctx.asp._id, product: ctx.product._id, brand: ctx.brand._id, model: ctx.model._id, voc: 'Noise',
  }), 201);
  assert.equal((await crmApi(other).get(`/jobs/${job._id}`)).status, 403);
  assert.equal((await crmApi(other).post(`/jobs/${job._id}/acknowledge`, { acknowledge: 'Accepted' })).status, 403);
  assert.equal((await crmApi(wh).post(`/jobs/${job._id}/acknowledge`, { acknowledge: 'Accepted' })).status, 403);
  assert.equal((await crmApi(cc).post(`/jobs/${job._id}/acknowledge`, { acknowledge: 'Accepted' })).status, 403);
  assert.equal((await crmApi(cc).post(`/jobs/${job._id}/assign`, { engineerId: ctx.engUser._id })).status, 403);
  assert.equal((await crmApi(asp).post(`/jobs/${job._id}/assign`, { assignLocationId: asp2._id })).status, 403);
  assert.equal((await crmApi(asp).post('/users', { loginId: 'HACK1', displayName: 'X', password: 'Password123!', userType: 'Admin' })).status, 403);
  assert.equal((await crmApi(asp).post('/claims/generate', { month: 1, year: 2026, locationId: ctx.asp._id })).status, 403);
  ok(await crmApi(asp).post(`/jobs/${job._id}/acknowledge`, { acknowledge: 'Rejected', remark: 'Out of area' }));
  const rejected = ok(await crmApi(cc).get('/jobs?rejected=1&status=Open'));
  assert.equal(rejected.find((j) => j._id === job._id)?.statusText, 'Rejected By ASC');
  ok(await crmApi(cc).post(`/jobs/${job._id}/assign`, { assignLocationId: asp2._id, remark: 'Reassigned' }));
  assert.equal((await crmApi(other).get(`/jobs/${job._id}`)).status, 200);
});

test('every report and dashboard endpoint answers', async () => {
  const keys = ['all-job', 'job-summary', 'pending-ageing', 'closed-tat', 'asp-tat', 'state-tat', 'state-ageing-model', 'brand-asp', 'faulty-model', 'part-consumption', 'po-pna', 'sales', 'sales-return',
    'stock-details', 'stock-move', 'pnl', 'part-price', 'product-search', 'call-details', 'asp-dashboard', 'spares-log', 'grn-details', 'tag-details', 'faulty-pending', 'asp-parts-sales', 'party-ledger', 'dashboard', 'asc-locations'];
  for (const k of keys) {
    const r = await crmApi().get(`/reports/${k}`);
    assert.equal(r.status, 200, `report ${k} → ${r.status} ${JSON.stringify(r.body).slice(0, 200)}`);
  }
  const all = ok(await crmApi().get('/reports/all-job'));
  assert.ok(all.length >= 1 && all[0].jobNo);
  const consumed = ok(await crmApi().get('/reports/part-consumption'));
  assert.ok(consumed.some((r) => r.partcode === ctx.part.partcode), 'consumed part shows in Part Consumption');
});

test('shared masters: location with login, city under state, VOC auto code, pincode → ASP mapping', async () => {
  const st = ok(await crmApi().post('/shared/state', { name: 'Haryana', code: 'HR', circle: 'NORTH' }), 201);
  assert.equal(st.attrs.circle, 'NORTH');
  ok(await crmApi().post('/shared/city', { state: 'Haryana', name: 'Gurgaon', isDistrict: true }), 201);
  assert.equal((await crmApi().post('/shared/city', { state: 'Haryana', name: 'Gurgaon' })).status, 409);
  const loc = ok(await crmApi().post('/shared/location', {
    locationType: 'ASP', name: 'Gurgaon Care', state: 'Haryana', city: 'Gurgaon', contactPerson: 'Amit', email: 'g@x.in', pincode: '122001', phone: '9811111111',
    billingAddress: 'Sector 14', proprietorType: 'OWNED', panNo: 'ABCDE1234F', region: 'CENTRAL', district: 'Gurgaon', loginId: 'GGN01', password: 'Password123!',
  }), 201);
  assert.equal(loc.code, 'GGN01');
  assert.equal(loc.attrs.district, 'Gurgaon');
  const me = ok(await crmApi(await tokenOf('GGN01')).get('/me'));
  assert.equal(me.crmRole, 'ASP');
  const voc = ok(await crmApi().post('/masters/voc', { name: 'Burning smell', brand: ctx.brand._id, product: ctx.product._id }), 201);
  assert.match(voc.code, /^V\d{4}$/);
  ok(await crmApi().post('/masters/pincode', { name: 'Sector 14', code: '122001', state: 'Haryana', city: 'Gurgaon', attrs: { aspId: loc._id } }), 201);
  const pins = ok(await crmApi().get('/masters/pincode'));
  assert.equal(pins.find((p) => p.code === '122001').aspName, 'Gurgaon Care (GGN01)');
  const job = ok(await crmApi().post('/jobs', {
    customerName: 'Pin Map', contactNo: '9876511111', address: 'Y', state: 'Haryana', city: 'Gurgaon', pincode: '122001',
    product: ctx.product._id, brand: ctx.brand._id, model: ctx.model._id, voc: 'Noise',
  }), 201);
  assert.equal(String(job.assignLocation), String(loc._id), 'job goes to the ASP mapped to the pincode');
});

test('job side flows: pickup/drop, reschedule, estimate, OUT warranty invoice, edit, change password', async () => {
  const [cc, asp] = [await tokenOf('CC001'), await tokenOf('PY0003')];
  ok(await crmApi(asp).post('/users', { loginId: 'PY0003P1', displayName: 'Pickup Raju', password: 'Password123!', userType: 'Pickup Boy' }), 201);
  ok(await crmApi(asp).post('/users', { loginId: 'PY0003D1', displayName: 'Delivery Sonu', password: 'Password123!', userType: 'Delivery boy' }), 201);
  const users = ok(await crmApi(asp).get('/users'));
  const pk = users.find((u) => u.loginId === 'PY0003P1');
  const dl = users.find((u) => u.loginId === 'PY0003D1');
  assert.equal(String(pk.location._id || pk.location), String(ctx.asp._id), 'ASP-created users belong to the ASP');
  const job = ok(await crmApi(cc).post('/jobs', {
    customerName: 'Out Warranty', contactNo: '9876522222', address: 'Z', state: 'Uttar Pradesh', city: 'Noida', pincode: '201301', assignLocation: ctx.asp._id,
    product: ctx.product._id, brand: ctx.brand._id, model: ctx.model._id, voc: 'Dead', serviceType: 'Pick and Drop', purchaseDate: '2020-01-01',
  }), 201);
  assert.equal(job.warrantyStatus, 'OUT');
  ok(await crmApi(asp).post(`/jobs/${job._id}/acknowledge`, { acknowledge: 'Accepted' }));
  ok(await crmApi(asp).post(`/jobs/${job._id}/pickup`, { action: 'assign-pickup', userId: pk._id }));
  ok(await crmApi(asp).post(`/jobs/${job._id}/pickup`, { action: 'received' }));
  ok(await crmApi(asp).post(`/jobs/${job._id}/reschedule`, { visitDate: '2026-12-01', visitTime: '11:00' }));
  ok(await crmApi(asp).post(`/jobs/${job._id}/assign`, { engineerId: ctx.engUser._id }));
  const ep = ok(await crmApi(asp).post(`/jobs/${job._id}/repair`, { repairStatus: 'Estimate Pending For Cost', serviceCharge: 250, estimateParts: [{ part: ctx.part._id, qty: 1, cost: 400, taxAmt: 72 }] }));
  assert.equal(ep.estimate.totalAmt, 722);
  const acc = ok(await crmApi(cc).post(`/jobs/${job._id}/estimate`, { decision: 'Accept' }));
  assert.equal(acc.subStatus, 'Estimation Accept');
  ok(await crmApi(asp).put(`/jobs/${job._id}`, { serialNo: 'EDITED-SN', editRemark: 'Typo' }));
  ok(await crmApi(asp).post(`/jobs/${job._id}/repair`, { repairStatus: 'Repair Done', closeType: 'Nothing', repairDetails: [{ faultCode: 'F01', repairCode: 'R01' }] }));
  const inv = ok(await crmApi(asp).post(`/jobs/${job._id}/invoice`, { serviceCharge: 250 }), 201);
  assert.equal(inv.docType, 'Retail Invoice');
  assert.equal(inv.grandTotal, 295);
  assert.equal((await crmApi(asp).post(`/jobs/${job._id}/invoice`, {})).status, 409);
  ok(await crmApi(asp).post(`/jobs/${job._id}/pickup`, { action: 'assign-delivery', userId: dl._id }));
  const done = ok(await crmApi(asp).post(`/jobs/${job._id}/pickup`, { action: 'delivered' }));
  assert.equal(done.subStatus, 'Set Delivered');
  const view = ok(await crmApi(cc).get(`/jobs/${job._id}`));
  assert.equal(view.serialNo, 'EDITED-SN');
  assert.ok(view.history.length >= 9);
  assert.equal((await crmApi(cc).post('/change-password', { oldPassword: 'wrong', newPassword: 'Newpass123!' })).status, 422);
  ok(await crmApi(cc).post('/change-password', { oldPassword: 'Password123!', newPassword: 'Newpass123!' }));
  await tokenOf('CC001', 'Newpass123!');
  ok(await crmApi(cc).post('/change-password', { oldPassword: 'Newpass123!', newPassword: 'Password123!' }));
});

test('stock documents: cancel returns stock, return receive + CN, reconciliation, PO cancel reopens PNA', async () => {
  const [cc, asp, wh] = [await tokenOf('CC001'), await tokenOf('PY0003'), await tokenOf('CWH47')];
  const whStock = async () => (ok(await crmApi(wh).get('/stock')).find((s) => String(s.part._id) === String(ctx.part._id)) || {}).fresh || 0;
  ok(await crmApi(wh).post('/grn/local', { shipTo: ctx.wh._id, items: [{ part: ctx.part._id, qty: 10, price: 100 }] }), 201);
  const before = await whStock();
  const inv = ok(await crmApi(wh).post('/dispatches', { docType: 'Invoice', toLocation: ctx.asp._id, items: [{ part: ctx.part._id, qty: 3 }] }), 201);
  assert.equal(await whStock(), before - 3);
  ok(await crmApi().post(`/dispatches/${inv._id}/cancel`, {}));
  assert.equal(await whStock(), before, 'cancel puts stock back');
  assert.equal((await crmApi().post(`/dispatches/${inv._id}/cancel`, {})).status, 422);
  ok(await crmApi(wh).post('/dispatches', { docType: 'Invoice', toLocation: ctx.asp._id, items: [{ part: ctx.part._id, qty: 2 }] }), 201);
  const inbound = ok(await crmApi(asp).get('/dispatches?docType=Invoice')).find((d) => d.status === 'Dispatched');
  ok(await crmApi(asp).post(`/dispatches/${inbound._id}/receive`, { remark: 'ok' }));
  const pr = ok(await crmApi(asp).post('/dispatches', { docType: 'Purchase Return', stockType: 'Fresh', toLocation: ctx.wh._id, items: [{ part: ctx.part._id, qty: 1, price: 100 }] }), 201);
  assert.equal((await crmApi(wh).post(`/dispatches/${pr._id}/cn`, {})).status, 422, 'CN only after receive');
  ok(await crmApi(wh).post(`/dispatches/${pr._id}/receive`, { remark: 'checked', items: [{ part: ctx.part._id, okQty: 0, damageQty: 1, missingQty: 0 }] }));
  ok(await crmApi(wh).post(`/dispatches/${pr._id}/cn`, {}));
  assert.equal((await crmApi(wh).post(`/dispatches/${pr._id}/cn`, {})).status, 409);
  const reco = ok(await crmApi(wh).get('/reconciliation'));
  assert.ok(reco.some((r) => r._id === pr._id));
  ok(await crmApi(wh).post(`/reconciliation/${pr._id}`, { action: 'damage-to-faulty' }));
  const job = ok(await crmApi(cc).post('/jobs', { customerName: 'PNA Cancel', contactNo: '9876533333', address: 'Q', state: 'Uttar Pradesh', city: 'Noida', pincode: '201301', assignLocation: ctx.asp._id, product: ctx.product._id, brand: ctx.brand._id, model: ctx.model._id, voc: 'Dead' }), 201);
  ok(await crmApi(asp).post(`/jobs/${job._id}/acknowledge`, { acknowledge: 'Accepted' }));
  ok(await crmApi(asp).post(`/jobs/${job._id}/assign`, { engineerId: ctx.engUser._id }));
  ok(await crmApi(asp).post(`/jobs/${job._id}/repair`, { repairStatus: 'Spare Part Unavailable', pendingParts: [{ part: ctx.part._id, qty: 1 }] }));
  const bucket = ok(await crmApi(asp).get('/pna-bucket')).filter((b) => b.jobNo === job.jobNo);
  const po = ok(await crmApi(asp).post('/pna-bucket/raise-po', { bucketIds: bucket.map((b) => b._id), toLocation: ctx.wh._id }), 201);
  ok(await crmApi(asp).post(`/po/${po._id}/cancel`, {}));
  const again = ok(await crmApi(asp).get('/pna-bucket')).filter((b) => b.jobNo === job.jobNo);
  assert.equal(again.length, 1, 'cancelled PO puts the part back in the PNA bucket');
  assert.equal((await crmApi(wh).post(`/po/${po._id}/dispatch`, {})).status, 422, 'cancelled PO cannot be dispatched');
});
