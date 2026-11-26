import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess, sendCreated } from '../../utils/apiResponse.js';
import { DmsLocation } from '../../dms/models/master.models.js';
import { CrmPart, nextCrmSeq } from '../models/crm.masters.js';
import { CrmJob } from '../models/crm.job.js';
import {
  CrmStock, CrmEngineerStock, CrmStockLedger, CrmPnaBucket, CrmPo, CrmDispatch, CrmGrn, CrmLedger,
} from '../models/crm.inventory.js';
import { CrmError, requireCrmRole } from '../middleware/context.js';

const router = Router();

async function adjustStock(locationId, partId, deltas, meta = {}) {
  let stk = await CrmStock.findOne({ location: locationId, part: partId });
  if (!stk) stk = await CrmStock.create({ location: locationId, part: partId });
  const opening = stk.fresh;
  for (const [k, v] of Object.entries(deltas)) {
    const next = (stk[k] || 0) + Number(v || 0);
    if (next < 0) throw new CrmError(`Insufficient ${k} stock`, 422);
    stk[k] = next;
  }
  await stk.save();
  if (deltas.fresh) {
    await CrmStockLedger.create({
      location: locationId,
      part: partId,
      ledgerType: 'Fresh',
      txnType: meta.txnType || 'Stock Update',
      opening,
      qtyChange: deltas.fresh,
      closing: stk.fresh,
      refType: meta.refType,
      refNo: meta.refNo,
      by: meta.by,
      remark: meta.remark || '',
    });
  }
  return stk;
}

/* Location Stock */
router.get('/stock', asyncHandler(async (req, res) => {
  const { location, product, brand } = req.query;
  const q = {};
  if (req.crm.crmRole === 'ASP' && req.crm.locationId) q.location = req.crm.locationId;
  else if (req.crm.crmRole === 'WH' && req.crm.locationId) q.location = req.crm.locationId;
  else if (location) q.location = location;

  let rows = await CrmStock.find(q)
    .populate('location', 'name code locationType')
    .populate({ path: 'part', populate: { path: 'brand product models', select: 'name modelName' } })
    .lean();
  if (product) rows = rows.filter((r) => String(r.part?.product?._id) === product);
  if (brand) rows = rows.filter((r) => String(r.part?.brand?._id) === brand);
  sendSuccess(res, { data: rows });
}));

/* Engineer Stock */
router.get('/engineer-stock', asyncHandler(async (req, res) => {
  const q = {};
  if (req.crm.crmRole === 'ASP' && req.crm.locationId) q.location = req.crm.locationId;
  else if (req.query.location) q.location = req.query.location;
  if (req.query.engineer) q.engineer = req.query.engineer;
  const rows = await CrmEngineerStock.find(q)
    .populate('engineer', 'displayName loginId')
    .populate({ path: 'part', populate: { path: 'brand product', select: 'name' } })
    .lean();
  sendSuccess(res, { data: rows });
}));

/* Issue Fresh Stock to Engineer */
router.post('/stock/issue-engineer', requireCrmRole('ASP'), asyncHandler(async (req, res) => {
  const { engineerId, items, issueType, jobNo, remark } = req.body || {};
  const locationId = req.body.locationId || req.crm.locationId;
  if (!locationId || !engineerId || !items?.length) throw new CrmError('Location, Engineer and Items are required', 422);

  for (const it of items) {
    const qty = Number(it.qty || 1);
    await adjustStock(locationId, it.part, { fresh: -qty }, { txnType: 'Issue To Engineer', refType: issueType || 'ENG_ISSUE', refNo: jobNo, by: req.crm.loginId, remark });
    let estk = await CrmEngineerStock.findOne({ location: locationId, engineer: engineerId, part: it.part });
    if (!estk) estk = await CrmEngineerStock.create({ location: locationId, engineer: engineerId, part: it.part });
    estk.fresh += qty;
    await estk.save();
  }
  const seq = await nextCrmSeq('dispatch');
  const doc = await CrmDispatch.create({
    docNo: `ENGISS${String(seq).padStart(5, '0')}`,
    docType: 'Engineer Issue',
    fromLocation: locationId,
    toEngineer: engineerId,
    jobNo,
    status: 'Received',
    items: items.map((i) => ({ ...i, qty: Number(i.qty || 1) })),
    totalQty: items.reduce((s, i) => s + Number(i.qty || 1), 0),
    remark,
    createdBy: req.user._id,
  });
  sendCreated(res, { data: doc, message: 'Stock issued to engineer' });
}));

/* Return Fresh/Faulty Stock from Engineer */
router.post('/stock/return-engineer', requireCrmRole('ASP'), asyncHandler(async (req, res) => {
  const { engineerId, items, stockKind = 'fresh', remark } = req.body || {};
  const locationId = req.body.locationId || req.crm.locationId;
  if (!locationId || !engineerId || !items?.length) throw new CrmError('Location, Engineer and Items are required', 422);

  for (const it of items) {
    const qty = Number(it.qty || 1);
    const estk = await CrmEngineerStock.findOne({ location: locationId, engineer: engineerId, part: it.part });
    if (!estk || estk[stockKind] < qty) throw new CrmError('Insufficient engineer stock', 422);
    estk[stockKind] -= qty;
    await estk.save();
    await adjustStock(locationId, it.part, { [stockKind === 'defective' ? 'defective' : 'fresh']: qty }, {
      txnType: 'Receive From Engineer', refType: 'ENG_RET', by: req.crm.loginId, remark,
    });
  }
  sendSuccess(res, { message: 'Returned from engineer' });
}));

/* PNA Bucket */
router.get('/pna-bucket', asyncHandler(async (req, res) => {
  const q = { status: 'Pending' };
  if (req.crm.crmRole === 'ASP' && req.crm.locationId) q.location = req.crm.locationId;
  else if (req.query.location) q.location = req.query.location;
  const rows = await CrmPnaBucket.find(q).populate('part', 'partcode partName locationPrice').sort({ createdAt: -1 }).lean();
  sendSuccess(res, { data: rows });
}));

router.post('/pna-bucket/raise-po', requireCrmRole('ASP'), asyncHandler(async (req, res) => {
  const { bucketIds, toLocation } = req.body || {};
  if (!bucketIds?.length || !toLocation) throw new CrmError('Select PNA items and Warehouse', 422);
  const buckets = await CrmPnaBucket.find({ _id: { $in: bucketIds }, status: 'Pending' }).populate('part').lean();
  if (!buckets.length) throw new CrmError('No pending PNA items found', 422);

  const fromLoc = buckets[0].location;
  const fromLocDoc = await DmsLocation.findById(fromLoc).lean();
  const seq = await nextCrmSeq('po');
  const poNo = `${fromLocDoc?.code || 'ASP'}PO${String(seq).padStart(4, '0')}`;

  const items = buckets.map((b) => ({
    part: b.part._id,
    partcode: b.part.partcode,
    partName: b.part.partName,
    jobNo: b.jobNo,
    reqQty: b.qty,
    price: b.part.locationPrice || 0,
    total: (b.part.locationPrice || 0) * b.qty,
  }));
  const po = await CrmPo.create({
    poNo,
    poType: 'PNA',
    fromLocation: fromLoc,
    toLocation,
    status: 'Pending',
    items,
    totalQty: items.reduce((s, i) => s + i.reqQty, 0),
    totalAmount: items.reduce((s, i) => s + i.total, 0),
    createdBy: req.user._id,
  });

  await CrmPnaBucket.updateMany({ _id: { $in: bucketIds } }, { status: 'PO Raised', poNo });
  const jobNos = [...new Set(buckets.map((b) => b.jobNo))];
  await CrmJob.updateMany(
    { jobNo: { $in: jobNos } },
    {
      $set: { status: 'PNA', subStatus: 'PNA PO Raised' },
      $push: { history: { location: fromLocDoc?.name || 'ASP', activity: 'PNA PO Raised', outcome: poNo, updateBy: req.crm.loginId, updateOn: new Date() } },
    },
  );
  sendCreated(res, { data: po, message: `PNA PO ${poNo} raised` });
}));

router.delete('/pna-bucket/:id', requireCrmRole('ASP'), asyncHandler(async (req, res) => {
  const b = await CrmPnaBucket.findOne({ _id: req.params.id, status: 'Pending', ...(req.crm.isAdmin ? {} : { location: req.crm.locationId }) });
  if (!b) throw new CrmError('PNA item not found', 404);
  b.status = 'Deleted';
  await b.save();
  sendSuccess(res, { message: 'Removed from PNA bucket' });
}));

/* Purchase Orders (PNA / MSL / VENDOR) */
router.get('/po', asyncHandler(async (req, res) => {
  const { poType, status } = req.query;
  const q = {};
  if (poType) q.poType = poType;
  if (status) q.status = { $in: String(status).split(',') };
  if (req.crm.crmRole === 'ASP' && req.crm.locationId) q.fromLocation = req.crm.locationId;
  if (req.crm.crmRole === 'WH' && req.crm.locationId) {
    q.$or = [{ toLocation: req.crm.locationId }, { fromLocation: req.crm.locationId }];
  }
  const rows = await CrmPo.find(q)
    .populate('fromLocation toLocation', 'name code city state')
    .populate('supplier', 'name code')
    .sort({ createdAt: -1 }).lean();
  sendSuccess(res, { data: rows });
}));

router.post('/po', asyncHandler(async (req, res) => {
  const b = req.body || {};
  const fromLoc = b.fromLocation || req.crm.locationId;
  if (!fromLoc || !b.items?.length) throw new CrmError('Location and items are required', 422);
  const seq = await nextCrmSeq('po');
  const poType = b.poType || 'MSL';
  const poNo = `${poType === 'VENDOR' ? 'VPO' : 'PO'}${String(seq).padStart(5, '0')}`;
  const items = [];
  for (const it of b.items) {
    const p = await CrmPart.findById(it.part).lean();
    if (!p) throw new CrmError('Invalid part', 422);
    const qty = Number(it.reqQty || it.qty || 1);
    const price = Number(it.price ?? (poType === 'VENDOR' ? p.purchasePrice : p.locationPrice) ?? 0);
    items.push({ part: p._id, partcode: p.partcode, partName: p.partName, jobNo: it.jobNo, reqQty: qty, price, total: qty * price });
  }
  const po = await CrmPo.create({
    poNo,
    poType,
    fromLocation: fromLoc,
    toLocation: b.toLocation || undefined,
    supplier: b.supplier || undefined,
    vendorType: b.vendorType || '',
    docType: b.docType || 'Invoice',
    status: 'Pending',
    items,
    totalQty: items.reduce((s, i) => s + i.reqQty, 0),
    totalAmount: items.reduce((s, i) => s + i.total, 0),
    remark: b.remark,
    createdBy: req.user._id,
  });
  sendCreated(res, { data: po, message: `PO ${poNo} created` });
}));

router.post('/po/:id/approve', requireCrmRole('Admin'), asyncHandler(async (req, res) => {
  const { decision, remark } = req.body || {};
  const po = await CrmPo.findById(req.params.id);
  if (!po) throw new CrmError('PO not found', 404);
  po.status = decision === 'Rejected' ? 'Rejected' : 'Approved';
  po.approvedBy = req.crm.loginId;
  po.approvedAt = new Date();
  if (remark) po.remark = remark;
  await po.save();
  sendSuccess(res, { data: po, message: `PO ${po.status}` });
}));

router.post('/po/:id/cancel', requireCrmRole('Admin', 'ASP'), asyncHandler(async (req, res) => {
  const cur = await CrmPo.findById(req.params.id);
  if (!cur) throw new CrmError('PO not found', 404);
  if (!req.crm.isAdmin && String(cur.fromLocation) !== req.crm.locationId) throw new CrmError('You can cancel only your own PO', 403);
  if (!['Pending', 'Approved'].includes(cur.status)) throw new CrmError('Only pending POs can be cancelled', 422);
  const po = await CrmPo.findByIdAndUpdate(req.params.id, { status: 'Cancelled' }, { new: true });
  if (po.poType === 'PNA') await CrmPnaBucket.updateMany({ poNo: po.poNo }, { status: 'Pending', poNo: '' });
  sendSuccess(res, { data: po, message: 'PO Cancelled' });
}));

/* WH Dispatch Against PNA/MSL PO */
router.post('/po/:id/dispatch', requireCrmRole('WH'), asyncHandler(async (req, res) => {
  const { items, docType = 'Invoice', courierName, docketNo, fcaInvoiceNo, remark } = req.body || {};
  const po = await CrmPo.findById(req.params.id);
  if (!po) throw new CrmError('PO not found', 404);
  if (['Cancelled', 'Received', 'Dispatched', 'Rejected'].includes(po.status)) throw new CrmError(`PO is ${po.status}`, 422);
  if (po.poType === 'VENDOR') throw new CrmError('Vendor POs are received through Gate Entry / GRN', 422);
  const whId = po.toLocation || req.crm.locationId;
  if (!whId) throw new CrmError('Warehouse location missing', 422);

  const dispLines = [];
  const sourceItems = items?.length
    ? items
    : po.items.map((l) => ({ part: l.part, partcode: l.partcode, partName: l.partName, jobNo: l.jobNo, qty: Math.max(0, (l.reqQty || 0) - (l.dispQty || 0)), price: l.price }));
  for (const it of sourceItems) {
    const qty = Number(it.dispQty ?? it.qty ?? it.reqQty ?? 0);
    if (qty <= 0) continue;
    const p = await CrmPart.findById(it.part).lean();
    await adjustStock(whId, it.part, { fresh: -qty }, { txnType: 'PO Dispatch', refType: 'PO', refNo: po.poNo, by: req.crm.loginId });
    await adjustStock(po.fromLocation, it.part, { freshInTransit: qty }, { txnType: 'In-Transit Add', refType: 'PO', refNo: po.poNo, by: req.crm.loginId });
    const poLine = po.items.find((l) => String(l.part) === String(it.part));
    if (poLine) poLine.dispQty += qty;
    dispLines.push({
      part: it.part,
      partcode: p?.partcode || it.partcode,
      partName: p?.partName || it.partName,
      jobNo: it.jobNo || poLine?.jobNo,
      qty,
      price: it.price ?? poLine?.price ?? 0,
      total: qty * (it.price ?? poLine?.price ?? 0),
    });
  }
  if (!dispLines.length) throw new CrmError('No dispatch quantities provided', 422);

  const allDone = po.items.every((l) => l.dispQty >= l.reqQty);
  po.status = allDone ? 'Dispatched' : 'Partial Processed';
  await po.save();

  const seq = await nextCrmSeq('dispatch');
  const docNo = `${docType === 'Delivery Challan' ? 'DC' : 'INV'}${String(seq).padStart(5, '0')}`;
  const subTotal = dispLines.reduce((s, i) => s + i.total, 0);
  const dispatch = await CrmDispatch.create({
    docNo,
    docType,
    fromLocation: whId,
    toLocation: po.fromLocation,
    poNo: po.poNo,
    courierName,
    docketNo,
    fcaInvoiceNo,
    status: 'Dispatched',
    items: dispLines,
    totalQty: dispLines.reduce((s, i) => s + i.qty, 0),
    subTotal,
    grandTotal: subTotal,
    remark,
    createdBy: req.user._id,
  });

  if (po.poType === 'PNA') {
    const jobNos = [...new Set(dispLines.map((l) => l.jobNo).filter(Boolean))];
    await CrmJob.updateMany(
      { jobNo: { $in: jobNos } },
      {
        $set: { subStatus: 'PNA PO Processed' },
        $push: { history: { location: 'WH', activity: 'WH Dispatch', outcome: `${docNo} (${courierName || 'Courier'})`, updateBy: req.crm.loginId, updateOn: new Date() } },
      },
    );
  }
  sendCreated(res, { data: dispatch, message: `Dispatched ${docNo}` });
}));

/* Dispatches / Invoices / Challans / STN / Faulty Dispatch / Retail Invoice */
router.get('/dispatches', asyncHandler(async (req, res) => {
  const { docType, status } = req.query;
  const q = {};
  if (docType) q.docType = { $in: String(docType).split(',') };
  if (status) q.status = { $in: String(status).split(',') };
  if ((req.crm.crmRole === 'ASP' || req.crm.crmRole === 'WH') && req.crm.locationId) {
    q.$or = [{ fromLocation: req.crm.locationId }, { toLocation: req.crm.locationId }];
  }
  const rows = await CrmDispatch.find(q).populate('fromLocation toLocation', 'name code city state').sort({ createdAt: -1 }).lean();
  sendSuccess(res, { data: rows });
}));

router.post('/dispatches', asyncHandler(async (req, res) => {
  const b = req.body || {};
  const fromLoc = b.fromLocation || req.crm.locationId;
  if (!fromLoc || !b.docType || !b.items?.length) throw new CrmError('From Location, Document Type and Items are required', 422);

  const lines = [];
  for (const it of b.items) {
    const p = await CrmPart.findById(it.part).lean();
    if (!p) throw new CrmError('Invalid part', 422);
    const qty = Number(it.qty || 1);
    const isFaulty = b.docType === 'Faulty Dispatch' || b.stockType === 'Faulty';
    await adjustStock(fromLoc, p._id, isFaulty ? { defective: -qty } : { fresh: -qty }, {
      txnType: b.docType, refType: b.docType, by: req.crm.loginId,
    });
    if (b.toLocation) {
      await adjustStock(b.toLocation, p._id, isFaulty ? { defectiveInTransit: qty } : { freshInTransit: qty }, {
        txnType: 'In-Transit', by: req.crm.loginId,
      });
    }
    const price = Number(it.price ?? p.customerPrice ?? 0);
    const igst = Number(it.igst || 0);
    const base = qty * price - Number(it.discount || 0);
    const tax = (base * igst) / 100;
    lines.push({
      part: p._id, partcode: p.partcode, partName: p.partName, jobNo: it.jobNo, serialNo: it.serialNo,
      qty, price, discount: Number(it.discount || 0), igst, total: base + tax,
    });
  }
  const seq = await nextCrmSeq('dispatch');
  const docNo = `${b.docType.slice(0, 3).toUpperCase()}${String(seq).padStart(5, '0')}`;
  const subTotal = lines.reduce((s, i) => s + i.total, 0);
  const doc = await CrmDispatch.create({
    ...b,
    docNo,
    fromLocation: fromLoc,
    status: b.docType === 'Retail Invoice' ? 'Processed' : 'Dispatched',
    items: lines,
    totalQty: lines.reduce((s, i) => s + i.qty, 0),
    subTotal,
    grandTotal: subTotal,
    createdBy: req.user._id,
  });
  sendCreated(res, { data: doc, message: `${b.docType} ${docNo} created` });
}));

/* Receive Dispatch (ASP Stock In or WH Faulty/Sales Return) */
router.post('/dispatches/:id/receive', asyncHandler(async (req, res) => {
  const { items, remark } = req.body || {};
  const doc = await CrmDispatch.findById(req.params.id);
  if (!doc) throw new CrmError('Dispatch not found', 404);
  if (doc.status === 'Received') throw new CrmError('Already received', 422);

  const isFaulty = doc.docType === 'Faulty Dispatch' || doc.stockType === 'Faulty';
  if (!req.crm.isAdmin && req.crm.locationId && doc.toLocation && String(doc.toLocation) !== req.crm.locationId) throw new CrmError('This document is not addressed to your location', 403);
  const targetLoc = doc.toLocation || req.crm.locationId;

  for (const line of doc.items) {
    const ov = items?.find((x) => String(x.part) === String(line.part));
    const okQty = Number(ov?.okQty ?? line.qty);
    const damageQty = Number(ov?.damageQty ?? 0);
    const missingQty = Number(ov?.missingQty ?? 0);
    line.okQty = okQty;
    line.damageQty = damageQty;
    line.missingQty = missingQty;

    if (targetLoc) {
      await adjustStock(targetLoc, line.part, {
        [isFaulty ? 'defectiveInTransit' : 'freshInTransit']: -line.qty,
        [isFaulty ? 'defective' : 'fresh']: okQty,
        damage: damageQty,
        missing: missingQty,
      }, { txnType: 'Stock In Receive', refType: doc.docType, refNo: doc.docNo, by: req.crm.loginId, remark });
    }
  }
  doc.status = 'Received';
  doc.receivedAt = new Date();
  doc.receivedBy = req.crm.loginId;
  doc.receiveRemark = remark || '';
  await doc.save();

  if (doc.poNo) {
    await CrmPo.findOneAndUpdate({ poNo: doc.poNo }, { status: 'Received' });
    const jobNos = [...new Set(doc.items.map((l) => l.jobNo).filter(Boolean))];
    if (jobNos.length) {
      await CrmJob.updateMany(
        { jobNo: { $in: jobNos } },
        {
          $set: { subStatus: 'PNA Part Received' },
          $push: { history: { location: 'ASP', activity: 'PNA Part Received', outcome: doc.docNo, updateBy: req.crm.loginId, updateOn: new Date() } },
        },
      );
    }
  }
  if (doc.toLocation) {
    await CrmLedger.create({
      location: doc.toLocation,
      accountType: 'Main',
      txnType: doc.docType,
      refNo: doc.docNo,
      details: `${doc.docType} Received`,
      dr: isFaulty ? 0 : doc.grandTotal,
      cr: isFaulty ? doc.grandTotal : 0,
      by: req.crm.loginId,
    });
  }
  sendSuccess(res, { data: doc, message: `${doc.docNo} received` });
}));

router.post('/dispatches/:id/courier', asyncHandler(async (req, res) => {
  const doc = await CrmDispatch.findByIdAndUpdate(
    req.params.id,
    { courierName: req.body.courierName, docketNo: req.body.docketNo },
    { new: true },
  );
  if (!doc) throw new CrmError('Document not found', 404);
  sendSuccess(res, { data: doc, message: 'Courier updated' });
}));

router.post('/dispatches/:id/cancel', requireCrmRole('Admin'), asyncHandler(async (req, res) => {
  const doc = await CrmDispatch.findById(req.params.id);
  if (!doc) throw new CrmError('Document not found', 404);
  if (doc.status === 'Cancelled') throw new CrmError('Already cancelled', 422);
  if (doc.status === 'Received') throw new CrmError('Received documents cannot be cancelled', 422);
  if (!['Engineer Issue', 'Engineer Return'].includes(doc.docType)) {
    const isFaulty = doc.docType === 'Faulty Dispatch' || doc.stockType === 'Faulty';
    for (const l of doc.items) {
      await adjustStock(doc.fromLocation, l.part, { [isFaulty ? 'defective' : 'fresh']: l.qty }, { txnType: 'Invoice Cancel', refType: doc.docType, refNo: doc.docNo, by: req.crm.loginId });
      if (doc.toLocation) await adjustStock(doc.toLocation, l.part, { [isFaulty ? 'defectiveInTransit' : 'freshInTransit']: -l.qty }, { txnType: 'Invoice Cancel', refNo: doc.docNo, by: req.crm.loginId });
    }
    if (doc.poNo) {
      const po = await CrmPo.findOne({ poNo: doc.poNo });
      if (po) { for (const l of doc.items) { const pl = po.items.find((x) => String(x.part) === String(l.part)); if (pl) pl.dispQty = Math.max(0, pl.dispQty - l.qty); } po.status = po.items.some((x) => x.dispQty > 0) ? 'Partial Processed' : 'Pending'; await po.save(); }
    }
  }
  doc.status = 'Cancelled';
  await doc.save();
  sendSuccess(res, { data: doc, message: 'Document cancelled' });
}));

/* GRN (Local GRN, Gate Entry, Receive GRN) */
router.get('/grn', asyncHandler(async (_req, res) => {
  const rows = await CrmGrn.find().populate('supplier', 'name code').populate('shipTo billTo', 'name code').sort({ createdAt: -1 }).lean();
  sendSuccess(res, { data: rows });
}));

router.post('/grn/local', requireCrmRole('WH'), asyncHandler(async (req, res) => {
  const b = req.body || {};
  const shipTo = b.shipTo || req.crm.locationId;
  if (!shipTo || !b.items?.length) throw new CrmError('Ship To WH and Items are required', 422);
  const lines = [];
  for (const it of b.items) {
    const p = await CrmPart.findById(it.part).lean();
    if (!p) throw new CrmError('Invalid part', 422);
    const qty = Number(it.qty || 1);
    await adjustStock(shipTo, p._id, { fresh: qty }, { txnType: 'Local GRN', refType: 'GRN', by: req.crm.loginId });
    const price = Number(it.price ?? p.purchasePrice ?? 0);
    lines.push({ part: p._id, partcode: p.partcode, partName: p.partName, qty, okQty: qty, price, total: qty * price });
  }
  const seq = await nextCrmSeq('grn');
  const grnNo = `LGRN${String(seq).padStart(5, '0')}`;
  const total = lines.reduce((s, i) => s + i.total, 0);
  const grn = await CrmGrn.create({
    grnNo, grnType: 'Local', supplier: b.supplier, billTo: b.billTo || shipTo, shipTo,
    status: 'Received', items: lines, totalQty: lines.reduce((s, i) => s + i.qty, 0),
    subTotal: total, grandTotal: total, remark: b.remark, receivedAt: new Date(), createdBy: req.user._id,
  });
  sendCreated(res, { data: grn, message: `Local GRN ${grnNo} received` });
}));

router.post('/grn/gate-entry', requireCrmRole('WH'), asyncHandler(async (req, res) => {
  const { poNo, vehicleNo, transportName, docketNo } = req.body || {};
  const po = await CrmPo.findOne({ poNo: String(poNo).toUpperCase().trim() }).lean();
  if (!po) throw new CrmError('Vendor PO not found', 404);
  if (po.poType !== 'VENDOR' || po.status !== 'Approved') throw new CrmError('Only approved vendor POs can be gate-entered', 422);
  if (await CrmGrn.findOne({ poNo: po.poNo })) throw new CrmError('Gate entry already made for this PO', 409);
  const seq = await nextCrmSeq('grn');
  const grnNo = `GE${String(seq).padStart(5, '0')}`;
  const grn = await CrmGrn.create({
    grnNo, grnType: 'PO', poNo: po.poNo, supplier: po.supplier,
    billTo: po.fromLocation, shipTo: po.toLocation || po.fromLocation,
    gateEntryNo: grnNo, vehicleNo, transportName, docketNo, status: 'Gate Entry',
    items: po.items.map((i) => ({ part: i.part, partcode: i.partcode, partName: i.partName, qty: i.reqQty, price: i.price, total: i.total })),
    totalQty: po.totalQty, subTotal: po.totalAmount, grandTotal: po.totalAmount, createdBy: req.user._id,
  });
  sendCreated(res, { data: grn, message: `Gate Entry ${grnNo} created` });
}));

router.post('/grn/:id/receive', requireCrmRole('WH'), asyncHandler(async (req, res) => {
  const { items, invoiceNo, invoiceDate, remark } = req.body || {};
  const grn = await CrmGrn.findById(req.params.id);
  if (!grn) throw new CrmError('GRN not found', 404);
  if (grn.status === 'Received') throw new CrmError('Already received', 422);

  for (const line of grn.items) {
    const ov = items?.find((x) => String(x.part) === String(line.part));
    const okQty = Number(ov?.okQty ?? line.qty);
    const damageQty = Number(ov?.damageQty ?? 0);
    const missingQty = Number(ov?.missingQty ?? 0);
    line.okQty = okQty;
    line.damageQty = damageQty;
    line.missingQty = missingQty;
    await adjustStock(grn.shipTo, line.part, { fresh: okQty, damage: damageQty, missing: missingQty }, {
      txnType: 'GRN Receive', refType: 'GRN', refNo: grn.grnNo, by: req.crm.loginId, remark,
    });
  }
  grn.status = 'Received';
  grn.invoiceNo = invoiceNo;
  grn.invoiceDate = invoiceDate ? new Date(invoiceDate) : new Date();
  grn.remark = remark;
  grn.receivedAt = new Date();
  await grn.save();
  if (grn.poNo) await CrmPo.findOneAndUpdate({ poNo: grn.poNo }, { status: 'Received' });
  sendSuccess(res, { data: grn, message: `GRN ${grn.grnNo} received` });
}));

/* Stock Adjustment */
router.post('/stock/adjustment', requireCrmRole('Admin', 'WH'), asyncHandler(async (req, res) => {
  const { locationId, items, remark } = req.body || {};
  const loc = locationId || req.crm.locationId;
  if (!loc || !items?.length) throw new CrmError('Location and items are required', 422);
  for (const it of items) {
    await adjustStock(loc, it.part, {
      fresh: Number(it.okDelta || 0),
      damage: Number(it.damageDelta || 0),
      missing: Number(it.missingDelta || 0),
    }, { txnType: 'Stock Adjustment', refType: 'ADJ', by: req.crm.loginId, remark });
  }
  sendSuccess(res, { message: 'Stock adjusted' });
}));

export default router;
