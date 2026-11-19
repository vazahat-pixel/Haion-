import { Router } from 'express';
import mongoose from 'mongoose';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess, sendCreated, sendPaginated } from '../../utils/apiResponse.js';
import { parsePagination } from '../../utils/pagination.util.js';
import { DmsPayment } from '../models/txn.models.js';
import { DmsLocation } from '../models/master.models.js';
import { requirePage, scopeFilter, assertCanSee } from '../middleware/context.js';
import { DmsError, nextReceiptNo, postLedger, round2 } from '../services/core.service.js';

const router = Router();
const PAY_MODES = ['BANK', 'CASH', 'PAYTM', 'CHEQUE', 'OTHER'];
const POP = [{ path: 'fromLocation', select: 'name code city state' }, { path: 'toLocation', select: 'name code city state' }];

async function load(req) {
  if (!mongoose.isValidObjectId(req.params.id)) throw new DmsError('Invalid id', 400);
  const p = await DmsPayment.findById(req.params.id).populate(POP);
  if (!p) throw new DmsError('Payment not found', 404);
  if (!req.dms.canSee(p.fromLocation._id) && !req.dms.canSee(p.toLocation._id)) throw new DmsError('Payment not found', 404);
  return p;
}

router.get('/', asyncHandler(async (req, res) => {
  const { skip, perPage, page } = parsePagination(req.query);
  const q = { kind: req.query.kind === 'ADJUSTMENT' ? 'ADJUSTMENT' : 'RECEIPT' };
  if (req.query.queue === 'approval') {
    q.status = 'PFA';
    if (req.dms.allowedLocationIds !== null) q.toLocation = { $in: req.dms.allowedLocationIds }; // receiver approves
  } else {
    Object.assign(q, scopeFilter(req, ['fromLocation', 'toLocation']));
    if (req.query.status) q.status = { $in: String(req.query.status).split(',') };
  }
  if (req.query.search) q.docNo = new RegExp(String(req.query.search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  const [data, total] = await Promise.all([
    DmsPayment.find(q).populate(POP).sort({ createdAt: -1 }).skip(skip).limit(perPage).lean(),
    DmsPayment.countDocuments(q),
  ]);
  sendPaginated(res, { data, total, page, perPage });
}));

router.get('/:id', asyncHandler(async (req, res) => sendSuccess(res, { data: await load(req) })));

router.post('/', (req, res, next) => requirePage(req.body.kind === 'ADJUSTMENT' ? 'acc_adjust' : 'payment_receive')(req, res, next), asyncHandler(async (req, res) => {
  const b = req.body;
  const kind = b.kind === 'ADJUSTMENT' ? 'ADJUSTMENT' : 'RECEIPT';
  const errors = {};
  if (!mongoose.isValidObjectId(b.fromLocation)) errors.fromLocation = ['Required'];
  if (!mongoose.isValidObjectId(b.toLocation)) errors.toLocation = ['Required'];
  if (!PAY_MODES.includes(b.payMode)) errors.payMode = ['Required'];
  if (!(Number(b.amount) > 0)) errors.amount = ['Enter a valid amount'];
  if (kind === 'ADJUSTMENT' && !['CR', 'DR'].includes(b.adjustType)) errors.adjustType = ['Required'];
  if (['BANK', 'CHEQUE'].includes(b.payMode)) {
    if (!b.bankName) errors.bankName = ['Required'];
    if (b.payMode === 'CHEQUE' && !b.ddChequeNo) errors.ddChequeNo = ['Required'];
  }
  if (['BANK', 'PAYTM'].includes(b.payMode) && !b.transactionId) errors.transactionId = ['Required'];
  if (Object.keys(errors).length) throw new DmsError('Please fill all required fields', 422, errors);
  if (String(b.fromLocation) === String(b.toLocation)) throw new DmsError('From and To location cannot be the same');
  const [from, to] = await Promise.all([DmsLocation.findById(b.fromLocation).lean(), DmsLocation.findById(b.toLocation).lean()]);
  if (!from || !to) throw new DmsError('Location not found');
  assertCanSee(req, from._id);

  const p = await DmsPayment.create({
    kind,
    docNo: await nextReceiptNo(kind, to, b.paymentDate || new Date()),
    fromLocation: from._id,
    toLocation: to._id,
    adjustType: kind === 'ADJUSTMENT' ? b.adjustType : '',
    payMode: b.payMode,
    bankName: b.bankName, bankBranch: b.bankBranch, ddChequeNo: b.ddChequeNo,
    ddChequeDate: b.ddChequeDate || undefined, receiptNo: b.receiptNo, transactionId: b.transactionId,
    amount: round2(b.amount),
    paymentDate: b.paymentDate ? new Date(b.paymentDate) : new Date(),
    remark: b.remark,
    // adjustments are book entries and take effect immediately; receipts wait for the receiver's approval
    status: kind === 'ADJUSTMENT' ? 'Approve' : 'PFA',
    receivedAmount: kind === 'ADJUSTMENT' ? round2(b.amount) : 0,
    approveBy: kind === 'ADJUSTMENT' ? req.dms.displayName : undefined,
    approveAt: kind === 'ADJUSTMENT' ? new Date() : undefined,
    entryBy: req.dms.displayName,
    entryByUser: req.user._id,
    entryIp: req.ip,
  });
  if (kind === 'ADJUSTMENT') {
    await postLedger({
      party: from._id, counterparty: to._id, counterpartyName: to.name, docNo: p.docNo, docType: `ADJUSTMENT_${b.adjustType}`,
      cr: b.adjustType === 'CR' ? p.amount : 0, dr: b.adjustType === 'DR' ? p.amount : 0, txnDate: p.paymentDate, paymentRemark: b.remark,
    });
  }
  sendCreated(res, { data: p, message: `${p.docNo} saved` });
}));

router.put('/:id', requirePage('payment_receive'), asyncHandler(async (req, res) => {
  const p = await load(req);
  if (p.kind !== 'RECEIPT' || p.status !== 'PFA') throw new DmsError('Only pending receipts can be edited');
  assertCanSee(req, p.fromLocation._id);
  const allowed = ['payMode', 'bankName', 'bankBranch', 'ddChequeNo', 'ddChequeDate', 'receiptNo', 'transactionId', 'amount', 'paymentDate', 'remark'];
  for (const k of allowed) if (req.body[k] !== undefined) p[k] = req.body[k];
  if (!(Number(p.amount) > 0)) throw new DmsError('Enter a valid amount');
  await p.save();
  sendSuccess(res, { data: p, message: 'Payment updated' });
}));

router.post('/:id/cancel', requirePage('payment_receive'), asyncHandler(async (req, res) => {
  const p = await load(req);
  if (p.status !== 'PFA') throw new DmsError(`A ${p.status} payment cannot be cancelled`);
  assertCanSee(req, p.fromLocation._id);
  p.status = 'Cancelled';
  await p.save();
  sendSuccess(res, { data: p, message: 'Payment cancelled' });
}));

router.post('/:id/approve', requirePage('payment_approval'), asyncHandler(async (req, res) => {
  const p = await load(req);
  const { action, remark } = req.body;
  if (p.kind !== 'RECEIPT' || p.status !== 'PFA') throw new DmsError(`Payment is already ${p.status}`);
  if (!['Approve', 'Reject'].includes(action)) throw new DmsError('Select an action', 422, { action: ['Required'] });
  if (!remark || !String(remark).trim()) throw new DmsError('Remark is required', 422, { remark: ['Required'] });
  assertCanSee(req, p.toLocation._id);
  const received = round2(req.body.receivedAmount ?? p.amount);
  if (action === 'Approve' && !(received > 0 && received <= p.amount)) throw new DmsError(`Received amount must be between 0 and ${p.amount}`, 422, { receivedAmount: ['Invalid'] });
  p.status = action;
  p.receivedAmount = action === 'Approve' ? received : 0;
  p.approveBy = req.dms.displayName;
  p.approveAt = new Date();
  p.approveRemark = String(remark).trim();
  await p.save();
  if (action === 'Approve') {
    await postLedger({
      party: p.fromLocation._id, counterparty: p.toLocation._id, counterpartyName: p.toLocation.name, docNo: p.docNo,
      docType: 'PAYMENT', cr: p.receivedAmount, txnDate: p.paymentDate, paymentRemark: p.remark, approvalRemark: p.approveRemark,
    });
  }
  sendSuccess(res, { data: p, message: `Payment ${action === 'Approve' ? 'approved' : 'rejected'}` });
}));

export default router;
