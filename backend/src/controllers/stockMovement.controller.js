import StockMovement from '../models/StockMovement.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess, sendPaginated } from '../utils/apiResponse.js';
import { parsePagination, buildSearchFilter } from '../utils/pagination.util.js';
import { toPublicDoc } from '../utils/serialize.util.js';

function mapMovement(doc) {
  const d = toPublicDoc(doc);
  return {
    ...d,
    movementType: d.action,
    direction: d.qtyDelta >= 0 ? 'IN' : 'OUT',
    quantity: Math.abs(d.qtyDelta),
    timestamp: d.createdAt,
  };
}

export const listStockMovements = asyncHandler(async (req, res) => {
  const { page, perPage, skip, sort } = parsePagination(req.query);
  const filter = { ...buildSearchFilter(req.query.search, ['sku', 'name', 'reference', 'performedBy']) };
  if (req.query.sku) filter.sku = req.query.sku.toUpperCase();
  if (req.query.action) filter.action = req.query.action.toUpperCase();
  if (req.query.warehouseId) filter.warehouse = req.query.warehouseId;
  if (req.query.dealerId) filter.dealer = req.query.dealerId;

  const [rows, total] = await Promise.all([
    StockMovement.find(filter).sort(sort).skip(skip).limit(perPage).lean(),
    StockMovement.countDocuments(filter),
  ]);
  return sendPaginated(res, { data: rows.map(mapMovement), total, page, perPage });
});

export const getSkuHistory = asyncHandler(async (req, res) => {
  const sku = req.params.sku.toUpperCase();
  const rows = await StockMovement.find({ sku }).sort({ createdAt: -1 }).limit(200).lean();
  return sendSuccess(res, { data: rows.map(mapMovement) });
});
