import Inventory from '../models/Inventory.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess, sendCreated, sendError, sendPaginated } from '../utils/apiResponse.js';
import { parsePagination, buildSearchFilter } from '../utils/pagination.util.js';
import { mapInventory } from '../utils/docMapper.util.js';
export const listInventory = asyncHandler(async (req, res) => {
  const { page, perPage, skip, sort } = parsePagination(req.query);
  const filter = {
    ...buildSearchFilter(req.query.search, ['name', 'sku', 'category']),
    isDeleted: false,
  };
  if (req.query.status) filter.status = req.query.status;
  if (req.query.category) filter.category = req.query.category;
  if (req.user.role === 'WAREHOUSE_MANAGER' && req.user.warehouseId) {
    filter.warehouse = req.user.warehouseId;
  } else if (req.query.warehouseId) {
    filter.warehouse = req.query.warehouseId;
  }

  const [rows, total] = await Promise.all([
    Inventory.find(filter).populate('warehouse', 'code name').sort(sort).skip(skip).limit(perPage).lean(),
    Inventory.countDocuments(filter),
  ]);

  const data = rows.map((r) => mapInventory({
    ...r,
    warehouseCode: r.warehouse?.code,
    warehouse: r.warehouse,
  }));
  return sendPaginated(res, { data, total, page, perPage });
});

export const getInventory = asyncHandler(async (req, res) => {
  const item = await Inventory.findOne({ _id: req.params.id, isDeleted: false })
    .populate('warehouse', 'code name').lean();
  if (!item) return sendError(res, { message: 'Inventory item not found', statusCode: 404 });
  return sendSuccess(res, {
    data: mapInventory({ ...item, warehouseCode: item.warehouse?.code }),
  });
});

export const createInventory = asyncHandler(async (req, res) => {
  const item = await Inventory.create({ ...req.body, warehouse: req.body.warehouseId || req.body.warehouse });
  await item.populate('warehouse', 'code');
  return sendCreated(res, {
    data: mapInventory({ ...item.toObject(), warehouseCode: item.warehouse?.code }),
    message: 'Inventory item created',
  });
});

export const updateInventory = asyncHandler(async (req, res) => {
  const item = await Inventory.findOneAndUpdate(
    { _id: req.params.id, isDeleted: false },
    req.body,
    { new: true, runValidators: true }
  ).populate('warehouse', 'code');
  if (!item) return sendError(res, { message: 'Inventory item not found', statusCode: 404 });
  return sendSuccess(res, {
    data: mapInventory({ ...item.toObject(), warehouseCode: item.warehouse?.code }),
    message: 'Inventory updated',
  });
});

export const deleteInventory = asyncHandler(async (req, res) => {
  const item = await Inventory.findOneAndUpdate(
    { _id: req.params.id, isDeleted: false },
    { isDeleted: true, status: 'DISCONTINUED' },
    { new: true }
  );
  if (!item) return sendError(res, { message: 'Inventory item not found', statusCode: 404 });
  return sendSuccess(res, { message: 'Inventory item deleted' });
});

export const lowStock = asyncHandler(async (req, res) => {
  const filter = { isDeleted: false, status: { $in: ['LOW_STOCK', 'OUT_OF_STOCK'] } };
  if (req.user.warehouseId && req.user.role === 'WAREHOUSE_MANAGER') {
    filter.warehouse = req.user.warehouseId;
  }
  const items = await Inventory.find(filter).populate('warehouse', 'code').limit(50).lean();
  return sendSuccess(res, {
    data: items.map((r) => mapInventory({ ...r, warehouseCode: r.warehouse?.code })),
  });
});

export const inventoryCategories = asyncHandler(async (_req, res) => {
  const categories = await Inventory.distinct('category', { isDeleted: false });
  return sendSuccess(res, { data: categories.sort() });
});
