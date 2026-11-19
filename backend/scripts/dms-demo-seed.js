/**
 * DMS DEMO SEED — synthetic, interconnected demo data for the Distributor DMS (Jan-2025 → Nov-2026).
 *
 * SAFETY
 *  - Refuses to run unless MONGODB_URI points at localhost / 127.0.0.1.
 *  - Writes ONLY to the isolated database `dms_demo` (override with DMS_DEMO_DB) and only to `dms_*`
 *    collections plus users whose e-mail ends with @demo.haion.local. The Haion production DB is never touched.
 *  - Idempotent: if the demo is already seeded it stops. `--reset` wipes the demo data first (dms_* collections
 *    and @demo.haion.local users in the demo DB), then re-seeds.
 *
 * HOW IT WORKS
 *  All business data is created through the real DMS API handlers (in-process, with role tokens), so numbering,
 *  stock, serials, tax, ledger and approvals follow the same rules as the application. Timestamps are then moved to
 *  the historical date of each step, so reports, aging and financial-year numbering look like a running business.
 *
 *  Run:   MONGODB_URI=mongodb://127.0.0.1:27999/ node scripts/dms-demo-seed.js [--reset]
 *  Start: MONGODB_URI=mongodb://127.0.0.1:27999/ MONGODB_DB_NAME=dms_demo node src/server.js
 *
 *  All people, phone numbers and addresses are synthetic. Demo password for every account: DmsDemo@123
 */
import express from 'express';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { env } from '../src/config/env.js';
import User from '../src/models/User.model.js';
import dmsRoutes from '../src/dms/index.js';
import { errorHandler } from '../src/middleware/errorHandler.middleware.js';
import { DmsEntity } from '../src/dms/models/entity.model.js';
import * as TX from '../src/dms/models/txn.models.js';

const URI = process.env.MONGODB_URI || '';
const DB = process.env.DMS_DEMO_DB || 'dms_demo';
const RESET = process.argv.includes('--reset');
const PASSWORD = 'DmsDemo@123';
const DOMAIN = '@demo.haion.local';

if (!/^mongodb:\/\/(127\.0\.0\.1|localhost)[:/]/.test(URI)) { console.error('Refusing to seed: MONGODB_URI must point at a local database.'); process.exit(1); }
if (DB === 'haion_erp') { console.error('Refusing to seed into haion_erp. Use the isolated demo database.'); process.exit(1); }

/* ───────────── plumbing ───────────── */
const sapp = express();
sapp.use(express.json({ limit: '5mb' }));
sapp.use('/api/dms', dmsRoutes);
sapp.use(errorHandler);

let rngState = 20261119;
const rnd = () => { rngState |= 0; rngState = (rngState + 0x6d2b79f5) | 0; let t = Math.imul(rngState ^ (rngState >>> 15), 1 | rngState); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
const pad = (n, w = 2) => String(n).padStart(w, '0');
const r2 = (n) => Math.round(n * 100) / 100;

async function call(tok, method, url, body, expected) {
  let r = request(sapp)[method](`/api/dms${url}`).set('Authorization', `Bearer ${tok}`);
  if (body !== undefined) r = r.send(body);
  const res = await r;
  const okCodes = expected ? [].concat(expected) : method === 'post' ? [200, 201] : [200];
  if (!okCodes.includes(res.status)) throw new Error(`${method.toUpperCase()} ${url} → ${res.status} ${JSON.stringify(res.body).slice(0, 400)}`);
  return res.body.data;
}

/** Move everything touched since `t0` to the historical moment `when` (parallel, index-assisted). */
let tick = 0;
const PATCH = {
  dms_invoices: [['createdAt', 'updatedAt', 'invoiceDate', 'receiving.at', 'logistic.updatedAt'], ['actions']],
  dms_purchase_orders: [['createdAt', 'updatedAt', 'poDate'], ['actions']],
  dms_payments: [['createdAt', 'updatedAt', 'approveAt'], []],
  dms_ledger: [['createdAt', 'updatedAt', 'txnDate'], []],
  dms_stock_ledger: [['createdAt', 'updatedAt'], []],
  dms_stock: [['lastInAt', 'updatedAt'], []],
  dms_serials: [['updatedAt'], ['history']],
  dms_entities: [['createdAt', 'updatedAt'], ['actions']],
  dms_masters: [['createdAt', 'updatedAt'], []], dms_products: [['createdAt', 'updatedAt'], []], dms_locations: [['createdAt', 'updatedAt'], []],
  dms_vendors: [['createdAt', 'updatedAt'], []], dms_customers: [['createdAt', 'updatedAt'], []], dms_prices: [['createdAt', 'updatedAt'], []],
  dms_schemes: [['createdAt', 'updatedAt'], []], dms_hsn: [['createdAt', 'updatedAt'], []], dms_profiles: [['createdAt', 'updatedAt'], []],
};
async function ensureIndexes() {
  await Promise.all(Object.keys(PATCH).map((c) => mongoose.connection.db.collection(c).createIndex({ updatedAt: 1 })));
}
async function backdate(t0, dateIso) {
  const when = new Date(`${dateIso}T05:30:00.000Z`);
  when.setTime(when.getTime() + (tick++ % 50000) * 1000);
  const db = mongoose.connection.db;
  await Promise.all(Object.entries(PATCH).map(async ([col, [fields, arrays]]) => {
    const c = db.collection(col);
    const ids = (await c.find({ updatedAt: { $gte: t0 } }, { projection: { _id: 1 } }).toArray()).map((x) => x._id);
    if (!ids.length) return;
    await Promise.all([
      ...fields.map((f) => c.updateMany({ _id: { $in: ids }, [f]: { $gte: t0 } }, { $set: { [f]: when } })),
      ...arrays.map((a) => c.updateMany({ _id: { $in: ids } }, { $set: { [`${a}.$[x].at`]: when } }, { arrayFilters: [{ 'x.at': { $gte: t0 } }] })),
    ]);
  }));
}
async function at(dateIso, fn) {
  const t0 = new Date();
  await new Promise((r) => setTimeout(r, 3));
  const out = await fn();
  await backdate(t0, dateIso);
  return out;
}

/* ───────────── reference data ───────────── */
const PAGES = {
  ho: ['home', 'dash_yearly', 'dash_monthly', 'dash_inventory', 'dash_po', 'dash_sale', 'dash_lead', 'm_customer', 'm_price', 'm_scheme', 'm_product', 'm_vendor',
    'r_collection', 'r_inventory', 'r_aging', 'r_ledger', 'r_party_master', 'r_payment', 'r_po', 'r_return', 'r_sale', 'r_serial_activation', 'r_stock_ledger', 'r_vendor', 'r_isd', 'r_price_drop',
    'dispatch', 'corporate', 'serial_track_multi', 'retail', 'serial_track', 'stock_transfer', 'stock_transfer_approval', 'stn_distribution', 'jobwork', 'local_purchase', 'opening', 'po', 'po_approval', 'vendor_po',
    'customer_return', 'purchase_return', 'return_approval', 'vendor_return', 'payment_approval', 'payment_receive', 'acc_adjust', 'receive', 'receive_jobwork',
    'lead', 'quote', 'target', 'pjp', 'beat_sched', 'deviation', 'expense', 'query', 'app_feedback', 'app_task', 'app_track', 'attendance_report', 'tada_approval',
    'hr_activities', 'hr_application_approve', 'hr_attendance', 'hr_claim_approve', 'hr_claims', 'hr_department', 'hr_designation', 'hr_employee', 'hr_holiday', 'hr_leave_approve', 'hr_leave_master',
    'hr_myteams', 'hr_notice', 'hr_policies', 'hr_projects', 'hr_resign', 'hr_salary_gen', 'hr_salary_sheet', 'rp_other', 'm_serial_activation'],
  branch: ['home', 'dash_inventory', 'dash_po', 'dash_sale', 'dash_lead', 'po', 'po_approval', 'corporate', 'dispatch', 'receive', 'retail', 'payment_receive', 'payment_approval', 'stock_transfer', 'stock_transfer_approval',
    'purchase_return', 'return_approval', 'customer_return', 'serial_track', 'r_inventory', 'r_aging', 'r_ledger', 'r_sale', 'r_po', 'r_stock_ledger', 'r_collection', 'r_payment', 'r_isd', 'm_customer',
    'lead', 'quote', 'target', 'pjp', 'deviation', 'expense', 'query', 'app_feedback', 'app_task', 'tada_approval', 'hr_leave_approve', 'hr_claim_approve', 'hr_application_approve', 'hr_myteams',
    'my_beat', 'e_attendance', 'e_leave', 'e_claims', 'e_activities', 'e_profile', 'e_policies', 'e_salary', 'e_tada', 'e_application', 'e_documents', 'e_resign', 'attendance_report'],
  dealer: ['home', 'dash_sale', 'dash_inventory', 'po', 'receive', 'retail', 'customer_return', 'payment_receive', 'serial_track', 'r_inventory', 'r_ledger', 'r_sale', 'r_stock_ledger', 'm_customer',
    'lead', 'quote', 'expense', 'query', 'app_feedback', 'app_track', 'my_beat', 'e_attendance', 'e_leave', 'e_claims', 'e_activities', 'e_profile', 'e_policies', 'e_salary', 'e_tada', 'e_application', 'e_documents', 'e_resign'],
};

const LOCS = [
  { k: 'ho', name: 'Haion Distribution HQ', type: 'Head Office', state: 'Uttar Pradesh', sc: 'UP', city: 'Noida', pre: 'HQN', region: 'NORTH', credit: 0, addr: 'Plot 14, Sector 63, Noida' },
  { k: 'agra', name: 'Haion Branch Agra', type: 'Branch', state: 'Uttar Pradesh', sc: 'UP', city: 'Agra', pre: 'AGR', parent: 'ho', region: 'NORTH', credit: 6000000, addr: 'Sanjay Place, Agra' },
  { k: 'jaipur', name: 'Haion Branch Jaipur', type: 'Branch', state: 'Rajasthan', sc: 'RJ', city: 'Jaipur', pre: 'JPR', parent: 'ho', region: 'NORTH', credit: 6000000, addr: 'Malviya Nagar, Jaipur' },
  { k: 'lucknow', name: 'Haion Branch Lucknow', type: 'Branch', state: 'Uttar Pradesh', sc: 'UP', city: 'Lucknow', pre: 'LKO', parent: 'ho', region: 'NORTH', credit: 6000000, addr: 'Hazratganj, Lucknow' },
  { k: 'mumbai', name: 'Haion Branch Mumbai', type: 'Branch', state: 'Maharashtra', sc: 'MH', city: 'Mumbai', pre: 'MUM', parent: 'ho', region: 'WEST', credit: 8000000, addr: 'Andheri East, Mumbai' },
  { k: 'kma', name: 'Krishna Mobiles', type: 'Dealer', state: 'Uttar Pradesh', sc: 'UP', city: 'Agra', pre: 'KMA', parent: 'agra', region: 'NORTH', credit: 1500000, addr: 'Kinari Bazar, Agra' },
  { k: 'sdm', name: 'Sharma Distributors', type: 'Distributor', state: 'Uttar Pradesh', sc: 'UP', city: 'Mathura', pre: 'SDM', parent: 'agra', region: 'NORTH', credit: 2000000, addr: 'Holi Gate, Mathura' },
  { k: 'pct', name: 'Pink City Telecom', type: 'Dealer', state: 'Rajasthan', sc: 'RJ', city: 'Jaipur', pre: 'PCT', parent: 'jaipur', region: 'NORTH', credit: 1500000, addr: 'MI Road, Jaipur' },
  { k: 'rrj', name: 'Rajputana Retail', type: 'Retailer', state: 'Rajasthan', sc: 'RJ', city: 'Jaipur', pre: 'RRJ', parent: 'jaipur', region: 'NORTH', credit: 800000, addr: 'Vaishali Nagar, Jaipur' },
  { k: 'nwb', name: 'Nawab Electronics', type: 'Dealer', state: 'Uttar Pradesh', sc: 'UP', city: 'Lucknow', pre: 'NWB', parent: 'lucknow', region: 'NORTH', credit: 1500000, addr: 'Aminabad, Lucknow' },
  { k: 'gmc', name: 'Gomti Communications', type: 'Dealer', state: 'Uttar Pradesh', sc: 'UP', city: 'Lucknow', pre: 'GMC', parent: 'lucknow', region: 'NORTH', credit: 1500000, addr: 'Gomti Nagar, Lucknow' },
  { k: 'bmh', name: 'Bandra Mobile Hub', type: 'Dealer', state: 'Maharashtra', sc: 'MH', city: 'Mumbai', pre: 'BMH', parent: 'mumbai', region: 'WEST', credit: 2000000, addr: 'Linking Road, Bandra, Mumbai' },
  { k: 'adg', name: 'Andheri Digital Point', type: 'Dealer', state: 'Maharashtra', sc: 'MH', city: 'Mumbai', pre: 'ADG', parent: 'mumbai', region: 'WEST', credit: 2000000, addr: 'Lokhandwala, Andheri, Mumbai' },
];
const DEALERS = LOCS.filter((l) => l.parent && l.parent !== 'ho').map((l) => l.k);
const BRANCHES = ['agra', 'jaipur', 'lucknow', 'mumbai'];
const BRANCH_OF = Object.fromEntries(LOCS.filter((l) => l.parent).map((l) => [l.k, l.parent]));
const PEOPLE = {
  ho: ['Rohit Malhotra', 'Sales Head'], agra: ['Anil Kapoor', 'Area Sales Manager'], jaipur: ['Neha Rathore', 'Area Sales Manager'], lucknow: ['Imran Siddiqui', 'Area Sales Manager'], mumbai: ['Karan Deshmukh', 'Area Sales Manager'],
  kma: ['Vikas Gupta', 'Sales Executive'], sdm: ['Pankaj Sharma', 'Sales Executive'], pct: ['Deepak Meena', 'Sales Executive'], rrj: ['Sunita Shekhawat', 'Sales Executive'],
  nwb: ['Faizan Ali', 'Sales Executive'], gmc: ['Ritu Srivastava', 'Sales Executive'], bmh: ['Aditya Kulkarni', 'Sales Executive'], adg: ['Pooja Naik', 'Sales Executive'],
};

// code, name, category, brand, color, hsn, serialized, mrp, hsnRate
const PRODUCTS = [
  ['PH-X1', 'Haion X1 128GB', 'MOBILE', 'Haion', 'BLACK', '85171300', 1, 14999, 120], ['PH-X1B', 'Haion X1 128GB', 'MOBILE', 'Haion', 'BLUE', '85171300', 1, 14999, 120],
  ['PH-Z2', 'Volta Z2 256GB', 'MOBILE', 'Volta', 'GREY', '85171300', 1, 24999, 120], ['PH-Z2P', 'Volta Z2 Pro 256GB', 'MOBILE', 'Volta', 'BLACK', '85171300', 1, 39999, 120],
  ['TV-43', 'Zenx 43 inch Smart LED TV', 'LED TV', 'Zenx', 'BLACK', '85287200', 1, 22999, 365], ['AC-15', 'Zenx 1.5 Ton Split AC', 'Split AC', 'Zenx', 'WHITE', '84151010', 1, 31999, 365],
  ['CH-20W', 'Haion 20W Fast Charger', 'MOBILE ACCESSORIES', 'Haion', 'WHITE', '85044030', 0, 599, 180], ['CB-C1', 'Haion Type-C Cable 1m', 'MOBILE ACCESSORIES', 'Haion', 'BLACK', '85444299', 0, 249, 90],
  ['EP-B1', 'Haion Buds B1 Earbuds', 'MOBILE ACCESSORIES', 'Haion', 'BLACK', '85183000', 0, 1499, 180], ['PB-10K', 'Volta Power Bank 10000mAh', 'MOBILE ACCESSORIES', 'Volta', 'BLACK', '85076000', 0, 999, 180],
  ['CS-X1', 'Haion X1 Back Case', 'MOBILE ACCESSORIES', 'Haion', 'NONE', '39269099', 0, 199, 30], ['SG-X1', 'Tempered Glass X1', 'MOBILE ACCESSORIES', 'Haion', 'NONE', '70071900', 0, 149, 30],
  ['SP-BT', 'Zenx Bluetooth Speaker', 'IT ACCESSORIES', 'Zenx', 'BLACK', '85182200', 0, 1799, 180], ['PD-32', 'Volta 32GB Pen Drive', 'IT ACCESSORIES', 'Volta', 'RED', '85234910', 0, 449, 365],
];
const HSNS = [['85171300', 'Smartphones', 9, 9, 18], ['85287200', 'Television receivers', 14, 14, 28], ['84151010', 'Air conditioning machines', 14, 14, 28], ['85044030', 'Chargers / static converters', 9, 9, 18],
  ['85444299', 'Cables with connectors', 9, 9, 18], ['85183000', 'Headphones / earphones', 9, 9, 18], ['85076000', 'Lithium-ion batteries', 9, 9, 18], ['39269099', 'Plastic articles', 9, 9, 18],
  ['70071900', 'Toughened glass', 9, 9, 18], ['85182200', 'Loudspeakers', 9, 9, 18], ['85234910', 'Flash drives', 9, 9, 18]];
const FIRST = ['Aarav', 'Vivaan', 'Aditya', 'Rahul', 'Ankit', 'Rohan', 'Saurabh', 'Manish', 'Priya', 'Neha', 'Anjali', 'Kavita', 'Sneha', 'Pooja', 'Ritu', 'Meena', 'Arjun', 'Imran', 'Farhan', 'Sana', 'Zoya', 'Harsh', 'Nikhil', 'Divya'];
const LAST = ['Verma', 'Singh', 'Yadav', 'Gupta', 'Mishra', 'Khan', 'Ansari', 'Jain', 'Agarwal', 'Chauhan', 'Rathore', 'Patil', 'Shah', 'Iyer', 'Nair', 'Bose'];

/* ───────────── main ───────────── */
await mongoose.connect(URI, { dbName: DB });
const db = mongoose.connection.db;
if (RESET) {
  for (const c of await db.listCollections().toArray()) if (c.name.startsWith('dms_')) await db.dropCollection(c.name);
  await User.deleteMany({ email: new RegExp(`${DOMAIN.replace('.', '\\.')}$`) });
  console.log('Reset: dms_* collections and demo users removed.');
}
if (await db.collection('dms_locations').countDocuments()) { console.error('Demo data already present. Re-run with --reset to rebuild it.'); await mongoose.disconnect(); process.exit(1); }

const t0All = Date.now();
await ensureIndexes();
const hash = await User.hashPassword(PASSWORD);
const adminUser = await User.create({ email: `dms.admin${DOMAIN}`, password: hash, firstName: 'DMS', lastName: 'Admin', phone: '9000000100', role: 'MASTER_ADMIN', isActive: true });
const sign = (u) => jwt.sign({ userId: u._id }, env.jwtAccessSecret, { expiresIn: '12h' });
const ADMIN = sign(adminUser);

const D0 = '2024-12-01';
await at(D0, async () => {
  /* masters */
  for (const [code, desc, c, s, i] of HSNS) await call(ADMIN, 'post', '/hsn', { hsnCode: code, description: desc, cgst: c, sgst: s, igst: i });
  const brandId = {}; const catId = {};
  for (const b of ['Haion', 'Volta', 'Zenx']) brandId[b] = (await call(ADMIN, 'post', '/masters/brand', { name: b }))._id;
  for (const c of ['MOBILE', 'MOBILE ACCESSORIES', 'IT ACCESSORIES', 'LED TV', 'Split AC']) catId[c] = (await call(ADMIN, 'post', '/masters/category', { name: c }))._id;
  const sub = await call(ADMIN, 'post', '/masters/subcategory', { name: 'MOBILE HANDSET', parent: catId.MOBILE });
  await call(ADMIN, 'post', '/masters/subcategory', { name: 'TWS EARBUDS', parent: catId['MOBILE ACCESSORIES'] });
  for (const c of ['BLACK', 'BLUE', 'GREY', 'WHITE', 'RED', 'NONE']) await call(ADMIN, 'post', '/masters/color', { name: c });
  global.PROD = {};
  for (const [code, name, cat, brand, color, hsn, ser, mrp, war] of PRODUCTS) {
    const p = await call(ADMIN, 'post', '/products', { productCode: code, name, category: catId[cat], subCategory: cat === 'MOBILE' ? sub._id : undefined, brand: brandId[brand], color, hsnCode: hsn, warrantyDays: war, isSerialized: Boolean(ser) });
    global.PROD[code] = { id: p._id, code, name, ser: Boolean(ser), mrp, hsn };
  }
  global.COURIER = [];
  for (const [n, c, ph] of [['DTDC Express', 'Gurgaon', '9000011001'], ['Blue Dart', 'Delhi', '9000011002'], ['Delhivery', 'Gurgaon', '9000011003']]) {
    global.COURIER.push((await call(ADMIN, 'post', '/masters/courier', { name: n, code: n.split(' ')[0].toUpperCase(), attrs: { contactPerson: 'Dispatch Desk', phone: ph, city: c, state: 'Haryana', address: `${c} hub` } }))._id);
  }
  global.VENDOR = [];
  for (const [n, c, s, sc] of [['Orbit Electronics Pvt Ltd', 'Noida', 'Uttar Pradesh', 'UP'], ['Zenith Components', 'Gurugram', 'Haryana', 'HR'], ['Lumen Tech Imports', 'Delhi', 'Delhi', 'DL']]) {
    global.VENDOR.push((await call(ADMIN, 'post', '/vendors', { name: n, city: c, state: s, stateCode: sc, phone: `90000${ri(20000, 29999)}`, email: `accounts@${n.split(' ')[0].toLowerCase()}.example`, address: `${c} industrial area`, gstNo: `${sc === 'UP' ? '09' : '06'}AABCT${ri(1000, 9999)}K1Z${ri(1, 9)}` }))._id);
  }
  /* locations */
  global.LOC = {};
  for (const l of LOCS) {
    const loc = await call(ADMIN, 'post', '/locations', {
      name: l.name, locationType: l.type, state: l.state, stateCode: l.sc, city: l.city, docPrefix: l.pre, region: l.region, parent: l.parent ? global.LOC[l.parent].id : undefined, creditLimit: l.credit,
      billingAddress: l.addr, dispatchAddress: l.addr, contactPerson: PEOPLE[l.k]?.[0], phone: `90000${ri(30000, 39999)}`, email: `${l.k}@${l.k}.example`, panNo: `AAAPD${ri(1000, 9999)}${String.fromCharCode(65 + ri(0, 25))}`,
      gstNo: `${l.sc === 'UP' ? '09' : l.sc === 'RJ' ? '08' : '27'}AAAPD${ri(1000, 9999)}Q1Z${ri(1, 9)}`, proprietorType: 'OWNED', tdsPercent: 1,
      bank: { accountHolder: l.name, bankName: 'Demo Bank', bankCity: l.city, ifsc: 'DEMO0000123', accountNo: `00${ri(10000000, 99999999)}` },
    });
    global.LOC[l.k] = { id: loc._id, code: loc.code, ...l };
  }
  /* users */
  global.USER = {};
  for (const l of LOCS) {
    const [name, type] = PEOPLE[l.k];
    const pages = l.k === 'ho' ? PAGES.ho : BRANCHES.includes(l.k) ? PAGES.branch : PAGES.dealer;
    const p = await call(ADMIN, 'post', '/users', { displayName: name, email: `${l.k}${DOMAIN}`, phone: `90000${ri(40000, 49999)}`, password: PASSWORD, userType: type, location: global.LOC[l.k].id, pages });
    const u = await User.findOne({ email: `${l.k}${DOMAIN}` });
    global.USER[l.k] = { tok: sign(u), loginId: p.loginId, profile: p._id, name };
  }
  /* price master (state × location type) */
  for (const [code, , , , , , , mrp] of PRODUCTS) {
    for (const st of ['Uttar Pradesh', 'Rajasthan', 'Maharashtra']) {
      await call(ADMIN, 'post', '/prices', { state: st, locationType: 'Branch', product: global.PROD[code].id, mrp, price: r2(mrp * 0.82) });
      await call(ADMIN, 'post', '/prices', { state: st, locationType: 'Dealer', product: global.PROD[code].id, mrp, price: r2(mrp * 0.9) });
    }
  }
  /* schemes, accounts, coupons, other masters */
  const phones = ['PH-X1', 'PH-X1B', 'PH-Z2', 'PH-Z2P'].map((c) => global.PROD[c].id);
  global.SCHEME = (await call(ADMIN, 'post', '/schemes', { name: 'Diwali Dhamaka 2025', fromDate: '2025-10-10', toDate: '2025-11-15', products: phones, discountType: 'FLAT', discountValue: 500 }))._id;
  global.SCHEME2 = (await call(ADMIN, 'post', '/schemes', { name: 'Festive Offer 2026', fromDate: '2026-10-01', toDate: '2026-12-31', products: phones, discountType: 'PERCENT', discountValue: 3 }))._id;
  await call(ADMIN, 'post', '/schemes', { name: 'Accessory Bonanza', fromDate: '2026-01-01', toDate: '2026-12-31', products: ['CH-20W', 'CB-C1', 'EP-B1'].map((c) => global.PROD[c].id), discountType: 'PERCENT', discountValue: 5 });
  await call(ADMIN, 'post', '/masters/account', { name: 'HQ Collection Account', attrs: { accountNo: '000123456789', accountType: 'Current', bankName: 'Demo Bank', ifsc: 'DEMO0000123', mappedLocations: [global.LOC.ho.id] } });
  await call(ADMIN, 'post', '/masters/account', { name: 'Cash Counter', attrs: { accountNo: 'CASH-01', accountType: 'Cash', mappedLocations: BRANCHES.map((b) => global.LOC[b].id) } });
  await call(ADMIN, 'post', '/masters/coupon', { name: 'WELCOME200', attrs: { amount: 200, validFrom: '2026-01-01', validTo: '2026-12-31', mappedLocations: DEALERS.map((d) => global.LOC[d].id) } });
  await call(ADMIN, 'post', '/masters/othertax', { name: 'TCS', attrs: { percent: 1 } });
  await call(ADMIN, 'post', '/masters/parameter', { name: 'RAM', parent: sub._id });
  await call(ADMIN, 'post', '/masters/parameter', { name: 'Storage', parent: sub._id });
  for (const c of ['PH-X1', 'PH-Z2', 'PH-Z2P']) await call(ADMIN, 'post', '/masters/specification', { name: '-', attrs: { product: global.PROD[c].id, specs: 'Display: 6.5 inch AMOLED\nRAM: 8 GB\nBattery: 5000 mAh\nOS: Android 14' } });
  for (const [f, t, d] of [['Noida', 'Agra', 2], ['Noida', 'Jaipur', 3], ['Noida', 'Lucknow', 2], ['Noida', 'Mumbai', 5], ['Agra', 'Mathura', 1], ['Lucknow', 'Kanpur', 1]]) await call(ADMIN, 'post', '/masters/productdelivery', { name: '-', attrs: { fromCity: f, toCity: t, category: 'MOBILE', days: d } });
});
const LOC = global.LOC; const PROD = global.PROD; const USER = global.USER; const COURIER = global.COURIER; const VENDOR = global.VENDOR;
const ho = USER.ho.tok;
console.log(`Masters, ${LOCS.length} locations, ${Object.keys(USER).length} users created.`);

/* customers: 4 per dealer */
const CUST = {};
await at('2024-12-05', async () => {
  for (const d of DEALERS) {
    CUST[d] = [];
    for (let i = 0; i < 4; i++) {
      const c = await call(USER[d].tok, 'post', '/customers', { name: `${pick(FIRST)} ${pick(LAST)}`, phone: `90000${ri(50000, 79999)}`, state: LOC[d].state, stateCode: LOC[d].sc, city: LOC[d].city, location: LOC[d].id, address: `${ri(1, 220)}, ${LOC[d].addr}`, email: `cust${ri(100, 999)}@mail.example` });
      CUST[d].push(c._id);
    }
  }
});

/* ───────────── stock bookkeeping (mirrors what the API enforces) ───────────── */
const STOCK = {}; // loc -> code -> { qty, serials[] }
const stk = (l, c) => ((STOCK[l] ||= {})[c] ||= { qty: 0, serials: [] });
let serialSeq = 1000;
const newSerials = (code, n, tag) => Array.from({ length: n }, () => `${code.replace('-', '')}${tag}${String(++serialSeq).padStart(5, '0')}`);
const takeOut = (l, code, n) => { const s = stk(l, code); s.qty -= n; return PROD[code].ser ? s.serials.splice(0, n) : []; };
const putIn = (l, code, n, serials = []) => { const s = stk(l, code); s.qty += n; s.serials.push(...serials); };
const price = (code, f) => r2(PROD[code].mrp * f);
const FACTOR = { branch: 0.82, dealer: 0.9 };

/* opening stock at HO (FY 24-25) */
await at('2024-12-28', async () => {
  const lines = PRODUCTS.map(([code, , , , , , ser, mrp]) => {
    const qty = ser ? 40 : 120; const serials = ser ? newSerials(code, qty, '24') : undefined;
    putIn('ho', code, qty, serials);
    return { product: PROD[code].id, qty, okQty: qty, price: r2(mrp * 0.72), serials };
  });
  await call(ho, 'post', '/invoices', { kind: 'OPENING', from: LOC.ho.id, invoiceDate: '2024-12-28', refNo: 'OPEN/2024', lines, remark: 'Opening stock as on 28-Dec-2024' });
});

/* ───────────── monthly business cycle ───────────── */
const MONTHS = []; for (let y = 2025, m = 1; y < 2026 || m <= 11; ) { MONTHS.push([y, m]); m += 1; if (m > 12) { m = 1; y += 1; } if (y === 2026 && m > 11) break; }
const lastIdx = MONTHS.length - 1;
const BILLS = []; // retail bills for returns/cancel/targets
const PAY_PENDING = [];
const ISO = (y, m, d) => `${y}-${pad(m)}-${pad(d)}`;
const SEASON = (m) => ([10, 11].includes(m) ? 1.5 : [1, 2, 6, 7].includes(m) ? 0.85 : 1);
let vinv = 0; let stnDone = false; let prnDone = 0; let cancelDone = false;

async function viaPo({ buyer, supplier, buyerTok, supplierTok, items, y, m, dPo, dApprove, dInv, dDisp, dRecv, partial, reject, leaveAt }) {
  const f = LOC[buyer].type === 'Branch' ? FACTOR.branch : FACTOR.dealer;
  const lines = items.map(([code, qty]) => ({ product: PROD[code].id, qty, price: price(code, f), discountPerUnit: PROD[code].ser ? 0 : r2(price(code, f) * 0.02), warrantyDays: 365 }));
  const po = await at(ISO(y, m, dPo), () => call(buyerTok, 'post', '/po', { fromLocation: LOC[buyer].id, toLocation: LOC[supplier].id, lines, deliveryAddress: LOC[buyer].addr, paymentTerms: '30 days', remark: `Monthly replenishment ${ISO(y, m, 1).slice(0, 7)}`, salesExecutive: undefined }));
  if (reject) { await at(ISO(y, m, dApprove), () => call(supplierTok, 'post', `/po/${po._id}/approve`, { action: 'Rejected', remark: 'Item not available this cycle' })); return null; }
  if (leaveAt === 'pfa') return po;
  await at(ISO(y, m, dApprove), () => call(supplierTok, 'post', `/po/${po._id}/approve`, { action: 'Approved', remark: 'Approved as per credit limit' }));
  if (leaveAt === 'approved') return po;
  const docs = [];
  const bill = async (frac, day, label) => {
    const outLines = [];
    const rl = [];
    po.lines.forEach((l, i) => {
      const code = items[i][0];
      let qty = label === 'first' ? (frac < 1 ? Math.max(1, Math.floor(l.reqQty * frac)) : l.reqQty) : l.reqQty - Math.max(1, Math.floor(l.reqQty * frac));
      if (qty <= 0) return;
      qty = Math.min(qty, stk(supplier, code).qty);
      if (qty <= 0) return;
      const serials = takeOut(supplier, code, qty);
      rl.push({ lineId: l._id, qty, serials: PROD[code].ser ? serials : undefined, discountPerUnit: l.discountPerUnit });
      outLines.push([code, qty, serials]);
    });
    if (!rl.length) return null;
    const inv = await at(ISO(y, m, day), () => call(supplierTok, 'post', `/invoices/against-po/${po._id}`, { invoiceDate: ISO(y, m, day), docType: 'INVOICE', lines: rl, remark: 'Against approved PO' }, 201));
    await at(ISO(y, m, day + 1), () => call(supplierTok, 'post', `/invoices/${inv._id}/dispatch`, {
      courier: pick(COURIER), docketNo: `DKT${y}${pad(m)}${ri(1000, 9999)}`, dispatchDate: ISO(y, m, day + 1), logisticPerson: pick(['Ramesh', 'Sandeep', 'Mohit', 'Gaurav']), transportMode: 'By Road',
      contactNo: `90000${ri(60000, 69999)}`, carrierNo: `UP${ri(10, 99)}AB${ri(1000, 9999)}`, deliveryAddress: LOC[buyer].addr, remark: 'Handed to carrier', ewayBillNo: `${ri(100000000000, 999999999999)}`,
    }));
    const recvDay = Math.min(28, day + 3);
    const recv = inv.lines.map((l, i) => {
      const dmg = !PROD[outLines[i][0]].ser && rnd() < 0.12 ? 1 : 0; const miss = !PROD[outLines[i][0]].ser && rnd() < 0.05 ? 1 : 0;
      return { lineId: l._id, okQty: l.qty - dmg - miss, damageQty: dmg, missingQty: miss };
    });
    await at(ISO(y, m, recvDay), () => call(buyerTok, 'post', `/invoices/${inv._id}/receive`, { remark: recv.some((r) => r.damageQty || r.missingQty) ? 'Received with shortage / damage noted' : 'Received in good condition', lines: recv }));
    outLines.forEach(([code, qty, serials], i) => putIn(buyer, code, recv[i].okQty + recv[i].damageQty * 0, serials.slice(0, recv[i].okQty)));
    docs.push({ inv, total: inv.grandTotal });
    return inv;
  };
  if (partial) { await bill(0.6, dInv, 'first'); await bill(0.6, dInv + 2, 'rest'); } else await bill(1, dInv, 'first');
  return { po, docs };
}

async function payment({ from, to, fromTok, toTok, amount, y, m, d, approveD, state = 'approve', mode }) {
  const payMode = mode || pick(['BANK', 'CASH', 'PAYTM', 'CHEQUE']);
  const body = { kind: 'RECEIPT', fromLocation: LOC[from].id, toLocation: LOC[to].id, payMode, amount: r2(amount), paymentDate: ISO(y, m, d), remark: pick(['Against monthly invoices', 'Part payment', 'Settlement of dues', 'As per statement']) };
  if (payMode === 'BANK') Object.assign(body, { bankName: 'Demo Bank', bankBranch: 'DEMO0000123', transactionId: `UTR${y}${pad(m)}${ri(100000, 999999)}` });
  if (payMode === 'PAYTM') body.transactionId = `PTM${ri(10000000, 99999999)}`;
  if (payMode === 'CHEQUE') Object.assign(body, { bankName: 'Demo Bank', ddChequeNo: String(ri(100000, 999999)), ddChequeDate: ISO(y, m, d) });
  const p = await at(ISO(y, m, d), () => call(fromTok, 'post', '/payments', body));
  if (state === 'pending') return p;
  await at(ISO(y, m, approveD), () => call(toTok, 'post', `/payments/${p._id}/approve`, state === 'reject' ? { action: 'Reject', remark: 'Cheque bounced / reference not found' } : { action: 'Approve', receivedAmount: r2(amount), remark: 'Received and reconciled' }));
  return p;
}

for (const [mi, [y, m]] of MONTHS.entries()) {
  const season = SEASON(m);
  const isLast = mi === lastIdx;
  /* dealer demand for the month */
  const dealerNeed = {};
  for (const dk of DEALERS) {
    dealerNeed[dk] = PRODUCTS.map(([code, , , , , , ser]) => {
      const base = ser ? (code === 'PH-X1' ? 6 : code === 'PH-X1B' ? 3 : code === 'PH-Z2' ? 3 : code === 'PH-Z2P' ? 1 : 1) : (code === 'CS-X1' || code === 'SG-X1' ? 14 : 8);
      const q = Math.max(0, Math.round(base * season * (0.7 + rnd() * 0.7)));
      return [code, (code === 'AC-15' && ![4, 5, 6, 7].includes(m)) ? 0 : q];
    }).filter(([, q]) => q > 0);
  }
  const branchNeed = {};
  for (const bk of BRANCHES) {
    const agg = {};
    for (const dk of DEALERS.filter((d) => BRANCH_OF[d] === bk)) for (const [c, q] of dealerNeed[dk]) agg[c] = (agg[c] || 0) + q;
    branchNeed[bk] = Object.entries(agg).map(([c, q]) => [c, q + (PROD[c].ser ? 0 : 4)]);
  }
  const vendorNeed = {};
  for (const bk of BRANCHES) for (const [c, q] of branchNeed[bk]) vendorNeed[c] = (vendorNeed[c] || 0) + q;

  /* 1) HO buys from the vendor and receives with serials */
  const vItems = Object.entries(vendorNeed).map(([c, q]) => [c, Math.ceil(q * 1.15)]);
  const vpo = await at(ISO(y, m, 2), () => call(ho, 'post', '/po', { poType: 'VENDOR', fromLocation: LOC.ho.id, toVendor: pick(VENDOR), deliveryAddress: LOC.ho.addr, paymentTerms: '45 days', remark: `Vendor replenishment ${y}-${pad(m)}`, lines: vItems.map(([c, q]) => ({ product: PROD[c].id, qty: q, price: price(c, 0.7) })) }));
  const vserials = vItems.map(([c, q]) => (PROD[c].ser ? newSerials(c, q, `${String(y).slice(2)}${pad(m)}`) : undefined));
  await at(ISO(y, m, 4), () => call(ho, 'post', `/invoices/from-vendor-po/${vpo._id}`, { refNo: `VINV/${y}${pad(m)}/${++vinv}`, refDate: ISO(y, m, 3), invoiceDate: ISO(y, m, 4), remark: 'Goods received against vendor PO', lines: vpo.lines.map((l, i) => ({ lineId: l._id, okQty: l.reqQty, serials: vserials[i] })) }, 201));
  vItems.forEach(([c, q], i) => putIn('ho', c, q, vserials[i] || []));

  /* 2) branches order from HO; HO approves, invoices, dispatches; branch receives */
  for (const [bi, bk] of BRANCHES.entries()) {
    await viaPo({ buyer: bk, supplier: 'ho', buyerTok: USER[bk].tok, supplierTok: ho, items: branchNeed[bk], y, m, dPo: 6, dApprove: 7, dInv: 8, dDisp: 9, dRecv: 11, partial: bi === (mi % 4) && mi % 3 === 0 });
  }
  if (mi % 4 === 1) { // an extra, rejected request (shows the Rejected state and approval history)
    await viaPo({ buyer: 'agra', supplier: 'ho', buyerTok: USER.agra.tok, supplierTok: ho, items: [['PH-Z2P', 6]], y, m, dPo: 7, dApprove: 8, reject: true });
  }
  /* 3) dealers order from their branch */
  for (const dk of DEALERS) {
    const bk = BRANCH_OF[dk];
    await viaPo({ buyer: dk, supplier: bk, buyerTok: USER[dk].tok, supplierTok: USER[bk].tok, items: dealerNeed[dk], y, m, dPo: 12, dApprove: 13, dInv: 14, dDisp: 15, dRecv: 17, partial: false });
  }
  /* 4) retail sales by dealers (serial-tracked phones/TV/AC + accessories) */
  const monthBills = [];
  for (const dk of DEALERS) {
    const nBills = Math.round((9 + ri(0, 5)) * season);
    for (let b = 0; b < nBills; b++) {
      const day = ri(18, 28);
      const avail = PRODUCTS.map(([c]) => c).filter((c) => stk(dk, c).qty > 0);
      if (!avail.length) continue;
      const chosen = [...new Set([pick(avail), pick(avail), rnd() < 0.4 ? pick(avail) : null].filter(Boolean))];
      const lines = []; const used = [];
      for (const c of chosen) {
        const q = PROD[c].ser ? 1 : Math.min(stk(dk, c).qty, ri(1, 3)); if (q < 1) continue;
        const serials = takeOut(dk, c, q);
        const scheme = PROD[c].ser && ['PH-X1', 'PH-X1B', 'PH-Z2', 'PH-Z2P'].includes(c) && ((y === 2025 && [10, 11].includes(m)) ? SCHEME_ID(1) : (y === 2026 && m >= 10) ? SCHEME_ID(2) : null);
        lines.push({ product: PROD[c].id, qty: q, price: price(c, 0.99), serials: PROD[c].ser ? serials : undefined, scheme: scheme || undefined });
        used.push([c, q, serials]);
      }
      if (!lines.length) continue;
      const cust = pick(CUST[dk]);
      const bill = await at(ISO(y, m, day), () => call(USER[dk].tok, 'post', '/invoices', { kind: 'RETAIL_CUSTOMER', from: LOC[dk].id, to: cust, invoiceDate: ISO(y, m, day), lines, deliveryAddress: LOC[dk].addr, remark: 'Retail sale' }, 201));
      const roll = rnd();
      if (isLast && roll > 0.6) { PAY_PENDING.push(bill._id); } else if (roll < 0.85) {
        await at(ISO(y, m, day), () => call(USER[dk].tok, 'post', `/invoices/${bill._id}/payment`, { amount: bill.grandTotal, payMode: pick(['CASH', 'PAYTM', 'BANK']), remark: pick(['Paid at counter', 'UPI payment', 'Card payment']) }));
      } else if (roll < 0.95) {
        await at(ISO(y, m, day), () => call(USER[dk].tok, 'post', `/invoices/${bill._id}/payment`, { amount: r2(bill.grandTotal * 0.5), payMode: 'CASH', remark: 'Advance 50%' }));
      }
      monthBills.push({ bill, dk, used, y, m, day });
    }
  }
  /* 5) customer return / cancelled bill (state coverage) */
  const retPick = monthBills.find((x) => x.used.some(([c]) => PROD[c].ser));
  if (mi % 5 === 3 && retPick) {
    const [c, , serials] = retPick.used.find(([cc]) => PROD[cc].ser);
    await at(ISO(y, m, 29), () => call(USER[retPick.dk].tok, 'post', '/invoices', { kind: 'CUSTOMER_RETURN', from: retPick.bill.to.customer, to: LOC[retPick.dk].id, sourceInvoice: retPick.bill._id, invoiceDate: ISO(y, m, 29), remark: 'Customer returned — dead on arrival', lines: [{ product: PROD[c].id, qty: 1, price: price(c, 0.99), serials: [serials[0]] }] }, 201));
    putIn(retPick.dk, c, 1, [serials[0]]);
  }
  if (mi === 12 && !cancelDone) {
    const dk = 'nwb'; const c = 'CH-20W'; const q = Math.min(2, stk(dk, c).qty);
    if (q > 0) {
      takeOut(dk, c, q);
      const bill = await at(ISO(y, m, 20), () => call(USER[dk].tok, 'post', '/invoices', { kind: 'RETAIL_CUSTOMER', from: LOC[dk].id, to: CUST[dk][0], invoiceDate: ISO(y, m, 20), lines: [{ product: PROD[c].id, qty: q, price: price(c, 0.99) }] }, 201));
      await at(ISO(y, m, 20), () => call(USER[dk].tok, 'post', `/invoices/${bill._id}/cancel`, { remark: 'Customer changed mind' }));
      putIn(dk, c, q); cancelDone = true;
    }
  }
  /* 6) STN HO→Agra and a purchase return Agra→HO (approval workflow both ways) */
  if (mi === 10 && !stnDone) {
    const items = [['CH-20W', 15], ['CB-C1', 15]];
    items.forEach(([c, q]) => takeOut('ho', c, q));
    const stn = await at(ISO(y, m, 21), () => call(ho, 'post', '/invoices', { kind: 'STN', from: LOC.ho.id, to: LOC.agra.id, docType: 'DELIVERY CHALLAN', invoiceDate: ISO(y, m, 21), remark: 'Stock balancing', deliveryAddress: LOC.agra.addr, lines: items.map(([c, q]) => ({ product: PROD[c].id, qty: q, price: price(c, 0.7) })) }, 201));
    await at(ISO(y, m, 22), () => call(ho, 'post', `/invoices/${stn._id}/approve`, { action: 'Approved', remark: 'Approved for transfer' }));
    await at(ISO(y, m, 24), () => call(USER.agra.tok, 'post', `/invoices/${stn._id}/receive`, { remark: 'Stock transfer received', lines: stn.lines.map((l) => ({ lineId: l._id, okQty: l.qty, damageQty: 0, missingQty: 0 })) }));
    items.forEach(([c, q]) => putIn('agra', c, q));
    stnDone = true;
  }
  if ((mi === 7 || mi === 16) && prnDone < 2 && stk('mumbai', 'CS-X1').qty >= 4) {
    const c = 'CS-X1'; takeOut('mumbai', c, 3);
    const prn = await at(ISO(y, m, 22), () => call(USER.mumbai.tok, 'post', '/invoices', { kind: 'PRN', from: LOC.mumbai.id, to: LOC.ho.id, invoiceDate: ISO(y, m, 22), remark: 'Defective back cases', deliveryAddress: LOC.ho.addr, lines: [{ product: PROD[c].id, qty: 3, price: price(c, 0.82) }] }, 201));
    await at(ISO(y, m, 23), () => call(ho, 'post', `/invoices/${prn._id}/approve`, { action: 'Approved', remark: 'Return accepted' }));
    await at(ISO(y, m, 26), () => call(ho, 'post', `/invoices/${prn._id}/receive`, { remark: 'Returned goods received at HQ', lines: prn.lines.map((l) => ({ lineId: l._id, okQty: 0, damageQty: l.qty, missingQty: 0 })) }));
    prnDone += 1;
  }
  /* 7) collections: dealers pay branches, branches pay HO (approved by the receiving side) */
  for (const dk of DEALERS) {
    const bk = BRANCH_OF[dk];
    const inv = await TX.DmsInvoice.find({ kind: 'CORPORATE', 'to.location': new mongoose.Types.ObjectId(LOC[dk].id), invoiceDate: { $gte: new Date(`${ISO(y, m, 1)}T00:00:00Z`), $lte: new Date(`${ISO(y, m, 28)}T23:59:59Z`) }, status: { $ne: 'Cancelled' } }).lean();
    const due = inv.reduce((n, i) => n + i.grandTotal, 0);
    if (due > 0) await payment({ from: dk, to: bk, fromTok: USER[dk].tok, toTok: USER[bk].tok, amount: due * (0.86 + rnd() * 0.14), y, m, d: 25, approveD: 26, state: isLast && rnd() > 0.5 ? 'pending' : (mi === 6 && dk === 'rrj' ? 'reject' : 'approve') });
  }
  for (const bk of BRANCHES) {
    const inv = await TX.DmsInvoice.find({ kind: 'CORPORATE', 'to.location': new mongoose.Types.ObjectId(LOC[bk].id), invoiceDate: { $gte: new Date(`${ISO(y, m, 1)}T00:00:00Z`), $lte: new Date(`${ISO(y, m, 28)}T23:59:59Z`) }, status: { $ne: 'Cancelled' } }).lean();
    const due = inv.reduce((n, i) => n + i.grandTotal, 0);
    if (due > 0) await payment({ from: bk, to: 'ho', fromTok: USER[bk].tok, toTok: ho, amount: due * (0.84 + rnd() * 0.14), y, m, d: 27, approveD: 28, state: isLast && bk === 'mumbai' ? 'pending' : 'approve', mode: 'BANK' });
  }
  if (mi === 14) await at(ISO(y, m, 28), () => call(ho, 'post', '/payments', { kind: 'ADJUSTMENT', fromLocation: LOC.kma.id, toLocation: LOC.agra.id, adjustType: 'CR', payMode: 'OTHER', amount: 2500, paymentDate: ISO(y, m, 28), remark: 'Scheme credit note' }));
  if (isLast) { // leave a few approvals open so queues are populated
    await viaPo({ buyer: 'pct', supplier: 'jaipur', buyerTok: USER.pct.tok, supplierTok: USER.jaipur.tok, items: [['PH-Z2', 3], ['CH-20W', 10]], y, m, dPo: 17, dApprove: 18, leaveAt: 'pfa' });
    await viaPo({ buyer: 'nwb', supplier: 'lucknow', buyerTok: USER.nwb.tok, supplierTok: USER.lucknow.tok, items: [['EP-B1', 6]], y, m, dPo: 17, dApprove: 18, leaveAt: 'approved' });
    await viaPo({ buyer: 'jaipur', supplier: 'ho', buyerTok: USER.jaipur.tok, supplierTok: ho, items: [['PH-X1', 4]], y, m, dPo: 18, dApprove: 18, leaveAt: 'pfa' });
  }
  if (mi % 6 === 5 || isLast) console.log(`  …${y}-${pad(m)} done`);
}
function SCHEME_ID(n) { return n === 1 ? global.SCHEME : global.SCHEME2; }
console.log(`Transactions seeded for ${MONTHS.length} months.`);

/* ───────────── Sale Force, General Query, App, HRMS (via API, then dated) ───────────── */
const E = (tok, type, body, expected) => call(tok, 'post', `/entities/${type}`, body, expected);
const ACT = (tok, type, id, body) => call(tok, 'post', `/entities/${type}/${id}/action`, body);
const mid = (y, m, d) => ISO(y, m, d);

/* HR masters + employees */
const DEPT = {}; const DESIG = {}; const EMP = {};
await at('2024-12-10', async () => {
  for (const d of ['Sales', 'Accounts', 'Logistics', 'Human Resources', 'After Sales Service']) DEPT[d] = (await E(ADMIN, 'department', { name: d }))._id;
  for (const d of ['Sales Head', 'Area Sales Manager', 'Sales Executive', 'Accounts Executive', 'Store Keeper', 'HR Executive']) DESIG[d] = (await E(ADMIN, 'designation', { name: d }))._id;
  for (const [t, n] of [['Casual Leave', 12], ['Sick Leave', 10], ['Earned Leave', 15]]) EMP[t] = (await E(ADMIN, 'leavetype', { typeOfLeave: t, noOfDays: n, effectiveDate: '2025-01-01' }))._id;
  const hol = [['2025-01-26', 'Republic Day'], ['2025-03-14', 'Holi'], ['2025-08-15', 'Independence Day'], ['2025-10-02', 'Gandhi Jayanti'], ['2025-10-20', 'Diwali'], ['2025-12-25', 'Christmas'],
    ['2026-01-26', 'Republic Day'], ['2026-03-04', 'Holi'], ['2026-08-15', 'Independence Day'], ['2026-10-02', 'Gandhi Jayanti'], ['2026-11-08', 'Diwali']];
  for (const [d, n] of hol) await E(ADMIN, 'holiday', { date: d, description: n });
  let idx = 0;
  for (const k of Object.keys(PEOPLE)) {
    const [name, desig] = PEOPLE[k]; idx++;
    const basic = k === 'ho' ? 60000 : BRANCHES.includes(k) ? 38000 : 22000;
    EMP[k] = (await E(ADMIN, 'employee', {
      name, loginId: USER[k].loginId, email: `${k}${DOMAIN}`, phone: `90000${ri(80000, 89999)}`, gender: idx % 3 === 0 ? 'Female' : 'Male', joiningDate: `2024-0${(idx % 9) + 1}-01`,
      department: DEPT.Sales, designation: DESIG[desig], location: LOC[k].id, employmentType: 'Permanent', city: LOC[k].city, state: LOC[k].state, basicSalary: basic, hra: r2(basic * 0.4), allowances: r2(basic * 0.15), pfPercent: 12,
    }))._id;
  }
  await E(ADMIN, 'employee', { name: 'Priya Verma', phone: '9000099901', joiningDate: '2024-06-01', department: DEPT['Human Resources'], designation: DESIG['HR Executive'], location: LOC.ho.id, basicSalary: 30000, hra: 12000, allowances: 4500, pfPercent: 12, city: 'Noida', state: 'Uttar Pradesh' });
  await E(ADMIN, 'notice', { subject: 'Diwali 2025 holiday schedule', body: 'Offices remain closed 20–22 October. Dispatches resume on 23 October.' });
  await E(ADMIN, 'notice', { subject: 'Quarterly target review', body: 'Branch managers to submit target achievement by the 5th of every month.' });
  await E(ADMIN, 'policy', { policyName: 'Leave & Attendance Policy', releaseDate: '2025-01-01', content: 'Casual leave 12 days, sick leave 10 days, earned leave 15 days per calendar year. Attendance must be marked daily.' });
  await E(ADMIN, 'policy', { policyName: 'Travel & DA Policy', releaseDate: '2025-04-01', content: 'Travel by road reimbursed at ₹8 per km. DA ₹500 per day outside home city.' });
  for (const [p, c] of [['Dealer Onboarding Drive', 'Internal'], ['Festive Display Rollout', 'Zenx'], ['Warranty Portal Migration', 'Volta']]) await E(ADMIN, 'project', { project: p, client: c, entryDate: '2026-04-01', tentativeDate: '2026-12-31', manager: EMP.ho });
});
console.log('HR masters and employees seeded.');

/* Sale Force: leads → approvals → quotes → outcomes */
const leadAreas = ['Agra', 'Mathura', 'Jaipur', 'Lucknow', 'Mumbai'];
const leadParties = ['Shree Mobile Gallery', 'Tech Bazaar', 'Mahalaxmi Electronics', 'City Telecom', 'Royal Appliances', 'Metro Digital', 'Sai Communications', 'Alpha Mobiles', 'Bright Retail', 'Kumar Home Needs', 'Galaxy Digital', 'Om Sai Traders'];
const quotes = [];
for (let i = 0; i < 28; i++) {
  const dk = pick(DEALERS); const bk = BRANCH_OF[dk]; const mIdx = Math.max(0, lastIdx - ri(0, 14)); const [y, m] = MONTHS[mIdx]; const d = ri(2, 24);
  const lead = await at(mid(y, m, d), () => E(USER[dk].tok, 'lead', { partyName: `${pick(leadParties)} ${i + 1}`, contactPerson: `${pick(FIRST)} ${pick(LAST)}`, phone: `90000${ri(90000, 99999)}`, area: LOC[dk].city, source: pick(['Walk-in', 'Referral', 'Website', 'Exhibition']), priority: pick(['High', 'Medium', 'Low']), expectedValue: ri(2, 40) * 10000, followUpDate: mid(y, m, Math.min(28, d + 6)), remark: 'Interested in phones and accessories' }));
  const outcome = i % 7;
  if (outcome === 6) continue; // stays Open
  await at(mid(y, m, d + 1), () => ACT(USER[bk].tok, 'lead', lead._id, outcome === 5 ? { action: 'reject', remark: 'Out of service area' } : { action: 'approve', remark: 'Valid lead' }));
  if (outcome === 5) continue;
  if (outcome >= 1) {
    const items = [['PH-X1', ri(2, 6)], ['CH-20W', ri(5, 15)]];
    const q = await at(mid(y, m, d + 2), () => E(USER[dk].tok, 'quote', { lead: lead._id, partyName: lead.data.partyName, validTill: mid(y, m, Math.min(28, d + 12)), remark: 'Quotation for bulk purchase', lines: items.map(([c, qty]) => ({ product: PROD[c].id, qty, price: price(c, 0.95), discountPerUnit: 0 })) }));
    quotes.push([q, bk]);
    await at(mid(y, m, d + 3), () => ACT(USER[bk].tok, 'quote', q._id, { action: 'approve', remark: 'Quote approved' }));
    if (outcome === 1 || outcome === 2) await at(mid(y, m, d + 5), () => ACT(USER[bk].tok, 'lead', lead._id, { action: 'setStatus', status: outcome === 1 ? 'Won' : 'Negotiation', remark: outcome === 1 ? 'Order confirmed' : 'Discussing price' }));
    if (outcome === 3) await at(mid(y, m, d + 5), () => ACT(USER[bk].tok, 'lead', lead._id, { action: 'setStatus', status: 'Lost', remark: 'Went with a competitor' }));
  } else await at(mid(y, m, d + 4), () => ACT(USER[bk].tok, 'lead', lead._id, { action: 'setStatus', status: 'Follow Up', remark: 'Call back next week' }));
}
/* Targets: set from each executive's real sales so achievement is meaningful */
for (const dk of DEALERS) {
  const profileUser = await User.findOne({ email: `${dk}${DOMAIN}` }).lean();
  for (const [y, m] of MONTHS.slice(-6)) {
    const [agg] = await TX.DmsInvoice.aggregate([{ $match: { kind: 'RETAIL_CUSTOMER', status: { $nin: ['Cancelled', 'Rejected'] }, entryByUser: profileUser._id, invoiceDate: { $gte: new Date(Date.UTC(y, m - 1, 1)), $lt: new Date(Date.UTC(y, m, 1)) } } }, { $group: { _id: null, v: { $sum: '$grandTotal' } } }]);
    if (!agg) continue;
    await at(mid(y, m, 1), () => E(ho, 'target', { employee: USER[dk].profile, month: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][m - 1], year: y, type: 'Sale Amount', targetValue: Math.round((agg.v * (0.8 + rnd() * 0.5)) / 1000) * 1000, remark: 'Monthly sale target' }));
  }
}
/* PJP + beat plans (uploaded in one batch, then visited / deviated) */
for (const bk of BRANCHES) await at('2026-09-28', () => E(USER[bk].tok, 'pjp', { name: `${LOC[bk].city} Q4 Dealer Route`, fromDate: '2026-10-01', toDate: '2026-12-31', assignedTo: USER[DEALERS.find((d) => BRANCH_OF[d] === bk)].profile, locations: DEALERS.filter((d) => BRANCH_OF[d] === bk).map((d) => LOC[d].id), remark: 'Fortnightly dealer visits' }));
const beatRows = [];
for (const dk of DEALERS) for (let i = 0; i < 6; i++) beatRows.push({ loginId: USER[dk].loginId, date: mid(2026, 11, 3 + i * 4 > 28 ? 28 : 3 + i * 4), task: pick(['Collection', 'Dealer Visit', 'Feedback', 'Sale Order']), area: `${LOC[dk].city} - ${pick(['Market Road', 'Station Area', 'Civil Lines', 'Mall Road'])}` });
await at('2026-11-01', () => call(ho, 'post', '/entities/beat-upload', { rows: beatRows }));
const beats = await DmsEntity.find({ type: 'beat' }).sort({ 'data.date': 1 }).lean();
for (const [i, b] of beats.entries()) {
  const dk = DEALERS.find((d) => USER[d].loginId.toLowerCase() === b.ownerLoginId);
  if (b.data.date <= '2026-11-12' && i % 3 !== 2) await at(b.data.date, () => ACT(USER[dk].tok, 'beat', b._id, { action: 'visit' }));
  else if (i % 11 === 0) {
    const dev = await at('2026-11-10', () => call(USER[dk].tok, 'post', `/entities/beat/${b._id}/deviate`, { changeVisit: `${LOC[dk].city} - Wholesale Market`, requestRemark: 'Dealer closed on scheduled day' }, 201));
    if (i % 22 === 0) await at('2026-11-11', () => ACT(USER[BRANCH_OF[dk]].tok, 'deviation', dev._id, { action: 'approve', remark: 'Approved' }));
  }
}
/* General Query */
for (let i = 0; i < 26; i++) {
  const k = pick([...DEALERS, ...BRANCHES]); const [y, m] = MONTHS[Math.max(0, lastIdx - ri(0, 12))];
  await at(mid(y, m, ri(3, 25)), () => E(USER[k].tok, 'expense', { location: LOC[k].id, amount: ri(2, 40) * 100, expenseDate: mid(y, m, ri(3, 25)), paymentMode: pick(['Cash', 'UPI', 'Bank']), narration: pick(['Counter display materials', 'Courier charges', 'Staff refreshment', 'Shop maintenance', 'Printing & stationery', 'Local conveyance']) }));
}
for (const [mod, type, text] of [['PO', 'Question', 'How do I split a PO into two invoices?'], ['Payment', 'Data Issue', 'Receipt shows wrong bank name'], ['Invoice', 'Bug', 'Print preview cuts the last column'], ['Report', 'Feedback', 'Add export for stock ledger'], ['Stock', 'Question', 'Where do damaged units appear?'], ['Master', 'Data Issue', 'Duplicate customer record']]) {
  const k = pick(DEALERS); const q = await at(mid(2026, ri(8, 11), ri(2, 20)), () => E(USER[k].tok, 'query', { module: mod, problemType: type, problem: text, dueDate: '2026-12-05' }));
  if (rnd() > 0.4) await at('2026-11-14', () => ACT(ho, 'query', q._id, { action: 'reply', remark: 'Noted — resolved in the latest release / guidance shared.' }));
}
/* App transactions */
for (const k of DEALERS.slice(0, 6)) await at(mid(2026, 10 + (rnd() > 0.5 ? 1 : 0), ri(3, 16)), () => E(USER[k].tok, 'appfeedback', { feedbackType: pick(['Complaints', 'General', 'Query']), subject: pick(['Display stand missing', 'Need more demo units', 'Scheme clarification', 'Delivery delay']), feedback: 'Please look into this at the earliest.', address: LOC[k].addr, date: mid(2026, 11, 5) }));
for (const bk of BRANCHES) for (const [i, st] of ['Pending', 'In-Progress', 'Done'].entries()) {
  const dk = DEALERS.find((d) => BRANCH_OF[d] === bk);
  const t = await at(mid(2026, 11, 2 + i), () => E(USER[bk].tok, 'apptask', { taskName: pick(['Stock audit', 'Collect cheque', 'Display check']), subject: `${LOC[dk].city} follow-up`, details: 'Complete and update status in the app.', assignedTo: USER[dk].profile, date: mid(2026, 11, 2 + i) }));
  if (st !== 'Pending') await at(mid(2026, 11, 8 + i), () => ACT(USER[bk].tok, 'apptask', t._id, { action: 'setStatus', status: st }));
}
const trackDocs = [];
for (const dk of DEALERS) for (let i = 0; i < 8; i++) {
  const baseLat = { UP: 27.17, RJ: 26.91, MH: 19.07 }[LOC[dk].sc]; const baseLng = { UP: 78.0, RJ: 75.78, MH: 72.87 }[LOC[dk].sc];
  trackDocs.push({ type: 'track', status: 'Logged', ownerLoginId: USER[dk].loginId.toLowerCase(), createdByName: USER[dk].name, location: LOC[dk].id, data: { address: `${LOC[dk].city} route stop ${i + 1}`, lat: r2(baseLat + i * 0.01), lng: r2(baseLng + i * 0.012), travelDate: mid(2026, 11, 3 + i), travelTime: `${10 + i}:15` }, actions: [{ by: USER[dk].name, action: 'Created' }] });
}
await DmsEntity.insertMany(trackDocs);
/* TA/DA, claims, leave, applications, activities, resignation */
for (const dk of DEALERS) {
  for (let i = 0; i < 3; i++) {
    const [y, m] = MONTHS[lastIdx - ri(0, 5)]; const d = ri(3, 24);
    const t = await at(mid(y, m, d), () => E(USER[dk].tok, 'tada', { date: mid(y, m, d), fromPlace: LOC[dk].city, toPlace: pick(['Mathura', 'Kanpur', 'Ajmer', 'Pune', 'Thane', 'Varanasi']), distanceKm: ri(30, 220), travelAmount: ri(3, 18) * 100, daAmount: ri(1, 3) * 500, remark: 'Dealer visit' }));
    await at(mid(y, m, d + 2), () => ACT(USER[BRANCH_OF[dk]].tok, 'tada', t._id, i === 2 ? { action: 'reject', remark: 'Bills not attached' } : { action: 'approve', remark: 'Approved as per policy' }));
  }
  for (let i = 0; i < 2; i++) {
    const [y, m] = MONTHS[lastIdx - ri(0, 6)]; const d = ri(3, 24);
    const c = await at(mid(y, m, d), () => E(USER[dk].tok, 'claim', { claimType: pick(['Travelling', 'Lodging', 'Food']), claimDate: mid(y, m, d), amount: ri(4, 25) * 100, description: 'Field visit expenses' }));
    if (i === 0) await at(mid(y, m, d + 3), () => ACT(USER[BRANCH_OF[dk]].tok, 'claim', c._id, { action: 'approve', remark: 'Verified' }));
  }
  const lv = await at('2026-09-02', () => E(USER[dk].tok, 'leave', { leaveType: EMP['Casual Leave'], fromDate: '2026-09-14', toDate: '2026-09-15', purpose: 'Family function' }));
  await at('2026-09-03', () => ACT(USER[BRANCH_OF[dk]].tok, 'leave', lv._id, { action: 'approve', remark: 'Enjoy' }));
  await at('2026-10-20', () => E(USER[dk].tok, 'leave', { leaveType: EMP['Sick Leave'], fromDate: '2026-10-27', toDate: '2026-10-28', purpose: 'Fever' }));
  await at('2026-11-02', () => E(USER[dk].tok, 'activity', { description: 'Dealer display audit', startDate: '2026-11-04' }));
}
await at('2026-11-05', () => E(USER.kma.tok, 'application', { type: 'ID Card', details: 'Need replacement ID card' }));
await at('2026-11-06', () => E(USER.nwb.tok, 'application', { type: 'Loan', amount: 50000, details: 'Personal loan against salary' }));
const rs = await at('2026-11-07', () => E(USER.adg.tok, 'resign', { reason: 'Higher studies', reasonDetails: 'Relocating for a masters programme.', lastWorkingDate: '2026-12-31' }));
await at('2026-11-09', () => ACT(ho, 'resign', rs._id, { action: 'approve', remark: 'Accepted. Handover plan to follow.' }));
await at('2026-11-02', () => E(USER.kma.tok, 'mydoc', { fileName: 'Address proof', fileUrl: 'https://docs.example.com/demo/address-proof.pdf' }));
console.log('Sale Force, queries, app data and HR transactions seeded.');

/* Attendance: Mon–Sat for the last 4 months for every linked employee (with a few absences), then payroll for Aug–Oct 2026 */
const att = [];
const holidays = new Set(['2026-08-15', '2026-10-02', '2026-11-08']);
for (const k of Object.keys(PEOPLE)) {
  for (let d = new Date('2026-07-01T00:00:00Z'); d <= new Date('2026-11-18T00:00:00Z'); d.setUTCDate(d.getUTCDate() + 1)) {
    const iso = d.toISOString().slice(0, 10);
    if (d.getUTCDay() === 0 || holidays.has(iso) || rnd() < 0.05) continue;
    const inT = new Date(`${iso}T0${ri(3, 4)}:${pad(ri(0, 55))}:00Z`); const outT = new Date(inT.getTime() + (8 + rnd()) * 3600000);
    att.push({ type: 'attendance', status: 'Present', ownerLoginId: USER[k].loginId.toLowerCase(), createdByName: USER[k].name, location: LOC[k].id, createdAt: inT, updatedAt: outT,
      data: { date: iso, employeeName: USER[k].name, inAt: inT.toISOString(), inAddress: `${LOC[k].city} office`, outAt: outT.toISOString(), outAddress: `${LOC[k].city} office` }, actions: [{ at: inT, by: USER[k].name, action: 'Created' }] });
  }
}
await DmsEntity.insertMany(att);
for (const mn of ['August', 'September', 'October']) for (const k of Object.keys(PEOPLE)) await at(`2026-${mn === 'August' ? '09' : mn === 'September' ? '10' : '11'}-01`, () => call(ADMIN, 'post', '/entities/salary-generate', { employee: EMP[k], month: mn, year: 2026, bonus: mn === 'October' ? 2000 : 0 }, 201));
console.log(`${att.length} attendance days and payroll for Aug–Oct 2026 seeded.`);

/* master timestamps → start of business, then summary */
const counts = {};
for (const c of (await db.listCollections().toArray()).map((x) => x.name).filter((n) => n.startsWith('dms_')).sort()) counts[c] = await db.collection(c).countDocuments();
console.log('\nSeed complete in', Math.round((Date.now() - t0All) / 1000), 's. Record counts:');
console.table(counts);
console.log(`Logins (password ${PASSWORD}): admin dms.admin${DOMAIN} · HQ ${USER.ho.loginId} · Agra ${USER.agra.loginId} · Krishna Mobiles ${USER.kma.loginId}  (e-mail <key>${DOMAIN} also works)`);
await mongoose.disconnect();
