/**
 * SERVICE CRM DEMO SEED — local demo data for the Service panel (/distributor/service).
 *
 *  - Local only: refuses to run unless MONGODB_URI points at localhost / 127.0.0.1. Never run it on a server.
 *  - Re-uses the DMS demo masters (brands, product categories, states, cities, HSN) so both panels share them.
 *  - Every business record is created through the real Service CRM API (in-process), so numbering, stock,
 *    ledgers and job history are exactly what the app would produce.
 *
 *  LOCAL:  MONGODB_URI=mongodb://127.0.0.1:27999/ node scripts/crm-demo-seed.js
 *          Logins (password DmsDemo@123, local demo only): CRMADMIN (Admin) · ANJU (Call Center) · PY0003, PA0119 (ASP) · CWH47 (WH)
 *
 *  LIVE (server demo):  CRM_SEED_PASSWORD='<strong password>' node scripts/crm-demo-seed.js --live --confirm=<db name>
 *   - Uses the server's own MONGODB_URI / MONGODB_DB_NAME from backend/.env; --confirm must name that database.
 *   - Every demo login gets CRM_SEED_PASSWORD (10+ chars with upper, lower, digit and symbol). The public demo password is never used.
 *   - Refuses if any Service CRM user or job already exists, so real data is never mixed with demo data.
 *   - Writes crm_* collections, the demo locations/logins, and (only if missing) a minimal set of shared masters.
 *   - Clean-up later (before entering real Service data):  node scripts/crm-demo-seed.js --live --remove --confirm=<db name>
 *     Removes every crm_* collection, the demo logins and the demo locations / masters this seed created. It refuses if
 *     non-demo Service users exist.
 */
import express from 'express';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { env } from '../src/config/env.js';
import User from '../src/models/User.model.js';
import crmRoutes from '../src/crm/index.js';
import { errorHandler } from '../src/middleware/errorHandler.middleware.js';
import { DmsMaster, DmsHsn, DmsVendor, DmsLocation } from '../src/dms/models/master.models.js';
import { CrmUserProfile } from '../src/crm/models/crm.masters.js';
import { CrmJob } from '../src/crm/models/crm.job.js';

const LIVE = process.argv.includes('--live');
const REMOVE = process.argv.includes('--remove');
const URI = LIVE ? env.mongodbUri : process.env.MONGODB_URI || '';
const DB = LIVE ? env.mongodbDbName : process.env.DMS_DEMO_DB || 'dms_demo';
const PASSWORD = LIVE ? process.env.CRM_SEED_PASSWORD || '' : 'DmsDemo@123';
const DEMO_LOGINS = ['CRMADMIN', 'ANJU', 'PY0003', 'PA0119', 'CWH47', 'PY0003U1', 'PY0003U2', 'PY0003P1', 'PY0003D1', 'PA0119U1'];
const MANIFEST_ID = 'crm-demo-seed';
if (LIVE) {
  const confirm = (process.argv.find((a) => a.startsWith('--confirm=')) || '').slice('--confirm='.length);
  if (confirm !== DB) { console.error(`Live mode works on the server database "${DB}". Re-run with --confirm=${DB} to proceed.`); process.exit(1); }
  if (!REMOVE && !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{10,}$/.test(PASSWORD)) {
    console.error('Set CRM_SEED_PASSWORD: at least 10 characters with upper case, lower case, a digit and a symbol. The public demo password is never used on a server.');
    process.exit(1);
  }
} else {
  if (!/^mongodb:\/\/(127\.0\.0\.1|localhost)[:/]/.test(URI)) { console.error('Refusing to seed: MONGODB_URI must point at a local database (use --live on the server).'); process.exit(1); }
  if (DB === 'haion_erp') { console.error('Refusing to seed into haion_erp.'); process.exit(1); }
}
const created = { users: [], masters: [], hsns: [], vendors: [], locations: [] };
/** Remembers the non-crm_* records this seed created, so --remove can take exactly those away. */
async function saveManifest() {
  if (mongoose.connection.readyState !== 1) return;
  const col = mongoose.connection.collection('crm_demo_manifest');
  const cur = (await col.findOne({ _id: MANIFEST_ID })) || {};
  const merge = (k) => [...new Set([...(cur[k] || []), ...created[k]].map(String))].map((x) => new mongoose.Types.ObjectId(x));
  await col.updateOne({ _id: MANIFEST_ID }, { $set: { users: merge('users'), masters: merge('masters'), hsns: merge('hsns'), vendors: merge('vendors'), locations: merge('locations'), at: new Date() } }, { upsert: true });
}

const app = express();
app.use(express.json({ limit: '5mb' }));
app.use('/api/service-crm', crmRoutes);
app.use(errorHandler);

const tokens = {};
async function call(who, method, url, body, expected) {
  let r = request(app)[method](`/api/service-crm${url}`).set('Authorization', `Bearer ${tokens[who]}`);
  if (body !== undefined) r = r.send(body);
  const res = await r;
  const okCodes = expected ? [].concat(expected) : method === 'post' ? [200, 201] : [200];
  if (!okCodes.includes(res.status)) throw new Error(`${who} ${method.toUpperCase()} ${url} → ${res.status} ${JSON.stringify(res.body).slice(0, 300)}`);
  return res.body.data;
}
const tokenFor = async (loginId) => {
  const p = await CrmUserProfile.findOne({ loginId }).lean();
  return jwt.sign({ userId: p.user }, env.jwtAccessSecret, { expiresIn: '2h' });
};

async function removeDemo() {
  const others = await CrmUserProfile.find({ loginId: { $nin: DEMO_LOGINS } }).select('loginId').lean();
  if (others.length) { console.error(`Refusing to remove: ${others.length} non-demo Service users exist (e.g. ${others[0].loginId}). Remove them first or keep the demo data.`); process.exit(1); }
  const man = (await mongoose.connection.collection('crm_demo_manifest').findOne({ _id: MANIFEST_ID })) || {};
  const profiles = await CrmUserProfile.find({}).select('user').lean();
  const userIds = [...profiles.map((p) => p.user), ...(man.users || [])];
  const r = { users: (await User.deleteMany({ _id: { $in: userIds } })).deletedCount };
  r.locations = (await DmsLocation.deleteMany({ _id: { $in: man.locations || [] } })).deletedCount;
  r.masters = (await DmsMaster.deleteMany({ _id: { $in: man.masters || [] } })).deletedCount;
  r.hsns = (await DmsHsn.deleteMany({ _id: { $in: man.hsns || [] } })).deletedCount;
  r.vendors = (await DmsVendor.deleteMany({ _id: { $in: man.vendors || [] } })).deletedCount;
  const cols = (await mongoose.connection.db.listCollections().toArray()).map((c) => c.name).filter((n) => n.startsWith('crm_'));
  for (const c of cols) await mongoose.connection.db.dropCollection(c);
  console.log(`Service CRM demo data removed: ${cols.length} crm_* collections, ${r.users} users, ${r.locations} locations, ${r.masters} masters, ${r.hsns} HSN, ${r.vendors} suppliers.`);
}

async function main() {
  await mongoose.connect(URI, { dbName: DB });
  if (REMOVE) { await removeDemo(); await mongoose.disconnect(); return; }
  if (await CrmUserProfile.findOne({ loginId: 'CRMADMIN' })) { console.log('Service CRM demo data already exists — nothing to do.'); await mongoose.disconnect(); return; }
  if (LIVE && ((await CrmUserProfile.countDocuments()) || (await CrmJob.countDocuments()))) {
    console.error('Refusing to seed: this database already has Service CRM users or jobs. The demo seed only runs on an empty Service panel.');
    process.exit(1);
  }
  if (await User.findOne({ email: 'crmadmin@demo.haion.local' })) { console.error('A crmadmin@demo.haion.local user already exists without its Service profile. Run --remove first.'); process.exit(1); }

  // admin
  const admin = await User.create({ email: 'crmadmin@demo.haion.local', phone: `9${String(Date.now()).slice(-5)}${Math.floor(1000 + Math.random() * 9000)}`, password: await User.hashPassword(PASSWORD), firstName: 'Service', lastName: 'Admin', role: 'SERVICE_CENTER', isActive: true });
  created.users.push(admin._id);
  await CrmUserProfile.create({ user: admin._id, loginId: 'CRMADMIN', displayName: 'Service Admin', crmRole: 'Admin', userType: 'Admin', email: 'crmadmin@demo.haion.local' });
  tokens.admin = jwt.sign({ userId: admin._id }, env.jwtAccessSecret, { expiresIn: '2h' });

  // shared masters already present from the DMS demo
  // shared masters: reuse the DMS demo ones, or create a minimal set so this seed also runs on its own
  const ensure = async (type, name, extra = {}) => {
    const found = await DmsMaster.findOne({ type, name });
    if (found) return found;
    const doc = await DmsMaster.create({ type, name, status: 'Active', ...extra });
    created.masters.push(doc._id);
    return doc;
  };
  if (!(await DmsMaster.countDocuments({ type: 'brand' }))) for (const n of ['LAZER', 'CELLO']) await ensure('brand', n);
  if (!(await DmsMaster.countDocuments({ type: 'category' }))) for (const n of ['CEILING FANS', 'MIXER GRINDER', 'WATER HEATER']) await ensure('category', n);
  if (!(await DmsMaster.countDocuments({ type: 'state' }))) {
    const up = await ensure('state', 'Uttar Pradesh', { code: 'UP', attrs: { circle: 'NORTH' } });
    const dl = await ensure('state', 'Delhi', { code: 'DL', attrs: { circle: 'NORTH' } });
    await ensure('city', 'Noida', { parent: up._id }); await ensure('city', 'Lucknow', { parent: up._id }); await ensure('city', 'New Delhi', { parent: dl._id });
  }
  if (!(await DmsHsn.countDocuments())) created.hsns.push((await DmsHsn.create({ hsnCode: '8509', chapterNo: '85', description: 'Electro-mechanical domestic appliances', cgst: 9, sgst: 9, igst: 18 }))._id);
  const brands = await DmsMaster.find({ type: 'brand', status: 'Active' }).sort('name').limit(2).lean();
  const cats = await DmsMaster.find({ type: 'category', status: 'Active' }).sort('name').limit(3).lean();
  const states = await DmsMaster.find({ type: 'state', status: 'Active' }).lean();
  const cities = await DmsMaster.find({ type: 'city', status: 'Active' }).lean();
  const hsn = await DmsHsn.findOne({ status: 'Active' }).lean();
  if (!brands.length || !cats.length || !states.length) throw new Error('Run the DMS demo seed first (brands / categories / states are shared).');
  const cityOf = (stateName) => cities.find((c) => String(c.parent) === String(states.find((s) => s.name === stateName)?._id))?.name || cities[0]?.name || 'City';
  const [st1, st2] = [states[0].name, (states[1] || states[0]).name];

  // locations (each creates its own panel login)
  const loc = {};
  for (const [key, b] of Object.entries({
    wh: { locationType: 'WH', name: 'Haion Service WH', loginId: 'CWH47', state: st1, pincode: '201301', region: 'NORTH' },
    cc: { locationType: 'Call Center', name: 'Haion Call Centre', loginId: 'ANJU', state: st1, pincode: '201301', region: 'NORTH' },
    asp1: { locationType: 'ASP', name: 'TEST SERVICE', loginId: 'PY0003', state: st1, pincode: '201002', region: 'NORTH' },
    asp2: { locationType: 'ASP', name: 'A.N. ELECTRICALS', loginId: 'PA0119', state: st2, pincode: '226001', region: 'CENTRAL' },
  })) {
    loc[key] = await call('admin', 'post', '/shared/location', {
      ...b, city: cityOf(b.state), contactPerson: b.name, email: `${b.loginId.toLowerCase()}@demo.haion.local`, phone: `98${String(1e8 + Object.keys(loc).length * 1111).slice(0, 8)}`,
      billingAddress: `${b.name}, Main Road`, proprietorType: 'OWNED', panNo: 'ABCDE1234F', password: PASSWORD, country: 'India',
    }, 201);
    created.locations.push(loc[key]._id);
  }
  await saveManifest();
  for (const k of ['ANJU', 'PY0003', 'PA0119', 'CWH47']) tokens[k] = await tokenFor(k);

  // engineers / pickup / delivery (created by the ASP, as in the reference)
  for (const [lid, name, type] of [['PY0003U1', 'Santosh', 'Engineer'], ['PY0003U2', 'Mohit', 'Engineer'], ['PY0003P1', 'Raju Pickup', 'Pickup Boy'], ['PY0003D1', 'Sonu Delivery', 'Delivery boy']]) {
    await call('PY0003', 'post', '/users', { loginId: lid, displayName: name, password: PASSWORD, userType: type, phone: '9810000000' }, 201);
  }
  await call('PA0119', 'post', '/users', { loginId: 'PA0119U1', displayName: 'Manoj', password: PASSWORD, userType: 'Engineer' }, 201);
  const engs = await CrmUserProfile.find({ userType: { $in: ['Engineer', 'Pickup Boy', 'Delivery boy'] } }).lean();
  const eng = (lid) => engs.find((e) => e.loginId === lid);

  // CRM masters
  const M = (type, b) => call('admin', 'post', `/masters/${type}`, b, 201);
  for (const n of ['Amazon', 'Dealer', 'Distributor', 'Flipkart']) await M('purchaseFrom', { name: n });
  for (const n of ['Customer Not Available', 'Pending For Customer Confirmation', 'Pending For Approval From Brand', 'Repair In Progress', 'CUSTOMER NOT AGREE TO PAY']) await M('pendingReason', { name: n, code: n.slice(0, 3).toUpperCase() + n.length });
  for (const n of ['Satisfied', 'Not Satisfied', 'Call Not Picked']) await M('feedback', { name: n });
  for (const b of brands) {
    for (const c of cats) {
      for (const n of ['No Power On', 'Noise Problem', 'Not Working', 'Leakage', 'Installation']) await M('voc', { name: n, brand: b._id, product: c._id });
      for (const [code, n] of [['V0001', 'BREAKAGE'], ['V0002', 'BURN'], ['V0003', 'DEAD'], ['V0004', 'NOISE']]) await M('fault', { name: n, code, brand: b._id, product: c._id });
      for (const [code, n, rep] of [['R0001', 'Part Replaced', 'Yes'], ['R0002', 'Soldering / Adjustment', 'No'], ['R0003', 'Software Update', 'No'], ['R00065', 'Replacement', 'Yes']]) await M('repairAction', { name: n, code, brand: b._id, product: c._id, attrs: { partReplaceCheck: rep, repairFor: 'ALL' } });
      for (const [js, area, price] of [['Repair Done', 'Local', 300], ['Repair Done', 'Upcountry', 450], ['Installation Done', 'Local', 200], ['Demo Done', 'Local', 150], ['Replacement Done', 'Local', 250]]) {
        await M('claimRate', { name: `${js} ${area}`, brand: b._id, product: c._id, attrs: { aspPrice: price, partnerPrice: Math.round(price * 0.4), areaType: area, jobStatus: js, fromTat: 0, toTat: 48, claimPct: '80' } });
      }
    }
  }
  for (const [pin, area, a] of [['201002', 'Raj Nagar', loc.asp1], ['201301', 'Sector 62', loc.asp1], ['226001', 'Hazratganj', loc.asp2]]) await M('pincode', { name: area, code: pin, state: a.state, city: a.city, attrs: { aspId: a._id } });
  await M('holiday', { name: 'Republic Day', state: st1, attrs: { holidayType: 'National Holiday', date: '2027-01-26', weekDay: 'Tuesday' } });
  await M('accountHead', { name: 'Office Expenses', attrs: { nature: 'Debit' } });
  await M('accountSection', { name: 'Conveyance', attrs: { accountHead: 'Office Expenses', calcType: 'None' } });
  await M('voucherMaster', { name: 'Travel Voucher', attrs: { section: 'Conveyance' } });
  await M('bankAccount', { name: 'Haion Service Current A/c', attrs: { acType: 'Current', bankName: 'State Bank of India', ifsc: 'SBIN0000001', acNo: '00001234567', branch: 'Noida' } });
  await M('notice', { name: 'New spare price list', attrs: { message: 'Spare prices revised from 1st of the month.', from: '2026-11-01', to: '2026-12-31' } });

  // models + parts
  const models = [];
  let mi = 0;
  for (const b of brands) for (const c of cats) {
    for (const n of [1, 2]) {
      mi += 1;
      models.push(await call('admin', 'post', '/models', {
        modelCode: `M${String(mi).padStart(4, '0')}`, modelName: `${c.name} ${b.name} ${n === 1 ? 'Classic' : 'Pro'}`, product: c._id, brand: b._id,
        customerWarrantyDays: 365, repairWarrantyDays: 90, serviceCharges: 250, makeJob: true, repairable: true, outWarranty: true, releaseDate: '2025-01-01', terms: '1 year warranty from invoice date.',
      }, 201));
    }
  }
  const parts = [];
  let pi = 0;
  for (const m of models) {
    for (const [suffix, cat, price] of [['Motor', 'Component', 600], ['PCB', 'Component', 900], ['Cord', 'Accessory', 150]]) {
      pi += 1;
      parts.push(await call('admin', 'post', '/parts', {
        partcode: `P${String(pi).padStart(5, '0')}`, partName: `${suffix} ${m.modelName}`, product: m.product, brand: m.brand, models: [m._id], hsnCode: hsn?.hsnCode || '8509',
        purchasePrice: price, locationPrice: Math.round(price * 1.1), customerPrice: Math.round(price * 1.4), partCategory: cat, partFor: 'ALL', faultyDispatchToWh: cat !== 'Accessory', warrantyDays: 90, dealerWarrantyDays: 90,
      }, 201));
    }
  }

  // stock: vendor PO → approval → gate entry → GRN, plus a local GRN
  let vendor = await DmsVendor.findOne().lean();
  if (!vendor) {
    vendor = await call('admin', 'post', '/shared/supplier', { name: 'Motor Parts Pvt Ltd', phone: '9811100000', email: 'v@demo.haion.local', city: 'Delhi', state: 'Delhi', country: 'India', address: 'Okhla', billingAddress: 'Okhla' }, 201);
    created.vendors.push(vendor._id);
  }
  const vpo = await call('CWH47', 'post', '/po', { poType: 'VENDOR', supplier: vendor._id, fromLocation: loc.wh._id, toLocation: loc.wh._id, vendorType: 'Local', items: parts.map((p) => ({ part: p._id, reqQty: 40, price: p.purchasePrice })) }, 201);
  await call('admin', 'post', `/po/${vpo._id}/approve`, { decision: 'Approved' });
  await call('CWH47', 'post', '/grn/gate-entry', { poNo: vpo.poNo, vehicleNo: 'UP16AB1234', transportName: 'Safe Express' }, 201);
  const ge = (await call('CWH47', 'get', '/grn')).find((g) => g.poNo === vpo.poNo);
  await call('CWH47', 'post', `/grn/${ge._id}/receive`, { invoiceNo: 'VINV-1001', invoiceDate: new Date().toISOString().slice(0, 10), remark: 'Received in good condition' });
  await call('CWH47', 'post', '/grn/local', { supplier: vendor._id, shipTo: loc.wh._id, billTo: loc.wh._id, items: parts.slice(0, 4).map((p) => ({ part: p._id, qty: 10, price: p.purchasePrice })), remark: 'Local purchase' }, 201);
  // MSL stock to both ASPs
  for (const [who, a] of [['PY0003', loc.asp1], ['PA0119', loc.asp2]]) {
    const po = await call(who, 'post', '/po', { poType: 'MSL', toLocation: loc.wh._id, items: parts.slice(0, 6).map((p) => ({ part: p._id, reqQty: 5 })) }, 201);
    const d = await call('CWH47', 'post', `/po/${po._id}/dispatch`, { docType: 'Invoice', courierName: 'DTDC', docketNo: `DK${po.poNo}` }, 201);
    await call(who, 'post', `/dispatches/${d._id}/receive`, { remark: 'MSL received' });
    void a;
  }
  // engineer stock
  await call('PY0003', 'post', '/stock/issue-engineer', { engineerId: eng('PY0003U1')._id, issueType: 'Bulk Part issue', items: parts.slice(0, 3).map((p) => ({ part: p._id, qty: 2 })) }, 201);

  // jobs across the lifecycle
  const custs = [['Sunil Kumar Singh', '8826693947'], ['Rahul Sharma', '9876543210'], ['Priya Verma', '9811122233'], ['Amit Gupta', '9899988877'], ['Neha Singh', '9810011122'],
    ['Vikas Yadav', '9717171717'], ['Pooja Mehra', '9654321098'], ['Ravi Kumar', '9555512345'], ['Sanjay Jain', '9876001234'], ['Kavita Rao', '9810098100'], ['Arjun Das', '9711122334'], ['Meena Gupta', '9871234567']];
  const mk = async (i, extra = {}) => {
    const m = models[i % models.length];
    const a = extra.asp || loc.asp1;
    return call('ANJU', 'post', '/jobs', {
      customerName: custs[i][0], contactNo: custs[i][1], email: `${custs[i][0].split(' ')[0].toLowerCase()}@example.com`, address: `${100 + i}, Main Market`, landmark: 'Near Metro', state: a.state, city: a.city, pincode: a.pincode,
      customerCategory: 'Customer', assignLocation: a._id, product: m.product, brand: m.brand, model: m._id, serialNo: `SN${2026000 + i}`, purchaseDate: extra.purchaseDate || '2026-06-15',
      callType: extra.callType || 'Repair', callSource: 'Call Center', serviceType: extra.serviceType || 'DoorStep', vocs: ['No Power On'], remark: 'Customer called the helpline', purchaseFrom: 'Amazon', areaType: extra.areaType || 'Local',
    }, 201);
  };
  const J = [];
  for (let i = 0; i < 12; i += 1) J.push(await mk(i, i === 9 ? { asp: loc.asp2 } : i === 7 ? { purchaseDate: '2023-01-10' } : i === 6 ? { serviceType: 'Pick and Drop' } : i === 5 ? { callType: 'Installation' } : {}));
  const A = (j, who = 'PY0003') => ({ ack: () => call(who, 'post', `/jobs/${j._id}/acknowledge`, { acknowledge: 'Accepted', remark: 'Accepted' }),
    visit: () => call(who, 'post', `/jobs/${j._id}/appointment`, { visitDate: new Date().toISOString().slice(0, 10), visitTime: '15:30', approvedBy: 'Customer' }),
    assign: (e = 'PY0003U1') => call(who, 'post', `/jobs/${j._id}/assign`, { engineerId: eng(e)._id }),
    repair: (b) => call(who, 'post', `/jobs/${j._id}/repair`, b) });
  const partFor = (j) => parts.find((p) => String(p.models?.[0]) === String(j.model) || (p.models || []).some((x) => String(x) === String(j.model)));
  // J0, J1 stay Registered. J2 acknowledged. J3 appointment. J4 assigned.
  await A(J[2]).ack();
  await A(J[3]).ack(); await A(J[3]).visit();
  await A(J[4]).ack(); await A(J[4]).visit(); await A(J[4]).assign('PY0003U2');
  // J5 installation done + handover + happy call
  await A(J[5]).ack(); await A(J[5]).assign(); await A(J[5]).repair({ repairStatus: 'Installation Done', closeType: 'Invoice', closeDocNo: 'INV55', repairDetails: [{ faultCode: 'V0003', faultName: 'DEAD', repairCode: 'R0002', repairName: 'Soldering / Adjustment' }] });
  await call('PY0003', 'post', `/jobs/${J[5]._id}/handover`, { confirmBy: custs[5][0], contactNo: custs[5][1], remark: 'Installed', rating: 5 });
  await call('ANJU', 'post', `/jobs/${J[5]._id}/happy-call`, { remark: 'Satisfied', rating: 5 });
  // J6 pickup & drop received at ASP
  await A(J[6]).ack();
  await call('PY0003', 'post', `/jobs/${J[6]._id}/pickup`, { action: 'assign-pickup', userId: eng('PY0003P1')._id });
  await call('PY0003', 'post', `/jobs/${J[6]._id}/pickup`, { action: 'received' });
  // J7 OUT warranty: estimate pending
  await A(J[7]).ack(); await A(J[7]).assign();
  const p7 = partFor(J[7]);
  await A(J[7]).repair({ repairStatus: 'Estimate Pending For Cost', serviceCharge: 250, estimateParts: [{ part: p7._id, partcode: p7.partcode, partName: p7.partName, qty: 1, cost: p7.customerPrice, taxPct: 18, taxAmt: Math.round(p7.customerPrice * 18) / 100, total: p7.customerPrice * 1.18 }] });
  // J8 PNA → PO → WH dispatch → stock in (part received)
  await A(J[8]).ack(); await A(J[8]).assign();
  const p8 = parts[parts.length - 1];
  await A(J[8]).repair({ repairStatus: 'Spare Part Unavailable', pendingParts: [{ part: p8._id, qty: 1 }] });
  const b8 = (await call('PY0003', 'get', '/pna-bucket')).filter((x) => x.jobNo === J[8].jobNo);
  const po8 = await call('PY0003', 'post', '/pna-bucket/raise-po', { bucketIds: b8.map((x) => x._id), toLocation: loc.wh._id }, 201);
  const d8 = await call('CWH47', 'post', `/po/${po8._id}/dispatch`, { docType: 'Invoice', courierName: 'Blue Dart', docketNo: 'BD778899' }, 201);
  await call('PY0003', 'post', `/dispatches/${d8._id}/receive`, { remark: 'PNA part received' });
  // J10 another PNA left in the bucket (for the PNA bucket screen)
  await A(J[10]).ack(); await A(J[10]).assign();
  await A(J[10]).repair({ repairStatus: 'Spare Part Unavailable', pendingParts: [{ part: partFor(J[10])._id, qty: 1 }] });
  // J11 request for approval (replacement)
  await A(J[11]).ack(); await A(J[11]).assign();
  await A(J[11]).repair({ repairStatus: 'Request For Approval', requestFor: 'Replacement', remark: 'Motor burnt, unit not repairable' });
  // J1 → repair done with part from engineer stock, handed over
  await A(J[1]).ack(); await A(J[1]).assign();
  const p1 = parts.slice(0, 3).find((p) => (p.models || []).some((x) => String(x) === String(J[1].model))) || parts[0];
  await A(J[1]).repair({ repairStatus: 'Repair Done', closeType: 'Warranty Card', closeDocNo: 'WC1001', repairDetails: [{ faultCode: 'V0002', faultName: 'BURN', repairCode: 'R0001', repairName: 'Part Replaced', part: p1._id, qty: 1 }] });
  await call('PY0003', 'post', `/jobs/${J[1]._id}/handover`, { confirmBy: custs[1][0], contactNo: custs[1][1], remark: 'Working fine', rating: 4 });
  // J9 at second ASP: repair done
  await A(J[9], 'PA0119').ack(); await A(J[9], 'PA0119').assign('PA0119U1');
  await A(J[9], 'PA0119').repair({ repairStatus: 'Repair Done', closeType: 'Nothing', repairDetails: [{ faultCode: 'V0004', faultName: 'NOISE', repairCode: 'R0002', repairName: 'Soldering / Adjustment' }] });

  // money: payment, expense, claim
  const pay = await call('PY0003', 'post', '/payments', { toLocation: loc.wh._id, amount: 5000, mode: 'NEFT', bankName: 'State Bank of India', ddChequeNo: 'UTR998877' }, 201);
  await call('CWH47', 'post', `/payments/${pay._id}/receive`, { decision: 'Received' });
  await call('PY0003', 'post', '/expenses', { payeeName: 'Santosh', voucherType: 'Travel Voucher', billNo: 'TV-01', expenseDate: new Date().toISOString().slice(0, 10), items: [{ description: 'Field visit conveyance', amount: 350 }], attachment: '-' }, 201);
  const now = new Date();
  const claim = await call('admin', 'post', '/claims/generate', { month: now.getMonth() + 1, year: now.getFullYear(), locationId: loc.asp1._id, claimType: 'Labour' }, 201);
  await call('admin', 'post', `/claims/${claim._id}/approve`, {});

  const total = await CrmJob.countDocuments();
  console.log(`Service CRM demo ready: ${total} jobs, ${parts.length} parts, ${models.length} models.`);
  await saveManifest();
  console.log(LIVE
    ? 'Logins (password = CRM_SEED_PASSWORD): CRMADMIN · ANJU · PY0003 · PA0119 · CWH47. Remove later with --live --remove --confirm=<db>.'
    : 'Logins (password DmsDemo@123, local only): CRMADMIN · ANJU · PY0003 · PA0119 · CWH47');
  await mongoose.disconnect();
}

main().catch(async (e) => {
  console.error(e.message);
  await saveManifest().catch(() => {});
  if (created.locations.length) console.error('Partial demo data was written. Clean it with --remove (add --live --confirm=<db> on the server).');
  await mongoose.disconnect();
  process.exit(1);
});
