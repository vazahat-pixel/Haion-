import Report from '../models/Report.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess, sendCreated, sendError, sendPaginated } from '../utils/apiResponse.js';
import { parsePagination, buildSearchFilter } from '../utils/pagination.util.js';
import { mapReport } from '../utils/docMapper.util.js';

export const listReports = asyncHandler(async (req, res) => {
  const { page, perPage, skip, sort } = parsePagination(req.query);
  const filter = { ...buildSearchFilter(req.query.search, ['title', 'type', 'author']) };
  if (req.query.status) filter.status = req.query.status;
  if (req.query.type) filter.type = req.query.type;
  if (req.user.dealerId) filter.dealer = req.user.dealerId;

  const [rows, total] = await Promise.all([
    Report.find(filter).sort(sort).skip(skip).limit(perPage).lean(),
    Report.countDocuments(filter),
  ]);
  return sendPaginated(res, { data: rows.map(mapReport), total, page, perPage });
});

export const getReport = asyncHandler(async (req, res) => {
  const doc = await Report.findById(req.params.id).lean();
  if (!doc) return sendError(res, { message: 'Report not found', statusCode: 404 });
  return sendSuccess(res, { data: mapReport(doc) });
});

export const createReport = asyncHandler(async (req, res) => {
  const doc = await Report.create({
    title: req.body.title,
    type: req.body.type,
    author: req.body.author || `${req.user.firstName} ${req.user.lastName}`,
    authorUser: req.user._id,
    dealer: req.body.dealerId || req.user.dealerId,
    period: req.body.period,
    status: req.body.status || 'IN_PROGRESS',
    summary: req.body.summary,
    data: req.body.data,
  });
  return sendCreated(res, { data: mapReport(doc.toObject()), message: 'Report created' });
});
