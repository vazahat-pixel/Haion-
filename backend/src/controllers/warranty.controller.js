import Warranty from '../models/Warranty.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess, sendError, sendPaginated } from '../utils/apiResponse.js';
import { parsePagination, buildSearchFilter } from '../utils/pagination.util.js';
import { mapWarranty } from '../utils/docMapper.util.js';

function dealerFilter(req) {
  if (req.user.dealerId) return { dealer: req.user.dealerId };
  if (req.query.dealerId) return { dealer: req.query.dealerId };
  return {};
}

export const listWarranties = asyncHandler(async (req, res) => {
  const { page, perPage, skip, sort } = parsePagination(req.query);
  const filter = {
    ...dealerFilter(req),
    ...buildSearchFilter(req.query.search, ['serialNo', 'customerName', 'billNo', 'product']),
  };
  if (req.query.status) filter.status = req.query.status;

  const [rows, total] = await Promise.all([
    Warranty.find(filter).sort(sort).skip(skip).limit(perPage).lean(),
    Warranty.countDocuments(filter),
  ]);
  return sendPaginated(res, { data: rows.map(mapWarranty), total, page, perPage });
});

export const getWarranty = asyncHandler(async (req, res) => {
  const filter = { _id: req.params.id, ...dealerFilter(req) };
  const warranty = await Warranty.findOne(filter).lean();
  if (!warranty) return sendError(res, { message: 'Warranty not found', statusCode: 404 });
  return sendSuccess(res, { data: mapWarranty(warranty) });
});

export const checkEligibility = asyncHandler(async (req, res) => {
  const serial = (req.query.serial || req.query.serialNo || '').trim();
  if (!serial) return sendError(res, { message: 'Serial number required', statusCode: 400 });

  const warranty = await Warranty.findOne({ serialNo: serial.toUpperCase() }).lean();
  if (!warranty) {
    return sendSuccess(res, { data: { eligible: false, reason: 'Serial not found' } });
  }

  const now = new Date();
  const expired = warranty.endDate < now || warranty.status === 'EXPIRED';
  const eligible = !expired && warranty.status === 'ACTIVE';

  return sendSuccess(res, {
    data: {
      eligible,
      warranty: mapWarranty(warranty),
      reason: expired ? 'Warranty expired' : eligible ? 'Active warranty' : `Status: ${warranty.status}`,
    },
  });
});

export const claimWarranty = asyncHandler(async (req, res) => {
  const filter = { _id: req.params.id, ...dealerFilter(req) };
  const warranty = await Warranty.findOne(filter);
  if (!warranty) return sendError(res, { message: 'Warranty not found', statusCode: 404 });
  if (warranty.status !== 'ACTIVE') {
    return sendError(res, { message: 'Warranty is not active', statusCode: 400 });
  }
  if (warranty.endDate < new Date()) {
    warranty.status = 'EXPIRED';
    await warranty.save();
    return sendError(res, { message: 'Warranty has expired', statusCode: 400 });
  }

  warranty.status = 'CLAIMED';
  await warranty.save();
  return sendSuccess(res, { data: mapWarranty(warranty.toObject()), message: 'Warranty claim recorded' });
});
