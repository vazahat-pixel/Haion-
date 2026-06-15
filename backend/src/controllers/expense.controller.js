import Expense from '../models/Expense.model.js';
import Approval from '../models/Approval.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess, sendCreated, sendError, sendPaginated } from '../utils/apiResponse.js';
import { parsePagination, buildSearchFilter } from '../utils/pagination.util.js';
import { mapExpense } from '../utils/docMapper.util.js';
import { nextSequence } from '../utils/sequence.util.js';

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
  });

  await Approval.create({
    type: 'Expense Claim',
    requester: submittedBy,
    requesterUser: req.user._id,
    amount: doc.amount,
    status: 'PENDING',
    description: doc.description,
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
  await doc.save();

  return sendSuccess(res, { data: mapExpense(doc.toObject()), message: `Expense ${doc.status.toLowerCase()}` });
});
