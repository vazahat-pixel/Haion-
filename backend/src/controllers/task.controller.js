import Task from '../models/Task.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess, sendError, sendPaginated } from '../utils/apiResponse.js';
import { parsePagination, buildSearchFilter } from '../utils/pagination.util.js';
import { toPublicDoc } from '../utils/serialize.util.js';

export const listTasks = asyncHandler(async (req, res) => {
  const { page, perPage, skip, sort } = parsePagination(req.query);
  const filter = { ...buildSearchFilter(req.query.search, ['title', 'assignee']) };
  if (req.query.status) filter.status = req.query.status;

  const [rows, total] = await Promise.all([
    Task.find(filter).sort(sort).skip(skip).limit(perPage).lean(),
    Task.countDocuments(filter),
  ]);
  return sendPaginated(res, { data: toPublicDoc(rows), total, page, perPage });
});

export const getTask = asyncHandler(async (req, res) => {
  const doc = await Task.findById(req.params.id).lean();
  if (!doc) return sendError(res, { message: 'Task not found', statusCode: 404 });
  return sendSuccess(res, { data: toPublicDoc(doc) });
});

export const updateTask = asyncHandler(async (req, res) => {
  // SECURITY: Whitelist allowed update fields — prevent mass assignment
  const ALLOWED = ['title', 'description', 'status', 'assignee', 'dueDate', 'priority', 'notes'];
  const safeUpdate = Object.fromEntries(ALLOWED.filter((k) => req.body[k] !== undefined).map((k) => [k, req.body[k]]));
  const doc = await Task.findByIdAndUpdate(req.params.id, { $set: safeUpdate }, { new: true, runValidators: true }).lean();
  if (!doc) return sendError(res, { message: 'Task not found', statusCode: 404 });
  return sendSuccess(res, { data: toPublicDoc(doc), message: 'Task updated' });
});

export const getPendingCount = asyncHandler(async (_req, res) => {
  const count = await Task.countDocuments({ status: { $in: ['PENDING', 'IN_PROGRESS'] } });
  return sendSuccess(res, { data: { count } });
});
