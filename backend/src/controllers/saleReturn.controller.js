import mongoose from 'mongoose';
import SaleReturn from '../models/SaleReturn.model.js';
import Dealer from '../models/Dealer.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess, sendCreated, sendError, sendPaginated } from '../utils/apiResponse.js';
import { parsePagination, buildSearchFilter } from '../utils/pagination.util.js';
import { toPublicDoc } from '../utils/serialize.util.js';
import { upsertDealerStock, deductDealerStock } from '../services/inventory.service.js';

function mapSaleReturn(doc) {
  return toPublicDoc(doc);
}

async function generateReturnNo() {
  const year = new Date().getFullYear();
  const last = await SaleReturn.findOne(
    { sequenceNumber: { $exists: true } },
    { sequenceNumber: 1 },
    { sort: { sequenceNumber: -1 } }
  ).lean();
  const seq = (last?.sequenceNumber || 0) + 1;
  return { returnNo: `SR-${year}-${String(seq).padStart(4, '0')}`, sequenceNumber: seq };
}

// ── List ──────────────────────────────────────────────────────────────────────

export const listSaleReturns = asyncHandler(async (req, res) => {
  const { page, perPage, skip, sort } = parsePagination(req.query);
  const filter = buildSearchFilter(req.query.search, ['returnNo', 'customerName', 'billNo']);

  if (req.user.dealerId) {
    filter.dealer = req.user.dealerId;
  } else if (req.query.dealerId) {
    filter.dealer = req.query.dealerId;
  }
  if (req.query.status) filter.status = req.query.status;

  const [rows, total] = await Promise.all([
    SaleReturn.find(filter).sort(sort).skip(skip).limit(perPage).lean(),
    SaleReturn.countDocuments(filter),
  ]);
  return sendPaginated(res, { data: rows.map(mapSaleReturn), total, page, perPage });
});

// ── Get ───────────────────────────────────────────────────────────────────────

export const getSaleReturn = asyncHandler(async (req, res) => {
  const filter = { _id: req.params.id };
  if (req.user.dealerId) filter.dealer = req.user.dealerId;

  const doc = await SaleReturn.findOne(filter).lean();
  if (!doc) return sendError(res, { message: 'Sale return not found', statusCode: 404 });
  return sendSuccess(res, { data: mapSaleReturn(doc) });
});

// ── Create — Dealer records a customer's sale return ─────────────────────────

export const createSaleReturn = asyncHandler(async (req, res) => {
  const dealerId = req.user.dealerId || req.body.dealerId;
  if (!dealerId) return sendError(res, { message: 'Dealer context required', statusCode: 403 });

  const {
    billNo = '', customerName, customerPhone = '', lineItems = [], reason, restock = true,
  } = req.body;

  if (!customerName) return sendError(res, { message: 'Customer name is required', statusCode: 400 });
  if (!reason) return sendError(res, { message: 'Reason is required', statusCode: 400 });
  if (!lineItems.length) return sendError(res, { message: 'At least one line item required', statusCode: 400 });

  const dealer = await Dealer.findById(dealerId).lean();
  if (!dealer) return sendError(res, { message: 'Dealer not found', statusCode: 404 });

  const normalizedItems = lineItems.map((item) => ({
    sku: String(item.sku || '').toUpperCase().trim(),
    product: item.product,
    quantity: Number(item.quantity),
    unitPrice: Number(item.unitPrice) || 0,
    amount: Number(item.quantity) * (Number(item.unitPrice) || 0),
    serialNos: item.serialNos || [],
  }));
  if (normalizedItems.some((i) => !i.sku || !i.product || !i.quantity || i.quantity <= 0)) {
    return sendError(res, { message: 'Each line item requires a valid SKU, product, and quantity', statusCode: 400 });
  }
  const refundAmount = normalizedItems.reduce((s, i) => s + i.amount, 0);

  const { returnNo, sequenceNumber } = await generateReturnNo();

  const session = await mongoose.startSession();
  try {
    let doc;
    await session.withTransaction(async () => {
      [doc] = await SaleReturn.create([{
        returnNo,
        sequenceNumber,
        dealer: dealer._id,
        dealerName: dealer.name,
        billNo,
        customerName,
        customerPhone,
        lineItems: normalizedItems,
        reason,
        refundAmount,
        restock: !!restock,
        status: 'COMPLETED',
        timeline: [{
          title: 'Sale return recorded',
          description: restock ? 'Items restocked to dealer inventory' : 'Items not restocked (marked defective/discarded)',
          by: req.user.name || dealer.name,
        }],
        createdBy: req.user._id,
      }], { session });

      if (restock) {
        for (const item of normalizedItems) {
          // eslint-disable-next-line no-await-in-loop
          await upsertDealerStock({
            dealerId: dealer._id,
            sku: item.sku,
            name: item.product,
            qtyDelta: item.quantity,
            reference: returnNo,
            referenceType: 'SaleReturn',
            referenceId: doc._id,
            performedBy: req.user.name || req.user.email,
            performedByUser: req.user._id,
            session,
          });
        }
      }
    });

    return sendCreated(res, { data: mapSaleReturn(doc.toObject()), message: 'Sale return recorded' });
  } finally {
    await session.endSession();
  }
});

// ── Void — Admin reverses a sale return (e.g. suspected fraud) ───────────────

export const voidSaleReturn = asyncHandler(async (req, res) => {
  const doc = await SaleReturn.findById(req.params.id);
  if (!doc) return sendError(res, { message: 'Sale return not found', statusCode: 404 });
  if (doc.status === 'VOIDED') return sendError(res, { message: 'Sale return already voided', statusCode: 400 });

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      if (doc.restock) {
        await deductDealerStock({
          dealerId: doc.dealer,
          lineItems: doc.lineItems.map((i) => ({ sku: i.sku, name: i.product, quantity: i.quantity })),
          reference: doc.returnNo,
          referenceType: 'SaleReturn',
          referenceId: doc._id,
          performedBy: req.user.name || req.user.email,
          performedByUser: req.user._id,
          session,
        });
      }

      doc.status = 'VOIDED';
      doc.voidedAt = new Date();
      doc.voidedBy = req.user._id;
      doc.timeline.push({
        title: 'Sale return voided',
        description: req.body.notes || '',
        variant: 'danger',
        by: req.user.name || 'Admin',
      });
      await doc.save({ session });
    });

    return sendSuccess(res, { data: mapSaleReturn(doc.toObject()), message: 'Sale return voided and stock reversed' });
  } catch (err) {
    return sendError(res, { message: err.message || 'Failed to void sale return', statusCode: err.statusCode || 400 });
  } finally {
    await session.endSession();
  }
});
