/**
 * Independent reconciliation of the seeded DMS demo database (read-only).
 *   MONGODB_URI=mongodb://127.0.0.1:27999/ node scripts/dms-demo-verify.js
 * Exits non-zero if any check fails. Each check recomputes a figure from raw documents and compares it with what the
 * application stores / reports (ledger, stock, serials, numbering, dashboard tiles, salary, targets).
 */
import express from 'express';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { env } from '../src/config/env.js';
import User from '../src/models/User.model.js';
import dmsRoutes from '../src/dms/index.js';
import { errorHandler } from '../src/middleware/errorHandler.middleware.js';
import * as TX from '../src/dms/models/txn.models.js';
import { DmsEntity } from '../src/dms/models/entity.model.js';
import { DmsLocation } from '../src/dms/models/master.models.js';
import { fyLabel } from '../src/dms/services/core.service.js';

const URI = process.env.MONGODB_URI || '';
const DB = process.env.DMS_DEMO_DB || 'dms_demo';
if (!/^mongodb:\/\/(127\.0\.0\.1|localhost)[:/]/.test(URI)) { console.error('Local database only.'); process.exit(1); }
await mongoose.connect(URI, { dbName: DB });
const r2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
const results = [];
const check = (name, pass, detail = '') => { results.push({ check: name, result: pass ? 'PASS' : 'FAIL', detail }); };

const locs = await DmsLocation.find().lean();
const lname = new Map(locs.map((l) => [String(l._id), l.name]));
const SALE = ['CORPORATE', 'UPLOAD_BILLING', 'RETAIL_LOCATION', 'RETAIL_CUSTOMER'];

/* 1 ─ party ledger = invoices issued − receipts received (seller-side convention verified on the reference) */
{
  const bad = [];
  for (const l of locs) {
    const id = l._id;
    const [inv] = await TX.DmsInvoice.aggregate([{ $match: { kind: { $in: SALE }, status: { $nin: ['Cancelled', 'Rejected'] }, 'from.location': id } }, { $group: { _id: null, v: { $sum: '$grandTotal' } } }]);
    const [retailPaid] = await TX.DmsInvoice.aggregate([{ $match: { kind: 'RETAIL_CUSTOMER', status: { $ne: 'Cancelled' }, 'from.location': id } }, { $group: { _id: null, v: { $sum: '$paidAmount' } } }]);
    const [pay] = await TX.DmsPayment.aggregate([{ $match: { kind: 'RECEIPT', status: 'Approve', toLocation: id } }, { $group: { _id: null, v: { $sum: '$receivedAmount' } } }]);
    const [prn] = await TX.DmsInvoice.aggregate([{ $match: { kind: 'PRN', status: 'Received', 'to.location': id } }, { $group: { _id: null, v: { $sum: '$grandTotal' } } }]);
    const adj = await TX.DmsPayment.find({ kind: 'ADJUSTMENT', fromLocation: id }).lean();
    const adjNet = adj.reduce((n, a) => n + (a.adjustType === 'DR' ? a.amount : -a.amount), 0);
    const expected = r2((inv?.v || 0) - (retailPaid?.v || 0) - (pay?.v || 0) - (prn?.v || 0) + adjNet);
    const [led] = await TX.DmsLedger.aggregate([{ $match: { party: id } }, { $group: { _id: null, dr: { $sum: '$dr' }, cr: { $sum: '$cr' } } }]);
    const actual = r2((led?.dr || 0) - (led?.cr || 0));
    if (Math.abs(expected - actual) > 0.01) bad.push(`${l.name}: ledger ${actual} vs recomputed ${expected}`);
  }
  check('Ledger net per location = invoices − receipts − returns ± adjustments', bad.length === 0, bad.join(' | ') || `${locs.length} locations reconciled`);
}

/* 2 ─ stock: bucket totals = Σ stock-ledger movements; closing of last ledger row = stock */
{
  const bad = [];
  const stocks = await TX.DmsStock.find().lean();
  for (const s of stocks) {
    for (const [bucket, f] of [['OK', 'okQty'], ['DAMAGE', 'damageQty'], ['MISSING', 'missingQty']]) {
      const [m] = await TX.DmsStockLedger.aggregate([{ $match: { location: s.location, product: s.product, bucket } }, { $group: { _id: null, i: { $sum: '$inQty' }, o: { $sum: '$outQty' } } }]);
      const net = (m?.i || 0) - (m?.o || 0);
      if (net !== s[f]) bad.push(`${lname.get(String(s.location))}/${s.product} ${bucket}: stock ${s[f]} vs ledger ${net}`);
    }
  }
  check('Stock buckets (OK/Damage/Missing) = Σ stock-ledger in − out', bad.length === 0, bad.slice(0, 3).join(' | ') || `${stocks.length} stock rows reconciled`);
  const neg = stocks.filter((s) => s.okQty < 0 || s.damageQty < 0 || s.missingQty < 0);
  check('No negative stock anywhere', neg.length === 0, `${neg.length} negative rows`);
}

/* 3 ─ serial register vs stock (serialized products) */
{
  const bad = [];
  const serialProducts = await mongoose.connection.db.collection('dms_products').find({ isSerialized: true }).toArray();
  for (const p of serialProducts) {
    for (const l of locs) {
      const inStock = await TX.DmsSerial.countDocuments({ product: p._id, location: l._id, status: 'IN_STOCK' });
      const st = await TX.DmsStock.findOne({ location: l._id, product: p._id }).lean();
      const ok = st?.okQty || 0;
      if (inStock !== ok) bad.push(`${l.name}/${p.productCode}: serials ${inStock} vs OK stock ${ok}`);
    }
  }
  const dup = await TX.DmsSerial.aggregate([{ $group: { _id: '$serialNo', n: { $sum: 1 } } }, { $match: { n: { $gt: 1 } } }]);
  check('Serials IN_STOCK per location = OK stock (serialized products)', bad.length === 0, bad.slice(0, 3).join(' | ') || `${serialProducts.length} serialized products reconciled`);
  check('Serial numbers are unique', dup.length === 0, `${dup.length} duplicates`);
  const [sold, total] = [await TX.DmsSerial.countDocuments({ status: 'SOLD' }), await TX.DmsSerial.countDocuments()];
  check('Serial register populated', total > 0, `${total} serials, ${sold} sold`);
}

/* 4 ─ document numbering: unique, FY matches the document date, series contiguous */
{
  const invs = await TX.DmsInvoice.find().select('invoiceNo invoiceDate kind').lean();
  const dupNo = invs.length - new Set(invs.map((i) => i.invoiceNo)).size;
  const wrongFy = invs.filter((i) => !i.invoiceNo.includes(`/${fyLabel(i.invoiceDate)}/`));
  const series = new Map();
  for (const i of invs) {
    const m = i.invoiceNo.match(/^(.*)\/(\d{4})$/);
    if (!m) continue;
    (series.get(m[1]) || series.set(m[1], []).get(m[1])).push(Number(m[2]));
  }
  const gaps = [];
  for (const [k, arr] of series) { arr.sort((a, b) => a - b); if (arr.some((n, idx) => n !== idx + 1)) gaps.push(k); }
  check('Invoice numbers are unique', dupNo === 0, `${dupNo} duplicates in ${invs.length}`);
  check('Invoice number financial year matches the invoice date', wrongFy.length === 0, `${wrongFy.length} mismatches`);
  check('Each numbering series (location/FY) is contiguous', gaps.length === 0, gaps.slice(0, 3).join(', ') || `${series.size} series`);
}

/* 5 ─ PO ↔ invoices */
{
  const pos = await TX.DmsPurchaseOrder.find({ poType: 'LOCATION' }).lean();
  const bad = [];
  for (const po of pos) {
    const invs = await TX.DmsInvoice.find({ po: po._id, status: { $ne: 'Cancelled' } }).lean();
    for (const l of po.lines) {
      const billed = invs.reduce((n, i) => n + i.lines.filter((x) => String(x.product) === String(l.product)).reduce((m, x) => m + x.qty, 0), 0);
      if (billed > l.reqQty) bad.push(`${po.poNo}: billed ${billed} > ordered ${l.reqQty}`);
    }
    if (['Approved', 'PFA', 'Rejected'].includes(po.status) && invs.length) bad.push(`${po.poNo}: status ${po.status} but has invoices`);
    if (po.status === 'Processed' && !invs.length) bad.push(`${po.poNo}: Processed without invoice`);
  }
  const counts = {};
  for (const p of pos) counts[p.status] = (counts[p.status] || 0) + 1;
  check('PO billing never exceeds ordered qty; statuses agree with invoices', bad.length === 0, bad.slice(0, 3).join(' | ') || JSON.stringify(counts));
}

/* 6 ─ dashboard tiles via the real endpoint vs independent aggregation */
{
  const admin = await User.findOne({ role: 'MASTER_ADMIN' });
  const app = express(); app.use(express.json()); app.use('/api/dms', dmsRoutes); app.use(errorHandler);
  const tok = jwt.sign({ userId: admin._id }, env.jwtAccessSecret, { expiresIn: '1h' });
  const res = await request(app).get('/api/dms/reports/dashboard').set('Authorization', `Bearer ${tok}`);
  const t = res.body.data?.tiles;
  const [coll] = await TX.DmsPayment.aggregate([{ $match: { kind: 'RECEIPT', status: 'Approve' } }, { $group: { _id: null, v: { $sum: '$receivedAmount' } } }]);
  const [led] = await TX.DmsLedger.aggregate([{ $group: { _id: null, dr: { $sum: '$dr' }, cr: { $sum: '$cr' } } }]);
  const [sale] = await TX.DmsInvoice.aggregate([{ $match: { kind: { $in: [...SALE, 'STN', 'JOBWORK'] }, status: { $nin: ['Cancelled', 'Rejected', 'PFA'] } } }, { $group: { _id: null, v: { $sum: '$grandTotal' } } }]);
  const [stockQty] = await TX.DmsStock.aggregate([{ $group: { _id: null, v: { $sum: '$okQty' } } }]);
  check('Dashboard "Collection" tile = Σ approved receipts', t && Math.abs(t.collection.amount - r2(coll?.v || 0)) < 0.01, `${t?.collection.amount} vs ${r2(coll?.v || 0)}`);
  check('Dashboard "Outstanding" tile = Σ ledger DR − CR', t && Math.abs(t.outstanding.amount - r2((led?.dr || 0) - (led?.cr || 0))) < 0.01, `${t?.outstanding.amount} vs ${r2((led?.dr || 0) - (led?.cr || 0))}`);
  check('Dashboard "Sale" tile = Σ sale documents', t && Math.abs(t.sale.amount - r2(sale?.v || 0)) < 0.01, `${t?.sale.amount} vs ${r2(sale?.v || 0)}`);
  check('Dashboard "Inventory" qty = Σ OK stock', t && t.inventory.qty === (stockQty?.v || 0), `${t?.inventory.qty} vs ${stockQty?.v}`);
}

/* 7 ─ payroll arithmetic */
{
  const sal = await DmsEntity.find({ type: 'salary' }).lean();
  const bad = sal.filter((s) => {
    const d = s.data;
    const gross = r2(d.basic + d.hra + d.allowances);
    const lop = r2((gross / d.workingDays) * d.lopDays);
    return Math.abs(d.gross - gross) > 0.01 || Math.abs(d.lopDeduction - lop) > 0.01 || Math.abs(d.net - r2(gross - d.pf - lop + d.bonus - d.otherDeduction)) > 0.01 || d.workingDays < d.presentDays - 0;
  });
  check('Salary slips: gross, LOP deduction and net recompute exactly', bad.length === 0 && sal.length > 0, `${sal.length} slips, ${bad.length} wrong`);
}

/* 8 ─ target achievement vs invoices */
{
  const tg = await DmsEntity.find({ type: 'target' }).lean();
  const MON = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const admin = await User.findOne({ role: 'MASTER_ADMIN' });
  const app = express(); app.use(express.json()); app.use('/api/dms', dmsRoutes); app.use(errorHandler);
  const tok = jwt.sign({ userId: admin._id }, env.jwtAccessSecret, { expiresIn: '1h' });
  let bad = 0;
  for (const t of tg.slice(0, 12)) {
    const prof = await mongoose.connection.db.collection('dms_profiles').findOne({ _id: new mongoose.Types.ObjectId(t.data.employee) });
    const [a] = await TX.DmsInvoice.aggregate([{ $match: { kind: { $in: SALE }, status: { $nin: ['Cancelled', 'Rejected'] }, entryByUser: prof.user, invoiceDate: { $gte: new Date(t.data.year, MON.indexOf(t.data.month), 1), $lt: new Date(t.data.year, MON.indexOf(t.data.month) + 1, 1) } } }, { $group: { _id: null, v: { $sum: '$grandTotal' } } }]);
    const res = await request(app).get(`/api/dms/entities/target/${t._id}`).set('Authorization', `Bearer ${tok}`);
    if (Math.abs(res.body.data.achieved - r2(a?.v || 0)) > 0.01) bad++;
  }
  check('Target "achieved" = the executive\'s invoices in that month', tg.length > 0 && bad === 0, `${Math.min(12, tg.length)} of ${tg.length} sampled, ${bad} wrong`);
}

/* 8b ─ historical reports: FY opening = previous FY closing; month totals = raw documents */
{
  const admin = await User.findOne({ role: 'MASTER_ADMIN' });
  const app = express(); app.use(express.json()); app.use('/api/dms', dmsRoutes); app.use(errorHandler);
  const tok = jwt.sign({ userId: admin._id }, env.jwtAccessSecret, { expiresIn: '1h' });
  const get = (u) => request(app).get('/api/dms' + u).set('Authorization', 'Bearer ' + tok);
  const bad = [];
  for (const l of locs.filter((x) => x.locationType !== 'Head Office').slice(0, 6)) {
    const a = (await get('/reports/party-ledger?location=' + l._id + '&from=2025-04-01&to=2026-03-31')).body.data;
    const b = (await get('/reports/party-ledger?location=' + l._id + '&from=2026-04-01&to=2026-11-19')).body.data;
    const whole = (await get('/reports/party-ledger?location=' + l._id + '&from=2024-01-01&to=2026-11-19')).body.data;
    if (Math.abs(a.closing - b.opening) > 0.01) bad.push(l.name + ': FY25-26 closing ' + a.closing + ' vs FY26-27 opening ' + b.opening);
    if (Math.abs(b.closing - whole.closing) > 0.01) bad.push(l.name + ': partial vs full-range closing differ');
  }
  check('Party ledger: FY25-26 closing = FY26-27 opening; ranges agree with full history', bad.length === 0, bad.slice(0, 2).join(' | ') || '6 locations chained across the FY boundary');
  const yr = (await get('/x/dash-yearly?year=2025')).body.data;
  const raw = await TX.DmsInvoice.aggregate([{ $match: { kind: { $in: SALE }, status: { $nin: ['Cancelled', 'Rejected', 'PFA'] }, invoiceDate: { $gte: new Date(2025, 0, 1), $lt: new Date(2026, 0, 1) } } }, { $group: { _id: { $month: '$invoiceDate' }, v: { $sum: '$grandTotal' } } }]);
  const rawTotal = r2(raw.reduce((n, x) => n + x.v, 0));
  const shown = r2(yr.series.reduce((n, x) => n + x.total, 0));
  check('Yearly dashboard (top-10 series) never exceeds the raw 2025 sale total; raw total is non-zero', rawTotal > 0 && shown <= rawTotal + 0.01, shown + ' of ' + rawTotal);
  const mon = (await get('/x/dash-monthly?year=2025&month=10')).body.data;
  const rawOct = await TX.DmsInvoice.aggregate([{ $match: { kind: { $in: SALE }, status: { $nin: ['Cancelled', 'Rejected', 'PFA'] }, invoiceDate: { $gte: new Date(2025, 9, 1), $lt: new Date(2025, 10, 1) } } }, { $unwind: '$lines' }, { $group: { _id: null, q: { $sum: '$lines.qty' }, v: { $sum: '$lines.total' } } }]);
  check('Day-wise dashboard for Oct-2025 sums to the raw documents', Math.abs(r2(mon.reduce((n, d) => n + d.amount, 0)) - r2(rawOct[0].v)) < 0.01 && mon.reduce((n, d) => n + d.qty, 0) === rawOct[0].q, mon.reduce((n, d) => n + d.qty, 0) + ' pcs');
}

/* 9 ─ coverage summary */
{
  const [mn] = await TX.DmsInvoice.aggregate([{ $group: { _id: null, a: { $min: '$invoiceDate' }, b: { $max: '$invoiceDate' } } }]);
  check('Historical coverage ≥ 20 months', mn && (mn.b - mn.a) / 86400000 > 600, `${mn?.a?.toISOString().slice(0, 10)} → ${mn?.b?.toISOString().slice(0, 10)}`);
}

console.table(results);
const failed = results.filter((r) => r.result === 'FAIL');
console.log(failed.length ? `\n${failed.length} check(s) FAILED` : `\nAll ${results.length} checks passed`);
await mongoose.disconnect();
process.exit(failed.length ? 1 : 0);
