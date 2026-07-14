import Expense from '../models/Expense.model.js';
import Approval from '../models/Approval.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess, sendCreated, sendError, sendPaginated } from '../utils/apiResponse.js';
import { parsePagination, buildSearchFilter } from '../utils/pagination.util.js';
import { mapExpense } from '../utils/docMapper.util.js';
import { nextSequence } from '../utils/sequence.util.js';

function buildExpenseDedupeKey({ category, description, amount, vendor, submittedByUser }) {
  return [
    String(category || '').trim().toLowerCase(),
    String(description || '').trim().toLowerCase(),
    Number(amount || 0).toFixed(2),
    String(vendor || '').trim().toLowerCase(),
    String(submittedByUser || ''),
  ].join('|');
}

export const listExpenses = asyncHandler(async (req, res) => {
  const { page, perPage, skip, sort } = parsePagination(req.query);
  const filter = { ...buildSearchFilter(req.query.search, ['expenseNo', 'category', 'description', 'submittedBy']) };
  if (req.query.status) filter.status = req.query.status;
  if (req.query.category) filter.category = req.query.category;

  const [rows, total] = await Promise.all([
    Expense.find(filter).sort(sort).skip(skip).limit(perPage).lean(),
    Expense.countDocuments(filter),
  ]);
  return sendPaginated(res, { data: rows.map(mapExpense), total, page, perPage });
});

export const getExpense = asyncHandler(async (req, res) => {
  const doc = await Expense.findById(req.params.id).lean();
  if (!doc) return sendError(res, { message: 'Expense not found', statusCode: 404 });
  return sendSuccess(res, { data: mapExpense(doc) });
});

export const createExpense = asyncHandler(async (req, res) => {
  const expenseNo = req.body.expenseNo || nextSequence('EXP');
  const submittedBy = req.body.submittedBy || `${req.user.firstName} ${req.user.lastName}`;
  const dedupeKey = buildExpenseDedupeKey({
    category: req.body.category,
    description: req.body.description,
    amount: req.body.amount,
    vendor: req.body.vendor || '—',
    submittedByUser: req.user._id,
  });
  const duplicate = await Expense.findOne({
    dedupeKey,
    submittedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    status: { $in: ['PENDING', 'APPROVED'] },
  }).lean();
  if (duplicate) {
    return sendError(res, { message: 'Possible duplicate expense detected in last 24h', statusCode: 409 });
  }

  const doc = await Expense.create({
    expenseNo,
    category: req.body.category,
    description: req.body.description,
    amount: req.body.amount,
    vendor: req.body.vendor || '—',
    status: 'PENDING',
    submittedBy,
    submittedByUser: req.user._id,
    submittedAt: new Date(),
    dedupeKey,
    auditTrail: [{ by: req.user?.email || submittedBy, action: 'CREATED', note: 'Expense submitted' }],
  });

  await Approval.create({
    type: 'Expense Claim',
    requester: submittedBy,
    requesterUser: req.user._id,
    amount: doc.amount,
    status: 'PENDING',
    description: doc.description,
    resourceId: doc._id,
    resourceType: 'Expense',
  });

  return sendCreated(res, { data: mapExpense(doc.toObject()), message: 'Expense submitted for approval' });
});

export const updateExpenseStatus = asyncHandler(async (req, res) => {
  const doc = await Expense.findById(req.params.id);
  if (!doc) return sendError(res, { message: 'Expense not found', statusCode: 404 });

  if (!['APPROVED', 'REJECTED'].includes(req.body.status)) {
    return sendError(res, { message: 'Invalid status', statusCode: 400 });
  }

  doc.status = req.body.status;
  doc.reviewedBy = req.user._id;
  doc.reviewedAt = new Date();
  doc.auditTrail.push({
    by: req.user?.email || 'system',
    action: `STATUS_${req.body.status}`,
    note: req.body.note || '',
  });
  await doc.save();

  return sendSuccess(res, { data: mapExpense(doc.toObject()), message: `Expense ${doc.status.toLowerCase()}` });
});
