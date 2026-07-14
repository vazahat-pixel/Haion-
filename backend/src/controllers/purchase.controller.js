import Purchase from '../models/Purchase.model.js';
import Party from '../models/Party.model.js';
import Product from '../models/Product.model.js';
import Warehouse from '../models/Warehouse.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess, sendCreated, sendError, sendPaginated } from '../utils/apiResponse.js';
import { parsePagination, buildSearchFilter } from '../utils/pagination.util.js';
import { toPublicDoc } from '../utils/serialize.util.js';
import { nextSequence } from '../utils/sequence.util.js';
import { calculateLineGST } from '../utils/gst.util.js';
import { upsertWarehouseStock } from '../services/inventory.service.js';

const DEFAULT_TERMS = `1. Goods once sold will not be taken back or exchanged
2. All disputes are subject to jurisdiction only`;

function buildLineItems(rawItems) {
  return rawItems.map((item) => {
    const gross = Math.round(item.quantity * item.unitPrice * 100) / 100;
    const discount = Math.min(item.discount || 0, gross);
    const amount = Math.round((gross - discount) * 100) / 100;
    const gst = calculateLineGST({ amount, gstRate: item.gstRate, isInterState: false });
    return {
      productId: item.productId || undefined,
      sku: item.sku.toUpperCase(),
      name: item.name,
      hsn: item.hsn || '',
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discount,
      gstRate: item.gstRate,
      amount,
      taxAmount: gst.totalGST,
      lineTotal: amount + gst.totalGST,
    };
  });
}

function computePurchaseTotals(lineItems, { orderDiscount = 0, additionalCharges = [], amountPaid = 0 } = {}) {
  const subtotal = lineItems.reduce((s, l) => s + l.amount, 0);
  const tax = lineItems.reduce((s, l) => s + l.taxAmount, 0);
  const chargesTotal = (additionalCharges || []).reduce((s, c) => s + (c.amount || 0), 0);
  const discount = Math.min(orderDiscount || 0, subtotal);
  const taxableAmount = Math.round((subtotal - discount + chargesTotal) * 100) / 100;
  const total = Math.round((taxableAmount + tax) * 100) / 100;
  const paid = amountPaid || 0;
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    orderDiscount: discount,
    taxableAmount,
    tax: Math.round(tax * 100) / 100,
    total,
    amountPaid: paid,
    balanceAmount: Math.round((total - paid) * 100) / 100,
  };
}

function computeDueDate(invDate, termsDays) {
  const base = invDate ? new Date(invDate) : new Date();
  const due = new Date(base);
  due.setDate(due.getDate() + (termsDays ?? 30));
  return due;
}

function mapPurchase(doc) {
  const d = toPublicDoc(doc);
  return {
    ...d,
    partyId: String(d.party?._id || d.party || ''),
    partyName: d.partyName || d.party?.name || '',
    warehouse: d.warehouse?.code || d.warehouse?.name || d.warehouse,
    warehouseId: String(d.warehouse?._id || d.warehouse || ''),
    itemCount: d.lineItems?.length || d.itemCount || 0,
    purchaseInvDate: d.purchaseInvDate ? new Date(d.purchaseInvDate).toISOString().slice(0, 10) : null,
    dueDate: d.dueDate ? new Date(d.dueDate).toISOString().slice(0, 10) : null,
  };
}

export const listPurchases = asyncHandler(async (req, res) => {
  const { page, perPage, skip, sort } = parsePagination(req.query);
  const filter = { ...buildSearchFilter(req.query.search, ['purchaseNo', 'billNo', 'partyName', 'originalInvNo']) };
  if (req.query.status) filter.status = req.query.status;
  if (req.query.partyId) filter.party = req.query.partyId;

  const [rows, total] = await Promise.all([
    Purchase.find(filter)
      .populate('party', 'name code type')
      .populate('warehouse', 'code name')
      .sort(sort)
      .skip(skip)
      .limit(perPage)
      .lean(),
    Purchase.countDocuments(filter),
  ]);

  return sendPaginated(res, { data: rows.map(mapPurchase), total, page, perPage });
});

export const getPurchase = asyncHandler(async (req, res) => {
  const purchase = await Purchase.findById(req.params.id)
    .populate('party', 'name code type phone gstin billingAddress')
    .populate('warehouse', 'code name city')
    .lean();
  if (!purchase) return sendError(res, { message: 'Purchase not found', statusCode: 404 });
  return sendSuccess(res, { data: mapPurchase(purchase) });
});

export const createPurchase = asyncHandler(async (req, res) => {
  const party = await Party.findById(req.body.partyId);
  if (!party) return sendError(res, { message: 'Party not found', statusCode: 404 });
  if (party.status !== 'ACTIVE') return sendError(res, { message: 'Party is inactive', statusCode: 400 });

  const warehouse = await Warehouse.findById(req.body.warehouseId);
  if (!warehouse) return sendError(res, { message: 'Warehouse not found', statusCode: 404 });

  const enrichedItems = await Promise.all(req.body.lineItems.map(async (item) => {
    const product = item.productId
      ? await Product.findById(item.productId).lean()
      : await Product.findOne({ sku: item.sku.toUpperCase() }).lean();
    return {
      ...item,
      productId: product?._id,
      sku: product?.sku || item.sku,
      name: product?.name || item.name,
      hsn: item.hsn || product?.hsnCode || '',
      gstRate: item.gstRate ?? product?.gstRate ?? 18,
    };
  }));

  const lineItems = buildLineItems(enrichedItems);
  const totals = computePurchaseTotals(lineItems, {
    orderDiscount: req.body.orderDiscount,
    additionalCharges: req.body.additionalCharges,
    amountPaid: req.body.amountPaid,
  });

  const purchaseInvDate = req.body.purchaseInvDate ? new Date(req.body.purchaseInvDate) : new Date();
  const paymentTermsDays = req.body.paymentTermsDays ?? 30;
  const dueDate = req.body.dueDate
    ? new Date(req.body.dueDate)
    : computeDueDate(purchaseInvDate, paymentTermsDays);

  const purchaseNo = nextSequence('PUR');

  const purchase = await Purchase.create({
    purchaseNo,
    billNo: req.body.billNo.trim(),
    purchaseInvDate,
    originalInvNo: req.body.originalInvNo || '',
    paymentTermsDays,
    dueDate,
    party: party._id,
    partyName: party.name,
    warehouse: warehouse._id,
    lineItems,
    additionalCharges: req.body.additionalCharges || [],
    termsAndConditions: req.body.termsAndConditions || DEFAULT_TERMS,
    signatureUrl: req.body.signatureUrl || null,
    notes: req.body.notes || '',
    ...totals,
    status: 'PENDING',
    createdBy: req.user._id,
  });

  await purchase.populate([
    { path: 'party', select: 'name code type' },
    { path: 'warehouse', select: 'code name' },
  ]);

  return sendCreated(res, { data: mapPurchase(purchase.toObject()), message: 'Purchase saved' });
});

export const receivePurchase = asyncHandler(async (req, res) => {
  const purchase = await Purchase.findById(req.params.id);
  if (!purchase) return sendError(res, { message: 'Purchase not found', statusCode: 404 });
  if (purchase.status === 'RECEIVED') {
    return sendError(res, { message: 'Purchase already received into inventory', statusCode: 400 });
  }
  if (purchase.status === 'CANCELLED') {
    return sendError(res, { message: 'Cancelled purchase cannot be received', statusCode: 400 });
  }

  for (const line of purchase.lineItems) {
    const product = await Product.findOne({ sku: line.sku }).lean();
    await upsertWarehouseStock({
      warehouseId: purchase.warehouse,
      sku: line.sku,
      name: line.name,
      category: product?.category || 'General',
      hsn: line.hsn || product?.hsnCode || '',
      qtyDelta: line.quantity,
      unitPrice: line.unitPrice,
      reference: purchase.purchaseNo,
      referenceType: 'Purchase',
      referenceId: purchase._id,
      performedBy: req.user.name || req.user.email,
      performedByUser: req.user._id,
    });
  }

  purchase.status = 'RECEIVED';
  purchase.receivedAt = new Date();
  purchase.receivedBy = req.user._id;
  await purchase.save();

  await purchase.populate([
    { path: 'party', select: 'name code type' },
    { path: 'warehouse', select: 'code name' },
  ]);

  return sendSuccess(res, {
    data: mapPurchase(purchase.toObject()),
    message: 'Purchase received — inventory updated',
  });
});

export const cancelPurchase = asyncHandler(async (req, res) => {
  const purchase = await Purchase.findById(req.params.id);
  if (!purchase) return sendError(res, { message: 'Purchase not found', statusCode: 404 });
  if (purchase.status === 'RECEIVED') {
    return sendError(res, { message: 'Received purchase cannot be cancelled', statusCode: 400 });
  }
  purchase.status = 'CANCELLED';
  await purchase.save();
  return sendSuccess(res, { data: mapPurchase(purchase.toObject()), message: 'Purchase cancelled' });
});
