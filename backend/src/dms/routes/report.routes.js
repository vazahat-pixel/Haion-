import { Router } from 'express';
import mongoose from 'mongoose';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess, sendPaginated } from '../../utils/apiResponse.js';
import { parsePagination } from '../../utils/pagination.util.js';
import { DmsInvoice, DmsPurchaseOrder, DmsPayment, DmsStock, DmsStockLedger, DmsLedger } from '../models/txn.models.js';
import { DmsLocation, DmsProduct, DmsVendor } from '../models/master.models.js';
import { requirePage } from '../middleware/context.js';
import { DmsError, round2 } from '../services/core.service.js';

const router = Router();

/**
 * Products selected by the reference report filters (Product Category, Product Sub Category, Brand, Product).
 * null = no product filter; [] = filters match no product.
 */
async function productSet(req) {
  const ok = (v) => v && mongoose.isValidObjectId(v);
  const { category, subCategory, brand, product } = req.query;
  if (![category, subCategory, brand, product].some(ok)) return null;
  const q = {};
  if (ok(category)) q.category = category;
  if (ok(subCategory)) q.subCategory = subCategory;
  if (ok(brand)) q.brand = brand;
  if (ok(product)) q._id = product;
  return (await DmsProduct.find(q).select('_id').lean()).map((p) => p._id);
}
const oid = (v) => new mongoose.Types.ObjectId(String(v));
/** Ledger "Document Type" captions. RETAIL INVOICE and Payment Received are verified on the reference; the rest follow the same style. */
const DOC_TYPE_LABEL = {
  RETAIL_LOCATION: 'RETAIL INVOICE', RETAIL_CUSTOMER: 'RETAIL INVOICE', CORPORATE: 'CORPORATE INVOICE', UPLOAD_BILLING: 'CORPORATE INVOICE', PAYMENT: 'Payment Received',
  PRN: 'PURCHASE RETURN', ADJUSTMENT_CR: 'Account Adjustment (CR)', ADJUSTMENT_DR: 'Account Adjustment (DR)',
  RETAIL_LOCATION_CANCEL: 'RETAIL INVOICE CANCELLED', RETAIL_CUSTOMER_CANCEL: 'RETAIL INVOICE CANCELLED', CORPORATE_CANCEL: 'CORPORATE INVOICE CANCELLED', UPLOAD_BILLING_CANCEL: 'CORPORATE INVOICE CANCELLED',
};
const SALE_KINDS = ['CORPORATE', 'UPLOAD_BILLING', 'RETAIL_LOCATION', 'RETAIL_CUSTOMER'];
const STN_KINDS = ['STN', 'JOBWORK'];

/** Location ids the query may cover: an explicit ?location (must be visible) or the caller's scope. */
function locIds(req) {
  if (req.query.location) {
    if (!mongoose.isValidObjectId(req.query.location) || !req.dms.canSee(req.query.location)) throw new DmsError('Location is outside your access', 403);
    return [oid(req.query.location)];
  }
  return req.dms.allowedLocationIds === null ? null : req.dms.allowedLocationIds.map(oid);
}
const inIds = (ids, path) => (ids === null ? {} : { [path]: { $in: ids } });
const dateRange = (req, path) => {
  const r = {};
  if (req.query.from) r.$gte = new Date(req.query.from);
  if (req.query.to) r.$lte = new Date(`${req.query.to}T23:59:59`);
  return Object.keys(r).length ? { [path]: r } : {};
};

/* ── home dashboard ── */
router.get('/dashboard', requirePage('home'), asyncHandler(async (req, res) => {
  const ids = locIds(req);
  const txn = req.query.txn || 'both'; // both | invoice | stn
  const kinds = txn === 'invoice' ? SALE_KINDS : txn === 'stn' ? STN_KINDS : [...SALE_KINDS, ...STN_KINDS];
  const live = { status: { $nin: ['Cancelled', 'Rejected', 'PFA'] } };
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const sumDocs = (match) => DmsInvoice.aggregate([{ $match: match }, { $group: { _id: null, amt: { $sum: '$grandTotal' }, qty: { $sum: '$totalQty' } } }]);

  const [sale, purchase, po, collection, stock, ledger, topModels, topSellers, poStatus, invStatus, monthly] = await Promise.all([
    sumDocs({ kind: { $in: kinds }, ...live, ...inIds(ids, 'from.location') }),
    sumDocs({ kind: { $in: [...kinds, 'LOCAL_PURCHASE'] }, status: 'Received', ...inIds(ids, 'to.location') }),
    DmsPurchaseOrder.aggregate([{ $match: { status: { $nin: ['Cancelled', 'Rejected'] }, ...inIds(ids, 'from.location') } }, { $group: { _id: null, amt: { $sum: '$grandTotal' }, qty: { $sum: '$totalQty' } } }]),
    DmsPayment.aggregate([{ $match: { kind: 'RECEIPT', status: 'Approve', ...inIds(ids, 'toLocation') } }, { $group: { _id: null, amt: { $sum: '$receivedAmount' } } }]),
    // inventory value = OK qty × last invoiced price of each product. Two cheap aggregations instead of a per-stock-row
    // lookup into every invoice line (that lookup made the home page take minutes on a remote database).
    Promise.all([
      DmsStock.aggregate([{ $match: inIds(ids, 'location') }, { $group: { _id: '$product', qty: { $sum: '$okQty' } } }]),
      DmsInvoice.aggregate([
        { $sort: { createdAt: -1 } }, { $project: { lines: { product: 1, price: 1 } } }, { $unwind: '$lines' },
        { $group: { _id: '$lines.product', price: { $first: '$lines.price' } } },
      ]),
    ]).then(([byProduct, prices]) => {
      const last = new Map(prices.map((p) => [String(p._id), p.price || 0]));
      return [{ qty: byProduct.reduce((n, r) => n + (r.qty || 0), 0), value: byProduct.reduce((n, r) => n + (r.qty || 0) * (last.get(String(r._id)) || 0), 0) }];
    }),
    DmsLedger.aggregate([{ $match: inIds(ids, 'party') }, { $group: { _id: null, dr: { $sum: '$dr' }, cr: { $sum: '$cr' } } }]),
    DmsInvoice.aggregate([
      { $match: { kind: { $in: kinds }, ...live, invoiceDate: { $gte: monthStart }, ...inIds(ids, 'from.location') } },
      { $unwind: '$lines' }, { $group: { _id: '$lines.productCode', qty: { $sum: '$lines.qty' }, amt: { $sum: '$lines.total' } } },
      { $sort: { qty: -1 } }, { $limit: 5 },
    ]),
    DmsInvoice.aggregate([
      { $match: { kind: { $in: kinds }, ...live, invoiceDate: { $gte: monthStart }, ...inIds(ids, 'from.location') } },
      { $group: { _id: '$from.name', amt: { $sum: '$grandTotal' } } }, { $sort: { amt: -1 } }, { $limit: 5 },
    ]),
    DmsPurchaseOrder.aggregate([{ $match: { poDate: { $gte: monthStart }, ...(ids === null ? {} : { $or: [{ 'from.location': { $in: ids } }, { 'to.location': { $in: ids } }] }) } }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
    DmsInvoice.aggregate([{ $match: { kind: { $in: kinds }, invoiceDate: { $gte: monthStart }, ...inIds(ids, 'from.location') } }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
    DmsInvoice.aggregate([
      { $match: { kind: { $in: kinds }, ...live, invoiceDate: { $gte: new Date(new Date().getFullYear() - 1, new Date().getMonth() + 1, 1) }, ...inIds(ids, 'from.location') } },
      { $group: { _id: { y: { $year: '$invoiceDate' }, m: { $month: '$invoiceDate' } }, amt: { $sum: '$grandTotal' }, qty: { $sum: '$totalQty' } } },
      { $sort: { '_id.y': 1, '_id.m': 1 } },
    ]),
  ]);
  const one = (a, k) => round2(a[0]?.[k] || 0);
  sendSuccess(res, {
    data: {
      tiles: {
        sale: { amount: one(sale, 'amt'), qty: one(sale, 'qty') },
        purchase: { amount: one(purchase, 'amt'), qty: one(purchase, 'qty') },
        po: { amount: one(po, 'amt'), qty: one(po, 'qty') },
        collection: { amount: one(collection, 'amt') },
        inventory: { qty: one(stock, 'qty'), amount: one(stock, 'value') },
        outstanding: { amount: round2(one(ledger, 'dr') - one(ledger, 'cr')) },
      },
      topModels: topModels.map((r) => ({ name: r._id, qty: r.qty, amount: round2(r.amt) })),
      topSellers: topSellers.map((r) => ({ name: r._id, amount: round2(r.amt) })),
      poStatus: poStatus.map((r) => ({ status: r._id, count: r.count })),
      invoiceStatus: invStatus.map((r) => ({ status: r._id, count: r.count })),
      monthly: monthly.map((r) => ({ month: `${r._id.y}-${String(r._id.m).padStart(2, '0')}`, amount: round2(r.amt), qty: r.qty })),
    },
  });
}));

/* ── inventory (stock) ── */
router.get('/inventory', requirePage('r_inventory', 'dash_inventory', 'home'), asyncHandler(async (req, res) => {
  const ids = locIds(req);
  const match = { ...inIds(ids, 'location') };
  const prods = await productSet(req);
  if (prods) match.product = { $in: prods };
  const invType = req.query.inventoryType === 'IMEI INVENTORY' ? true : req.query.inventoryType === 'QTY INVENTORY' ? false : null;
  const rows = await DmsStock.aggregate([
    { $match: match },
    { $lookup: { from: 'dms_products', localField: 'product', foreignField: '_id', as: 'p' } }, { $unwind: '$p' },
    { $lookup: { from: 'dms_locations', localField: 'location', foreignField: '_id', as: 'l' } }, { $unwind: '$l' },
    ...(invType === null ? [] : [{ $match: { 'p.isSerialized': invType } }]),
    { $project: { productId: '$p._id', locationId: '$l._id', location: '$l.name', locationCode: '$l.code', locationType: '$l.locationType', productCode: '$p.productCode', productName: '$p.name', color: '$p.color', isSerialized: '$p.isSerialized', okQty: 1, damageQty: 1, missingQty: 1, lastInAt: 1 } },
    { $sort: { location: 1, productCode: 1 } },
  ]);
  sendSuccess(res, { data: rows });
}));

/* ── inventory aging (FIFO on stock-ledger inward rows) ── */
router.get('/aging', requirePage('r_aging'), asyncHandler(async (req, res) => {
  const ids = locIds(req);
  const prods = await productSet(req);
  const stock = await DmsStock.find({ ...inIds(ids, 'location'), ...(prods ? { product: { $in: prods } } : {}) }).populate('product', 'productCode name isSerialized').populate('location', 'name locationType').lean();
  // one query for every inward movement (newest first); stock is aged FIFO-from-the-top: the units still on hand are the most recent receipts
  const inward = await DmsStockLedger.find({ ...inIds(ids, 'location'), inQty: { $gt: 0 } }).sort({ createdAt: -1 }).select('location product bucket inQty createdAt').lean();
  const byKey = new Map();
  for (const r of inward) { const k = `${r.location}|${r.product}|${r.bucket}`; (byKey.get(k) || byKey.set(k, []).get(k)).push(r); }
  const now = Date.now();
  const out = [];
  for (const s of stock) {
    if (!s.product || !s.location) continue;
    const row = { location: s.location.name, locationType: s.location.locationType, productCode: s.product.productCode, productName: s.product.name, nature: s.product.isSerialized ? 'Serialized' : 'Non-Serialized', b0: {}, b16: {}, b31: {} };
    for (const [bucket, field, key] of [['OK', 'okQty', 'ok'], ['DAMAGE', 'damageQty', 'dm'], ['MISSING', 'missingQty', 'ms']]) {
      let left = s[field] || 0;
      for (const r of byKey.get(`${s.location._id}|${s.product._id}|${bucket}`) || []) {
        if (left <= 0) break;
        const take = Math.min(left, r.inQty); left -= take;
        const days = (now - new Date(r.createdAt).getTime()) / 86400000;
        const bk = days <= 15 ? 'b0' : days <= 30 ? 'b16' : 'b31';
        row[bk][key] = (row[bk][key] || 0) + take;
      }
      if (left > 0) row.b31[key] = (row.b31[key] || 0) + left;
    }
    out.push(row);
  }
  sendSuccess(res, { data: out });
}));

/* ── stock ledger ── */
router.get('/stock-ledger', requirePage('r_stock_ledger'), asyncHandler(async (req, res) => {
  const { skip, perPage, page } = parsePagination(req.query);
  if (!req.query.location) throw new DmsError('Select a location', 422, { location: ['Required'] });
  const q = { location: locIds(req)[0], ...dateRange(req, 'createdAt') };
  const prods = await productSet(req);
  if (prods) q.product = { $in: prods };
  const [data, total] = await Promise.all([
    DmsStockLedger.find(q).populate('product', 'productCode name').sort({ createdAt: -1 }).skip(skip).limit(perPage).lean(),
    DmsStockLedger.countDocuments(q),
  ]);
  sendPaginated(res, { data, total, page, perPage });
}));

/* ── party ledger with running balance ── */
router.get('/party-ledger', requirePage('r_ledger'), asyncHandler(async (req, res) => {
  if (!req.query.location) throw new DmsError('Select a party', 422, { location: ['Required'] });
  const [party] = locIds(req);
  const q = { party, ...dateRange(req, 'txnDate') };
  // reference filters: Party Name (the other location) and Vendor Name (vendor documents carry the vendor's name)
  if (req.query.counterparty && mongoose.isValidObjectId(req.query.counterparty)) q.counterparty = oid(req.query.counterparty);
  if (req.query.vendor && mongoose.isValidObjectId(req.query.vendor)) q.counterpartyName = (await DmsVendor.findById(req.query.vendor).select('name').lean())?.name || '-';
  const rows = await DmsLedger.find(q).sort({ txnDate: 1, createdAt: 1 }).lean();
  const before = req.query.from ? await DmsLedger.aggregate([{ $match: { party, txnDate: { $lt: new Date(req.query.from) } } }, { $group: { _id: null, dr: { $sum: '$dr' }, cr: { $sum: '$cr' } } }]) : [];
  let bal = round2((before[0]?.dr || 0) - (before[0]?.cr || 0));
  const opening = bal;
  const loc = await DmsLocation.findById(party).select('name code').lean();
  const data = rows.map((r) => {
    bal = round2(bal + r.dr - r.cr);
    return { ...r, balance: bal, locationName: loc?.name, docTypeLabel: DOC_TYPE_LABEL[r.docType] || r.docType.replace(/_/g, ' ') };
  });
  sendSuccess(res, { data: { party: loc, opening, closing: bal, totalDr: round2(rows.reduce((n, r) => n + r.dr, 0)), totalCr: round2(rows.reduce((n, r) => n + r.cr, 0)), rows: data } });
}));

/* ── sale / purchase / return / PO reports (flat line rows) ── */
router.get('/documents', requirePage('r_sale', 'r_po', 'r_return', 'r_vendor', 'r_payment', 'r_collection'), asyncHandler(async (req, res) => {
  const kinds = String(req.query.kind || SALE_KINDS.join(',')).split(',');
  const ids = locIds(req);
  const q = { kind: { $in: kinds }, ...dateRange(req, 'invoiceDate') };
  if (ids !== null) q.$or = [{ 'from.location': { $in: ids } }, { 'to.location': { $in: ids } }];
  if (req.query.toLocation && mongoose.isValidObjectId(req.query.toLocation)) q['to.location'] = oid(req.query.toLocation);
  if (req.query.status) q.status = { $in: String(req.query.status).split(',') };
  if (req.query.docType) q.docType = req.query.docType;
  if (req.query.vendor && mongoose.isValidObjectId(req.query.vendor)) q.$and = [...(q.$and || []), { $or: [{ 'from.vendor': oid(req.query.vendor) }, { 'to.vendor': oid(req.query.vendor) }] }];
  const prods = await productSet(req);
  if (prods) q['lines.product'] = { $in: prods };
  const scheme = req.query.scheme ? String(req.query.scheme) : '';
  if (scheme) q['lines.schemeName'] = scheme;
  const keep = new Set((prods || []).map(String));
  const docs = await DmsInvoice.find(q).sort({ invoiceDate: -1 }).limit(5000).lean();
  const rows = docs.flatMap((d) => d.lines.filter((l) => (!prods || keep.has(String(l.product))) && (!scheme || l.schemeName === scheme)).map((l) => ({
    invoiceNo: d.invoiceNo, invoiceDate: d.invoiceDate, kind: d.kind, docType: d.docType, status: d.status,
    from: d.from.name, to: d.to.name, poNo: d.poNo, productCode: l.productCode, productName: l.productName, hsnCode: l.hsnCode,
    qty: l.qty, price: l.price, discount: round2(l.discountPerUnit * l.qty), taxable: l.afterDiscount,
    tax: round2(l.sgstAmt + l.cgstAmt + l.igstAmt), total: l.total, scheme: l.schemeName, serials: (l.serials || []).join(' '),
  })));
  sendSuccess(res, { data: rows });
}));

export default router;
