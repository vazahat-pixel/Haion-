/** Sale Force, General Query, App and HRMS flows. In-memory MongoDB only. */
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
const api = (t = adminTok) => ({
  get: (u) => request(app).get(`/api/dms${u}`).set('Authorization', `Bearer ${t}`),
  post: (u, b) => request(app).post(`/api/dms${u}`).set('Authorization', `Bearer ${t}`).send(b),
  put: (u, b) => request(app).put(`/api/dms${u}`).set('Authorization', `Bearer ${t}`).send(b),
});
const ok = (res, code = 200) => {
  assert.equal(res.status, code, `${res.req?.method} ${res.req?.path} → ${res.status} ${JSON.stringify(res.body)}`);
  return res.body.data;
};

before(async () => {
  if (mongoose.connection.readyState) await mongoose.disconnect();
  mem = await MongoMemoryServer.create();
  await mongoose.connect(mem.getUri(), { dbName: 'dms_ent_test' });
  const admin = await User.create({
    email: 'ent-admin@test.local', password: await User.hashPassword('Password123!'), firstName: 'E', lastName: 'A', phone: '9100000001', role: 'MASTER_ADMIN', isActive: true,
  });
  adminTok = jwt.sign({ userId: admin._id }, env.jwtAccessSecret, { expiresIn: '1h' });
  const a = api();
  const base = { state: 'Uttar Pradesh', stateCode: 'UP', city: 'Noida', billingAddress: 'B-32' };
  ctx.ho = ok(await a.post('/locations', { ...base, name: 'HO', locationType: 'Head Office', docPrefix: 'HO' }), 201);
  const mk = async (name, email, phone, pages) => {
    const p = ok(await a.post('/users', { displayName: name, email, phone, password: 'Password123!', userType: 'Location User', location: ctx.ho._id, pages }), 201);
    const login = await request(app).post('/api/auth/login').send({ email: p.loginId, password: 'Password123!' });
    return { profile: p, tok: login.body.data.accessToken };
  };
  ctx.emp = await mk('Emp One', 'emp1@test.local', '9100000002', ['e_leave', 'e_attendance', 'e_claims', 'home']);
  ctx.mgr = await mk('Mgr One', 'mgr1@test.local', '9100000003', ['hr_leave_approve', 'hr_claim_approve', 'home']);
});
after(async () => {
  await mongoose.disconnect();
  await mem?.stop();
});

test('schemas endpoint describes every entity type', async () => {
  const d = ok(await api().get('/entities/schemas'));
  assert.ok(d.types.lead && d.types.leave && d.types.salary);
  assert.equal(d.leadStatuses.length, 22);
});

test('lead → approve → quote shares the lead; validation + status rules', async () => {
  const a = api();
  const bad = await a.post('/entities/lead', { partyName: '', area: 'Agra', phone: '123' });
  assert.equal(bad.status, 422);
  assert.ok(bad.body.errors.partyName && bad.body.errors.phone);
  const lead = ok(await a.post('/entities/lead', { partyName: 'Shop A', area: 'Agra', priority: 'High', phone: '9876543210' }), 201);
  assert.equal(lead.docNo, 'LD00001');
  assert.equal(lead.status, 'Open');
  assert.equal((await a.post(`/entities/lead/${lead._id}/action`, { action: 'approve' })).status, 422, 'remark required');
  ok(await a.post(`/entities/lead/${lead._id}/action`, { action: 'approve', remark: 'good lead' }));
  assert.equal((await a.post(`/entities/lead/${lead._id}/action`, { action: 'approve', remark: 'again' })).status, 422, 'already approved');
  const brand = ok(await a.post('/masters/brand', { name: 'B' }), 201);
  const cat = ok(await a.post('/masters/category', { name: 'C' }), 201);
  ok(await a.post('/hsn', { hsnCode: '1111', cgst: 9, sgst: 9 }), 201);
  ctx.prod = ok(await a.post('/products', { productCode: 'P1', name: 'Prod 1', category: cat._id, brand: brand._id, hsnCode: '1111' }), 201);
  const q = ok(await a.post('/entities/quote', { lead: lead._id, partyName: 'Shop A', lines: [{ product: ctx.prod._id, qty: 2, price: 100, discountPerUnit: 10 }] }), 201);
  assert.equal(q.data.lines[0].total, 180);
  const l2 = ok(await a.get(`/entities/lead/${lead._id}`));
  assert.equal(l2.status, 'Quote Shared');
  assert.equal((await a.post('/entities/quote', { partyName: 'X', lines: [] })).status, 422);
  ok(await a.post(`/entities/lead/${lead._id}/action`, { action: 'setStatus', status: 'Won', remark: 'order' }));
  const dash = ok(await a.get('/x/dash-lead'));
  assert.equal(dash.conversion[0].lead, 1);
  assert.equal(dash.conversion[0].order, 1);
});

test('HRMS: leave balance, overlap, own-approval block, approver flow', async () => {
  const a = api();
  const lt = ok(await a.post('/entities/leavetype', { typeOfLeave: 'Casual', noOfDays: 3 }), 201);
  assert.equal((await a.post('/entities/leavetype', { typeOfLeave: 'casual', noOfDays: 5 })).status, 409, 'unique ignoring case');
  const e = api(ctx.emp.tok);
  const l1 = ok(await e.post('/entities/leave', { leaveType: lt._id, fromDate: '2026-12-01', toDate: '2026-12-02', purpose: 'trip' }), 201);
  assert.equal(l1.data.duration, 2);
  assert.equal((await e.post('/entities/leave', { leaveType: lt._id, fromDate: '2026-12-02', toDate: '2026-12-03', purpose: 'x' })).status, 422, 'overlap');
  assert.equal((await e.post('/entities/leave', { leaveType: lt._id, fromDate: '2026-12-10', toDate: '2026-12-12', purpose: 'x' })).status, 422, 'balance 2+3>3');
  assert.equal((await e.post('/entities/leave', { leaveType: lt._id, fromDate: '2026-12-05', toDate: '2026-12-04', purpose: 'x' })).status, 422, 'date order');
  assert.equal((await e.post(`/entities/leave/${l1._id}/action`, { action: 'approve', remark: 'self' })).status, 403);
  assert.equal((await e.get('/entities/leave')).status, 403, 'employee cannot list all');
  assert.equal(ok(await e.get('/entities/leave?view=mine')).length, 1);
  const m = api(ctx.mgr.tok);
  assert.equal(ok(await m.get('/entities/leave?queue=approval')).length, 1);
  ok(await m.post(`/entities/leave/${l1._id}/action`, { action: 'approve', remark: 'enjoy' }));
  assert.equal((await e.put(`/entities/leave/${l1._id}`, { leaveType: lt._id, fromDate: '2026-12-01', toDate: '2026-12-01', purpose: 'edit' })).status, 422);
  ctx.lt = lt;
});

test('attendance punch rules and salary generation (LOP, holiday, duplicates)', async () => {
  const a = api();
  const e = api(ctx.emp.tok);
  assert.equal((await e.post('/entities/attendance-punch', { kind: 'out' })).status, 422, 'must log in first');
  ok(await e.post('/entities/attendance-punch', { kind: 'in', address: 'Office' }), 201);
  assert.equal((await e.post('/entities/attendance-punch', { kind: 'in' })).status, 422, 'double login');
  ok(await e.post('/entities/attendance-punch', { kind: 'out', address: 'Office' }));
  assert.equal((await e.post('/entities/attendance-punch', { kind: 'out' })).status, 422);
  assert.ok(ok(await e.get('/entities/attendance-today')).data.outAt);
  assert.equal((await api(ctx.mgr.tok).post('/entities/attendance-punch', { kind: 'in' })).status, 403, 'no attendance right');

  const emp = ok(await a.post('/entities/employee', {
    name: 'Emp One', phone: '9100000002', joiningDate: '2026-01-01', loginId: ctx.emp.profile.loginId, basicSalary: 30000, hra: 6000, allowances: 4000, pfPercent: 12,
  }), 201);
  assert.equal(emp.docNo, 'EMP0001');
  assert.equal((await a.post('/entities/employee', { name: 'Dup', phone: '9100000009', joiningDate: '2026-01-01', loginId: ctx.emp.profile.loginId })).status, 409, 'login id unique');
  ok(await a.post('/entities/holiday', { date: '2026-12-25', description: 'Christmas' }), 201);
  assert.equal((await a.post('/entities/salary-generate', { employee: emp._id, month: 'Nope', year: 2026 })).status, 422);
  const s = ok(await a.post('/entities/salary-generate', { employee: emp._id, month: 'December', year: 2026, bonus: 1000 }), 201);
  // Dec 2026: 31 days, 4 Sundays, 1 holiday (25th) → 26 working days; 2 approved leave days; no December attendance
  assert.equal(s.data.workingDays, 26);
  assert.equal(s.data.leaveDays, 2);
  assert.equal(s.data.lopDays, 24);
  assert.equal(s.data.gross, 40000);
  assert.equal(s.data.pf, 3600);
  assert.equal(s.data.lopDeduction, Math.round((40000 / 26) * 24 * 100) / 100);
  assert.equal((await a.post('/entities/salary-generate', { employee: emp._id, month: 'December', year: 2026 })).status, 409, 'duplicate month');
  assert.equal((await api(ctx.emp.tok).get('/entities/salary?view=mine')).status, 403, 'no e_salary right');
});

test('beat upload is all-or-nothing; deviation approval changes the beat', async () => {
  const a = api();
  const badUp = await a.post('/entities/beat-upload', {
    rows: [{ loginId: ctx.emp.profile.loginId, date: '2026-12-01', task: 'Dealer Visit', area: 'Agra' }, { loginId: 'NOPE', date: '2026-12-01', task: 'Dealer Visit', area: 'X' }],
  });
  assert.equal(badUp.status, 422);
  assert.equal(ok(await a.get('/entities/beat')).length, 0, 'nothing created on error');
  ok(await a.post('/entities/beat-upload', { rows: [{ loginId: ctx.emp.profile.loginId, date: '2026-12-01', task: 'Dealer Visit', area: 'Agra' }] }), 201);
  const [beat] = ok(await a.get('/entities/beat'));
  const dev = ok(await a.post(`/entities/beat/${beat._id}/deviate`, { changeVisit: 'Mathura', requestRemark: 'closed' }), 201);
  assert.equal((await a.post(`/entities/beat/${beat._id}/deviate`, { changeVisit: 'X', requestRemark: 'y' })).status, 409, 'one pending');
  ok(await a.post(`/entities/deviation/${dev._id}/action`, { action: 'approve', remark: 'ok' }));
  assert.equal(ok(await a.get(`/entities/beat/${beat._id}`)).data.area, 'Mathura');
});

test('expense, query reply, tada approval, serial activation, collection, report guards', async () => {
  const a = api();
  assert.equal((await a.post('/entities/expense', { location: ctx.ho._id, amount: 0, expenseDate: '2026-11-01', paymentMode: 'Cash' })).status, 422);
  const ex = ok(await a.post('/entities/expense', { location: ctx.ho._id, amount: 500, expenseDate: '2026-11-01', paymentMode: 'Cash', narration: 'tea' }), 201);
  assert.equal(ex.docNo, 'EXP00001');
  assert.equal((await a.put(`/entities/expense/${ex._id}`, {})).status, 400, 'expenses are not editable');
  const qy = ok(await a.post('/entities/query', { module: 'PO', problemType: 'Bug', problem: 'x' }), 201);
  ok(await a.post(`/entities/query/${qy._id}/action`, { action: 'reply', remark: 'fixed' }));
  assert.equal(ok(await a.get(`/entities/query/${qy._id}`)).status, 'Replied');
  const td = ok(await a.post('/entities/tada', { date: '2026-11-02', fromPlace: 'A', toPlace: 'B', travelAmount: 100, daAmount: 50 }), 201);
  assert.equal(td.data.amount, 150);
  ok(await a.post(`/entities/tada/${td._id}/action`, { action: 'reject', remark: 'no bill' }));

  ok(await a.post('/invoices', { kind: 'OPENING', from: ctx.ho._id, lines: [{ product: ctx.prod._id, qty: 2, price: 10, serials: ['ZS1', 'ZS2'] }] }), 201);
  const act = ok(await a.post('/x/serial-activate', { product: ctx.prod._id, serials: ['zs1', 'NOPE'] }));
  assert.equal(act.activated, 1);
  assert.equal(act.unknownCount, 1);
  assert.equal(ok(await a.post('/x/serial-activate', { product: ctx.prod._id, serials: ['ZS1'] })).alreadyActive, 1);
  assert.equal(ok(await a.get('/x/serial-activation')).length, 1);
  assert.equal((await a.get('/x/collection')).status, 422);
  assert.equal((await a.get('/x/payment-status?type=Payable')).status, 422);
  ok(await a.get(`/x/collection?date=2026-11-19&location=${ctx.ho._id}`));
  ok(await a.get('/x/dash-yearly?year=2026'));
  ok(await a.post('/x/delivery-bulk', { rows: [{ fromCity: 'Agra', toCity: 'Delhi', category: 'MOBILE', days: 2 }] }), 201);
  assert.equal((await a.post('/x/delivery-bulk', { rows: [{ fromCity: 'A', toCity: 'B', category: 'C', days: -1 }] })).status, 422);
  assert.equal((await api(ctx.emp.tok).get('/x/isd')).status, 403);
});

test('attrs masters validate: coupon dates, tax percent, specification enrichment', async () => {
  const a = api();
  assert.equal((await a.post('/masters/coupon', { name: 'C1', attrs: { amount: 10, validFrom: '2026-05-02', validTo: '2026-05-01' } })).status, 422);
  ok(await a.post('/masters/coupon', { name: 'C1', attrs: { amount: 10, validFrom: '2026-05-01', validTo: '2026-05-02' } }), 201);
  assert.equal((await a.post('/masters/othertax', { name: 'T', attrs: { percent: 120 } })).status, 422);
  const spec = ok(await a.post('/masters/specification', { name: 'x', attrs: { product: ctx.prod._id, specs: 'RAM: 4GB' } }), 201);
  assert.equal(spec.attrs.productLabel, 'Prod 1 | P1');
  assert.equal(spec.attrs.brandName, 'B');
});

test('mobile: selfie upload, offline punch time window, assigned user updates own task', async () => {
  const e = api(ctx.emp.tok);
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
  const up = await request(app).post('/api/dms/entities/attendance-photo').set('Authorization', `Bearer ${ctx.emp.tok}`).attach('photo', png, { filename: 'selfie.png', contentType: 'image/png' });
  assert.equal(up.status, 201, JSON.stringify(up.body));
  assert.match(up.body.data.url, /^\/uploads\/.+\.png$/);
  const exe = await request(app).post('/api/dms/entities/attendance-photo').set('Authorization', `Bearer ${ctx.emp.tok}`).attach('photo', Buffer.from('MZ'), { filename: 'x.exe', contentType: 'application/x-msdownload' });
  assert.equal(exe.status, 422, 'non-image refused');
  assert.equal((await request(app).post('/api/dms/entities/attendance-photo').set('Authorization', `Bearer ${ctx.mgr.tok}`).attach('photo', png, { filename: 's.png', contentType: 'image/png' })).status, 403);
  const old = new Date(Date.now() - 30 * 3600000).toISOString();
  assert.equal((await e.post('/entities/attendance-punch', { kind: 'in', capturedAt: old })).status, 422, 'older than 24h refused');
  const future = new Date(Date.now() + 3600000).toISOString();
  assert.equal((await e.post('/entities/attendance-punch', { kind: 'in', capturedAt: future })).status, 422, 'future refused');

  const a = api();
  const task = ok(await a.post('/entities/apptask', { taskName: 'Collect cheque', subject: 'Shop A', assignedTo: ctx.emp.profile._id }), 201);
  assert.equal((await api(ctx.emp.tok).get('/entities/apptask?view=mine')).status, 403, 'needs the my_beat (field) right');
  const { DmsProfile } = await import('../src/dms/models/master.models.js');
  await DmsProfile.updateOne({ _id: ctx.emp.profile._id }, { $addToSet: { pages: 'my_beat' } });
  const mine = await api(ctx.emp.tok).get('/entities/apptask?view=mine');
  assert.equal(mine.status, 200);
  assert.equal(mine.body.data.length, 1);
  ok(await api(ctx.emp.tok).post(`/entities/apptask/${task._id}/action`, { action: 'setStatus', status: 'Done' }));
  assert.equal(ok(await a.get(`/entities/apptask/${task._id}`)).status, 'Done');
});
