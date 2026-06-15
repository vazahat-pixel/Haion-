import Return from '../models/Return.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess, sendCreated, sendError, sendPaginated } from '../utils/apiResponse.js';
import { parsePagination, buildSearchFilter } from '../utils/pagination.util.js';
import { toPublicDoc } from '../utils/serialize.util.js';
import { nextSequence } from '../utils/sequence.util.js';

export const listReturns = asyncHandler(async (req, res) => {
  const { page, perPage, skip, sort } = parsePagination(req.query);
  const filter = { ...buildSearchFilter(req.query.search, ['returnNo', 'product', 'serialNo']) };
  if (req.query.status) filter.status = req.query.status;

  const [rows, total] = await Promise.all([
    Return.find(filter).sort(sort).skip(skip).limit(perPage).lean(),
    Return.countDocuments(filter),
  ]);
  return sendPaginated(res, { data: toPublicDoc(rows), total, page, perPage });
});

export const getReturn = asyncHandler(async (req, res) => {
  const doc = await Return.findById(req.params.id).lean();
  if (!doc) return sendError(res, { message: 'Return not found', statusCode: 404 });
  return sendSuccess(res, { data: toPublicDoc(doc) });
});

export const createReturn = asyncHandler(async (req, res) => {
  const returnNo = req.body.returnNo || nextSequence('RET');
  const doc = await Return.create({
    returnNo,
    product: req.body.product,
    serialNo: req.body.serialNo,
    reason: req.body.reason,
    warranty: req.body.warrantyId,
    receivedAt: req.body.receivedAt,
    status: req.body.status || 'REQUESTED',
  });
  return sendCreated(res, { data: toPublicDoc(doc.toObject()), message: 'Return request created' });
});

export const inspectReturn = asyncHandler(async (req, res) => {
  const doc = await Return.findById(req.params.id);
  if (!doc) return sendError(res, { message: 'Return not found', statusCode: 404 });
  doc.status = req.body.approved === false ? 'REJECTED' : 'INSPECTED';
  doc.inspectionNotes = req.body.notes || req.body.inspectionNotes;
  doc.inspectedAt = new Date();
  if (!doc.receivedAt) doc.receivedAt = new Date();
  await doc.save();
  return sendSuccess(res, { data: toPublicDoc(doc.toObject()), message: 'Inspection recorded' });
});
