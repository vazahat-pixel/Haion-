/**
 * All stock-moving documents. Behaviour per kind:
 *
 * kind              from      to        create→status  stock OUT at  stock IN at  ledger
 * CORPORATE         LOCATION  LOCATION  Pending        create        receive      DR buyer on create
 * UPLOAD_BILLING    LOCATION  LOCATION  Pending        create        receive      DR buyer on create
 * RETAIL_LOCATION   LOCATION  LOCATION  Pending        create        receive      DR buyer on create
 * RETAIL_CUSTOMER   LOCATION  CUSTOMER  Pending        create        —            — (paid via /payment)
 * STN / JOBWORK     LOCATION  LOCATION  PFA            approval      receive      —
 * PRN               LOCATION  LOCATION  PFA            approval      receive      CR returner on receive
 * CUSTOMER_RETURN   CUSTOMER  LOCATION  Completed      —             create       —
 * LOCAL_PURCHASE    VENDOR    LOCATION  Pending        —             receive      —
 * VENDOR_RETURN     LOCATION  VENDOR    Completed      create        —            —
 * OPENING           LOCATION  (same)    Completed      —             create       —
 */
import { Router } from 'express';
import mongoose from 'mongoose';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess, sendCreated, sendPaginated } from '../../utils/apiResponse.js';
import { parsePagination } from '../../utils/pagination.util.js';
import { DmsInvoice, DmsPurchaseOrder, DmsSerial, INVOICE_KINDS } from '../models/txn.models.js';
import { DmsMaster, DmsScheme, DmsLocation } from '../models/master.models.js';
import { requirePage, scopeFilter, assertCanSee } from '../middleware/context.js';
import {
  DmsError, computeDocument, nextInvoiceNo, isInterState, assertStockAvailable, moveStock,
  assertSerialsOut, assertSerialsNew, setSerials, postLedger, round2, nextReceiptNo, nextSeq,
} from '../services/core.service.js';
import { buildParty, partyLabel } from '../services/party.service.js';
import { logAudit } from '../../services/audit.service.js';

const router = Router();
const esc = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const SPEC = {
  CORPORATE: { from: 'LOCATION', to: 'LOCATION', status: 'Pending', out: 'create', in: 'receive', ledger: 'seller', page: 'corporate' },
  UPLOAD_BILLING: { from: 'LOCATION', to: 'LOCATION', status: 'Pending', out: 'create', in: 'receive', ledger: 'seller', page: 'corporate' },
  RETAIL_LOCATION: { from: 'LOCATION', to: 'LOCATION', status: 'Pending', out: 'create', in: 'receive', ledger: 'seller', page: 'retail' },
  RETAIL_CUSTOMER: { from: 'LOCATION', to: 'CUSTOMER', status: 'Pending', out: 'create', serialOut: 'SOLD', ledger: 'seller', page: 'retail', roundOff: true },
  STN: { from: 'LOCATION', to: 'LOCATION', status: 'PFA', out: 'approve', in: 'receive', page: 'stock_transfer', approvePage: 'stock_transfer_approval', approver: 'from' },
  JOBWORK: { from: 'LOCATION', to: 'LOCATION', status: 'PFA', out: 'approve', in: 'receive', page: 'jobwork', approvePage: 'stock_transfer_approval', approver: 'from' },
  PRN: { from: 'LOCATION', to: 'LOCATION', status: 'PFA', out: 'approve', in: 'receive', ledger: 'returner', page: 'purchase_return', approvePage: 'return_approval', approver: 'to' },
  CUSTOMER_RETURN: { from: 'CUSTOMER', to: 'LOCATION', status: 'Completed', in: 'create', page: 'customer_return' },
  LOCAL_PURCHASE: { from: 'VENDOR', to: 'LOCATION', status: 'Pending', in: 'receive', newSerials: true, page: 'local_purchase' },
  VENDOR_RETURN: { from: 'LOCATION', to: 'VENDOR', status: 'Completed', out: 'create', serialOut: 'RETURNED_TO_VENDOR', page: 'vendor_return' },
  OPENING: { from: 'LOCATION', to: 'SAME', status: 'Completed', in: 'create', newSerials: true, page: 'opening' },
};
const RECEIVABLE = ['CORPORATE', 'UPLOAD_BILLING', 'RETAIL_LOCATION', 'STN', 'JOBWORK', 'PRN', 'LOCAL_PURCHASE'];
const DISPATCHABLE = ['CORPORATE', 'UPLOAD_BILLING', 'RETAIL_LOCATION', 'STN', 'JOBWORK', 'PRN'];

const REPORT_PAGES = ['r_sale', 'r_return', 'r_vendor', 'dash_sale', 'dash_inventory', 'r_stock_ledger', 'r_isd'];
const ALSO_READ = { STN: ['stn_distribution'], RETAIL_CUSTOMER: ['customer_return'], CORPORATE: ['po', 'po_approval'], LOCAL_PURCHASE: ['vendor_po'] };
/** Page rights that may list documents for a given query. */
function listPages({ queue, kind }) {
  if (queue === 'receive') return ['receive', 'receive_jobwork', 'local_purchase'];
  if (queue === 'dispatch') return ['dispatch'];
  if (queue === 'approval') return ['stock_transfer_approval', 'return_approval'];
  const kinds = String(kind || '').split(',').filter((k) => SPEC[k]);
  const base = kinds.length ? kinds : Object.keys(SPEC);
  return [...new Set([...base.flatMap((k) => [SPEC[k].page, SPEC[k].approvePage, ...(ALSO_READ[k] || [])]), ...REPORT_PAGES].filter(Boolean))];
}
const canReadDoc = (req, inv) => req.dms.isAdmin || [SPEC[inv.kind].page, SPEC[inv.kind].approvePage, 'dispatch', 'receive', 'receive_jobwork', ...REPORT_PAGES, ...(inv.po ? ['po', 'po_approval', 'vendor_po'] : []), ...(ALSO_READ[inv.kind] || [])].some((k) => k && req.dms.pages.includes(k));

const actor = (req) => ({ by: req.dms.displayName, byUser: req.user._id });
const visibleIds = (inv) => [inv.from?.location, inv.to?.location].filter(Boolean).map(String);

async function loadInvoice(req) {
  if (!mongoose.isValidObjectId(req.params.id)) throw new DmsError('Invalid id', 400);
  const inv = await DmsInvoice.findById(req.params.id);
  if (!inv) throw new DmsError('Document not found', 404);
  if (req.dms.allowedLocationIds !== null && !visibleIds(inv).some((id) => req.dms.canSee(id))) throw new DmsError('Document not found', 404);
  return inv;
}

/* ── stock effect helpers ── */
async function stockOut(inv, spec) {
  const toLabel = partyLabel(inv.to);
  for (const l of inv.lines) {
    // eslint-disable-next-line no-await-in-loop
    await moveStock({ location: inv.from.location, product: l.product, delta: -l.qty, docNo: inv.invoiceNo, docKind: inv.kind, transferType: 'OUT', counterparty: toLabel });
    // eslint-disable-next-line no-await-in-loop
    await setSerials(l.serials, {
      status: spec.serialOut || 'IN_TRANSIT', location: null, product: l.product,
      docNo: inv.invoiceNo, docKind: inv.kind, from: inv.from.name, to: inv.to.name,
    });
  }
}
async function stockIn(inv, spec, receivedLines) {
  const loc = inv.to.kind === 'LOCATION' ? inv.to.location : inv.from.location; // OPENING uses from
  const fromLabel = partyLabel(inv.from);
  for (const l of inv.lines) {
    const r = receivedLines?.get(String(l._id)) || { okQty: l.qty, damageQty: 0, missingQty: 0 };
    l.okQty = r.okQty; l.damageQty = r.damageQty; l.missingQty = r.missingQty;
    const base = { location: loc, product: l.product, docNo: inv.invoiceNo, docKind: inv.kind, transferType: 'IN', counterparty: fromLabel };
    // eslint-disable-next-line no-await-in-loop
    await moveStock({ ...base, bucket: 'OK', delta: r.okQty });
    // eslint-disable-next-line no-await-in-loop
    await moveStock({ ...base, bucket: 'DAMAGE', delta: r.damageQty });
    // eslint-disable-next-line no-await-in-loop
    await moveStock({ ...base, bucket: 'MISSING', delta: r.missingQty });
    // eslint-disable-next-line no-await-in-loop
    await setSerials(l.serials, {
      status: 'IN_STOCK', location: loc, product: l.product, docNo: inv.invoiceNo, docKind: inv.kind,
      from: inv.from.name, to: inv.to.name, upsert: Boolean(spec.newSerials),
    });
  }
}
async function postInvoiceLedger(inv, spec, sign = 1) {
  // Reference behaviour (verified on the live Party Ledger): the SELLER's ledger is debited when it issues an
  // invoice and credited when it receives payment. The counterparty (buyer / payer) is the secondary column.
  if (spec.ledger === 'seller') {
    await postLedger({
      party: inv.from.location, counterparty: inv.to.location, counterpartyName: inv.to.name,
      docNo: inv.invoiceNo, docType: sign > 0 ? inv.kind : `${inv.kind}_CANCEL`,
      dr: sign > 0 ? inv.grandTotal : 0, cr: sign < 0 ? inv.grandTotal : 0, txnDate: inv.invoiceDate,
    });
  }
  if (spec.ledger === 'returner') {
    await postLedger({
      // a purchase return reduces what the returning location owes the supplier (the PRN's receiver)
      party: inv.to.location, counterparty: inv.from.location, counterpartyName: inv.from.name,
      docNo: inv.invoiceNo, docType: 'PRN', cr: inv.grandTotal, txnDate: new Date(),
    });
  }
}
async function refreshPoStatus(poId) {
  if (!poId) return;
  const active = await DmsInvoice.countDocuments({ po: poId, status: { $ne: 'Cancelled' } });
  await DmsPurchaseOrder.updateOne({ _id: poId, status: { $in: ['Approved', 'Processed'] } }, { status: active ? 'Processed' : 'Approved' });
}

/* ── list ── */
router.get('/', (req, res, next) => requirePage(...listPages(req.query))(req, res, next), asyncHandler(async (req, res) => {
  const { skip, perPage, page } = parsePagination(req.query);
  const kinds = String(req.query.kind || '').split(',').filter((k) => INVOICE_KINDS.includes(k));
  const q = {};
  if (kinds.length) q.kind = { $in: kinds };
  const allowed = req.dms.allowedLocationIds;
  const inScope = (path) => (allowed === null ? {} : { [path]: { $in: allowed } });
  switch (req.query.queue) {
    case 'receive':
      Object.assign(q, inScope('to.location'), { status: { $in: ['Pending', 'Dispatched', 'Received'] } });
      if (!kinds.length) q.kind = { $in: RECEIVABLE };
      break;
    case 'dispatch':
      Object.assign(q, inScope('from.location'));
      if (!kinds.length) q.kind = { $in: DISPATCHABLE };
      break;
    case 'approval': // STN/JOBWORK → source approves; PRN → receiver approves
      Object.assign(q, allowed === null ? {} : { $or: [
        { kind: { $in: ['STN', 'JOBWORK'] }, 'from.location': { $in: allowed } },
        { kind: 'PRN', 'to.location': { $in: allowed } },
      ] });
      break;
    default:
      Object.assign(q, scopeFilter(req, ['from.location', 'to.location']));
  }
  if (req.query.status) q.status = { $in: String(req.query.status).split(',') };
  if (req.query.docType) q.docType = req.query.docType;
  if (req.query.customer && mongoose.isValidObjectId(req.query.customer)) q['to.customer'] = req.query.customer;
  if (req.query.distribution === '1') q.refNo = /^DIST\//;
  if (req.query.fromLocation) q['from.location'] = req.query.fromLocation;
  if (req.query.toLocation) q['to.location'] = req.query.toLocation;
  if (req.query.from) q.invoiceDate = { ...(q.invoiceDate || {}), $gte: new Date(req.query.from) };
  if (req.query.to) q.invoiceDate = { ...(q.invoiceDate || {}), $lte: new Date(`${req.query.to}T23:59:59`) };
  if (req.query.search) {
    const rx = new RegExp(esc(req.query.search), 'i');
    q.$and = [...(q.$and || []), { $or: [{ invoiceNo: rx }, { poNo: rx }, { 'from.name': rx }, { 'to.name': rx }, { entryBy: rx }] }];
  }
  const [rows, total] = await Promise.all([
    DmsInvoice.find(q).select('-actions').sort({ createdAt: -1 }).skip(skip).limit(perPage).lean(),
    DmsInvoice.countDocuments(q),
  ]);
  const data = rows.map(({ lines, ...r }) => ({
    ...r,
    lineCount: lines.length,
    serialsAttached: lines.reduce((n, l) => n + (l.serials?.length || 0), 0),
  }));
  sendPaginated(res, { data, total, page, perPage });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const inv = await loadInvoice(req);
  if (!canReadDoc(req, inv)) throw new DmsError('You do not have permission for this page', 403);
  await inv.populate('logistic.courier', 'name attrs');
  sendSuccess(res, { data: inv });
}));

/* ── create (non-PO kinds) ── */
async function applySchemes(lines) {
  const ids = lines.map((l) => l.scheme).filter((s) => mongoose.isValidObjectId(s));
  if (!ids.length) return lines;
  const schemes = await DmsScheme.find({ _id: { $in: ids }, status: 'Active' }).lean();
  const smap = new Map(schemes.map((s) => [String(s._id), s]));
  return lines.map((l) => {
    const s = smap.get(String(l.scheme));
    if (!s) return { ...l, scheme: undefined };
    const out = { ...l, schemeName: s.name, schemeCode: s.code };
    if (!Number(l.discountPerUnit)) {
      if (s.discountType === 'FLAT') out.discountPerUnit = Math.min(Number(l.price), s.discountValue);
      if (s.discountType === 'PERCENT') out.discountPerUnit = round2((Number(l.price) * s.discountValue) / 100);
      if (s.discountType === 'FOC') out.discountPerUnit = Number(l.price);
    }
    return out;
  });
}

async function createDocument(req, kind, body, extra = {}) {
  const spec = SPEC[kind];
  const from = await buildParty(spec.from, body.from);
  const to = spec.to === 'SAME' ? from : await buildParty(spec.to, body.to);
  if (spec.from === 'LOCATION') assertCanSee(req, from.party.location);
  if (spec.to === 'LOCATION') {
    if (spec.from !== 'LOCATION') assertCanSee(req, to.party.location);
    if (spec.from === 'LOCATION' && String(from.party.location) === String(to.party.location)) throw new DmsError('From and To cannot be the same location');
  }
  if (kind === 'RETAIL_CUSTOMER') assertCanSee(req, to.doc.location);

  const applyTax = !['OPENING', 'STN', 'JOBWORK'].includes(kind) && body.taxType !== 'NONE';
  const rawLines = await applySchemes(body.lines || []);
  const { lines, totals } = await computeDocument(rawLines, {
    interState: isInterState(from.party.stateCode, to.party.stateCode), applyTax, roundOff: Boolean(spec.roundOff),
  });
  if (kind === 'OPENING') {
    // opening captures ok / damage / missing separately; qty = sum
    for (const l of lines) {
      const raw = rawLines.find((r) => String(r.product) === String(l.product)) || {};
      l.okQty = Number(raw.okQty ?? l.qty); l.damageQty = Number(raw.damageQty || 0); l.missingQty = Number(raw.missingQty || 0);
      if (l.okQty + l.damageQty + l.missingQty !== l.qty) throw new DmsError(`${l.productCode}: OK + Damage + Missing must equal qty`);
    }
  }

  // ── validate everything before mutating ──
  if (spec.out === 'create' || spec.out === 'approve') await assertStockAvailable(from.party.location, lines);
  if (spec.out === 'create') await assertSerialsOut(from.party.location, lines);
  if (spec.out === 'approve') await assertSerialsOut(from.party.location, lines);
  if (spec.newSerials) await assertSerialsNew(lines);
  if (kind === 'CUSTOMER_RETURN') await assertReturnSerials(body, lines, to.party.location);

  const issuing = spec.from === 'LOCATION' ? from.doc : to.doc;
  const invoiceDate = body.invoiceDate ? new Date(body.invoiceDate) : new Date();
  const inv = new DmsInvoice({
    kind,
    docType: body.docType === 'DELIVERY CHALLAN' ? 'DELIVERY CHALLAN' : 'INVOICE',
    invoiceNo: await nextInvoiceNo(kind, issuing, invoiceDate),
    invoiceDate,
    refNo: body.refNo,
    refDate: body.refDate,
    from: from.party,
    to: to.party,
    taxType: applyTax ? body.taxType || 'Productwise Tax' : 'NONE',
    discountType: body.discountType || 'Productwise Discount',
    currency: body.currency || 'INR',
    lines: lines.map(({ _isSerialized, ...l }) => l),
    ...totals,
    marginAmount: Number(body.marginAmount || 0),
    deliveryAddress: body.deliveryAddress || to.party.address,
    dispatchAddress: from.doc.dispatchAddress || from.party.address,
    remark: body.remark,
    status: spec.status,
    entryBy: req.dms.displayName,
    entryByUser: req.user._id,
    actions: [{ ...actor(req), action: 'Created', remark: body.remark }],
    ...extra,
  });
  await inv.validate();

  if (spec.out === 'create') await stockOut(inv, spec);
  if (spec.in === 'create') await stockIn(inv, spec, kind === 'OPENING' ? new Map(inv.lines.map((l) => [String(l._id), l])) : null);
  await inv.save();
  if (spec.out === 'create') await postInvoiceLedger(inv, spec);
  logAudit({ action: `DMS_${kind}_CREATE`, user: req.dms.loginId, userId: req.user._id, module: 'DMS', resourceId: String(inv._id), metadata: { invoiceNo: inv.invoiceNo } });
  return inv;
}

async function assertReturnSerials(body, lines, locationId) {
  if (!mongoose.isValidObjectId(body.sourceInvoice)) throw new DmsError('Original invoice is required for a customer return', 422, { sourceInvoice: ['Required'] });
  const src = await DmsInvoice.findById(body.sourceInvoice).lean();
  if (!src || src.kind !== 'RETAIL_CUSTOMER' || String(src.from.location) !== String(locationId)) throw new DmsError('Original invoice not found for this location');
  if (String(src.to.customer) !== String(body.from)) throw new DmsError('Customer does not match the original invoice');
  for (const l of lines) {
    const srcLine = src.lines.find((s) => String(s.product) === String(l.product));
    if (!srcLine) throw new DmsError(`${l.productCode} was not on invoice ${src.invoiceNo}`);
    if (l.qty > srcLine.qty) throw new DmsError(`${l.productCode}: return qty exceeds invoiced qty`);
    const bad = l.serials.filter((s) => !srcLine.serials.includes(s));
    if (bad.length) throw new DmsError(`Serial(s) not on the original invoice: ${bad.join(', ')}`);
  }
}

router.post('/', asyncHandler(async (req, res, next) => {
  const kind = req.body.kind;
  if (!SPEC[kind] || kind === 'CORPORATE') throw new DmsError('Invalid document kind', 422);
  requirePage(SPEC[kind].page)(req, res, async (err) => {
    if (err) return next(err);
    try {
      const extra = {};
      if (kind === 'CUSTOMER_RETURN') {
        const src = await DmsInvoice.findById(req.body.sourceInvoice).select('invoiceNo').lean();
        extra.sourceInvoice = src?._id;
        extra.sourceInvoiceNo = src?.invoiceNo;
      }
      const inv = await createDocument(req, kind, req.body, extra); // stockIn() re-registers returned serials
      sendCreated(res, { data: inv, message: `${inv.invoiceNo} created` });
    } catch (e) { next(e); }
  });
}));

/* ── STN Distribution: one source → many destinations in one go (one STN per destination, all pending approval) ── */
router.post('/stn-distribution', requirePage('stn_distribution', 'stock_transfer'), asyncHandler(async (req, res) => {
  const { from, docType, rows } = req.body;
  if (!Array.isArray(rows) || !rows.length) throw new DmsError('Add at least one destination', 422, { rows: ['Required'] });
  const dests = rows.map((r) => String(r.to));
  if (new Set(dests).size !== dests.length) throw new DmsError('A destination is repeated', 422);
  if (dests.includes(String(from))) throw new DmsError('Source cannot also be a destination', 422);
  // validate the TOTAL across all destinations against the source stock before creating anything
  const all = rows.flatMap((r) => (r.lines || []).filter((l) => Number(l.qty) > 0));
  if (!all.length) throw new DmsError('Enter a quantity for at least one product', 422);
  const { lines: totalLines } = await computeDocument(all.map((l) => ({ product: l.product, qty: Number(l.qty), price: Number(l.price || 0) })), { applyTax: false });
  await assertStockAvailable(from, totalLines);
  const batch = `DIST/${await nextSeq('DIST')}`;
  const created = [];
  for (const r of rows) {
    const lines = (r.lines || []).filter((l) => Number(l.qty) > 0);
    if (!lines.length) continue;
    // eslint-disable-next-line no-await-in-loop
    created.push(await createDocument(req, 'STN', { from, to: r.to, docType, refNo: batch, lines, remark: req.body.remark || 'STN distribution' }));
  }
  sendCreated(res, { data: { batch, documents: created.map((d) => ({ _id: d._id, invoiceNo: d.invoiceNo, to: d.to.name })) }, message: `${created.length} stock transfer(s) created (${batch}) — pending approval` });
}));

/* ── corporate invoice against an approved PO ── */
router.post('/against-po/:poId', requirePage('corporate'), asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.poId)) throw new DmsError('Invalid PO id', 400);
  const po = await DmsPurchaseOrder.findById(req.params.poId).lean();
  if (!po || po.poType !== 'LOCATION') throw new DmsError('Purchase order not found', 404);
  if (!['Approved', 'Processed'].includes(po.status)) throw new DmsError(`Cannot invoice a ${po.status} purchase order`);
  assertCanSee(req, po.to.location); // supplier raises the invoice

  const billed = new Map();
  const prior = await DmsInvoice.find({ po: po._id, status: { $ne: 'Cancelled' } }).select('lines.product lines.qty').lean();
  for (const inv of prior) for (const l of inv.lines) billed.set(String(l.product), (billed.get(String(l.product)) || 0) + l.qty);

  const lines = [];
  for (const reqLine of req.body.lines || []) {
    const pl = po.lines.find((l) => String(l._id) === String(reqLine.lineId) || String(l.product) === String(reqLine.product));
    if (!pl) throw new DmsError('Line does not belong to this PO');
    const qty = Number(reqLine.qty);
    if (!qty) continue;
    const pending = pl.reqQty - (billed.get(String(pl.product)) || 0);
    if (qty > pending) throw new DmsError(`${pl.productCode}: bill qty ${qty} exceeds pending qty ${pending}`);
    lines.push({
      product: pl.product, reqQty: pl.reqQty, qty, price: pl.price,
      discountPerUnit: reqLine.discountPerUnit ?? pl.discountPerUnit, serials: reqLine.serials, scheme: reqLine.scheme,
    });
  }
  if (!lines.length) throw new DmsError('Enter bill qty for at least one item');
  const inv = await createDocument(
    req, 'CORPORATE',
    { ...req.body, from: po.to.location, to: po.from.location, lines, deliveryAddress: req.body.deliveryAddress || po.deliveryAddress },
    { po: po._id, poNo: po.poNo },
  );
  await DmsPurchaseOrder.updateOne({ _id: po._id }, { status: 'Processed', $push: { invoices: inv._id, actions: { ...actor(req), action: 'Processed', remark: `Invoice ${inv.invoiceNo}` } } });
  sendCreated(res, { data: inv, message: `Invoice ${inv.invoiceNo} created` });
}));

/* ── receive goods against a vendor PO (creates a received LOCAL_PURCHASE document) ── */
router.post('/from-vendor-po/:poId', requirePage('vendor_po', 'local_purchase'), asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.poId)) throw new DmsError('Invalid PO id', 400);
  const po = await DmsPurchaseOrder.findById(req.params.poId).lean();
  if (!po || po.poType !== 'VENDOR') throw new DmsError('Vendor purchase order not found', 404);
  if (po.status !== 'Approved') throw new DmsError(`Cannot receive a ${po.status} order`);
  assertCanSee(req, po.from.location);
  if (!req.body.refNo) throw new DmsError('Vendor invoice no. is required', 422, { refNo: ['Required'] });
  const received = new Map();
  const lines = [];
  for (const r of req.body.lines || []) {
    const pl = po.lines.find((l) => String(l._id) === String(r.lineId));
    if (!pl) throw new DmsError('Line does not belong to this PO');
    const okQty = Number(r.okQty || 0); const damageQty = Number(r.damageQty || 0); const missingQty = Number(r.missingQty || 0);
    const qty = okQty + damageQty + missingQty;
    if (!qty) continue;
    if ([okQty, damageQty, missingQty].some((n) => n < 0)) throw new DmsError(`${pl.productCode}: invalid quantity`);
    if (qty > pl.reqQty) throw new DmsError(`${pl.productCode}: received qty exceeds ordered qty ${pl.reqQty}`);
    lines.push({ product: pl.product, reqQty: pl.reqQty, qty, price: pl.price, serials: r.serials, _recv: { okQty, damageQty, missingQty } });
  }
  if (!lines.length) throw new DmsError('Enter received qty for at least one item');
  const inv = await createDocument(
    req, 'LOCAL_PURCHASE',
    { ...req.body, from: po.to.vendor, to: po.from.location, lines: lines.map(({ _recv, ...l }) => l), currency: po.currency },
    { po: po._id, poNo: po.poNo },
  );
  inv.lines.forEach((l, i) => received.set(String(l._id), lines[i]._recv));
  await stockIn(inv, SPEC.LOCAL_PURCHASE, received);
  inv.status = 'Received';
  inv.receiving = { by: req.dms.displayName, at: new Date(), remark: req.body.remark || 'Received against vendor PO' };
  inv.actions.push({ ...actor(req), action: 'Received', remark: req.body.remark });
  await inv.save();
  await DmsPurchaseOrder.updateOne({ _id: po._id }, { status: 'Received', $push: { invoices: inv._id, actions: { ...actor(req), action: 'Received', remark: inv.invoiceNo } } });
  sendCreated(res, { data: inv, message: `Received as ${inv.invoiceNo}` });
}));

/* ── approve / reject (STN, JOBWORK, PRN) ── */
router.post('/:id/approve', asyncHandler(async (req, res, next) => {
  const inv = await loadInvoice(req);
  const spec = SPEC[inv.kind];
  if (!spec.approvePage) throw new DmsError('This document does not need approval');
  requirePage(spec.approvePage)(req, res, async (err) => {
    if (err) return next(err);
    try {
      const { action, remark } = req.body;
      if (!['Approved', 'Rejected'].includes(action)) throw new DmsError('Action must be Approved or Rejected', 422);
      if (!remark || !String(remark).trim()) throw new DmsError('Remark is required', 422, { remark: ['Required'] });
      if (inv.status !== 'PFA') throw new DmsError(`Document is already ${inv.status}`);
      assertCanSee(req, spec.approver === 'to' ? inv.to.location : inv.from.location);
      if (action === 'Approved') {
        await assertStockAvailable(inv.from.location, inv.lines);
        await assertSerialsOut(inv.from.location, inv.lines.map((l) => ({ ...l.toObject(), _isSerialized: false })));
        await stockOut(inv, spec);
        inv.status = 'Pending';
      } else {
        inv.status = 'Rejected';
      }
      inv.actions.push({ ...actor(req), action, remark: String(remark).trim() });
      await inv.save();
      sendSuccess(res, { data: inv, message: `${inv.invoiceNo} ${action}` });
    } catch (e) { next(e); }
  });
}));

/* ── update dispatch ── */
router.post('/:id/dispatch', requirePage('dispatch'), asyncHandler(async (req, res) => {
  const inv = await loadInvoice(req);
  if (!DISPATCHABLE.includes(inv.kind)) throw new DmsError('This document is not dispatched');
  if (!['Pending', 'Dispatched'].includes(inv.status)) throw new DmsError(`A ${inv.status} document cannot be dispatched`);
  assertCanSee(req, inv.from.location);
  const b = req.body;
  const required = ['courier', 'docketNo', 'dispatchDate', 'logisticPerson', 'transportMode', 'contactNo', 'carrierNo', 'deliveryAddress', 'remark'];
  const errors = Object.fromEntries(required.filter((k) => !String(b[k] ?? '').trim()).map((k) => [k, ['Required']]));
  if (Object.keys(errors).length) throw new DmsError('Please fill all required fields', 422, errors);
  if (!/^\d{10}$/.test(String(b.contactNo).trim())) throw new DmsError('Contact No. must be 10 digits', 422, { contactNo: ['10 digits'] });
  const courier = mongoose.isValidObjectId(b.courier) ? await DmsMaster.findOne({ _id: b.courier, type: 'courier' }).lean() : null;
  if (!courier) throw new DmsError('Logistic not found', 422, { courier: ['Invalid'] });
  inv.logistic = {
    courier: courier._id, courierName: courier.name, docketNo: b.docketNo, dispatchDate: new Date(b.dispatchDate),
    logisticPerson: b.logisticPerson, transportMode: b.transportMode, contactNo: b.contactNo, carrierNo: b.carrierNo,
    ewayBillNo: b.ewayBillNo, deliveryAddress: b.deliveryAddress, remark: b.remark, updatedBy: req.dms.displayName, updatedAt: new Date(),
  };
  inv.status = 'Dispatched';
  inv.actions.push({ ...actor(req), action: 'Dispatched', remark: b.remark });
  await inv.save();
  sendSuccess(res, { data: inv, message: `${inv.invoiceNo} dispatched` });
}));

/* ── receive ── */
router.post('/:id/receive', asyncHandler(async (req, res, next) => {
  const inv = await loadInvoice(req);
  const spec = SPEC[inv.kind];
  if (spec.in !== 'receive') throw new DmsError('This document is not received');
  requirePage(inv.kind === 'LOCAL_PURCHASE' ? 'local_purchase' : inv.kind === 'JOBWORK' ? 'receive_jobwork' : 'receive')(req, res, async (err) => {
    if (err) return next(err);
    try {
      if (!['Pending', 'Dispatched'].includes(inv.status)) throw new DmsError(`A ${inv.status} document cannot be received`);
      assertCanSee(req, inv.to.location);
      if (!req.body.remark || !String(req.body.remark).trim()) throw new DmsError('Receive remark is required', 422, { remark: ['Required'] });
      const received = new Map();
      for (const l of inv.lines) {
        const r = (req.body.lines || []).find((x) => String(x.lineId) === String(l._id));
        const okQty = Number(r?.okQty ?? l.qty); const damageQty = Number(r?.damageQty || 0); const missingQty = Number(r?.missingQty || 0);
        if ([okQty, damageQty, missingQty].some((n) => n < 0 || !Number.isFinite(n))) throw new DmsError(`${l.productCode}: invalid quantity`);
        if (okQty + damageQty + missingQty !== l.qty) throw new DmsError(`${l.productCode}: OK + Damage + Missing must equal ${l.qty}`);
        received.set(String(l._id), { okQty, damageQty, missingQty });
      }
      if (spec.newSerials) await assertSerialsNew(inv.lines);
      await stockIn(inv, spec, received);
      inv.status = 'Received';
      inv.receiving = { by: req.dms.displayName, at: new Date(), remark: String(req.body.remark).trim() };
      inv.actions.push({ ...actor(req), action: 'Received', remark: req.body.remark });
      await inv.save();
      if (spec.ledger === 'returner') await postInvoiceLedger(inv, spec);
      sendSuccess(res, { data: inv, message: `${inv.invoiceNo} received` });
    } catch (e) { next(e); }
  });
}));

/* ── cancel ── */
router.post('/:id/cancel', asyncHandler(async (req, res, next) => {
  const inv = await loadInvoice(req);
  const spec = SPEC[inv.kind];
  requirePage(spec.page)(req, res, async (err) => {
    if (err) return next(err);
    try {
      assertCanSee(req, inv.from.location || inv.to.location);
      if (!['PFA', 'Pending'].includes(inv.status)) throw new DmsError(`A ${inv.status} document cannot be cancelled`);
      if (inv.paidAmount > 0) throw new DmsError('Payment has been received against this invoice');
      const stockWasMoved = spec.out === 'create' || (spec.out === 'approve' && inv.status === 'Pending');
      if (stockWasMoved) {
        for (const l of inv.lines) {
          // eslint-disable-next-line no-await-in-loop
          await moveStock({ location: inv.from.location, product: l.product, delta: l.qty, docNo: inv.invoiceNo, docKind: `${inv.kind}_CANCEL`, transferType: 'IN', counterparty: partyLabel(inv.to) });
          // eslint-disable-next-line no-await-in-loop
          await setSerials(l.serials, { status: 'IN_STOCK', location: inv.from.location, product: l.product, docNo: inv.invoiceNo, docKind: `${inv.kind}_CANCEL`, from: inv.to.name, to: inv.from.name });
        }
        if (spec.out === 'create') await postInvoiceLedger(inv, spec, -1);
      }
      inv.status = 'Cancelled';
      inv.actions.push({ ...actor(req), action: 'Cancelled', remark: req.body.remark });
      await inv.save();
      await refreshPoStatus(inv.po);
      sendSuccess(res, { data: inv, message: `${inv.invoiceNo} cancelled` });
    } catch (e) { next(e); }
  });
}));

/* ── retail customer payment ── */
router.post('/:id/payment', requirePage('retail'), asyncHandler(async (req, res) => {
  const inv = await loadInvoice(req);
  if (inv.kind !== 'RETAIL_CUSTOMER') throw new DmsError('Payment can be received only on retail customer bills');
  if (inv.status !== 'Pending') throw new DmsError(`Bill is ${inv.status}`);
  const amount = round2(Number(req.body.amount));
  if (!(amount > 0)) throw new DmsError('Enter a valid amount', 422, { amount: ['Required'] });
  const due = round2(inv.grandTotal - inv.paidAmount);
  if (amount > due) throw new DmsError(`Amount exceeds balance due (${due})`, 422, { amount: ['Too high'] });
  inv.paidAmount = round2(inv.paidAmount + amount);
  const receiptNo = await nextReceiptNo('RECEIPT', await DmsLocation.findById(inv.from.location).lean());
  await postLedger({
    party: inv.from.location, counterpartyName: inv.to.name, docNo: receiptNo, docType: 'PAYMENT', cr: amount, txnDate: new Date(),
    paymentRemark: [req.body.payMode || 'CASH', req.body.remark].filter(Boolean).join(' - '),
  });
  if (inv.paidAmount >= inv.grandTotal) inv.status = 'Completed';
  inv.actions.push({ ...actor(req), action: 'Payment Received', remark: `${req.body.payMode || 'CASH'} ${amount}${req.body.remark ? ` — ${req.body.remark}` : ''}` });
  await inv.save();
  sendSuccess(res, { data: inv, message: 'Payment recorded' });
}));

/* ── serial lookup (single + multiple track) ── */
router.post('/serials/track', requirePage('serial_track', 'serial_track_multi'), asyncHandler(async (req, res) => {
  const list = (req.body.serials || []).map((s) => String(s).trim().toUpperCase()).filter(Boolean).slice(0, 500);
  if (!list.length) throw new DmsError('Enter at least one serial number');
  const rows = await DmsSerial.find({ serialNo: { $in: list } }).populate('product', 'productCode name').populate('location', 'name code city').lean();
  const map = new Map(rows.map((r) => [r.serialNo, r]));
  sendSuccess(res, { data: list.map((s) => map.get(s) || { serialNo: s, notFound: true }) });
}));

export default router;
