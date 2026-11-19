/** Remaining dashboards, reports and bulk tools (/api/dms/x). */
import { Router } from 'express';
import mongoose from 'mongoose';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess, sendCreated } from '../../utils/apiResponse.js';
import { DmsInvoice, DmsPayment, DmsLedger, DmsSerial } from '../models/txn.models.js';
import { DmsLocation, DmsMaster, DmsProduct } from '../models/master.models.js';
import { DmsEntity } from '../models/entity.model.js';
import { requirePage } from '../middleware/context.js';
import { DmsError, round2 } from '../services/core.service.js';

const router = Router();
const isId = (v) => mongoose.isValidObjectId(v);
const oid = (v) => new mongoose.Types.ObjectId(String(v));
const SALE = ['CORPORATE', 'UPLOAD_BILLING', 'RETAIL_LOCATION', 'RETAIL_CUSTOMER'];
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function locScope(req, explicit) {
  if (explicit) {
    if (!isId(explicit) || !req.dms.canSee(explicit)) throw new DmsError('Location is outside your access', 403);
    return [oid(explicit)];
  }
  return req.dms.allowedLocationIds === null ? null : req.dms.allowedLocationIds.map(oid);
}
const inIds = (ids, path) => (ids === null ? {} : { [path]: { $in: ids } });
const live = { status: { $nin: ['Cancelled', 'Rejected', 'PFA'] } };

/* ── Dashboard 1: yearly, by customer or location ── */
router.get('/dash-yearly', requirePage('dash_yearly'), asyncHandler(async (req, res) => {
  const year = Number(req.query.year);
  if (!(year >= 2000 && year <= 2100)) throw new DmsError('Select a year', 422, { year: ['Required'] });
  const byCustomer = req.query.by === 'Customer';
  const ids = locScope(req, req.query.location);
  const rows = await DmsInvoice.aggregate([
    { $match: { kind: { $in: byCustomer ? ['RETAIL_CUSTOMER'] : SALE }, ...live, invoiceDate: { $gte: new Date(year, 0, 1), $lt: new Date(year + 1, 0, 1) }, ...inIds(ids, 'from.location') } },
    { $group: { _id: { n: byCustomer ? '$to.name' : '$from.name', m: { $month: '$invoiceDate' } }, amt: { $sum: '$grandTotal' }, qty: { $sum: '$totalQty' } } },
  ]);
  const map = new Map();
  for (const r of rows) {
    const s = map.get(r._id.n) || { name: r._id.n, amount: Array(12).fill(0), qty: Array(12).fill(0), total: 0 };
    s.amount[r._id.m - 1] = round2(r.amt); s.qty[r._id.m - 1] = r.qty; s.total += r.amt;
    map.set(r._id.n, s);
  }
  const series = [...map.values()].sort((a, b) => b.total - a.total).slice(0, 10);
  sendSuccess(res, { data: { months: MON, series, chart: MON.map((m, i) => Object.fromEntries([['month', m], ...series.map((s) => [s.name, s.amount[i]])])) } });
}));

/* ── Dashboard 2: month, day-wise qty/amount with location + product filter ── */
router.get('/dash-monthly', requirePage('dash_monthly'), asyncHandler(async (req, res) => {
  const year = Number(req.query.year); const month = Number(req.query.month);
  if (!(year >= 2000) || !(month >= 1 && month <= 12)) throw new DmsError('Select year and month', 422);
  const ids = locScope(req, req.query.location);
  const prodMatch = req.query.product && isId(req.query.product) ? { 'lines.product': oid(req.query.product) } : {};
  const rows = await DmsInvoice.aggregate([
    { $match: { kind: { $in: SALE }, ...live, invoiceDate: { $gte: new Date(year, month - 1, 1), $lt: new Date(year, month, 1) }, ...inIds(ids, 'from.location') } },
    { $unwind: '$lines' }, { $match: prodMatch },
    { $group: { _id: { $dayOfMonth: '$invoiceDate' }, qty: { $sum: '$lines.qty' }, amt: { $sum: '$lines.total' } } }, { $sort: { _id: 1 } },
  ]);
  const days = new Date(year, month, 0).getDate();
  const m = new Map(rows.map((r) => [r._id, r]));
  sendSuccess(res, { data: Array.from({ length: days }, (_, i) => ({ day: i + 1, qty: m.get(i + 1)?.qty || 0, amount: round2(m.get(i + 1)?.amt || 0) })) });
}));

/* ── Lead dashboard ── */
router.get('/dash-lead', requirePage('dash_lead'), asyncHandler(async (req, res) => {
  const range = {};
  if (req.query.from) range.$gte = new Date(req.query.from);
  if (req.query.to) range.$lte = new Date(`${req.query.to}T23:59:59`);
  const scope = req.dms.isAdmin ? {} : { $or: [{ location: { $in: req.dms.allowedLocationIds } }, { ownerLoginId: String(req.dms.loginId).toLowerCase() }] };
  const leads = await DmsEntity.find({ type: 'lead', ...scope, ...(Object.keys(range).length ? { createdAt: range } : {}) }).lean();
  const leadIds = leads.map((l) => String(l._id));
  const quotes = await DmsEntity.find({ type: 'quote', 'data.lead': { $in: leadIds } }).select('data.lead data.lines').lean();
  const quotedLeads = new Set(quotes.map((q) => q.data.lead));
  const orderStatuses = ['Sale Order', 'Won', 'Converted'];
  const quoteValue = new Map(quotes.map((q) => [q.data.lead, (q.data.lines || []).reduce((n, l) => n + l.total, 0)]));
  const area = new Map(); const user = new Map();
  for (const l of leads) {
    const a = area.get(l.data.area) || { area: l.data.area, lead: 0, quote: 0, order: 0 };
    a.lead += 1; if (quotedLeads.has(String(l._id))) a.quote += 1; if (orderStatuses.includes(l.status)) a.order += 1;
    area.set(l.data.area, a);
    const u = user.get(l.createdByName) || { user: l.createdByName, leads: 0, orders: 0, value: 0 };
    u.leads += 1; if (orderStatuses.includes(l.status)) { u.orders += 1; u.value += quoteValue.get(String(l._id)) || 0; }
    user.set(l.createdByName, u);
  }
  const pct = (a, b) => (b ? round2((a / b) * 100) : 0);
  const todayIso = new Date().toISOString().slice(0, 10);
  sendSuccess(res, {
    data: {
      conversion: [...area.values()].map((a) => ({ ...a, quotePct: pct(a.quote, a.lead), orderPct: pct(a.order, a.lead) })),
      upcoming: leads.filter((l) => l.data.followUpDate && l.data.followUpDate >= todayIso && !['Closed', 'Cancelled', 'Lost', 'Won', 'Converted'].includes(l.status))
        .sort((a, b) => a.data.followUpDate.localeCompare(b.data.followUpDate)).slice(0, 20)
        .map((l) => ({ _id: l._id, lead: l.docNo, party: l.data.partyName, priority: l.data.priority, status: l.status, date: l.data.followUpDate })),
      top: [...user.values()].map((u) => ({ ...u, value: round2(u.value), ratio: pct(u.orders, u.leads) })).sort((a, b) => b.ratio - a.ratio || b.leads - a.leads).slice(0, 10),
    },
  });
}));

/* ── Collection sheet ── */
router.get('/collection', requirePage('r_collection'), asyncHandler(async (req, res) => {
  const date = req.query.date;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '')) throw new DmsError('Select a date', 422, { date: ['Required'] });
  const ids = locScope(req, req.query.location);
  const day = { $gte: new Date(`${date}T00:00:00`), $lte: new Date(`${date}T23:59:59.999`) };
  const base = { kind: 'RECEIPT', status: 'Approve', ...inIds(ids, 'toLocation') };
  const rows = await DmsPayment.find({ ...base, paymentDate: day }).populate('fromLocation', 'name city').populate('toLocation', 'name city').sort({ createdAt: 1 }).lean();
  const prev = await DmsPayment.aggregate([
    { $match: { ...base, paymentDate: { $lt: day.$gte } } },
    { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$paymentDate' } }, amount: { $sum: '$receivedAmount' }, count: { $sum: 1 } } }, { $sort: { _id: -1 } }, { $limit: 15 },
  ]);
  sendSuccess(res, { data: { rows, total: round2(rows.reduce((n, r) => n + r.receivedAmount, 0)), previous: prev.map((p) => ({ date: p._id, amount: round2(p.amount), count: p.count })) } });
}));

/* ── Payment status (payable / receivable) ── */
router.get('/payment-status', requirePage('r_payment'), asyncHandler(async (req, res) => {
  const { type } = req.query;
  if (!['Payable', 'Receivable'].includes(type)) throw new DmsError('Select a payment type', 422, { type: ['Required'] });
  if (!req.query.location) throw new DmsError('Select a location', 422, { location: ['Required'] });
  const [loc] = locScope(req, req.query.location);
  // Payable: this location is the debtor (ledger.party). Receivable: it is the creditor (ledger.counterparty).
  const match = type === 'Payable' ? { party: loc } : { counterparty: loc };
  const group = type === 'Payable' ? '$counterparty' : '$party';
  const rows = await DmsLedger.aggregate([{ $match: match }, { $group: { _id: group, dr: { $sum: '$dr' }, cr: { $sum: '$cr' } } }]);
  const locs = await DmsLocation.find({ _id: { $in: rows.map((r) => r._id).filter(Boolean) } }).select('name city code').lean();
  const lm = new Map(locs.map((l) => [String(l._id), l]));
  const data = rows.map((r) => ({ party: lm.get(String(r._id))?.name || 'Unknown', code: lm.get(String(r._id))?.code, invoiced: round2(r.dr), paid: round2(r.cr), outstanding: round2(r.dr - r.cr) })).filter((r) => r.outstanding !== 0);
  sendSuccess(res, { data });
}));

/* ── Price drop (price changes of a product over time) ── */
router.get('/price-drop', requirePage('r_price_drop'), asyncHandler(async (req, res) => {
  const { product } = req.query;
  if (!isId(product)) throw new DmsError('Select a product', 422, { product: ['Required'] });
  const ids = locScope(req, req.query.location);
  const docs = await DmsInvoice.aggregate([
    { $match: { kind: { $in: [...SALE, 'STN', 'LOCAL_PURCHASE'] }, ...live, ...(ids === null ? {} : { $or: [{ 'from.location': { $in: ids } }, { 'to.location': { $in: ids } }] }) } },
    { $unwind: '$lines' }, { $match: { 'lines.product': oid(product) } }, { $sort: { invoiceDate: 1 } },
    { $project: { invoiceNo: 1, invoiceDate: 1, from: '$from.name', price: '$lines.price' } },
  ]);
  const out = []; let last = null;
  for (const d of docs) {
    if (last !== null && d.price !== last) out.push({ date: d.invoiceDate, invoiceNo: d.invoiceNo, from: d.from, oldPrice: last, newPrice: d.price, change: round2(d.price - last), percent: round2(((d.price - last) / last) * 100) });
    last = d.price;
  }
  sendSuccess(res, { data: out.reverse() });
}));

/* ── Party master (mapping) ── */
router.get('/party-master', requirePage('r_party_master'), asyncHandler(async (req, res) => {
  const q = { ...(req.dms.allowedLocationIds === null ? {} : { _id: { $in: req.dms.allowedLocationIds } }) };
  if (req.query.location && isId(req.query.location)) q._id = req.query.location;
  const locs = await DmsLocation.find(q).populate('mappedLocations', 'name code').sort({ name: 1 }).lean();
  sendSuccess(res, { data: locs.flatMap((l) => (l.mappedLocations.length ? l.mappedLocations.map((m) => ({ party: l.name, mapped: `${m.name} (${m.code})`, status: l.status })) : [{ party: l.name, mapped: '—', status: l.status }])) });
}));

/* ── ISD report: serials sold to customers ── */
router.get('/isd', requirePage('r_isd'), asyncHandler(async (req, res) => {
  const ids = locScope(req, req.query.location);
  const dr = {};
  if (req.query.from) dr.$gte = new Date(req.query.from);
  if (req.query.to) dr.$lte = new Date(`${req.query.to}T23:59:59`);
  const rows = await DmsInvoice.aggregate([
    { $match: { kind: 'RETAIL_CUSTOMER', ...live, ...(Object.keys(dr).length ? { invoiceDate: dr } : {}), ...inIds(ids, 'from.location') } },
    { $unwind: '$lines' }, { $unwind: '$lines.serials' },
    { $lookup: { from: 'dms_customers', localField: 'to.customer', foreignField: '_id', as: 'c' } },
    { $project: { isp: '$entryBy', serial: '$lines.serials', customer: '$to.name', location: '$from.name', phone: { $first: '$c.phone' }, state: '$to.state', city: '$to.city', date: '$invoiceDate' } },
    { $sort: { date: -1 } }, { $limit: 5000 },
  ]);
  sendSuccess(res, { data: rows });
}));

/* ── Serial activation: upload + report ── */
router.post('/serial-activate', requirePage('m_serial_activation'), asyncHandler(async (req, res) => {
  const { product } = req.body;
  const list = [...new Set((req.body.serials || []).map((s) => String(s).trim().toUpperCase()).filter(Boolean))].slice(0, 5000);
  if (!isId(product)) throw new DmsError('Select a product', 422, { product: ['Required'] });
  if (!list.length) throw new DmsError('The file has no serial numbers', 422);
  const p = await DmsProduct.findById(product).select('productCode').lean();
  if (!p) throw new DmsError('Product not found', 404);
  const found = await DmsSerial.find({ serialNo: { $in: list }, product }).select('serialNo activated').lean();
  const fm = new Map(found.map((s) => [s.serialNo, s]));
  const unknown = list.filter((s) => !fm.has(s));
  const already = found.filter((s) => s.activated).map((s) => s.serialNo);
  const toDo = found.filter((s) => !s.activated).map((s) => s.serialNo);
  if (toDo.length) await DmsSerial.updateMany({ serialNo: { $in: toDo } }, { $set: { activated: true, activatedAt: new Date() }, $push: { history: { at: new Date(), docKind: 'ACTIVATION', status: 'ACTIVATED', docNo: req.dms.loginId } } });
  sendSuccess(res, { data: { activated: toDo.length, alreadyActive: already.length, unknown: unknown.slice(0, 50), unknownCount: unknown.length }, message: `${toDo.length} serial(s) activated` });
}));
router.get('/serial-activation', requirePage('r_serial_activation'), asyncHandler(async (req, res) => {
  const dr = {};
  if (req.query.from) dr.$gte = new Date(req.query.from);
  if (req.query.to) dr.$lte = new Date(`${req.query.to}T23:59:59`);
  const rows = await DmsSerial.find({ activated: true, ...(Object.keys(dr).length ? { activatedAt: dr } : {}) }).populate('product', 'name productCode').populate('location', 'name').sort({ activatedAt: -1 }).limit(5000).lean();
  sendSuccess(res, { data: rows.map((r) => ({ serialNo: r.serialNo, product: r.product ? `${r.product.name} | ${r.product.productCode}` : '', status: r.status, location: r.location?.name || '', activatedAt: r.activatedAt })) });
}));

/* ── delivery matrix bulk upload ── */
router.post('/delivery-bulk', requirePage('m_delivery'), asyncHandler(async (req, res) => {
  const rows = Array.isArray(req.body.rows) ? req.body.rows.slice(0, 2000) : [];
  if (!rows.length) throw new DmsError('The file has no rows', 422);
  const errs = []; const ops = [];
  rows.forEach((r, i) => {
    const days = Number(r.days);
    if (!String(r.fromCity || '').trim() || !String(r.toCity || '').trim() || !String(r.category || '').trim()) errs.push(`Row ${i + 2}: fromCity, toCity and category are required`);
    else if (!Number.isInteger(days) || days < 0) errs.push(`Row ${i + 2}: days must be a whole number`);
    else {
      const name = `${r.fromCity.trim()}>${r.toCity.trim()}>${r.category.trim()}`;
      ops.push({ updateOne: { filter: { type: 'productdelivery', name }, update: { $set: { type: 'productdelivery', name, status: 'Active', attrs: { fromCity: r.fromCity.trim(), toCity: r.toCity.trim(), category: r.category.trim(), days } } }, upsert: true } });
    }
  });
  if (errs.length) throw new DmsError(`${errs.length} row(s) have errors; nothing was uploaded`, 422, { rows: errs.slice(0, 20) });
  await DmsMaster.bulkWrite(ops);
  sendCreated(res, { data: { saved: ops.length }, message: `${ops.length} delivery row(s) saved` });
}));

/* ── distance covered (app track location) ── */
const rad = (d) => (d * Math.PI) / 180;
const hav = (a, b) => {
  const dLat = rad(b.lat - a.lat); const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
};
router.get('/track-distance', requirePage('app_track'), asyncHandler(async (req, res) => {
  const { user, from, to } = req.query;
  if (!user) throw new DmsError('Select a user', 422, { user: ['Required'] });
  const q = { type: 'track', ownerLoginId: String(user).toLowerCase(), 'data.lat': { $type: 'number' }, 'data.lng': { $type: 'number' } };
  if (from || to) q['data.travelDate'] = { ...(from ? { $gte: from } : {}), ...(to ? { $lte: to } : {}) };
  const pts = await DmsEntity.find(q).sort({ 'data.travelDate': 1, createdAt: 1 }).select('data.lat data.lng').lean();
  let km = 0;
  for (let i = 1; i < pts.length; i += 1) km += hav(pts[i - 1].data, pts[i].data);
  sendSuccess(res, { data: { points: pts.length, km: round2(km) } });
}));

/* ── HR: other requests report ── */
router.get('/other-requests', requirePage('rp_other'), asyncHandler(async (req, res) => {
  const t = req.query.type;
  const map = { 'Apply for ID Card': ['application', 'type', 'ID Card'], 'Apply for Visiting Card': ['application', 'type', 'Visiting Card'], 'Apply for Loan': ['application', 'type', 'Loan'], 'Travelling Claim': ['claim', 'claimType', 'Travelling'], 'Lodging Claim': ['claim', 'claimType', 'Lodging'] };
  if (!map[t]) throw new DmsError('Select a request type', 422, { type: ['Required'] });
  const [type, field, value] = map[t];
  const dr = {};
  if (req.query.from) dr.$gte = new Date(req.query.from);
  if (req.query.to) dr.$lte = new Date(`${req.query.to}T23:59:59`);
  const rows = await DmsEntity.find({ type, [`data.${field}`]: value, ...(Object.keys(dr).length ? { createdAt: dr } : {}) }).sort({ createdAt: -1 }).limit(2000).lean();
  sendSuccess(res, { data: rows.map((r) => ({ _id: r._id, employee: r.createdByName, request: t, date: r.createdAt, amount: r.data.amount || '', details: r.data.details || r.data.description || '', status: r.status })) });
}));

export default router;
