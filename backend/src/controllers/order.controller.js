import Order from '../models/Order.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess, sendCreated, sendError, sendPaginated } from '../utils/apiResponse.js';
import { parsePagination, buildSearchFilter } from '../utils/pagination.util.js';
import { mapOrder } from '../utils/docMapper.util.js';
import { nextSequence } from '../utils/sequence.util.js';

function scopeFilter(req) {
  const filter = {};
  if (req.user.role === 'CUSTOMER') filter.customer = req.user._id;
  if (req.user.dealerId) filter.dealer = req.user.dealerId;
  if (req.query.dealerId) filter.dealer = req.query.dealerId;
  return filter;
}

export const listOrders = asyncHandler(async (req, res) => {
  const { page, perPage, skip, sort } = parsePagination(req.query);
  const filter = {
    ...scopeFilter(req),
    ...buildSearchFilter(req.query.search, ['orderNo', 'customerName']),
  };
  if (req.query.status) filter.status = req.query.status;

  const [rows, total] = await Promise.all([
    Order.find(filter).sort(sort).skip(skip).limit(perPage).lean(),
    Order.countDocuments(filter),
  ]);
  return sendPaginated(res, { data: rows.map(mapOrder), total, page, perPage });
});

export const getOrder = asyncHandler(async (req, res) => {
  const filter = { _id: req.params.id, ...scopeFilter(req) };
  const doc = await Order.findOne(filter).lean();
  if (!doc) return sendError(res, { message: 'Order not found', statusCode: 404 });
  return sendSuccess(res, { data: mapOrder(doc) });
});

export const getOrderTracking = asyncHandler(async (req, res) => {
  const filter = { _id: req.params.id, ...scopeFilter(req) };
  const doc = await Order.findOne(filter).select('orderNo status timeline eta trackingNo').lean();
  if (!doc) return sendError(res, { message: 'Order not found', statusCode: 404 });
  return sendSuccess(res, {
    data: {
      orderNo: doc.orderNo,
      status: doc.status,
      eta: doc.eta,
      trackingNo: doc.trackingNo,
      timeline: doc.timeline || [],
    },
  });
});

export const createOrder = asyncHandler(async (req, res) => {
  const lineItems = req.body.lineItems || [];
  const items = lineItems.reduce((sum, l) => sum + (l.quantity || 0), 0) || req.body.items || 1;
  const total = req.body.total ?? lineItems.reduce((sum, l) => sum + (l.amount || l.quantity * l.unitPrice || 0), 0);

  const orderNo = req.body.orderNo || nextSequence('ORD');
  const eta = req.body.eta || new Date(Date.now() + 7 * 86400000);

  const doc = await Order.create({
    orderNo,
    customer: req.user._id,
    customerName: req.body.customerName || `${req.user.firstName} ${req.user.lastName}`,
    dealer: req.body.dealerId || req.user.dealerId,
    lineItems,
    items,
    total,
    status: req.body.status || 'CONFIRMED',
    placedAt: new Date(),
    eta,
    trackingNo: req.body.trackingNo,
    timeline: [{ title: 'Order placed', variant: 'success', at: new Date() }],
  });
  return sendCreated(res, { data: mapOrder(doc.toObject()), message: 'Order created' });
});
