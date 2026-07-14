import Approval from '../models/Approval.model.js';
import Expense from '../models/Expense.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess, sendError, sendPaginated } from '../utils/apiResponse.js';
import { parsePagination, buildSearchFilter } from '../utils/pagination.util.js';
import { mapApproval } from '../utils/docMapper.util.js';
import { logAudit } from '../services/audit.service.js';

export const listApprovals = asyncHandler(async (req, res) => {
  const { page, perPage, skip, sort } = parsePagination(req.query);
  const filter = { ...buildSearchFilter(req.query.search, ['type', 'requester']) };
  if (req.query.status) filter.status = req.query.status;

  const [rows, total] = await Promise.all([
    Approval.find(filter).sort(sort).skip(skip).limit(perPage).lean(),
    Approval.countDocuments(filter),
  ]);
  return sendPaginated(res, { data: rows.map(mapApproval), total, page, perPage });
});

export const getApproval = asyncHandler(async (req, res) => {
  const doc = await Approval.findById(req.params.id).lean();
  if (!doc) return sendError(res, { message: 'Approval not found', statusCode: 404 });
  return sendSuccess(res, { data: mapApproval(doc) });
});

export const getPendingCount = asyncHandler(async (_req, res) => {
  const count = await Approval.countDocuments({ status: 'PENDING' });
  return sendSuccess(res, { data: { count } });
});

export const updateApproval = asyncHandler(async (req, res) => {
  const doc = await Approval.findById(req.params.id);
  if (!doc) return sendError(res, { message: 'Approval not found', statusCode: 404 });
  if (doc.status !== 'PENDING') {
    return sendError(res, { message: 'Approval already reviewed', statusCode: 400 });
  }

  const status = req.body.status;
  if (!['APPROVED', 'REJECTED'].includes(status)) {
    return sendError(res, { message: 'Status must be APPROVED or REJECTED', statusCode: 400 });
  }

  doc.status = status;
  doc.reviewedBy = req.user._id;
  doc.reviewedAt = new Date();
  doc.reviewNotes = req.body.notes || req.body.reviewNotes;
  await doc.save();

  // Sync the status back to the referenced resource
  if (doc.resourceType === 'Expense' && doc.resourceId) {
    await Expense.findByIdAndUpdate(doc.resourceId, {
      status: status === 'APPROVED' ? 'APPROVED' : 'REJECTED',
      reviewedBy: req.user._id,
      reviewedAt: new Date(),
    });
  }

  await logAudit({
    action: `APPROVAL_${status}`,
    user: req.user?.email,
    userId: req.user?._id,
    module: 'Approvals',
    ip: req.ip,
    resourceId: String(doc._id),
    metadata: { type: doc.type, resourceType: doc.resourceType },
  });

  return sendSuccess(res, { data: mapApproval(doc.toObject()), message: `Approval ${status.toLowerCase()}` });
});
