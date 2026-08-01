import mongoose from 'mongoose';
import PurchaseReturn from '../models/PurchaseReturn.model.js';
import Dealer from '../models/Dealer.model.js';
import DealerInventory from '../models/DealerInventory.model.js';
import Warehouse from '../models/Warehouse.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess, sendCreated, sendError, sendPaginated } from '../utils/apiResponse.js';
import { parsePagination, buildSearchFilter } from '../utils/pagination.util.js';
import { toPublicDoc } from '../utils/serialize.util.js';
import { deductDealerStock, upsertWarehouseStock } from '../services/inventory.service.js';

function mapPurchaseReturn(doc) {
  return toPublicDoc(doc);
}

async function generateReturnNo() {
  const year = new Date().getFullYear();
  const last = await PurchaseReturn.findOne(
    { sequenceNumber: { $exists: true } },
    { sequenceNumber: 1 },
    { sort: { sequenceNumber: -1 } }
  ).lean();
  const seq = (last?.sequenceNumber || 0) + 1;
  return { returnNo: `PR-${year}-${String(seq).padStart(4, '0')}`, sequenceNumber: seq };
}

// ── List ──────────────────────────────────────────────────────────────────────

export const listPurchaseReturns = asyncHandler(async (req, res) => {
  const { page, perPage, skip, sort } = parsePagination(req.query);
  const filter = buildSearchFilter(req.query.search, ['returnNo']);

  if (req.user.dealerId) {
    filter.dealer = req.user.dealerId;
  } else if (req.query.dealerId) {
    filter.dealer = req.query.dealerId;
  }
  if (req.query.status) filter.status = req.query.status;

  const [rows, total] = await Promise.all([
    PurchaseReturn.find(filter).sort(sort).skip(skip).limit(perPage).lean(),
    PurchaseReturn.countDocuments(filter),
  ]);
  return sendPaginated(res, { data: rows.map(mapPurchaseReturn), total, page, perPage });
});

// ── Get ───────────────────────────────────────────────────────────────────────

export const getPurchaseReturn = asyncHandler(async (req, res) => {
  const filter = { _id: req.params.id };
  if (req.user.dealerId) filter.dealer = req.user.dealerId;

  const doc = await PurchaseReturn.findOne(filter).lean();
  if (!doc) return sendError(res, { message: 'Purchase return not found', statusCode: 404 });
  return sendSuccess(res, { data: mapPurchaseReturn(doc) });
});

// ── Create — Dealer requests to send stock back to admin ─────────────────────

export const createPurchaseReturn = asyncHandler(async (req, res) => {
  const dealerId = req.user.dealerId || req.body.dealerId;
  if (!dealerId) return sendError(res, { message: 'Dealer context required', statusCode: 403 });

  const { lineItems = [], reason } = req.body;
  if (!reason) return sendError(res, { message: 'Reason is required', statusCode: 400 });
  if (!lineItems.length) return sendError(res, { message: 'At least one line item required', statusCode: 400 });

  const dealer = await Dealer.findById(dealerId).lean();
  if (!dealer) return sendError(res, { message: 'Dealer not found', statusCode: 404 });

  const normalizedItems = [];
  for (const item of lineItems) {
    const sku = String(item.sku || '').toUpperCase().trim();
    const quantity = Number(item.quantity);
    if (!sku || !quantity || quantity <= 0) {
      return sendError(res, { message: 'Each line item requires a valid SKU and quantity', statusCode: 400 });
    }
    // eslint-disable-next-line no-await-in-loop
    const stock = await DealerInventory.findOne({ dealer: dealerId, sku }).lean();
    if (!stock || stock.quantity < quantity) {
      return sendError(res, { message: `Insufficient stock for SKU ${sku} (available: ${stock?.quantity ?? 0})`, statusCode: 400 });
    }
    const unitPrice = Number(item.unitPrice) || 0;
    normalizedItems.push({
      sku,
      product: item.product || stock.name,
      quantity,
      unitPrice,
      amount: quantity * unitPrice,
    });
  }
  const returnAmount = normalizedItems.reduce((s, i) => s + i.amount, 0);

  const { returnNo, sequenceNumber } = await generateReturnNo();

  const doc = await PurchaseReturn.create({
    returnNo,
    sequenceNumber,
    dealer: dealer._id,
    dealerName: dealer.name,
    lineItems: normalizedItems,
    reason,
    returnAmount,
    status: 'REQUESTED',
    timeline: [{ title: 'Return requested', description: `Requested by ${dealer.name}`, by: req.user.name || dealer.name }],
    createdBy: req.user._id,
  });

  return sendCreated(res, { data: mapPurchaseReturn(doc.toObject()), message: 'Purchase return requested' });
});

// ── Ship — Dealer marks the return as shipped back to admin ──────────────────

export const shipPurchaseReturn = asyncHandler(async (req, res) => {
  const filter = { _id: req.params.id };
  if (req.user.dealerId) filter.dealer = req.user.dealerId;

  const doc = await PurchaseReturn.findOne(filter);
  if (!doc) return sendError(res, { message: 'Purchase return not found', statusCode: 404 });
  if (doc.status !== 'REQUESTED') {
    return sendError(res, { message: 'Only requested returns can be marked shipped', statusCode: 400 });
  }

  doc.status = 'SHIPPED';
  doc.shippedAt = new Date();
  doc.timeline.push({ title: 'Shipped back to admin', description: req.body.notes || '', by: req.user.name || doc.dealerName });
  await doc.save();

  return sendSuccess(res, { data: mapPurchaseReturn(doc.toObject()), message: 'Purchase return marked as shipped' });
});

// ── Receive — Admin receives the stock back into a warehouse ─────────────────

export const receivePurchaseReturn = asyncHandler(async (req, res) => {
  const { warehouseId } = req.body;
  if (!warehouseId) return sendError(res, { message: 'Warehouse is required', statusCode: 400 });

  const doc = await PurchaseReturn.findById(req.params.id);
  if (!doc) return sendError(res, { message: 'Purchase return not found', statusCode: 404 });
  if (doc.status !== 'SHIPPED') {
    return sendError(res, { message: 'Return must be shipped before it can be received', statusCode: 400 });
  }

  const warehouse = await Warehouse.findById(warehouseId).lean();
  if (!warehouse) return sendError(res, { message: 'Warehouse not found', statusCode: 404 });

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      await deductDealerStock({
        dealerId: doc.dealer,
        lineItems: doc.lineItems.map((i) => ({ sku: i.sku, name: i.product, quantity: i.quantity })),
        reference: doc.returnNo,
        referenceType: 'PurchaseReturn',
        referenceId: doc._id,
        performedBy: req.user.name || req.user.email,
        performedByUser: req.user._id,
        session,
      });

      for (const item of doc.lineItems) {
        // eslint-disable-next-line no-await-in-loop
        await upsertWarehouseStock({
          warehouseId,
          sku: item.sku,
          name: item.product,
          qtyDelta: item.quantity,
          unitPrice: item.unitPrice,
          reference: doc.returnNo,
          referenceType: 'PurchaseReturn',
          referenceId: doc._id,
          performedBy: req.user.name || req.user.email,
          performedByUser: req.user._id,
          session,
        });
      }

      doc.status = 'RECEIVED';
      doc.warehouse = warehouseId;
      doc.receivedAt = new Date();
      doc.timeline.push({
        title: 'Received at warehouse',
        description: `Received into ${warehouse.name}`,
        variant: 'success',
        by: req.user.name || 'Admin',
      });
      await doc.save({ session });
    });

    return sendSuccess(res, { data: mapPurchaseReturn(doc.toObject()), message: 'Purchase return received — stock updated' });
  } catch (err) {
    return sendError(res, { message: err.message || 'Failed to receive purchase return', statusCode: err.statusCode || 400 });
  } finally {
    await session.endSession();
  }
});

// ── Reject — Admin rejects the return before it's received ───────────────────

export const rejectPurchaseReturn = asyncHandler(async (req, res) => {
  const doc = await PurchaseReturn.findById(req.params.id);
  if (!doc) return sendError(res, { message: 'Purchase return not found', statusCode: 404 });
  if (!['REQUESTED', 'SHIPPED'].includes(doc.status)) {
    return sendError(res, { message: `Return is already ${doc.status.toLowerCase()}`, statusCode: 400 });
  }

  doc.status = 'REJECTED';
  doc.rejectedAt = new Date();
  doc.rejectReason = req.body.reason || '';
  doc.timeline.push({ title: 'Return rejected', description: doc.rejectReason, variant: 'danger', by: req.user.name || 'Admin' });
  await doc.save();

  return sendSuccess(res, { data: mapPurchaseReturn(doc.toObject()), message: 'Purchase return rejected' });
});
