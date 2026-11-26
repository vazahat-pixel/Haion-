/**
 * Service CRM — remaining reference screens:
 * shared masters (DMS collections), job side-flows (reschedule, pickup/drop, edit, SFR,
 * estimate decision, out-warranty invoice), CN, reconciliation, expense approval,
 * engineer attendance and every report / dashboard table of the reference panels.
 */
import { Router } from 'express';
import mongoose from 'mongoose';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess, sendCreated } from '../../utils/apiResponse.js';
import { DmsMaster, DmsHsn, DmsLocation, DmsVendor, LOCATION_TYPES } from '../../dms/models/master.models.js';
import { CrmPart, CrmModel, CrmUserProfile, nextCrmSeq } from '../models/crm.masters.js';
import { CrmJob } from '../models/crm.job.js';
import {
  CrmStock, CrmEngineerStock, CrmStockLedger, CrmPo, CrmDispatch, CrmGrn, CrmLedger, CrmExpense, CrmClaim,
} from '../models/crm.inventory.js';
import { CrmError, requireCrmRole } from '../middleware/context.js';

const router = Router();
const { Schema } = mongoose;

/* Engineer attendance (marked from the engineer app; listed in the ASP panel) */
const attendanceSchema = new Schema({
  engineer: { type: Schema.Types.ObjectId, ref: 'CrmUserProfile', required: true, index: true },
  location: { type: Schema.Types.ObjectId, ref: 'DmsLocation', index: true },
  inAt: Date, inAddress: String, outAt: Date, outAddress: String,
}, { timestamps: true, collection: 'crm_attendance' });
export const CrmAttendance = mongoose.models.CrmAttendance || mongoose.model('CrmAttendance', attendanceSchema);

const OPEN_EXCL = ['Handover', 'Cancel', 'RWR', 'BER', 'Repair Done', 'Installation Done', 'Demo Done', 'Replacement'];
const DONE = ['Repair Done', 'Handover', 'Installation Done', 'Demo Done', 'Replacement'];
const day = 86400000;
const n2 = (v) => Math.round((Number(v) || 0) * 100) / 100;

/** Reference "Status" text for a job row. */
export function jobStatusText(j) {
  if (j.status === 'Handover') return 'Set Delivered';
  if (j.status === 'Open') return j.ackStatus === 'Rejected' ? 'Rejected By ASC' : 'Registered';
  if (j.status === 'Asigned') return 'Assigned';
  if (j.status === 'PNA') return j.subStatus || 'PNA';
  if (j.status === 'EP') return 'Estimate Pending For Cost';
  if (j.status === 'RWR') return 'Closed Without Repair';
  if (j.status === 'Request For Approval') return j.subStatus === 'Request Approved' ? 'Request Approved' : j.subStatus === 'Request Rejected' ? 'Request Rejected' : 'Request For Approval';
  if (j.status === 'Replacement') return 'Replacement Done';
  return j.status;
}

function dateRange(q, field = 'openDate') {
  const out = {};
  if (q.from) out.$gte = new Date(q.from);
  if (q.to) out.$lte = new Date(new Date(q.to).getTime() + day - 1);
  return Object.keys(out).length ? { [field]: out } : {};
}
const list = (v) => (v ? String(v).split(',').filter(Boolean) : []);

function scopeJobs(req, q = {}) {
  const out = { ...q };
  if (req.crm.crmRole === 'ASP' && req.crm.locationId) out.assignLocation = req.crm.locationId;
  return out;
}

async function loadJob(req, roles) {
  if (roles && !req.crm.isAdmin && !roles.includes(req.crm.crmRole)) throw new CrmError('You do not have permission for this action', 403);
  const job = await CrmJob.findById(req.params.id);
  if (!job) throw new CrmError('Job not found', 404);
  if (req.crm.crmRole === 'ASP' && req.crm.locationId && String(job.assignLocation) !== req.crm.locationId) {
    throw new CrmError('This job is not assigned to your location', 403);
  }
  return job;
}
const hist = (req, job, activity, outcome, remark) => job.history.push({
  location: req.crm.location?.name || (req.crm.isAdmin ? 'Admin' : req.crm.crmRole), activity, outcome,
  updateBy: req.crm.loginId, remark: remark || '', priority: job.priority, updateOn: new Date(),
});

/* ───────────── Shared masters (stored in DMS collections, visible in both panels) ───────────── */
const SHARED = {
  brand: { model: DmsMaster, type: 'brand' },
  product: { model: DmsMaster, type: 'category' },
  state: { model: DmsMaster, type: 'state' },
  city: { model: DmsMaster, type: 'city' },
  hsn: { model: DmsHsn },
  supplier: { model: DmsVendor },
  location: { model: DmsLocation },
};

router.get('/shared/:type', asyncHandler(async (req, res) => {
  const s = SHARED[req.params.type];
  if (!s) throw new CrmError('Unknown master', 400);
  const q = s.type ? { type: s.type } : {};
  if (req.query.status) q.status = req.query.status;
  if (req.params.type === 'location' && req.query.locationType) q.locationType = { $in: list(req.query.locationType) };
  let find = s.model.find(q).sort(s.type ? 'name' : { createdAt: -1 });
  if (req.params.type === 'city') find = find.populate('parent', 'name');
  sendSuccess(res, { data: await find.lean() });
}));

async function sharedBody(type, b) {
  if (type === 'city') {
    const st = await DmsMaster.findOne({ type: 'state', name: b.state }).lean();
    return { name: b.name, parent: st?._id, attrs: { isDistrict: Boolean(b.isDistrict) }, status: b.status || 'Active' };
  }
  if (type === 'state') return { name: b.name, code: b.code, attrs: { circle: b.circle, country: b.country || 'India' }, status: b.status || 'Active' };
  if (type === 'brand' || type === 'product') return { name: b.name, attrs: b.attrs || {}, status: b.status || 'Active' };
  if (type === 'location') {
    const prefix = LOCATION_TYPES[b.locationType] || 'AS';
    const st = await DmsMaster.findOne({ type: 'state', name: b.state }).lean();
    const extraKeys = ['district', 'helplineNo', 'otherTaxNo', 'otherTaxName', 'erpCode', 'otherCode', 'purchaseFrom', 'country'];
    const out = { ...b, stateCode: b.stateCode || st?.code || String(b.state || '').slice(0, 2).toUpperCase(), billingAddress: b.billingAddress || b.address, attrs: { ...(b.attrs || {}) } };
    for (const k of extraKeys) { if (b[k] !== undefined) out.attrs[k] = b[k]; delete out[k]; }
    delete out.password;
    if (!out.code) out.code = `P${prefix}${String(await nextCrmSeq(`loc-${prefix}`)).padStart(4, '0')}`;
    return out;
  }
  if (type === 'supplier' && !b.code) return { ...b, code: `VN${String(await nextCrmSeq('vendor')).padStart(4, '0')}` };
  return b;
}

router.post('/shared/:type', requireCrmRole('Admin'), asyncHandler(async (req, res) => {
  const s = SHARED[req.params.type];
  if (!s) throw new CrmError('Unknown master', 400);
  const b = await sharedBody(req.params.type, req.body || {});
  if (s.type) {
    if (!b.name?.trim()) throw new CrmError('Name is required', 422, { name: ['Required'] });
    if (await DmsMaster.findOne({ type: s.type, name: b.name.trim(), ...(s.type === 'city' ? { parent: b.parent } : {}) })) throw new CrmError(`${b.name} already exists`, 409);
    b.type = s.type;
  }
  if (req.params.type === 'location' && req.body.loginId) {
    b.code = String(req.body.loginId).toUpperCase().trim();
    if (await DmsLocation.findOne({ code: b.code })) throw new CrmError('User id already exists', 409, { loginId: ['Already used'] });
    if (await CrmUserProfile.findOne({ loginId: b.code })) throw new CrmError('User id already exists', 409, { loginId: ['Already used'] });
  }
  delete b.loginId;
  const doc = await s.model.create(b);
  if (req.params.type === 'location' && req.body.password && ['ASP', 'Call Center', 'WH'].includes(doc.locationType)) {
    const User = mongoose.model('User');
    const user = await User.create({
      email: `${doc.code.toLowerCase()}@crm.local`, phone: `9${String(Date.now()).slice(-5)}${Math.floor(1000 + Math.random() * 9000)}`,
      password: await User.hashPassword(String(req.body.password)), firstName: doc.name, lastName: doc.locationType, role: 'SERVICE_CENTER', isActive: true,
    });
    await CrmUserProfile.create({ user: user._id, loginId: doc.code, displayName: doc.name, crmRole: doc.locationType, userType: doc.locationType, location: doc._id, phone: doc.phone, email: doc.email });
  }
  sendCreated(res, { data: doc, message: 'Saved' });
}));

router.put('/shared/:type/:id', requireCrmRole('Admin'), asyncHandler(async (req, res) => {
  const s = SHARED[req.params.type];
  if (!s) throw new CrmError('Unknown master', 400);
  const b = await sharedBody(req.params.type, req.body || {});
  delete b.type;
  const doc = await s.model.findByIdAndUpdate(req.params.id, b, { new: true });
  if (!doc) throw new CrmError('Not found', 404);
  sendSuccess(res, { data: doc, message: 'Updated' });
}));

/* ───────────── Job side-flows ───────────── */
router.post('/jobs/:id/reschedule', asyncHandler(async (req, res) => {
  const job = await loadJob(req, ['ASP']);
  const { visitDate, visitTime, remark } = req.body || {};
  if (!visitDate || !visitTime) throw new CrmError('Visit Date and Time are required', 422);
  job.visitDate = new Date(visitDate); job.visitTime = visitTime;
  hist(req, job, 'Visit Rescheduled', `Visit - ${visitDate}/${visitTime}`, remark);
  await job.save();
  sendSuccess(res, { data: job, message: 'Visit rescheduled' });
}));

router.post('/jobs/:id/pickup', asyncHandler(async (req, res) => {
  const job = await loadJob(req, ['ASP']);
  const { action, userId, remark } = req.body || {};
  const user = userId ? await CrmUserProfile.findById(userId).lean() : null;
  if (action === 'assign-pickup') {
    if (!user) throw new CrmError('Select pickup boy', 422);
    job.pickupBoy = user._id; job.status = 'Pending For Pickup'; job.subStatus = 'Call Assigned to pickup Boy';
    hist(req, job, 'Assigned To Pickup', user.displayName, remark);
  } else if (action === 'received') {
    job.status = 'Received'; job.subStatus = 'Pickup Received';
    hist(req, job, 'Pickup Received', 'Unit received at ASP', remark);
  } else if (action === 'assign-delivery') {
    if (!user) throw new CrmError('Select delivery boy', 422);
    job.deliveryBoy = user._id; job.subStatus = 'Issue to Delivery Boy';
    hist(req, job, 'Assigned To Delivery Boy', user.displayName, remark);
  } else if (action === 'delivered') {
    job.status = 'Handover'; job.subStatus = 'Set Delivered'; job.closeDate = job.closeDate || new Date();
    hist(req, job, 'Delivered', 'Set Delivered', remark);
  } else throw new CrmError('Unknown action', 422);
  await job.save();
  sendSuccess(res, { data: job, message: 'Updated' });
}));

const EDITABLE = ['customerName', 'contactNo', 'altContactNo', 'email', 'address', 'landmark', 'state', 'city', 'area', 'pincode', 'serialNo', 'purchaseDate', 'installationDate', 'warrantyEndDate', 'warrantyStatus', 'dealerName', 'invoiceNo', 'callType', 'callSource', 'serviceType', 'areaType', 'remark'];
router.put('/jobs/:id', asyncHandler(async (req, res) => {
  const job = await loadJob(req, ['ASP', 'Call Center']);
  for (const k of EDITABLE) if (req.body[k] !== undefined) job[k] = req.body[k];
  hist(req, job, 'Job Details Edit', 'Details updated', req.body.editRemark);
  await job.save();
  sendSuccess(res, { data: job, message: 'Job updated' });
}));

router.post('/jobs/:id/sfr', asyncHandler(async (req, res) => {
  const job = await loadJob(req, ['ASP']);
  const { repairCenter, faultCode, remark } = req.body || {};
  if (!repairCenter) throw new CrmError('Repair Center is required', 422);
  const rc = await DmsLocation.findById(repairCenter).lean();
  job.status = 'SFR'; job.subStatus = 'SFR Dispatched By ASP';
  hist(req, job, 'Send For Repair', `${rc?.name || 'Repair Center'} ${faultCode ? `(${faultCode})` : ''}`, remark);
  await job.save();
  sendSuccess(res, { data: job, message: 'Sent for repair' });
}));

router.post('/jobs/:id/estimate', asyncHandler(async (req, res) => {
  const job = await loadJob(req, ['ASP', 'Call Center']);
  const accept = req.body.decision === 'Accept';
  job.estimate.status = accept ? 'Accepted' : 'Refused';
  job.status = accept ? 'WIP' : 'RWR';
  job.subStatus = accept ? 'Estimation Accept' : 'Estimation Refused';
  if (!accept) job.closeDate = new Date();
  hist(req, job, 'Estimate', accept ? 'Estimation Accept' : 'Estimation Refused', req.body.remark);
  await job.save();
  sendSuccess(res, { data: job, message: job.subStatus });
}));

/** OUT warranty invoice: bills consumed parts + service charge to the customer. */
router.post('/jobs/:id/invoice', asyncHandler(async (req, res) => {
  const job = await loadJob(req, ['ASP']);
  if (job.warrantyStatus !== 'OUT') throw new CrmError('Only OUT warranty jobs are invoiced', 422);
  if (await CrmDispatch.findOne({ docType: 'Retail Invoice', jobNo: job.jobNo, status: { $ne: 'Cancelled' } })) throw new CrmError('Invoice already made for this job', 409);
  const model = await CrmModel.findById(job.model).lean();
  const items = job.repairDetails.filter((r) => r.part).map((r) => ({ part: r.part, partcode: r.partcode, partName: r.partName, jobNo: job.jobNo, qty: r.qty || 1, price: r.price, total: (r.qty || 1) * (r.price || 0) }));
  const service = Number(req.body.serviceCharge ?? model?.serviceCharges ?? 0);
  const subTotal = items.reduce((s, i) => s + i.total, 0) + service;
  const gst = n2(subTotal * 0.18);
  const grand = Math.round(subTotal + gst);
  const seq = await nextCrmSeq('dispatch');
  const doc = await CrmDispatch.create({
    docNo: `RIN${String(seq).padStart(5, '0')}`, docType: 'Retail Invoice', fromLocation: job.assignLocation, jobNo: job.jobNo,
    customerName: job.customerName, customerState: job.state, customerPhone: job.contactNo, customerEmail: job.email, deliveryAddress: job.address,
    status: 'Processed', items, totalQty: items.reduce((s, i) => s + i.qty, 0), subTotal: n2(subTotal), taxTotal: gst,
    roundOff: n2(grand - subTotal - gst), grandTotal: grand, remark: `Service charge ${service}`, createdBy: req.user._id,
  });
  hist(req, job, 'OUT Warranty Invoice', doc.docNo);
  await job.save();
  sendCreated(res, { data: doc, message: `Invoice ${doc.docNo} made` });
}));

/* ───────────── Inventory / account side-flows ───────────── */
router.get('/dispatches/:id', asyncHandler(async (req, res) => {
  const doc = await CrmDispatch.findById(req.params.id).populate('fromLocation toLocation', 'name code billingAddress city state pincode gstNo phone email').populate('toEngineer', 'displayName loginId').lean();
  if (!doc) throw new CrmError('Document not found', 404);
  if (!req.crm.isAdmin && req.crm.locationId && ![String(doc.fromLocation?._id), String(doc.toLocation?._id)].includes(req.crm.locationId)) throw new CrmError('Not your document', 403);
  sendSuccess(res, { data: doc });
}));
router.get('/po/:id', asyncHandler(async (req, res) => {
  const po = await CrmPo.findById(req.params.id).populate('fromLocation toLocation', 'name code billingAddress city state').populate('supplier', 'name code address').lean();
  if (!po) throw new CrmError('PO not found', 404);
  const stock = await CrmStock.find({ part: { $in: po.items.map((i) => i.part) } }).lean();
  po.items = po.items.map((i) => ({
    ...i,
    whAvl: stock.find((s) => String(s.part) === String(i.part) && String(s.location) === String(po.toLocation?._id))?.fresh || 0,
    aspAvl: stock.find((s) => String(s.part) === String(i.part) && String(s.location) === String(po.fromLocation?._id))?.fresh || 0,
  }));
  sendSuccess(res, { data: po });
}));

router.get('/faulty-bin', asyncHandler(async (req, res) => {
  const loc = req.crm.locationId || req.query.location;
  const rows = await CrmStock.find({ ...(loc ? { location: loc } : {}), defective: { $gt: 0 } })
    .populate('location', 'name code').populate({ path: 'part', populate: { path: 'models', select: 'modelName' } }).lean();
  const jobs = await CrmJob.find(scopeJobs(req, { 'repairDetails.part': { $in: rows.map((r) => r.part?._id) } })).select('jobNo serialNo modelName repairDetails').lean();
  sendSuccess(res, {
    data: rows.map((r) => {
      const j = jobs.find((x) => x.repairDetails.some((d) => String(d.part) === String(r.part?._id)));
      return { _id: r._id, part: r.part?._id, partcode: r.part?.partcode, partName: r.part?.partName, qty: r.defective, jobNo: j?.jobNo || '', serialNo: j?.serialNo || '', model: j?.modelName || r.part?.models?.[0]?.modelName || '', location: r.location };
    }),
  });
}));

router.post('/dispatches/:id/cn', requireCrmRole('WH'), asyncHandler(async (req, res) => {
  const doc = await CrmDispatch.findById(req.params.id);
  if (!doc) throw new CrmError('Document not found', 404);
  if (doc.status !== 'Received') throw new CrmError('Receive the document before generating CN', 422);
  if (await CrmLedger.findOne({ txnType: 'Credit Note', refNo: doc.docNo })) throw new CrmError('CN already generated', 409);
  const amount = doc.items.reduce((s, l) => s + (l.okQty ?? l.qty) * (l.price || 0), 0);
  await CrmLedger.create({ location: doc.fromLocation, accountType: 'Main', txnType: 'Credit Note', refNo: doc.docNo, details: `CN against ${doc.docType} ${doc.docNo}`, cr: n2(amount), by: req.crm.loginId });
  sendSuccess(res, { message: `CN of ₹${n2(amount)} generated` });
}));

router.get('/reconciliation', asyncHandler(async (req, res) => {
  const q = { status: 'Received', $or: [{ 'items.damageQty': { $gt: 0 } }, { 'items.missingQty': { $gt: 0 } }] };
  if (req.crm.locationId && !req.crm.isAdmin) q.toLocation = req.crm.locationId;
  const rows = await CrmDispatch.find(q).populate('fromLocation toLocation', 'name code').sort({ createdAt: -1 }).lean();
  sendSuccess(res, { data: rows });
}));

router.post('/reconciliation/:id', requireCrmRole('WH'), asyncHandler(async (req, res) => {
  const doc = await CrmDispatch.findById(req.params.id);
  if (!doc) throw new CrmError('Document not found', 404);
  const loc = doc.toLocation;
  for (const l of doc.items) {
    const stk = await CrmStock.findOne({ location: loc, part: l.part });
    if (!stk) continue;
    if (req.body.action === 'damage-to-faulty' && l.damageQty) { const q = Math.min(stk.damage, l.damageQty); stk.damage -= q; stk.defective += q; }
    if (req.body.action === 'missing' && l.missingQty) { const q = Math.min(stk.missing, l.missingQty); stk.missing -= q; }
    await stk.save();
  }
  doc.receiveRemark = `${doc.receiveRemark || ''} [Reconciled: ${req.body.action}]`.trim();
  await doc.save();
  sendSuccess(res, { message: 'Reconciled' });
}));

router.post('/expenses/:id/status', requireCrmRole('Admin'), asyncHandler(async (req, res) => {
  const doc = await CrmExpense.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
  if (!doc) throw new CrmError('Expense not found', 404);
  sendSuccess(res, { data: doc, message: `Expense ${doc.status}` });
}));

router.get('/attendance', asyncHandler(async (req, res) => {
  const q = req.crm.locationId && !req.crm.isAdmin ? { location: req.crm.locationId } : {};
  const rows = await CrmAttendance.find(q).populate('engineer', 'displayName loginId').sort({ inAt: -1 }).limit(500).lean();
  sendSuccess(res, { data: rows });
}));

/* Change own password */
router.post('/change-password', asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body || {};
  if (!oldPassword || !newPassword || String(newPassword).length < 6) throw new CrmError('Enter the old password and a new password of at least 6 characters', 422);
  const User = mongoose.model('User');
  const user = await User.findById(req.user._id).select('+password');
  if (!user || !(await user.comparePassword(oldPassword))) throw new CrmError('Old password is incorrect', 422, { oldPassword: ['Incorrect'] });
  user.password = await User.hashPassword(String(newPassword));
  await user.save();
  sendSuccess(res, { message: 'Password changed successfully' });
}));

/* ───────────── Reports ───────────── */
const ageBuckets = (hrs) => (hrs <= 24 ? 'a0' : hrs <= 48 ? 'a1' : hrs <= 72 ? 'a2' : hrs <= 96 ? 'a3' : 'a4');

async function jobRows(req, extra = {}) {
  const q = scopeJobs(req, { ...dateRange(req.query), ...extra });
  if (req.query.state) q.state = { $in: list(req.query.state) };
  if (req.query.location) q.assignLocation = req.query.location;
  if (req.query.brand) q.brand = { $in: list(req.query.brand) };
  if (req.query.product) q.product = { $in: list(req.query.product) };
  if (req.query.model) q.model = { $in: list(req.query.model) };
  if (req.query.warranty) q.warrantyStatus = req.query.warranty;
  if (req.query.status) q.status = { $in: list(req.query.status) };
  if (req.query.subStatus) q.subStatus = { $in: list(req.query.subStatus) };
  if (req.query.purchaseFrom) q.purchaseFrom = req.query.purchaseFrom;
  if (req.query.pending === '1') q.status = { $nin: OPEN_EXCL };
  if (req.query.region) {
    const locs = await DmsLocation.find({ region: req.query.region }).select('_id').lean();
    q.assignLocation = { $in: locs.map((l) => l._id) };
  }
  return CrmJob.find(q).populate('assignLocation', 'name code state city').sort({ openDate: -1 }).limit(5000).lean();
}

const jobFlat = (j) => ({
  _id: j._id, jobNo: j.jobNo, customerId: j.customerIdCode, customerName: j.customerName, contactNo: j.contactNo, brand: j.brandName, product: j.productName,
  model: j.modelName, areaType: j.areaType, serialNo: j.serialNo, callType: j.callType, callSource: j.callSource, openDate: j.openDate, closeDate: j.closeDate,
  status: jobStatusText(j), subStatus: j.subStatus, warrantyStatus: j.warrantyStatus, location: j.assignLocation?.name || j.assignLocationName, locationCode: j.assignLocation?.code,
  state: j.state, city: j.city, engineer: j.engineerName, ageing: Math.floor(((j.closeDate || new Date()) - new Date(j.openDate)) / day),
  pendingReason: j.pendingReason, rating: j.handover?.rating, requestFor: j.approvalRequest?.requestFor,
});

function tatTable(jobs, keyOf, labelOf) {
  const map = new Map();
  for (const j of jobs) {
    const k = keyOf(j); if (!k) continue;
    if (!map.has(k)) map.set(k, { ...labelOf(j), total: 0, completed: 0, cancel: 0, open: 0, assign: 0, pending: 0, replacement: 0, a0: 0, a1: 0, a2: 0, a3: 0, a4: 0, in48: 0 });
    const r = map.get(k);
    r.total += 1;
    const hrs = ((j.closeDate || new Date()) - new Date(j.openDate)) / 3600000;
    if (DONE.includes(j.status)) { r.completed += 1; if (hrs <= 48) r.in48 += 1; } else if (j.status === 'Cancel') r.cancel += 1;
    else if (j.status === 'Open' || j.status === 'Acknowledged') r.open += 1;
    else if (j.status === 'Asigned' || j.status === 'Appointment') r.assign += 1;
    else r.pending += 1;
    if (j.status === 'Replacement') r.replacement += 1;
    if (!DONE.includes(j.status) && j.status !== 'Cancel') r[ageBuckets(hrs)] += 1;
  }
  return [...map.values()].map((r) => ({ ...r, tat: r.completed ? `${n2((r.in48 / r.completed) * 100)}%` : '0%' }));
}

const REPORTS = {
  async 'all-job'(req) { return (await jobRows(req)).map(jobFlat); },
  async 'job-summary'(req) {
    const jobs = await jobRows(req);
    const by = new Map();
    for (const j of jobs) {
      const k = j.assignLocation?.name || j.assignLocationName || 'Unassigned';
      if (!by.has(k)) by.set(k, { location: k, code: j.assignLocation?.code || '', state: j.assignLocation?.state || j.state, Registered: 0, Assigned: 0, Pending: 0, PNA: 0, 'Repair Done': 0, 'Set Delivered': 0, Cancel: 0, total: 0 });
      const r = by.get(k); const s = jobStatusText(j);
      const col = s === 'Registered' || s === 'Acknowledged' ? 'Registered' : s === 'Assigned' || s === 'Appointment' ? 'Assigned' : s.startsWith('PNA') ? 'PNA' : ['Repair Done', 'Replacement Done', 'Installation Done', 'Demo Done'].includes(s) ? 'Repair Done' : s === 'Set Delivered' ? 'Set Delivered' : s === 'Cancel' || s === 'Closed Without Repair' ? 'Cancel' : 'Pending';
      r[col] += 1; r.total += 1;
    }
    return [...by.values()];
  },
  async 'pending-ageing'(req) {
    const jobs = (await jobRows(req)).filter((j) => !OPEN_EXCL.includes(j.status) && j.status !== 'Cancel');
    return tatTable(jobs, (j) => String(j.assignLocation?._id || j.assignLocationName), (j) => ({ location: j.assignLocation?.name || j.assignLocationName, code: j.assignLocation?.code, state: j.assignLocation?.state || j.state }));
  },
  async 'closed-tat'(req) {
    const jobs = (await jobRows(req)).filter((j) => DONE.includes(j.status));
    return tatTable(jobs, (j) => String(j.assignLocation?._id || j.assignLocationName), (j) => ({ location: j.assignLocation?.name || j.assignLocationName, code: j.assignLocation?.code, state: j.assignLocation?.state || j.state }));
  },
  async 'asp-tat'(req) {
    return tatTable(await jobRows(req), (j) => String(j.assignLocation?._id || ''), (j) => ({ state: j.assignLocation?.state || j.state, location: j.assignLocation?.name, code: j.assignLocation?.code }));
  },
  async 'state-tat'(req) { return tatTable(await jobRows(req), (j) => j.state, (j) => ({ state: j.state })); },
  async 'state-ageing-model'(req) {
    const jobs = (await jobRows(req)).filter((j) => !OPEN_EXCL.includes(j.status) && j.status !== 'Cancel');
    const map = new Map();
    for (const j of jobs) {
      const k = j.modelName;
      if (!map.has(k)) map.set(k, { model: j.modelName, product: j.productName, total: 0 });
      const r = map.get(k); r[j.state] = (r[j.state] || 0) + 1; r.total += 1;
    }
    return [...map.values()];
  },
  async 'brand-asp'(req) {
    const asps = await DmsLocation.find({ locationType: 'ASP' }).lean();
    const jobs = await CrmJob.find(scopeJobs(req)).select('assignLocation brandName productName').lean();
    return asps.map((a) => {
      const js = jobs.filter((j) => String(j.assignLocation) === String(a._id));
      return { location: a.name, code: a.code, state: a.state, city: a.city, brands: [...new Set(js.map((j) => j.brandName))].join(', '), products: [...new Set(js.map((j) => j.productName))].join(', '), jobs: js.length };
    });
  },
  async 'faulty-model'(req) {
    const jobs = await jobRows(req);
    const map = new Map();
    for (const j of jobs) for (const d of j.repairDetails || []) {
      const k = `${j.modelName}|${d.faultName || d.faultCode}`;
      if (!map.has(k)) map.set(k, { model: j.modelName, product: j.productName, brand: j.brandName, fault: d.faultName || d.faultCode, count: 0 });
      map.get(k).count += 1;
    }
    return [...map.values()].sort((a, b) => b.count - a.count);
  },
  async 'part-consumption'(req) {
    const jobs = (await jobRows(req)).filter((j) => j.repairDetails?.length);
    return jobs.flatMap((j) => j.repairDetails.filter((d) => d.partcode).map((d) => ({
      jobNo: j.jobNo, location: j.assignLocation?.name, state: j.state, brand: j.brandName, product: j.productName, model: j.modelName, serialNo: j.serialNo,
      partcode: d.partcode, partName: d.partName, qty: d.qty || 1, price: d.price, faultCode: d.faultName || d.faultCode, repairCode: d.repairName || d.repairCode,
      closeDate: j.closeDate, handoverDate: j.handover?.at, warrantyStatus: j.warrantyStatus, engineer: j.engineerName,
    })));
  },
  async 'po-pna'(req) {
    const q = { poType: { $in: req.query.type ? list(req.query.type) : ['PNA', 'MSL'] }, ...dateRange(req.query, 'createdAt') };
    if (req.query.poStatus) q.status = { $in: list(req.query.poStatus) };
    if (req.query.location) q.fromLocation = req.query.location;
    if (req.crm.crmRole === 'ASP' && req.crm.locationId) q.fromLocation = req.crm.locationId;
    if (req.crm.crmRole === 'WH' && req.crm.locationId) q.toLocation = req.crm.locationId;
    const pos = await CrmPo.find(q).populate('fromLocation toLocation', 'name code city state').sort({ createdAt: -1 }).lean();
    return pos.flatMap((p) => p.items.map((i) => ({
      poNo: p.poNo, poDate: p.createdAt, poType: p.poType, location: p.fromLocation?.name, code: p.fromLocation?.code, cityState: `${p.fromLocation?.city || ''}/${p.fromLocation?.state || ''}`,
      to: p.toLocation?.name, partcode: i.partcode, partName: i.partName, jobNo: i.jobNo, reqQty: i.reqQty, dispQty: i.dispQty, pendingQty: Math.max(0, i.reqQty - i.dispQty), status: p.status,
      ageing: Math.floor((Date.now() - new Date(p.createdAt)) / day),
    })));
  },
  async sales(req) { return dispatchLines(req, ['Invoice', 'Delivery Challan', 'STN', 'Retail Invoice']); },
  async 'sales-return'(req) { return dispatchLines(req, ['Purchase Return', 'Faulty Dispatch']); },
  async 'stock-details'(req) {
    const q = {};
    if (req.crm.locationId && !req.crm.isAdmin) q.location = req.crm.locationId; else if (req.query.location) q.location = { $in: list(req.query.location) };
    const rows = await CrmStock.find(q).populate('location', 'name code').populate({ path: 'part', populate: { path: 'brand product models', select: 'name modelName' } }).lean();
    const eng = await CrmEngineerStock.find(q).lean();
    return rows.filter((r) => (!req.query.brand || list(req.query.brand).includes(String(r.part?.brand?._id))) && (!req.query.product || list(req.query.product).includes(String(r.part?.product?._id))))
      .map((r) => {
        const es = eng.filter((e) => String(e.part) === String(r.part?._id) && String(e.location) === String(r.location?._id));
        const ef = es.reduce((s, e) => s + e.fresh, 0); const ed = es.reduce((s, e) => s + e.defective, 0);
        return {
          _id: r._id, partcode: r.part?.partcode, description: r.part?.partName, product: r.part?.product?.name, brand: r.part?.brand?.name,
          model: (r.part?.models || []).map((m) => m.modelName).join(', '), alternate: (r.part?.alternatePartcodes || []).join(', '),
          customerPrice: r.part?.customerPrice, purchasePrice: r.part?.purchasePrice, mount: 0, fresh: r.fresh, defective: r.defective, damage: r.damage, missing: r.missing,
          msl: r.msl, freshInTransit: r.freshInTransit, defectiveInTransit: r.defectiveInTransit, freshReplace: r.freshReplace, engFresh: ef, engFaulty: ed, engStock: ef + ed,
          total: r.fresh + r.defective + r.damage + r.missing + r.freshInTransit + ef + ed, location: r.location?.name, locationCode: r.location?.code,
        };
      });
  },
  async 'stock-move'(req) {
    const q = { ...dateRange(req.query, 'createdAt') };
    if (req.crm.locationId && !req.crm.isAdmin) q.location = req.crm.locationId; else if (req.query.location) q.location = req.query.location;
    const led = await CrmStockLedger.find(q).populate('location', 'name code').populate({ path: 'part', populate: { path: 'brand product', select: 'name' } }).sort({ createdAt: 1 }).lean();
    const map = new Map();
    const col = (t) => ({ 'Local GRN': 'stockIn', 'GRN Receive': 'stockIn', 'Stock In Receive': 'stockIn', 'PO Dispatch': 'poDispatch', 'Purchase Return': 'srnOut', 'Faulty Dispatch': 'srnOut', 'Stock Adjustment': 'adj', 'Issue To Engineer': 'toEng', 'Receive From Engineer': 'fromEng', 'Job Consumption': 'consumed' }[t] || 'other');
    for (const l of led) {
      const k = `${l.location?._id}|${l.part?._id}`;
      if (!map.has(k)) map.set(k, { partcode: l.part?.partcode, description: l.part?.partName, product: l.part?.product?.name, brand: l.part?.brand?.name, location: l.location?.name, ledger: l.ledgerType, opening: l.opening, stockIn: 0, poDispatch: 0, srnIn: 0, srnOut: 0, adjPlus: 0, adjMinus: 0, toEng: 0, fromEng: 0, consumed: 0, other: 0, close: 0 });
      const r = map.get(k); const c = col(l.txnType); const q2 = Math.abs(l.qtyChange);
      if (c === 'adj') r[l.qtyChange >= 0 ? 'adjPlus' : 'adjMinus'] += q2; else r[c] += q2;
      r.close = l.closing;
    }
    return [...map.values()];
  },
  async pnl(req) {
    const m = Number(req.query.month); const y = Number(req.query.year);
    const from = m && y ? new Date(y, m - 1, 1) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const to = new Date(from.getFullYear(), from.getMonth() + 1, 1);
    const loc = req.crm.locationId && !req.crm.isAdmin ? req.crm.locationId : req.query.location;
    const dq = { createdAt: { $gte: from, $lt: to }, status: { $ne: 'Cancelled' }, ...(loc ? { fromLocation: loc } : {}) };
    const [sales, claims, exps, purchases] = await Promise.all([
      CrmDispatch.find({ ...dq, docType: 'Retail Invoice' }).lean(),
      CrmClaim.find({ month: from.getMonth() + 1, year: from.getFullYear(), ...(loc ? { location: loc } : {}) }).lean(),
      CrmExpense.find({ expenseDate: { $gte: from, $lt: to }, status: { $nin: ['Rejected', 'Cancelled'] }, ...(loc ? { location: loc } : {}) }).lean(),
      CrmDispatch.find({ createdAt: { $gte: from, $lt: to }, status: 'Received', docType: { $in: ['Invoice', 'Delivery Challan'] }, ...(loc ? { toLocation: loc } : {}) }).lean(),
    ]);
    const sale = sales.reduce((s, d) => s + d.grandTotal, 0); const claim = claims.reduce((s, c) => s + c.totalAmount, 0);
    const exp = exps.reduce((s, e) => s + e.amount, 0); const pur = purchases.reduce((s, d) => s + d.grandTotal, 0);
    return [
      { head: 'Sales (Retail / OUT warranty invoices)', type: 'Income', amount: n2(sale) },
      { head: 'Claims (Labour / Travel)', type: 'Income', amount: n2(claim) },
      { head: 'Purchases (spares received)', type: 'Expense', amount: n2(pur) },
      { head: 'Expenses', type: 'Expense', amount: n2(exp) },
      { head: 'Net Profit / Loss', type: 'Result', amount: n2(sale + claim - pur - exp) },
    ];
  },
  async 'part-price'(req) {
    const q = { status: 'Active' };
    if (req.query.brand) q.brand = req.query.brand;
    if (req.query.product) q.product = req.query.product;
    if (req.query.model) q.models = req.query.model;
    const parts = await CrmPart.find(q).populate('brand product', 'name').populate('models', 'modelName').lean();
    const stock = await CrmStock.aggregate([{ $group: { _id: '$part', fresh: { $sum: '$fresh' } } }]);
    return parts.map((p) => ({
      _id: p._id, partcode: p.partcode, hsn: p.hsnCode, model: (p.models || []).map((m) => m.modelName).join(', '), partName: p.partName, vendorPartcode: p.vendorPartcode,
      brand: p.brand?.name, product: p.product?.name, category: p.partCategory, customerPrice: p.customerPrice, locationPrice: p.locationPrice, purchasePrice: p.purchasePrice,
      warrantyDays: p.warrantyDays, dealerWarrantyDays: p.dealerWarrantyDays, availability: (stock.find((s) => String(s._id) === String(p._id))?.fresh || 0) > 0 ? 'Available' : 'Not Available',
    }));
  },
  async 'product-search'(req) {
    const q = { status: 'Active' };
    if (req.query.brand) q.brand = req.query.brand;
    if (req.query.product) q.product = req.query.product;
    if (req.query.model) q._id = req.query.model;
    return (await CrmModel.find(q).populate('brand product', 'name').lean()).map((m) => ({ _id: m._id, brand: m.brand?.name, product: m.product?.name, model: m.modelName, warrantyDays: m.customerWarrantyDays, terms: m.terms || '' }));
  },
  async 'call-details'(req) {
    const jobs = await CrmJob.find(dateRange(req.query)).select('history createdBy').lean();
    const users = await CrmUserProfile.find({ crmRole: 'Call Center' }).lean();
    return users.map((u) => {
      const mine = jobs.filter((j) => j.history?.[0]?.updateBy === u.loginId).length;
      return { name: `${u.displayName} (${u.loginId})`, total: jobs.length, self: mine, share: jobs.length ? `${n2((mine / jobs.length) * 100)}%` : '0%' };
    });
  },
  async 'asp-dashboard'(req) {
    const jobs = await jobRows(req);
    const engs = await CrmUserProfile.find({ userType: 'Engineer', ...(req.crm.locationId && !req.crm.isAdmin ? { location: req.crm.locationId } : {}) }).lean();
    return engs.map((e) => {
      const js = jobs.filter((j) => String(j.engineer) === String(e._id));
      return {
        engineer: `${e.displayName} (${e.loginId})`, assigned: js.length, pna: js.filter((j) => j.status === 'PNA').length,
        demo: js.filter((j) => j.callType === 'Demo').length, installation: js.filter((j) => j.callType === 'Installation').length,
        repairDone: js.filter((j) => DONE.includes(j.status)).length, confirmation: js.filter((j) => j.status === 'Handover').length,
      };
    });
  },
  async 'spares-log'(req) {
    const q = { ...dateRange(req.query, 'createdAt') };
    if (req.crm.locationId && !req.crm.isAdmin) q.location = req.crm.locationId;
    return (await CrmStockLedger.find(q).populate('part', 'partcode partName').sort({ createdAt: -1 }).limit(2000).lean()).map((l) => ({
      date: l.createdAt, partcode: l.part?.partcode, partName: l.part?.partName, txnType: l.txnType, refNo: l.refNo, opening: l.opening, qty: l.qtyChange, closing: l.closing, by: l.by,
    }));
  },
  async 'grn-details'(req) {
    const grns = await CrmGrn.find({ status: 'Received', ...dateRange(req.query, 'createdAt') }).populate('supplier', 'name').populate('shipTo', 'name').lean();
    return grns.flatMap((g) => g.items.map((i) => ({ grnNo: g.grnNo, grnDate: g.receivedAt, poNo: g.poNo, supplier: g.supplier?.name, shipTo: g.shipTo?.name, invoiceNo: g.invoiceNo, partcode: i.partcode, partName: i.partName, qty: i.qty, okQty: i.okQty, damageQty: i.damageQty, missingQty: i.missingQty, price: i.price, total: i.total })));
  },
  async 'tag-details'(req) {
    const grns = await CrmGrn.find({ status: 'Received' }).lean();
    const sold = new Set((await CrmDispatch.find({ 'items.serialNo': { $nin: [null, ''] } }).select('items.serialNo').lean()).flatMap((d) => d.items.map((i) => i.serialNo)));
    const rows = grns.flatMap((g) => g.items.filter((i) => i.serialNo).map((i) => ({ serial: i.serialNo, partcode: i.partcode, model: i.partName, grnNo: g.grnNo, history: sold.has(i.serialNo) ? 'Dispatch' : 'Available' })));
    return req.query.tagStatus && req.query.tagStatus !== 'All' ? rows.filter((r) => r.history === req.query.tagStatus) : rows;
  },
  async 'faulty-pending'(req) {
    const jobs = await CrmJob.find({ 'repairDetails.partcode': { $exists: true }, ...(req.query.location ? { assignLocation: req.query.location } : {}) }).populate('assignLocation', 'name').lean();
    const bins = await CrmStock.find({ defective: { $gt: 0 } }).select('location part').lean();
    return jobs.flatMap((j) => j.repairDetails.filter((d) => d.part && bins.some((b) => String(b.location) === String(j.assignLocation?._id) && String(b.part) === String(d.part)))
      .map((d) => ({ location: j.assignLocation?.name, jobNo: j.jobNo, imei: j.serialNo, model: j.modelName, part: `${d.partName} (${d.partcode})`, status: 'Pending at ASC' })));
  },
  async 'asp-parts-sales'(req) {
    const rows = await dispatchLines(req, ['Retail Invoice']);
    return rows;
  },
  async 'party-ledger'(req) {
    const loc = req.crm.locationId && !req.crm.isAdmin ? req.crm.locationId : req.query.location;
    const q = { ...(loc ? { location: loc } : {}), ...dateRange(req.query, 'txnDate') };
    if (req.query.accountType) q.accountType = req.query.accountType;
    return (await CrmLedger.find(q).populate('location', 'name code').sort({ txnDate: 1 }).lean()).map((l) => ({
      details: l.details || l.refNo, type: `${l.txnType} (${l.accountType})`, date: l.txnDate, cr: l.cr, dr: l.dr, location: l.location?.name, refNo: l.refNo,
    }));
  },
};

async function dispatchLines(req, types) {
  const q = { docType: { $in: types }, ...dateRange(req.query, 'createdAt') };
  if (req.crm.locationId && !req.crm.isAdmin) q.$or = [{ fromLocation: req.crm.locationId }, { toLocation: req.crm.locationId }];
  if (req.query.fromLocation) q.fromLocation = { $in: list(req.query.fromLocation) };
  if (req.query.toLocation) q.toLocation = { $in: list(req.query.toLocation) };
  const docs = await CrmDispatch.find(q).populate('fromLocation toLocation', 'name code state').sort({ createdAt: -1 }).lean();
  const parts = await CrmPart.find({ _id: { $in: docs.flatMap((d) => d.items.map((i) => i.part)) } }).populate('brand product', 'name').lean();
  const pOf = (id) => parts.find((p) => String(p._id) === String(id));
  return docs.flatMap((d) => d.items.filter((i) => {
    const p = pOf(i.part);
    return (!req.query.brand || list(req.query.brand).includes(String(p?.brand?._id))) && (!req.query.product || list(req.query.product).includes(String(p?.product?._id)));
  }).map((i) => ({
    docNo: d.docNo, docDate: d.createdAt, docType: d.docType, from: d.fromLocation?.name, fromState: d.fromLocation?.state, to: d.toLocation?.name || d.customerName, toState: d.toLocation?.state || d.customerState,
    partcode: i.partcode, partName: i.partName, brand: pOf(i.part)?.brand?.name, product: pOf(i.part)?.product?.name, qty: i.qty, price: i.price, total: n2(i.total), status: d.status, jobNo: i.jobNo || d.jobNo,
  })));
}

router.get('/reports/:key', asyncHandler(async (req, res) => {
  const fn = REPORTS[req.params.key];
  if (!fn) throw new CrmError('Unknown report', 404);
  sendSuccess(res, { data: await fn(req) });
}));

export default router;
