import AuditLog from '../models/AuditLog.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess, sendError, sendPaginated } from '../utils/apiResponse.js';
import { parsePagination, buildSearchFilter } from '../utils/pagination.util.js';
import { mapAuditLog } from '../utils/docMapper.util.js';

export const listAuditLogs = asyncHandler(async (req, res) => {
  const { page, perPage, skip, sort } = parsePagination(req.query);
  const filter = {
    ...buildSearchFilter(req.query.search, ['user', 'module', 'action']),
  };
  if (req.query.module) filter.module = req.query.module;
  if (req.query.action) filter.action = req.query.action.toUpperCase();
  if (req.query.from || req.query.to) {
    filter.createdAt = {};
    if (req.query.from) filter.createdAt.$gte = new Date(req.query.from);
    if (req.query.to) filter.createdAt.$lte = new Date(req.query.to);
  }

  const [rows, total] = await Promise.all([
    AuditLog.find(filter).sort(sort).skip(skip).limit(perPage).lean(),
    AuditLog.countDocuments(filter),
  ]);
  return sendPaginated(res, { data: rows.map(mapAuditLog), total, page, perPage });
});

export const getAuditLog = asyncHandler(async (req, res) => {
  const doc = await AuditLog.findById(req.params.id).lean();
  if (!doc) return sendError(res, { message: 'Audit log not found', statusCode: 404 });
  return sendSuccess(res, { data: mapAuditLog(doc) });
});
