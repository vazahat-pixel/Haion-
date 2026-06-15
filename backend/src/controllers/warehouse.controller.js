import Warehouse from '../models/Warehouse.model.js';
import Inventory from '../models/Inventory.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess, sendError, sendPaginated, sendCreated } from '../utils/apiResponse.js';
import { parsePagination, buildSearchFilter } from '../utils/pagination.util.js';
import { mapWarehouse } from '../utils/docMapper.util.js';
import { toPublicDoc } from '../utils/serialize.util.js';

export const listWarehouses = asyncHandler(async (req, res) => {
  const { page, perPage, skip, sort } = parsePagination(req.query);
  const filter = { ...buildSearchFilter(req.query.search, ['name', 'code', 'city']) };
  if (req.query.status) filter.status = req.query.status;
  if (req.user.role === 'WAREHOUSE_MANAGER' && req.user.warehouseId) {
    filter._id = req.user.warehouseId;
  }

  const [rows, total] = await Promise.all([
    Warehouse.find(filter).sort(sort).skip(skip).limit(perPage).lean(),
    Warehouse.countDocuments(filter),
  ]);

  const stockAgg = await Inventory.aggregate([
    { $match: { isDeleted: false } },
    { $group: { _id: '$warehouse', stockCount: { $sum: '$quantity' } } },
  ]);
  const stockMap = Object.fromEntries(stockAgg.map((s) => [String(s._id), s.stockCount]));

  const data = rows.map((w) => mapWarehouse({ ...w, stockCount: stockMap[w._id] || 0 }));
  return sendPaginated(res, { data, total, page, perPage });
});

export const getWarehouse = asyncHandler(async (req, res) => {
  const warehouse = await Warehouse.findById(req.params.id).lean();
  if (!warehouse) return sendError(res, { message: 'Warehouse not found', statusCode: 404 });
  const stockCount = await Inventory.aggregate([
    { $match: { warehouse: warehouse._id, isDeleted: false } },
    { $group: { _id: null, total: { $sum: '$quantity' } } },
  ]);
  return sendSuccess(res, {
    data: mapWarehouse({ ...warehouse, stockCount: stockCount[0]?.total || 0 }),
  });
});

export const getWarehouseStock = asyncHandler(async (req, res) => {
  const items = await Inventory.find({ warehouse: req.params.id, isDeleted: false }).lean();
  return sendSuccess(res, { data: toPublicDoc(items) });
});

export const createWarehouse = asyncHandler(async (req, res) => {
  const doc = await Warehouse.create(req.body);
  return sendCreated(res, { data: mapWarehouse(doc.toObject()), message: 'Warehouse created' });
});

export const updateWarehouse = asyncHandler(async (req, res) => {
  const warehouse = await Warehouse.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).lean();
  if (!warehouse) return sendError(res, { message: 'Warehouse not found', statusCode: 404 });
  return sendSuccess(res, { data: mapWarehouse(warehouse), message: 'Warehouse updated' });
});
