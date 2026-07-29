import DealerOrder from '../models/DealerOrder.model.js';
import Dealer from '../models/Dealer.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess, sendCreated, sendError, sendPaginated } from '../utils/apiResponse.js';
import { parsePagination, buildSearchFilter } from '../utils/pagination.util.js';
import { toPublicDoc } from '../utils/serialize.util.js';

function mapDealerOrder(doc) {
  if (!doc) return doc;
  return toPublicDoc(doc);
}

export async function generateOrderNo(prefix = 'PO') {
  const latest = await DealerOrder.findOne({ prefix }).sort({ sequenceNumber: -1 }).lean();
  const nextSeq = latest ? latest.sequenceNumber + 1 : 1;
  const year = new Date().getFullYear();
  return {
    orderNo: `${prefix}-${year}-${String(nextSeq).padStart(4, '0')}`,
    sequenceNumber: nextSeq,
  };
}

export const getNextOrderNumber = asyncHandler(async (req, res) => {
  const prefix = req.query.prefix || 'PO';
  const data = await generateOrderNo(prefix);
  return sendSuccess(res, { data });
});

/** GET /api/dealer-orders — Admin sees all; dealer sees own */
export const listDealerOrders = asyncHandler(async (req, res) => {
  const { page, perPage, skip, sort } = parsePagination(req.query);
  const filter = buildSearchFilter(req.query.search, ['orderNo', 'dealerName']);

  if (req.user.dealerId) {
    // Dealer panel — only their orders
    filter.dealer = req.user.dealerId;
  } else if (req.query.dealerId) {
    filter.dealer = req.query.dealerId;
  }

  if (req.query.status) filter.status = req.query.status;

  const [rows, total] = await Promise.all([
    DealerOrder.find(filter).sort(sort).skip(skip).limit(perPage).lean(),
    DealerOrder.countDocuments(filter),
  ]);
  return sendPaginated(res, { data: rows.map(mapDealerOrder), total, page, perPage });
});

/** GET /api/dealer-orders/:id */
export const getDealerOrder = asyncHandler(async (req, res) => {
  const filter = { _id: req.params.id };
  if (req.user.dealerId) filter.dealer = req.user.dealerId;

  const doc = await DealerOrder.findOne(filter).lean();
  if (!doc) return sendError(res, { message: 'Order not found', statusCode: 404 });
  return sendSuccess(res, { data: mapDealerOrder(doc) });
});

/** POST /api/dealer-orders — Dealer places an order */
export const createDealerOrder = asyncHandler(async (req, res) => {
  const dealerId = req.user.dealerId || req.body.dealerId;
  if (!dealerId) return sendError(res, { message: 'Dealer context required', statusCode: 403 });

  const { lineItems, notes } = req.body;
  if (!lineItems?.length) return sendError(res, { message: 'At least one item required', statusCode: 400 });

  const dealer = await Dealer.findById(dealerId).lean();
  if (!dealer) return sendError(res, { message: 'Dealer not found', statusCode: 404 });

  const prefix = req.body.prefix || 'PO';
  const seqData = await generateOrderNo(prefix);

  const doc = await DealerOrder.create({
    orderNo: seqData.orderNo,
    prefix,
    sequenceNumber: seqData.sequenceNumber,
    dealer: dealerId,
    dealerName: dealer.name,
    dealerGstin: dealer.gstin || '',
    dealerAddress: `${dealer.city || ''}, ${dealer.state || ''}`,
    orderDate: req.body.orderDate || new Date(),
    paymentTermsDays: Number(req.body.paymentTermsDays ?? 30),
    expiryDate: req.body.expiryDate || null,
    eWayBillNo: req.body.eWayBillNo || '',
    vehicleNo: req.body.vehicleNo || '',
    lineItems: lineItems.map((item) => ({
      sku: item.sku || '',
      name: item.name,
      hsn: item.hsn || '',
      quantity: Number(item.quantity || 1),
      unitPrice: Number(item.unitPrice || 0),
      discount: Number(item.discount || 0),
      gstRate: Number(item.gstRate ?? 18),
      amount: Number(item.amount || 0),
      taxAmount: Number(item.taxAmount || 0),
      lineTotal: Number(item.lineTotal || 0),
    })),
    subtotal: Number(req.body.subtotal || 0),
    orderDiscount: Number(req.body.orderDiscount || 0),
    additionalCharges: req.body.additionalCharges || [],
    taxableAmount: Number(req.body.taxableAmount || 0),
    tax: Number(req.body.tax || 0),
    total: Number(req.body.total || 0),
    notes: notes || '',
    termsAndConditions: req.body.termsAndConditions || '',
    bankDetails: req.body.bankDetails || {},
    status: 'PENDING',
    createdBy: req.user._id,
  });

  return sendCreated(res, { data: mapDealerOrder(doc.toObject()), message: 'Order placed successfully' });
});

/** PATCH /api/dealer-orders/:id/status — Admin approves/rejects/fulfils */
export const updateDealerOrderStatus = asyncHandler(async (req, res) => {
  const { status, adminNotes } = req.body;
  const allowed = ['APPROVED', 'REJECTED', 'FULFILLED'];
  if (!allowed.includes(status)) {
    return sendError(res, { message: `Status must be one of: ${allowed.join(', ')}`, statusCode: 400 });
  }

  const doc = await DealerOrder.findById(req.params.id);
  if (!doc) return sendError(res, { message: 'Order not found', statusCode: 404 });
  if (doc.status === 'FULFILLED' || doc.status === 'REJECTED') {
    return sendError(res, { message: 'This order is already finalized', statusCode: 400 });
  }

  doc.status = status;
  if (adminNotes !== undefined) doc.adminNotes = adminNotes;
  doc.reviewedBy = req.user._id;
  doc.reviewedAt = new Date();
  await doc.save();

  return sendSuccess(res, { data: mapDealerOrder(doc.toObject()), message: `Order ${status.toLowerCase()}` });
});
