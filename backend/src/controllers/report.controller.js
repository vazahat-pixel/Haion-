import Report from '../models/Report.model.js';
import ReportDelivery from '../models/ReportDelivery.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess, sendCreated, sendError, sendPaginated } from '../utils/apiResponse.js';
import { parsePagination, buildSearchFilter } from '../utils/pagination.util.js';
import { mapReport } from '../utils/docMapper.util.js';
import { toPublicDoc } from '../utils/serialize.util.js';
import { runReport, getCatalog } from '../services/reports/reportRunner.service.js';

export const getReportCatalog = asyncHandler(async (req, res) => {
  return sendSuccess(res, { data: getCatalog(req.user) });
});

export const runReportHandler = asyncHandler(async (req, res) => {
  const { reportCode, fromDate, toDate, save } = req.body;
  if (!reportCode) return sendError(res, { message: 'reportCode is required', statusCode: 400 });

  try {
    const result = await runReport({
      reportCode,
      fromDate,
      toDate,
      user: req.user,
      save: save !== false,
    });

    if (save === false) {
      return sendSuccess(res, { data: result });
    }

    return sendCreated(res, {
      data: mapReport(result),
      message: `${result.title} generated from database`,
    });
  } catch (err) {
    return sendError(res, {
      message: err.message || 'Failed to generate report',
      statusCode: err.statusCode || 500,
    });
  }
});

export const previewReport = asyncHandler(async (req, res) => {
  const { code } = req.params;
  const { fromDate, toDate } = req.query;
  if (!code) return sendError(res, { message: 'Report code required', statusCode: 400 });

  try {
    const result = await runReport({
      reportCode: code,
      fromDate,
      toDate,
      user: req.user,
      save: false,
    });
    return sendSuccess(res, { data: result });
  } catch (err) {
    return sendError(res, {
      message: err.message || 'Failed to preview report',
      statusCode: err.statusCode || 500,
    });
  }
});

function databaseReportFilter(base = {}) {
  return {
    ...base,
    reportCode: { $exists: true, $ne: null },
    'data.meta.source': 'database',
  };
}

export const listReports = asyncHandler(async (req, res) => {
  const { page, perPage, skip, sort } = parsePagination(req.query);
  const filter = databaseReportFilter({
    ...buildSearchFilter(req.query.search, ['title', 'type', 'author', 'reportCode']),
  });
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
  if (!doc.reportCode || doc.data?.meta?.source !== 'database') {
    return sendError(res, { message: 'Report not found', statusCode: 404 });
  }
  if (req.user.dealerId && doc.dealer && String(doc.dealer) !== String(req.user.dealerId)) {
    return sendError(res, { message: 'Report not found', statusCode: 404 });
  }
  return sendSuccess(res, { data: mapReport(doc) });
});

/** @deprecated Use POST /reports/run */
export const createReport = asyncHandler(async (req, res) => {
  const { reportCode, fromDate, toDate } = req.body;
  if (!reportCode) {
    return sendError(res, {
      message: 'Manual report creation is disabled. Use POST /reports/run with reportCode to generate from database.',
      statusCode: 400,
    });
  }
  try {
    const result = await runReport({
      reportCode,
      fromDate,
      toDate,
      user: req.user,
      save: true,
    });
    return sendCreated(res, {
      data: mapReport(result),
      message: `${result.title} generated from database`,
    });
  } catch (err) {
    return sendError(res, {
      message: err.message || 'Failed to generate report',
      statusCode: err.statusCode || 500,
    });
  }
});

export const listReportDeliveries = asyncHandler(async (req, res) => {
  const { page, perPage, skip, sort } = parsePagination(req.query);
  const filter = {};
  if (req.query.reportType) filter.reportType = req.query.reportType;
  if (req.query.recipientType) filter.recipientType = req.query.recipientType;
  if (req.query.status) filter.status = req.query.status;

  const [rows, total] = await Promise.all([
    ReportDelivery.find(filter).sort(sort).skip(skip).limit(perPage).lean(),
    ReportDelivery.countDocuments(filter),
  ]);
  return sendPaginated(res, { data: rows.map(toPublicDoc), total, page, perPage });
});
