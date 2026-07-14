import { env } from '../config/env.js';
import WebsiteOrder from '../models/WebsiteOrder.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess, sendCreated, sendError, sendPaginated } from '../utils/apiResponse.js';
import { parsePagination, buildSearchFilter } from '../utils/pagination.util.js';
import {
  createWebsiteCheckout,
  verifyWebsitePayment,
  trackWebsiteOrder,
  updateWebsiteOrderStatus,
  storeSalesSummary,
  storeSalesChart,
  topStoreProducts,
} from '../services/store.service.js';

function mapWebsiteOrder(doc) {
  if (!doc) return doc;
  const { _id, __v, ...rest } = doc;
  return { id: String(_id ?? doc.id), ...rest };
}

export const createCheckout = asyncHandler(async (req, res) => {
  const result = await createWebsiteCheckout(req.body);
  return sendCreated(res, {
    data: {
      order: mapWebsiteOrder(result.order),
      razorpay: result.razorpay,
    },
    message: result.razorpay ? 'Complete payment to confirm order' : 'Order placed successfully',
  });
});

export const verifyPayment = asyncHandler(async (req, res) => {
  const order = await verifyWebsitePayment(req.body);
  return sendSuccess(res, {
    data: { order: mapWebsiteOrder(order) },
    message: 'Payment verified successfully',
  });
});

export const trackOrder = asyncHandler(async (req, res) => {
  const orderNo = req.params.orderNo;
  const phone = req.query.phone;
  const doc = await trackWebsiteOrder(orderNo, phone);
  if (!doc) {
    return sendError(res, { message: 'Order not found. Check order ID and phone number.', statusCode: 404 });
  }
  return sendSuccess(res, { data: mapWebsiteOrder(doc) });
});

export const listStoreOrders = asyncHandler(async (req, res) => {
  const { page, perPage, skip, sort } = parsePagination(req.query);
  const filter = {
    ...buildSearchFilter(req.query.search, ['orderNo', 'customerName', 'phone']),
  };
  if (req.query.status) filter.status = req.query.status;
  if (req.query.paymentMethod) filter.paymentMethod = req.query.paymentMethod;
  if (req.query.paymentStatus) filter.paymentStatus = req.query.paymentStatus;

  const [rows, total] = await Promise.all([
    WebsiteOrder.find(filter).sort(sort).skip(skip).limit(perPage).lean(),
    WebsiteOrder.countDocuments(filter),
  ]);
  return sendPaginated(res, { data: rows.map(mapWebsiteOrder), total, page, perPage });
});

export const getStoreOrder = asyncHandler(async (req, res) => {
  const doc = await WebsiteOrder.findById(req.params.id).lean();
  if (!doc) return sendError(res, { message: 'Order not found', statusCode: 404 });
  return sendSuccess(res, { data: mapWebsiteOrder(doc) });
});

export const patchStoreOrderStatus = asyncHandler(async (req, res) => {
  const doc = await updateWebsiteOrderStatus(req.params.id, req.body);
  return sendSuccess(res, { data: mapWebsiteOrder(doc), message: 'Order status updated' });
});

export const getStoreAnalyticsSummary = asyncHandler(async (_req, res) => {
  const summary = await storeSalesSummary();
  return sendSuccess(res, { data: summary });
});

export const getStoreAnalyticsChart = asyncHandler(async (req, res) => {
  const days = Math.min(90, Math.max(7, Number(req.query.days) || 30));
  const chart = await storeSalesChart(days);
  return sendSuccess(res, { data: chart });
});

export const getStoreTopProducts = asyncHandler(async (req, res) => {
  const limit = Math.min(20, Math.max(1, Number(req.query.limit) || 10));
  const products = await topStoreProducts(limit);
  return sendSuccess(res, { data: products });
});

export const getPaymentConfig = asyncHandler(async (_req, res) => {
  const { isRazorpayConfigured } = await import('../services/razorpay.service.js');
  return sendSuccess(res, {
    data: {
      razorpayEnabled: isRazorpayConfigured(),
      keyId: env.razorpayKeyId || null,
    },
  });
});
