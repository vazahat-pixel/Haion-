import SpareRequest from '../models/SpareRequest.model.js';
import Return from '../models/Return.model.js';
import mongoose from 'mongoose';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess, sendCreated, sendError, sendPaginated } from '../utils/apiResponse.js';
import { parsePagination, buildSearchFilter } from '../utils/pagination.util.js';
import { toPublicDoc } from '../utils/serialize.util.js';
import { nextSequence } from '../utils/sequence.util.js';
import { deductWarehouseStock } from '../services/inventory.service.js';
import { logAudit } from '../services/audit.service.js';
import StockMovement from '../models/StockMovement.model.js';
import Inventory from '../models/Inventory.model.js';

function mapSpare(doc) {
  return toPublicDoc(doc);
}

async function markOverdueSpares() {
  const cutoff = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
  await SpareRequest.updateMany(
    {
      status: 'DISPATCHED',
      dispatchedAt: { $lte: cutoff },
      receivedAt: null,
      overdue: { $ne: true },
    },
    { $set: { overdue: true, overdueAt: new Date() } }
  );
}

export const listSpares = asyncHandler(async (req, res) => {
  await markOverdueSpares();
  const { page, perPage, skip, sort } = parsePagination(req.query);
  const filter = { ...buildSearchFilter(req.query.search, ['requestNo', 'partName', 'requestedBy']) };
  if (req.query.status) filter.status = req.query.status;
  if (req.query.overdue === 'true') filter.overdue = true;

  const [rows, total] = await Promise.all([
    SpareRequest.find(filter).sort(sort).skip(skip).limit(perPage).lean(),
    SpareRequest.countDocuments(filter),
  ]);
  return sendPaginated(res, { data: rows.map(mapSpare), total, page, perPage });
});

export const getSpare = asyncHandler(async (req, res) => {
  const doc = await SpareRequest.findById(req.params.id).lean();
  if (!doc) return sendError(res, { message: 'Spare request not found', statusCode: 404 });
  return sendSuccess(res, { data: mapSpare(doc) });
});

export const checkAvailability = asyncHandler(async (req, res) => {
  const sku = req.params.id;
  const item = await Inventory.findOne({ sku: sku.toUpperCase(), isDeleted: false }).lean();
  return sendSuccess(res, {
    data: {
      available: item ? item.quantity > 0 : false,
      quantity: item?.quantity || 0,
      sku,
      message: item ? `${item.quantity} units in stock` : 'SKU not found in inventory',
    },
  });
});

export const createSpareRequest = asyncHandler(async (req, res) => {
  const requestNo = req.body.requestNo || nextSequence('SPR');
  const doc = await SpareRequest.create({
    requestNo,
    partName: req.body.partName,
    sku: req.body.sku,
    quantity: req.body.quantity,
    requestedBy: req.body.requestedBy || req.user?.firstName || 'Service Center',
    requestedUser: req.user?._id,
    complaint: req.body.complaintId || req.body.complaint,
    serviceRequest: req.body.serviceRequestId || req.body.serviceRequest,
    notes: req.body.notes,
    status: 'PENDING',
    timeline: [{ title: 'Spare request submitted', variant: 'info', at: new Date(), by: req.user?.email }],
  });
  return sendCreated(res, { data: mapSpare(doc.toObject()), message: 'Spare request submitted' });
});

export const approveSpare = asyncHandler(async (req, res) => {
  const doc = await SpareRequest.findById(req.params.id);
  if (!doc) return sendError(res, { message: 'Spare request not found', statusCode: 404 });
  if (doc.status !== 'PENDING') {
    return sendError(res, { message: 'Only pending requests can be approved', statusCode: 400 });
  }
  doc.status = 'APPROVED';
  doc.approvedBy = req.user?.email || req.user?.firstName;
  doc.approvedAt = new Date();
  doc.timeline.push({ title: 'Request approved', description: req.body.notes, variant: 'success', at: new Date(), by: req.user?.email });
  await doc.save();

  await logAudit({ action: 'APPROVE', user: req.user?.email, userId: req.user?._id, module: 'SpareRequests', ip: req.ip, resourceId: doc.requestNo });

  return sendSuccess(res, { data: mapSpare(doc.toObject()), message: 'Spare request approved' });
});

export const rejectSpare = asyncHandler(async (req, res) => {
  const doc = await SpareRequest.findById(req.params.id);
  if (!doc) return sendError(res, { message: 'Spare request not found', statusCode: 404 });
  if (!['PENDING', 'APPROVED'].includes(doc.status)) {
    return sendError(res, { message: 'Cannot reject at this stage', statusCode: 400 });
  }
  doc.status = 'REJECTED';
  doc.rejectionReason = req.body.reason || 'Rejected by administrator';
  doc.timeline.push({ title: 'Request rejected', description: doc.rejectionReason, variant: 'danger', at: new Date(), by: req.user?.email });
  await doc.save();
  return sendSuccess(res, { data: mapSpare(doc.toObject()), message: 'Spare request rejected' });
});

export const dispatchSpare = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  try {
    let doc;
    await session.withTransaction(async () => {
      doc = await SpareRequest.findById(req.params.id).session(session);
      if (!doc) throw Object.assign(new Error('Spare request not found'), { statusCode: 404 });
      if (doc.status !== 'APPROVED') {
        throw Object.assign(new Error('Request must be approved before dispatching'), { statusCode: 400 });
      }

      const warehouseId = req.body.warehouseId || doc.warehouseId;
      if (doc.sku && warehouseId) {
        const invItem = await Inventory.findOne({ sku: doc.sku, warehouse: warehouseId, isDeleted: false }).session(session).lean();
        const qtyBefore = invItem?.quantity ?? 0;

        await deductWarehouseStock({
          warehouseId,
          lineItems: [{ sku: doc.sku, quantity: doc.quantity, name: doc.partName }],
          session,
        });

        await StockMovement.create([{
          sku: doc.sku,
          name: doc.partName,
          action: 'SPARE_DISPATCH',
          qtyBefore,
          qtyDelta: -doc.quantity,
          qtyAfter: qtyBefore - doc.quantity,
          warehouse: warehouseId,
          reference: doc.requestNo,
          referenceId: doc._id,
          referenceType: 'SpareRequest',
          performedBy: req.user?.email,
          performedByUser: req.user?._id,
          notes: `Spare dispatch for request ${doc.requestNo}`,
        }], { session });

        doc.warehouseDeducted = true;
        doc.warehouseId = warehouseId;
      }

      doc.status = 'DISPATCHED';
      doc.dispatchedAt = new Date();
      doc.deliveredTo = req.body.deliveredTo || doc.requestedBy;
      doc.timeline.push({ title: 'Parts dispatched', description: req.body.notes, variant: 'info', at: new Date(), by: req.user?.email });
      await doc.save({ session });

      const existingReturn = await Return.findOne({ spareRequest: doc._id }).session(session).lean();
      if (!existingReturn) {
        await Return.create([{
          returnNo: nextSequence('RET'),
          product: doc.partName,
          serialNo: `DEF-${doc.requestNo}`,
          reason: `Defective return expected for spare dispatch ${doc.requestNo}`,
          status: 'EXPECTED',
          spareRequest: doc._id,
          serviceRequest: doc.serviceRequest,
          returnedBy: doc.deliveredTo || doc.requestedBy,
          overdueAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          timeline: [{
            title: 'Return expected — spare dispatched',
            description: `${doc.quantity} × ${doc.partName}`,
            variant: 'info',
            at: new Date(),
            by: req.user?.email,
          }],
        }], { session });
      }
    });

    return sendSuccess(res, { data: mapSpare(doc.toObject()), message: 'Spare parts dispatched — defective return expected' });
  } catch (err) {
    return sendError(res, { message: err.message, statusCode: err.statusCode || 400 });
  } finally {
    await session.endSession();
  }
});

export const receiveSpare = asyncHandler(async (req, res) => {
  const doc = await SpareRequest.findById(req.params.id);
  if (!doc) return sendError(res, { message: 'Spare request not found', statusCode: 404 });
  if (doc.status !== 'DISPATCHED') {
    return sendError(res, { message: 'Request must be dispatched before marking received', statusCode: 400 });
  }
  doc.status = 'RECEIVED';
  doc.receivedAt = new Date();
  doc.overdue = false;
  doc.timeline.push({ title: 'Parts received', description: req.body.notes, variant: 'success', at: new Date(), by: req.user?.email });
  await doc.save();
  return sendSuccess(res, { data: mapSpare(doc.toObject()), message: 'Spare parts received' });
});

export const completeSpare = asyncHandler(async (req, res) => {
  const doc = await SpareRequest.findById(req.params.id);
  if (!doc) return sendError(res, { message: 'Spare request not found', statusCode: 404 });
  if (!['RECEIVED', 'DISPATCHED'].includes(doc.status)) {
    return sendError(res, { message: 'Cannot complete at this stage', statusCode: 400 });
  }
  doc.status = 'COMPLETED';
  doc.completedAt = new Date();
  doc.timeline.push({ title: 'Request completed', description: req.body.notes, variant: 'success', at: new Date(), by: req.user?.email });
  await doc.save();
  return sendSuccess(res, { data: mapSpare(doc.toObject()), message: 'Spare request completed' });
});

export const getSpareTimeline = asyncHandler(async (req, res) => {
  const doc = await SpareRequest.findById(req.params.id).select('timeline requestNo status').lean();
  if (!doc) return sendError(res, { message: 'Spare request not found', statusCode: 404 });
  return sendSuccess(res, { data: doc.timeline || [] });
});

export const getSpareKpis = asyncHandler(async (_req, res) => {
  await markOverdueSpares();
  const [pending, approved, dispatched, received, completed, overdue] = await Promise.all([
    SpareRequest.countDocuments({ status: 'PENDING' }),
    SpareRequest.countDocuments({ status: 'APPROVED' }),
    SpareRequest.countDocuments({ status: 'DISPATCHED' }),
    SpareRequest.countDocuments({ status: 'RECEIVED' }),
    SpareRequest.countDocuments({ status: 'COMPLETED' }),
    SpareRequest.countDocuments({ overdue: true }),
  ]);
  return sendSuccess(res, {
    data: {
      pending, approved, dispatched, received, completed, overdue,
      total: pending + approved + dispatched + received + completed,
    },
  });
});
