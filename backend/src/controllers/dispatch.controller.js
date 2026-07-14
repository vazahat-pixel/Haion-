import Dispatch from '../models/Dispatch.model.js';
import Dealer from '../models/Dealer.model.js';
import mongoose from 'mongoose';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess, sendCreated, sendError, sendPaginated } from '../utils/apiResponse.js';
import { parsePagination, buildSearchFilter } from '../utils/pagination.util.js';
import { mapDispatch } from '../utils/docMapper.util.js';
import { nextSequence } from '../utils/sequence.util.js';
import { deductWarehouseStock, upsertDealerStock } from '../services/inventory.service.js';

const STATUS_FLOW = {
  CREATED: ['PICKED', 'CANCELLED'],
  PICKED: ['PACKED', 'CANCELLED'],
  PACKED: ['DISPATCHED', 'CANCELLED'],
  DISPATCHED: ['IN_TRANSIT'],
  IN_TRANSIT: ['DELIVERED'],
};

export const listDispatch = asyncHandler(async (req, res) => {
  const { page, perPage, skip, sort } = parsePagination(req.query);
  const filter = { ...buildSearchFilter(req.query.search, ['dispatchNo']) };
  if (req.query.status) filter.status = req.query.status;
  if (req.query.warehouseId) filter.warehouse = req.query.warehouseId;
  if (req.query.dealerId) filter.dealer = req.query.dealerId;
  if (req.user.role === 'WAREHOUSE_MANAGER' && req.user.warehouseId) {
    filter.warehouse = req.user.warehouseId;
  }
  if (['DEALER_ADMIN', 'DEALER_SALES'].includes(req.user.role) && req.user.dealerId) {
    filter.dealer = req.user.dealerId;
  }

  const [rows, total] = await Promise.all([
    Dispatch.find(filter).populate('dealer', 'name code').populate('warehouse', 'code').sort(sort).skip(skip).limit(perPage).lean(),
    Dispatch.countDocuments(filter),
  ]);
  return sendPaginated(res, { data: rows.map(mapDispatch), total, page, perPage });
});

export const getDispatch = asyncHandler(async (req, res) => {
  const doc = await Dispatch.findById(req.params.id).populate('dealer', 'name').populate('warehouse', 'code').lean();
  if (!doc) return sendError(res, { message: 'Dispatch not found', statusCode: 404 });
  return sendSuccess(res, { data: mapDispatch(doc) });
});

export const getDispatchTracking = asyncHandler(async (req, res) => {
  const doc = await Dispatch.findById(req.params.id).select('timeline').lean();
  if (!doc) return sendError(res, { message: 'Dispatch not found', statusCode: 404 });
  const events = (doc.timeline || []).map((e) => ({
    id: String(e._id),
    title: e.title,
    description: e.description,
    timestamp: e.timestamp,
    variant: e.variant,
  }));
  return sendSuccess(res, { data: events });
});

export const createDispatch = asyncHandler(async (req, res) => {
  const dispatchNo = req.body.dispatchNo || nextSequence('DSP');
  const dispatch = await Dispatch.create({
    ...req.body,
    dispatchNo,
    dealer: req.body.dealerId || req.body.dealer,
    warehouse: req.body.warehouseId || req.body.warehouse,
    timeline: [{ title: 'Dispatch created', variant: 'success' }],
  });
  await dispatch.populate(['dealer', 'warehouse']);
  return sendCreated(res, { data: mapDispatch(dispatch.toObject()), message: 'Dispatch created' });
});

export const updateDispatchStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const dispatch = await Dispatch.findById(req.params.id);
  if (!dispatch) return sendError(res, { message: 'Dispatch not found', statusCode: 404 });

  const allowed = STATUS_FLOW[dispatch.status] || [];
  if (!allowed.includes(status)) {
    return sendError(res, { message: `Cannot transition from ${dispatch.status} to ${status}`, statusCode: 400 });
  }

  if (status === 'DISPATCHED') {
    await deductWarehouseStock({ warehouseId: dispatch.warehouse, lineItems: dispatch.lineItems });
  }
  // PRD: dealer stock increases only on GRN confirm, not when admin marks delivered
  if (status === 'DELIVERED' && !dispatch.dealerConfirmedAt) {
    dispatch.timeline.push({
      title: 'Delivered — awaiting dealer GRN confirmation',
      timestamp: new Date(),
      variant: 'warning',
    });
  }

  dispatch.status = status;
  dispatch.timeline.push({
    title: `Status: ${status.replace(/_/g, ' ')}`,
    timestamp: new Date(),
    variant: status === 'DELIVERED' ? 'success' : 'default',
  });
  await dispatch.save();
  await dispatch.populate(['dealer', 'warehouse']);

  return sendSuccess(res, { data: mapDispatch(dispatch.toObject()), message: 'Dispatch status updated' });
});

export const pendingDispatchCount = asyncHandler(async (_req, res) => {
  const count = await Dispatch.countDocuments({ status: { $in: ['CREATED', 'PICKED', 'PACKED', 'DISPATCHED', 'IN_TRANSIT'] } });
  return sendSuccess(res, { data: { count } });
});

export const confirmDealerGRN = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  try {
    let dispatch;
    await session.withTransaction(async () => {
      dispatch = await Dispatch.findById(req.params.id).session(session);
      if (!dispatch) throw Object.assign(new Error('Dispatch not found'), { statusCode: 404 });
      if (String(dispatch.dealer) !== String(req.user.dealerId)) {
        throw Object.assign(new Error('Access denied'), { statusCode: 403 });
      }
      if (dispatch.status === 'CANCELLED') {
        throw Object.assign(new Error('Cannot confirm GRN for a cancelled dispatch'), { statusCode: 400 });
      }
      if (dispatch.dealerConfirmedAt) {
        throw Object.assign(new Error('GRN already confirmed'), { statusCode: 400 });
      }

      const receivedMap = {};
      for (const item of req.body.receivedItems || []) {
        if (item.sku) receivedMap[item.sku.toUpperCase()] = Number(item.receivedQty);
      }

      let hasDiscrepancy = false;
      for (const line of dispatch.lineItems) {
        const dispatched = line.quantity;
        const received = receivedMap[line.sku] ?? dispatched;
        if (Number.isNaN(received) || received < 0 || received > dispatched) {
          throw Object.assign(new Error(`Received quantity for ${line.sku} must be between 0 and ${dispatched}`), { statusCode: 400 });
        }
        line.receivedQty = received;
        if (received !== dispatched) hasDiscrepancy = true;
        if (received > 0) {
          await upsertDealerStock({
            dealerId: dispatch.dealer,
            sku: line.sku,
            name: line.name,
            qtyDelta: received,
            reference: dispatch.dispatchNo,
            referenceType: 'Dispatch',
            referenceId: dispatch._id,
            performedBy: req.user.email,
            performedByUser: req.user._id,
            session,
          });
        }
      }

      dispatch.dealerConfirmedAt = new Date();
      if (dispatch.status !== 'DELIVERED') dispatch.status = 'DELIVERED';
      dispatch.timeline.push({
        title: hasDiscrepancy ? 'GRN confirmed with quantity discrepancy' : 'GRN confirmed by dealer — stock updated',
        description: hasDiscrepancy ? 'Received quantities differ from dispatched' : undefined,
        variant: hasDiscrepancy ? 'warning' : 'success',
        timestamp: new Date(),
      });
      await dispatch.save({ session });
    });

    await dispatch.populate(['dealer', 'warehouse']);
    const hasDiscrepancy = dispatch.lineItems.some((line) => Number(line.receivedQty ?? line.quantity) !== Number(line.quantity));
    return sendSuccess(res, {
      data: mapDispatch(dispatch.toObject()),
      message: hasDiscrepancy ? 'GRN confirmed with discrepancies recorded' : 'GRN confirmed — dealer stock updated',
    });
  } catch (err) {
    return sendError(res, { message: err.message, statusCode: err.statusCode || 400 });
  } finally {
    await session.endSession();
  }
});
