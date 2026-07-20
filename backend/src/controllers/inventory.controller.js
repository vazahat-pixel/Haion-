import Inventory from '../models/Inventory.model.js';
import StockMovement from '../models/StockMovement.model.js';
import Product from '../models/Product.model.js';
import { transferWarehouseStock } from '../services/inventory.service.js';
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

  // Filter by product kind (RAW materials vs FINISHED goods)
  if (req.query.stockType || req.query.productKind) {
    const kind = (req.query.stockType || req.query.productKind).toUpperCase();
    if (kind === 'FINISHED' || kind === 'RAW') {
      const products = await Product.find({ productKind: kind }).select('sku').lean();
      const skus = products.map((p) => p.sku);
      filter.sku = { ...(filter.sku || {}), $in: skus.length ? skus : ['__none__'] };
    }
  }

  const [rows, total] = await Promise.all([
    Inventory.find(filter).populate('warehouse', 'code name').sort(sort).skip(skip).limit(perPage).lean(),
    Inventory.countDocuments(filter),
  ]);

  const skuList = rows.map((r) => r.sku);
  const productKinds = await Product.find({ sku: { $in: skuList } }).select('sku productKind').lean();
  const kindBySku = Object.fromEntries(productKinds.map((p) => [p.sku, p.productKind || 'RAW']));

  const data = rows.map((r) => mapInventory({
    ...r,
    warehouseCode: r.warehouse?.code,
    warehouse: r.warehouse,
    productKind: kindBySku[r.sku] || 'RAW',
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

export const createInventory = asyncHandler(async (_req, res) => {
  return sendError(res, {
    message: 'Inventory items cannot be added manually. Create a purchase and mark it as received — stock will be updated automatically.',
    statusCode: 400,
  });
});

export const updateInventory = asyncHandler(async (req, res) => {
  // SECURITY: Whitelist allowed update fields — prevents mass assignment and
  // MongoDB operator injection (e.g. { "$set": { quantity: 99999 } } in req.body)
  const ALLOWED_FIELDS = ['minStock', 'maxStock', 'notes', 'location', 'status', 'reorderPoint'];
  const safeUpdate = {};
  for (const key of ALLOWED_FIELDS) {
    if (req.body[key] !== undefined) {
      safeUpdate[key] = req.body[key];
    }
  }
  if (Object.keys(safeUpdate).length === 0) {
    return sendError(res, { message: 'No valid fields provided for update', statusCode: 400 });
  }

  const item = await Inventory.findOneAndUpdate(
    { _id: req.params.id, isDeleted: false },
    { $set: safeUpdate },   // Always use $set explicitly — never spread req.body
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

export const listStockMovements = asyncHandler(async (req, res) => {
  const { page, perPage, skip, sort } = parsePagination(req.query);
  const filter = {};
  if (req.query.sku) filter.sku = req.query.sku.toUpperCase();
  if (req.query.warehouse) filter.warehouse = req.query.warehouse;
  if (req.query.dealer) filter.dealer = req.query.dealer;
  if (req.query.action) filter.action = req.query.action.toUpperCase();
  if (req.query.from || req.query.to) {
    filter.createdAt = {};
    if (req.query.from) filter.createdAt.$gte = new Date(req.query.from);
    if (req.query.to) filter.createdAt.$lte = new Date(req.query.to);
  }
  const [rows, total] = await Promise.all([
    StockMovement.find(filter).sort(sort).skip(skip).limit(perPage).lean(),
    StockMovement.countDocuments(filter),
  ]);
  return sendPaginated(res, { data: rows, total, page, perPage });
});

export const getInventoryMovements = asyncHandler(async (req, res) => {
  const item = await Inventory.findById(req.params.id).lean();
  if (!item) return sendError(res, { message: 'Inventory item not found', statusCode: 404 });
  const { page, perPage, skip, sort } = parsePagination(req.query);
  const filter = { sku: item.sku };
  if (item.warehouse) filter.warehouse = item.warehouse;
  const [rows, total] = await Promise.all([
    StockMovement.find(filter).sort(sort).skip(skip).limit(perPage).lean(),
    StockMovement.countDocuments(filter),
  ]);
  return sendPaginated(res, { data: rows, total, page, perPage });
});

export const transferStock = asyncHandler(async (req, res) => {
  const { fromWarehouseId, toWarehouseId, sku, quantity, notes } = req.body;
  if (!fromWarehouseId || !toWarehouseId || !sku) {
    return sendError(res, { message: 'fromWarehouseId, toWarehouseId, and sku are required', statusCode: 400 });
  }
  if (req.user.role === 'WAREHOUSE_MANAGER' && req.user.warehouseId
    && String(req.user.warehouseId) !== String(fromWarehouseId)) {
    return sendError(res, { message: 'You can only transfer from your assigned warehouse', statusCode: 403 });
  }

  try {
    const result = await transferWarehouseStock({
      fromWarehouseId,
      toWarehouseId,
      sku,
      quantity: Number(quantity),
      performedBy: req.user?.email,
      performedByUser: req.user?._id,
      notes,
    });
    return sendSuccess(res, {
      data: {
        reference: result.reference,
        sku: result.fromItem.sku,
        quantity: Number(quantity),
        fromQty: result.fromItem.quantity,
        toQty: result.toItem.quantity,
      },
      message: 'Stock transferred successfully',
    });
  } catch (err) {
    return sendError(res, { message: err.message, statusCode: err.statusCode || 400 });
  }
});

