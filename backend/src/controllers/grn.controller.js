import GRN from '../models/GRN.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess, sendCreated, sendError, sendPaginated } from '../utils/apiResponse.js';
import { parsePagination, buildSearchFilter } from '../utils/pagination.util.js';
import { mapGRN } from '../utils/docMapper.util.js';
import { nextSequence } from '../utils/sequence.util.js';
import { upsertWarehouseStock } from '../services/inventory.service.js';

export const listGRN = asyncHandler(async (req, res) => {
  const { page, perPage, skip, sort } = parsePagination(req.query);
  const filter = { ...buildSearchFilter(req.query.search, ['grnNo', 'supplier']) };
  if (req.query.status) filter.status = req.query.status;
  if (req.query.warehouseId) filter.warehouse = req.query.warehouseId;
  if (req.user.role === 'WAREHOUSE_MANAGER' && req.user.warehouseId) {
    filter.warehouse = req.user.warehouseId;
  }

  const [rows, total] = await Promise.all([
    GRN.find(filter).populate('warehouse', 'code name').sort(sort).skip(skip).limit(perPage).lean(),
    GRN.countDocuments(filter),
  ]);
  const data = rows.map((r) => mapGRN({ ...r, warehouse: r.warehouse }));
  return sendPaginated(res, { data, total, page, perPage });
});

export const getGRN = asyncHandler(async (req, res) => {
  const grn = await GRN.findById(req.params.id).populate('warehouse', 'code name').lean();
  if (!grn) return sendError(res, { message: 'GRN not found', statusCode: 404 });
  return sendSuccess(res, { data: mapGRN(grn) });
});

export const createGRN = asyncHandler(async (req, res) => {
  const grnNo = req.body.grnNo || nextSequence('GRN');
  const grn = await GRN.create({
    ...req.body,
    grnNo,
    warehouse: req.body.warehouseId || req.body.warehouse,
    status: req.body.status || 'PENDING_VERIFICATION',
    timeline: undefined,
  });
  await grn.populate('warehouse', 'code');
  return sendCreated(res, { data: mapGRN(grn.toObject()), message: 'GRN created' });
});

export const verifyGRN = asyncHandler(async (req, res) => {
  const grn = await GRN.findById(req.params.id);
  if (!grn) return sendError(res, { message: 'GRN not found', statusCode: 404 });
  if (grn.status === 'VERIFIED') {
    return sendError(res, { message: 'GRN already verified', statusCode: 400 });
  }

  for (const line of grn.lineItems) {
    await upsertWarehouseStock({
      warehouseId: grn.warehouse,
      sku: line.sku,
      name: line.name,
      qtyDelta: line.receivedQty || line.expectedQty,
    });
  }

  grn.status = 'VERIFIED';
  grn.verifiedAt = new Date();
  grn.verifiedBy = req.user._id;
  await grn.save();
  await grn.populate('warehouse', 'code');

  return sendSuccess(res, { data: mapGRN(grn.toObject()), message: 'GRN verified — stock updated' });
});

export const rejectGRN = asyncHandler(async (req, res) => {
  const grn = await GRN.findByIdAndUpdate(
    req.params.id,
    { status: 'REJECTED', rejectReason: req.body.reason || 'Rejected' },
    { new: true }
  ).populate('warehouse', 'code');
  if (!grn) return sendError(res, { message: 'GRN not found', statusCode: 404 });
  return sendSuccess(res, { data: mapGRN(grn.toObject()), message: 'GRN rejected' });
});
