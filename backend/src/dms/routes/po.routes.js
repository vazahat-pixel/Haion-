import { Router } from 'express';
import mongoose from 'mongoose';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess, sendCreated, sendPaginated } from '../../utils/apiResponse.js';
import { parsePagination } from '../../utils/pagination.util.js';
import { DmsPurchaseOrder, DmsInvoice } from '../models/txn.models.js';
import { DmsLocation, DmsProfile } from '../models/master.models.js';
import { requirePage, scopeFilter, assertCanSee } from '../middleware/context.js';
import { DmsError, computeDocument, nextPoNo, payableOf, round2, isInterState } from '../services/core.service.js';
import { buildParty } from '../services/party.service.js';
import { logAudit } from '../../services/audit.service.js';

const router = Router();
const PO_READ = ['po', 'po_approval', 'corporate', 'vendor_po', 'r_po', 'dash_po', 'local_purchase'];
const esc = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

async function loadPo(req) {
  if (!mongoose.isValidObjectId(req.params.id)) throw new DmsError('Invalid id', 400);
  const po = await DmsPurchaseOrder.findById(req.params.id);
  if (!po) throw new DmsError('Purchase order not found', 404);
  assertVisible(req, po);
  return po;
}
function assertVisible(req, po) {
  const ids = [po.from?.location, po.to?.location].filter(Boolean).map(String);
  if (req.dms.allowedLocationIds !== null && !ids.some((id) => req.dms.canSee(id))) throw new DmsError('Purchase order not found', 404);
}

/** Credit balance = credit limit − outstanding (ledger DR − CR). */
router.get('/credit/:locationId', requirePage('po', 'vendor_po'), asyncHandler(async (req, res) => {
  const loc = await DmsLocation.findById(req.params.locationId).lean();
  if (!loc) throw new DmsError('Location not found', 404);
  assertCanSee(req, loc._id);
  const outstanding = await payableOf(loc._id); // what the ordering location already owes its suppliers
  sendSuccess(res, { data: { creditLimit: loc.creditLimit || 0, outstanding, available: round2((loc.creditLimit || 0) - outstanding) } });
}));

router.get('/', requirePage(...PO_READ), asyncHandler(async (req, res) => {
  const { skip, perPage, page } = parsePagination(req.query);
  const poType = req.query.poType === 'VENDOR' ? 'VENDOR' : 'LOCATION';
  const q = { poType, ...scopeFilter(req, ['from.location', 'to.location']) };
  if (req.query.status) q.status = { $in: String(req.query.status).split(',') };
  // approval queue: only POs addressed TO my locations
  if (req.query.queue === 'approval') {
    q.status = 'PFA';
    if (req.dms.allowedLocationIds !== null) { delete q.$or; q['to.location'] = { $in: req.dms.allowedLocationIds }; }
  }
  // invoicing queue: approved POs addressed to my locations
  if (req.query.queue === 'invoicing') {
    q.status = { $in: ['Approved', 'Processed'] };
    if (req.dms.allowedLocationIds !== null) { delete q.$or; q['to.location'] = { $in: req.dms.allowedLocationIds }; }
  }
  if (req.query.from) q.poDate = { ...(q.poDate || {}), $gte: new Date(req.query.from) };
  if (req.query.to) q.poDate = { ...(q.poDate || {}), $lte: new Date(`${req.query.to}T23:59:59`) };
  if (req.query.search) {
    const rx = new RegExp(esc(req.query.search), 'i');
    q.$and = [{ $or: [{ poNo: rx }, { 'from.name': rx }, { 'to.name': rx }, { entryBy: rx }] }];
  }
  const [data, total] = await Promise.all([
    DmsPurchaseOrder.find(q).select('-lines -actions').sort({ createdAt: -1 }).skip(skip).limit(perPage).lean(),
    DmsPurchaseOrder.countDocuments(q),
  ]);
  sendPaginated(res, { data, total, page, perPage });
}));

router.get('/:id', requirePage(...PO_READ), asyncHandler(async (req, res) => {
  const po = await loadPo(req);
  const invoices = await DmsInvoice.find({ po: po._id, status: { $ne: 'Cancelled' } }).select('invoiceNo invoiceDate status grandTotal lines.product lines.qty').lean();
  // remaining qty per PO line = reqQty − already billed
  const billed = new Map();
  for (const inv of invoices) for (const l of inv.lines) billed.set(String(l.product), (billed.get(String(l.product)) || 0) + l.qty);
  const data = po.toObject();
  data.lines = data.lines.map((l) => ({ ...l, billedQty: billed.get(String(l.product)) || 0, pendingQty: Math.max(0, l.reqQty - (billed.get(String(l.product)) || 0)) }));
  data.invoiceList = invoices.map(({ lines, ...rest }) => rest);
  sendSuccess(res, { data });
}));

async function buildPoPayload(req, body) {
  const poType = body.poType === 'VENDOR' ? 'VENDOR' : 'LOCATION';
  const from = await buildParty('LOCATION', body.fromLocation);
  assertCanSee(req, from.party.location);
  const to = poType === 'VENDOR' ? await buildParty('VENDOR', body.toVendor) : await buildParty('LOCATION', body.toLocation);
  if (poType === 'LOCATION' && String(from.party.location) === String(to.party.location)) throw new DmsError('PO From and PO To cannot be the same location');
  const lines = (body.lines || []).map((l) => ({ ...l, reqQty: Number(l.qty) }));
  const { lines: computed, totals } = await computeDocument(lines, {
    interState: isInterState(from.party.stateCode, to.party.stateCode),
    applyTax: false, // the reference PO carries no tax columns
  });
  let salesExecutiveName;
  if (body.salesExecutive) {
    const se = await DmsProfile.findById(body.salesExecutive).lean();
    if (!se) throw new DmsError('Sales executive not found');
    salesExecutiveName = `${se.displayName} | ${se.loginId}`;
  }
  return {
    poType,
    from: from.party,
    to: to.party,
    fromDoc: from.doc,
    salesExecutive: body.salesExecutive || undefined,
    salesExecutiveName,
    currency: body.currency || 'INR',
    lines: computed.map(({ _isSerialized, serials, ...l }) => l),
    ...totals,
    deliveryAddress: body.deliveryAddress || from.doc.dispatchAddress || from.doc.billingAddress,
    paymentTerms: body.paymentTerms,
    remark: body.remark,
  };
}

router.post('/', (req, res, next) => requirePage(req.body.poType === 'VENDOR' ? 'vendor_po' : 'po')(req, res, next), asyncHandler(async (req, res) => {
  const { fromDoc, ...payload } = await buildPoPayload(req, req.body);
  const po = await DmsPurchaseOrder.create({
    ...payload,
    poNo: await nextPoNo(fromDoc, payload.poType),
    // vendor POs are raised by HO itself and need no internal approval
    status: payload.poType === 'VENDOR' ? 'Approved' : 'PFA',
    entryBy: req.dms.displayName,
    entryByUser: req.user._id,
    actions: [{ by: req.dms.displayName, byUser: req.user._id, action: 'Created' }],
  });
  logAudit({ action: 'DMS_PO_CREATE', user: req.dms.loginId, userId: req.user._id, module: 'DMS', resourceId: String(po._id), metadata: { poNo: po.poNo } });
  sendCreated(res, { data: po, message: `Purchase Order ${po.poNo} created` });
}));

router.put('/:id', requirePage('po', 'vendor_po'), asyncHandler(async (req, res) => {
  const po = await loadPo(req);
  if (po.status !== 'PFA') throw new DmsError('Only orders pending for approval can be edited');
  assertCanSee(req, po.from.location);
  const { fromDoc, poType, ...payload } = await buildPoPayload(req, { ...req.body, poType: po.poType, fromLocation: po.from.location });
  po.set(payload);
  po.actions.push({ by: req.dms.displayName, byUser: req.user._id, action: 'Edited' });
  await po.save();
  sendSuccess(res, { data: po, message: 'Purchase Order updated' });
}));

router.post('/:id/cancel', requirePage('po', 'vendor_po'), asyncHandler(async (req, res) => {
  const po = await loadPo(req);
  assertCanSee(req, po.from.location);
  const cancellable = po.poType === 'VENDOR' ? ['Approved'] : ['PFA'];
  if (!cancellable.includes(po.status)) throw new DmsError(`A ${po.status} order cannot be cancelled`);
  po.status = 'Cancelled';
  po.actions.push({ by: req.dms.displayName, byUser: req.user._id, action: 'Cancelled', remark: req.body.remark });
  await po.save();
  sendSuccess(res, { data: po, message: 'Purchase Order cancelled' });
}));

router.post('/:id/approve', requirePage('po_approval'), asyncHandler(async (req, res) => {
  const po = await loadPo(req);
  const { action, remark } = req.body;
  if (!['Approved', 'Rejected'].includes(action)) throw new DmsError('Action must be Approved or Rejected', 422, { action: ['Required'] });
  if (!remark || !String(remark).trim()) throw new DmsError('Remark is required', 422, { remark: ['Required'] });
  if (po.status !== 'PFA') throw new DmsError(`Order is already ${po.status}`);
  assertCanSee(req, po.to.location); // only the supplying side approves
  po.status = action;
  po.actions.push({ by: req.dms.displayName, byUser: req.user._id, action, remark: String(remark).trim() });
  await po.save();
  logAudit({ action: `DMS_PO_${action.toUpperCase()}`, user: req.dms.loginId, userId: req.user._id, module: 'DMS', resourceId: String(po._id), metadata: { poNo: po.poNo } });
  sendSuccess(res, { data: po, message: `Purchase Order ${action}` });
}));

export default router;
