import ServiceRequest from '../models/ServiceRequest.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess, sendCreated, sendError, sendPaginated } from '../utils/apiResponse.js';
import { parsePagination, buildSearchFilter } from '../utils/pagination.util.js';
import { toPublicDoc } from '../utils/serialize.util.js';
import { nextSequence } from '../utils/sequence.util.js';

export const listServiceRequests = asyncHandler(async (req, res) => {
  const { page, perPage, skip, sort } = parsePagination(req.query);
  const filter = { ...buildSearchFilter(req.query.search, ['requestNo', 'product', 'issue']) };
  if (req.query.status) filter.status = req.query.status;
  if (req.user.role === 'CUSTOMER') filter.customer = req.user._id;

  const [rows, total] = await Promise.all([
    ServiceRequest.find(filter).sort(sort).skip(skip).limit(perPage).lean(),
    ServiceRequest.countDocuments(filter),
  ]);
  return sendPaginated(res, { data: toPublicDoc(rows), total, page, perPage });
});

export const getServiceRequest = asyncHandler(async (req, res) => {
  const filter = { _id: req.params.id };
  if (req.user.role === 'CUSTOMER') filter.customer = req.user._id;
  const doc = await ServiceRequest.findOne(filter).lean();
  if (!doc) return sendError(res, { message: 'Service request not found', statusCode: 404 });
  return sendSuccess(res, { data: toPublicDoc(doc) });
});

export const createServiceRequest = asyncHandler(async (req, res) => {
  const requestNo = req.body.requestNo || nextSequence('SR');
  const doc = await ServiceRequest.create({
    requestNo,
    customer: req.user._id,
    customerName: req.body.customerName || `${req.user.firstName} ${req.user.lastName}`,
    product: req.body.product,
    serialNo: req.body.serialNo,
    issue: req.body.issue,
    warranty: req.body.warrantyId,
  });
  return sendCreated(res, { data: toPublicDoc(doc.toObject()), message: 'Service request submitted' });
});
