import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess, sendCreated } from '../../utils/apiResponse.js';
import { DmsLocation } from '../../dms/models/master.models.js';
import { nextCrmSeq } from '../models/crm.masters.js';
import { CrmJob } from '../models/crm.job.js';
import { CrmLedger, CrmPayment, CrmClaim, CrmExpense, CrmStockLedger, CrmPo } from '../models/crm.inventory.js';
import { CrmError, requireCrmRole } from '../middleware/context.js';
import { CrmMaster } from '../models/crm.masters.js';

const router = Router();

/* Party Account Status (Main / Security / Claim balances) */
router.get('/accounts/status', asyncHandler(async (req, res) => {
  const locFilter = {};
  if ((req.crm.crmRole === 'ASP' || req.crm.crmRole === 'WH') && req.crm.locationId) {
    locFilter._id = req.crm.locationId;
  } else {
    locFilter.locationType = { $in: ['ASP', 'WH', 'Distributor'] };
  }
  const locations = await DmsLocation.find(locFilter).lean();
  const entries = await CrmLedger.aggregate([
    { $group: { _id: { location: '$location', accountType: '$accountType' }, cr: { $sum: '$cr' }, dr: { $sum: '$dr' } } },
  ]);
  const map = {};
  for (const e of entries) {
    const k = `${e._id.location}:${e._id.accountType}`;
    map[k] = (e.cr || 0) - (e.dr || 0);
  }
  const rows = locations.map((l) => ({
    _id: l._id,
    code: l.code,
    name: l.name,
    locationType: l.locationType,
    state: l.state,
    city: l.city,
    mainAc: map[`${l._id}:Main`] || 0,
    securityAc: map[`${l._id}:Security`] || 0,
    claimAc: map[`${l._id}:Claim`] || 0,
  }));
  sendSuccess(res, { data: rows });
}));

router.get('/accounts/ledger', asyncHandler(async (req, res) => {
  const q = {};
  if (req.query.location) q.location = req.query.location;
  else if (req.crm.locationId && !req.crm.isAdmin) q.location = req.crm.locationId;
  if (req.query.accountType) q.accountType = req.query.accountType;
  const rows = await CrmLedger.find(q).populate('location', 'name code').sort({ txnDate: -1 }).lean();
  sendSuccess(res, { data: rows });
}));

router.post('/accounts/transfer', requireCrmRole('WH'), asyncHandler(async (req, res) => {
  const { locationId, fromAccount, toAccount, amount, remark } = req.body || {};
  const amt = Number(amount || 0);
  if (!locationId || !fromAccount || !toAccount || amt <= 0) throw new CrmError('Invalid transfer details', 422);
  await CrmLedger.create([
    { location: locationId, accountType: fromAccount, txnType: 'Account Transfer', details: `Transfer to ${toAccount}: ${remark || ''}`, dr: amt, by: req.crm.loginId },
    { location: locationId, accountType: toAccount, txnType: 'Account Transfer', details: `Transfer from ${fromAccount}: ${remark || ''}`, cr: amt, by: req.crm.loginId },
  ]);
  sendSuccess(res, { message: 'Account transfer completed' });
}));

router.post('/accounts/adjustment', requireCrmRole('WH'), asyncHandler(async (req, res) => {
  const { locationId, accountType = 'Main', type, amount, remark } = req.body || {};
  const amt = Number(amount || 0);
  if (!locationId || !['CR', 'DR'].includes(type) || amt <= 0) throw new CrmError('Location, CR/DR and amount required', 422);
  await CrmLedger.create({
    location: locationId,
    accountType,
    txnType: 'Adjustment',
    details: remark || 'Account Adjustment',
    cr: type === 'CR' ? amt : 0,
    dr: type === 'DR' ? amt : 0,
    by: req.crm.loginId,
  });
  sendSuccess(res, { message: 'Account adjusted' });
}));

/* Payments (ASP Add Payment -> WH Payment Receive) */
router.get('/payments', asyncHandler(async (req, res) => {
  const q = {};
  if (req.crm.crmRole === 'ASP' && req.crm.locationId) q.fromLocation = req.crm.locationId;
  if (req.crm.crmRole === 'WH' && req.crm.locationId) q.toLocation = req.crm.locationId;
  const rows = await CrmPayment.find(q).populate('fromLocation toLocation', 'name code').sort({ createdAt: -1 }).lean();
  sendSuccess(res, { data: rows });
}));

router.post('/payments', requireCrmRole('ASP'), asyncHandler(async (req, res) => {
  const b = req.body || {};
  const fromLocation = b.fromLocation || req.crm.locationId;
  if (!fromLocation || !b.toLocation || !b.amount || !b.mode) throw new CrmError('Location, Amount and Mode are required', 422);
  const seq = await nextCrmSeq('payment');
  const docNo = `PAY${String(seq).padStart(5, '0')}`;
  const doc = await CrmPayment.create({ ...b, docNo, fromLocation, createdBy: req.user._id });
  sendCreated(res, { data: doc, message: `Payment ${docNo} submitted` });
}));

router.post('/payments/:id/receive', requireCrmRole('WH'), asyncHandler(async (req, res) => {
  const { decision = 'Received', remark } = req.body || {};
  const pay = await CrmPayment.findById(req.params.id);
  if (!pay) throw new CrmError('Payment not found', 404);
  if (pay.status !== 'Pending') throw new CrmError('Payment already processed', 422);
  pay.status = decision;
  if (remark) pay.remark = remark;
  await pay.save();
  if (decision === 'Received') {
    await CrmLedger.create({
      location: pay.fromLocation,
      accountType: 'Main',
      txnType: 'Payment Receive',
      refNo: pay.docNo,
      details: `${pay.mode} ${pay.ddChequeNo || ''}`,
      cr: pay.amount,
      by: req.crm.loginId,
    });
  }
  sendSuccess(res, { data: pay, message: `Payment ${decision}` });
}));

/* Claims (Labour / Travel / Partner) */
router.get('/claims', asyncHandler(async (req, res) => {
  const q = {};
  if (req.crm.crmRole === 'ASP' && req.crm.locationId) q.location = req.crm.locationId;
  else if (req.query.location) q.location = req.query.location;
  const rows = await CrmClaim.find(q).populate('location', 'name code').sort({ createdAt: -1 }).lean();
  sendSuccess(res, { data: rows });
}));

router.post('/claims/generate', requireCrmRole('Admin'), asyncHandler(async (req, res) => {
  const { month, year, locationId, claimType = 'Labour' } = req.body || {};
  if (!month || !year || !locationId) throw new CrmError('Month, Year and Location are required', 422);
  const start = new Date(Number(year), Number(month) - 1, 1);
  const end = new Date(Number(year), Number(month), 1);
  if (await CrmClaim.findOne({ month: Number(month), year: Number(year), location: locationId, claimType })) throw new CrmError(`${claimType} claim for ${month}/${year} is already generated for this location`, 409);
  const claimed = new Set((await CrmClaim.find({ location: locationId }).select('jobs.jobNo claimType').lean()).filter((c) => c.claimType === claimType).flatMap((c) => c.jobs.map((x) => x.jobNo)));
  const jobs = (await CrmJob.find({
    assignLocation: locationId,
    status: { $in: ['Repair Done', 'Handover', 'Installation Done', 'Demo Done', 'Replacement', 'RWR'] },
    closeDate: { $gte: start, $lt: end },
  }).lean()).filter((j) => !claimed.has(j.jobNo) && (claimType !== 'Travel' || j.areaType === 'Upcountry'));
  const rates = await CrmMaster.find({ type: 'claimRate', status: 'Active' }).lean();
  const statusName = (j) => (j.status === 'Handover' ? ({ Installation: 'Installation Done', 'Re-installation': 'Installation Done', Demo: 'Demo Done' }[j.callType] || 'Repair Done') : ({ RWR: 'Closed Without Repair', Replacement: 'Replacement Done' }[j.status] || j.status));
  const rateFor = (j) => {
    const r = rates.find((x) => String(x.product) === String(j.product) && String(x.brand) === String(j.brand) && x.attrs?.jobStatus === statusName(j) && (x.attrs?.areaType || 'Local') === (j.areaType || 'Local'))
      || rates.find((x) => String(x.product) === String(j.product) && String(x.brand) === String(j.brand) && x.attrs?.jobStatus === statusName(j));
    if (!r) return 0;
    const hrs = ((j.closeDate ? new Date(j.closeDate) : new Date()) - new Date(j.openDate)) / 3600000;
    const pct = r.attrs?.toTat && hrs > Number(r.attrs.toTat) ? Number(r.attrs.claimPct || 100) : 100;
    const base = claimType === 'Partner' ? Number(r.attrs?.partnerPrice || 0) : Number(r.attrs?.aspPrice || 0);
    return Math.round(base * pct) / 100;
  };
  const claimJobs = jobs.map((j) => ({ job: j._id, jobNo: j.jobNo, amount: rateFor(j) })).filter((x) => x.amount > 0);
  if (!claimJobs.length) throw new CrmError('No claimable jobs for this month (check the Claim master rates)', 422);
  const totalAmount = claimJobs.reduce((s, j) => s + j.amount, 0);
  const seq = await nextCrmSeq('claim');
  const docNo = `CLM${String(seq).padStart(5, '0')}`;
  const claim = await CrmClaim.create({
    docNo, month: Number(month), year: Number(year), location: locationId, claimType,
    jobs: claimJobs, totalAmount, status: 'Generated', createdBy: req.user._id,
  });
  sendCreated(res, { data: claim, message: `Claim ${docNo} generated (${claimJobs.length} jobs)` });
}));

router.post('/claims/:id/approve', requireCrmRole('Admin'), asyncHandler(async (req, res) => {
  const claim = await CrmClaim.findById(req.params.id);
  if (!claim) throw new CrmError('Claim not found', 404);
  if (claim.status !== 'Generated') throw new CrmError('Claim already approved', 422);
  claim.status = 'Approved';
  await claim.save();
  await CrmLedger.create({
    location: claim.location,
    accountType: 'Claim',
    txnType: `${claim.claimType} Claim`,
    refNo: claim.docNo,
    details: `Claim ${claim.month}/${claim.year}`,
    cr: claim.totalAmount,
    by: req.crm.loginId,
  });
  sendSuccess(res, { data: claim, message: 'Claim approved & credited to Claim A/C' });
}));

router.post('/claims/:id/dispatch', requireCrmRole('Admin', 'ASP'), asyncHandler(async (req, res) => {
  const claim = await CrmClaim.findByIdAndUpdate(req.params.id, {
    courierName: req.body.courierName,
    docketNo: req.body.docketNo,
    dispatchDate: new Date(),
    status: 'Invoiced',
  }, { new: true });
  if (!claim) throw new CrmError('Claim not found', 404);
  sendSuccess(res, { data: claim, message: 'Claim dispatch updated' });
}));

/* Expenses */
router.get('/expenses', asyncHandler(async (req, res) => {
  const q = {};
  if (req.crm.crmRole === 'ASP' && req.crm.locationId) q.location = req.crm.locationId;
  const rows = await CrmExpense.find(q).populate('location', 'name code').sort({ createdAt: -1 }).lean();
  sendSuccess(res, { data: rows });
}));

router.post('/expenses', requireCrmRole('ASP', 'WH'), asyncHandler(async (req, res) => {
  const b = req.body || {};
  const location = b.location || req.crm.locationId;
  if (!location || !b.payeeName || !b.voucherType) throw new CrmError('Location, Payee Name and Voucher Type are required', 422);
  const seq = await nextCrmSeq('expense');
  const refNo = `EXP${String(seq).padStart(5, '0')}`;
  const amount = (b.items || []).reduce((s, i) => s + Number(i.amount || 0), 0) || Number(b.amount || 0);
  const doc = await CrmExpense.create({ ...b, refNo, location, amount, createdBy: req.user._id });
  sendCreated(res, { data: doc, message: `Expense ${refNo} submitted` });
}));

/* Reports & Dashboards */
router.get('/reports/dashboard', asyncHandler(async (req, res) => {
  const jobQ = {};
  if (req.crm.crmRole === 'ASP' && req.crm.locationId) jobQ.assignLocation = req.crm.locationId;
  const [jobs, pos] = await Promise.all([
    CrmJob.find(jobQ).select('status subStatus openDate closeDate engineerName assignLocationName state').lean(),
    CrmPo.find(req.crm.locationId ? { $or: [{ fromLocation: req.crm.locationId }, { toLocation: req.crm.locationId }] } : {}).select('status').lean(),
  ]);
  const byStatus = {};
  for (const j of jobs) byStatus[j.status] = (byStatus[j.status] || 0) + 1;
  const poSummary = { Raised: 0, Process: 0, Dispatch: 0, Received: 0 };
  for (const p of pos) {
    if (p.status === 'Pending') poSummary.Raised += 1;
    else if (['Approved', 'Processed', 'Partial Processed'].includes(p.status)) poSummary.Process += 1;
    else if (p.status === 'Dispatched') poSummary.Dispatch += 1;
    else if (p.status === 'Received') poSummary.Received += 1;
  }
  sendSuccess(res, {
    data: {
      totalJobs: jobs.length,
      openJobs: jobs.filter((j) => !['Handover', 'Cancel', 'RWR', 'BER', 'Repair Done', 'Installation Done', 'Demo Done', 'Replacement'].includes(j.status)).length,
      closedJobs: jobs.filter((j) => ['Repair Done', 'Handover', 'Installation Done', 'Demo Done', 'Replacement', 'Cancel', 'RWR', 'BER'].includes(j.status)).length,
      pnaJobs: byStatus.PNA || 0,
      byStatus,
      poSummary,
    },
  });
}));

router.get('/reports/stock-movement', asyncHandler(async (req, res) => {
  const q = {};
  if (req.crm.locationId && !req.crm.isAdmin) q.location = req.crm.locationId;
  else if (req.query.location) q.location = req.query.location;
  const rows = await CrmStockLedger.find(q)
    .populate('location', 'name code')
    .populate('part', 'partcode partName')
    .sort({ createdAt: -1 }).limit(200).lean();
  sendSuccess(res, { data: rows });
}));

router.get('/reports/asc-locations', asyncHandler(async (req, res) => {
  const q = { locationType: 'ASP', status: 'Active' };
  if (req.query.state) q.state = req.query.state;
  if (req.query.city) q.city = req.query.city;
  if (req.query.pincode) q.pincode = req.query.pincode;
  const rows = await DmsLocation.find(q).sort('name').lean();
  sendSuccess(res, { data: rows });
}));

export default router;
