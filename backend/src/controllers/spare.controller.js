import SpareRequest from '../models/SpareRequest.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess, sendCreated, sendError, sendPaginated } from '../utils/apiResponse.js';
import { parsePagination, buildSearchFilter } from '../utils/pagination.util.js';
import { toPublicDoc } from '../utils/serialize.util.js';
import { nextSequence } from '../utils/sequence.util.js';

export const listSpares = asyncHandler(async (req, res) => {
  const { page, perPage, skip, sort } = parsePagination(req.query);
  const filter = { ...buildSearchFilter(req.query.search, ['requestNo', 'partName', 'requestedBy']) };
  if (req.query.status) filter.status = req.query.status;

  const [rows, total] = await Promise.all([
    SpareRequest.find(filter).sort(sort).skip(skip).limit(perPage).lean(),
    SpareRequest.countDocuments(filter),
  ]);
  return sendPaginated(res, { data: toPublicDoc(rows), total, page, perPage });
});

export const getSpare = asyncHandler(async (req, res) => {
  const doc = await SpareRequest.findById(req.params.id).lean();
  if (!doc) return sendError(res, { message: 'Spare request not found', statusCode: 404 });
  return sendSuccess(res, { data: toPublicDoc(doc) });
});

export const checkAvailability = asyncHandler(async (req, res) => {
  return sendSuccess(res, {
    data: { available: true, quantity: 50, sku: req.params.id, message: 'Check warehouse stock for exact qty' },
  });
});

export const createSpareRequest = asyncHandler(async (req, res) => {
  const requestNo = req.body.requestNo || nextSequence('SPR');
  const doc = await SpareRequest.create({
    requestNo,
    partName: req.body.partName,
    sku: req.body.sku,
    quantity: req.body.quantity,
    requestedBy: req.body.requestedBy || req.user?.firstName || 'Service Center',
    requestedUser: req.user?._id,
    complaint: req.body.complaintId,
    notes: req.body.notes,
  });
  return sendCreated(res, { data: toPublicDoc(doc.toObject()), message: 'Spare request submitted' });
});
