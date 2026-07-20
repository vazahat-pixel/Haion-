import Manufacture from '../models/Manufacture.model.js';
import Product from '../models/Product.model.js';
import Inventory from '../models/Inventory.model.js';
import Warehouse from '../models/Warehouse.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess, sendCreated, sendError, sendPaginated } from '../utils/apiResponse.js';
import { parsePagination, buildSearchFilter } from '../utils/pagination.util.js';
import { toPublicDoc } from '../utils/serialize.util.js';
import { nextSequence } from '../utils/sequence.util.js';
import { upsertWarehouseStock, deductWarehouseStock } from '../services/inventory.service.js';

function mapManufacture(doc) {
  const d = toPublicDoc(doc);
  return {
    ...d,
    warehouseId: String(d.warehouse?._id || d.warehouse || ''),
    warehouse: d.warehouse?.code || d.warehouse?.name || d.warehouse,
    warehouseName: d.warehouse?.name || d.warehouse?.code || '',
    finishedProductId: String(d.finishedProduct?._id || d.finishedProduct || ''),
    componentCount: d.components?.length || 0,
    manufacturedAt: d.manufacturedAt
      ? new Date(d.manufacturedAt).toISOString()
      : null,
  };
}

export const listManufactures = asyncHandler(async (req, res) => {
  const { page, perPage, skip, sort } = parsePagination(req.query);
  const filter = {
    ...buildSearchFilter(req.query.search, ['manufactureNo', 'finishedSku', 'finishedName']),
  };
  if (req.query.status) filter.status = req.query.status;
  if (req.query.warehouseId) filter.warehouse = req.query.warehouseId;

  const [rows, total] = await Promise.all([
    Manufacture.find(filter)
      .populate('warehouse', 'code name')
      .populate('finishedProduct', 'name sku productKind')
      .sort(sort)
      .skip(skip)
      .limit(perPage)
      .lean(),
    Manufacture.countDocuments(filter),
  ]);

  return sendPaginated(res, { data: rows.map(mapManufacture), total, page, perPage });
});

export const getManufacture = asyncHandler(async (req, res) => {
  const doc = await Manufacture.findById(req.params.id)
    .populate('warehouse', 'code name city')
    .populate('finishedProduct', 'name sku productKind hsnCode gstRate category')
    .lean();
  if (!doc) return sendError(res, { message: 'Manufacture record not found', statusCode: 404 });
  return sendSuccess(res, { data: mapManufacture(doc) });
});

/**
 * Available purchased / raw materials in a warehouse (qty > 0).
 * Used by the Make Product UI so admin sees everything that was purchased.
 */
export const listAvailableMaterials = asyncHandler(async (req, res) => {
  const warehouseId = req.query.warehouseId;
  if (!warehouseId) {
    return sendError(res, { message: 'warehouseId is required', statusCode: 400 });
  }

  const warehouse = await Warehouse.findById(warehouseId).lean();
  if (!warehouse) return sendError(res, { message: 'Warehouse not found', statusCode: 404 });

  const items = await Inventory.find({
    warehouse: warehouseId,
    isDeleted: false,
    quantity: { $gt: 0 },
  })
    .sort({ name: 1 })
    .lean();

  const skus = items.map((i) => i.sku);
  const products = await Product.find({ sku: { $in: skus } })
    .select('sku productKind name hsnCode gstRate category')
    .lean();
  const productBySku = Object.fromEntries(products.map((p) => [p.sku, p]));

  // Prefer RAW materials; still show FINISHED so admin can remanufacture/kit if needed,
  // but exclude the selected finished SKU on the client. Here we surface purchased stock
  // (anything currently in warehouse with qty).
  const data = items.map((item) => {
    const product = productBySku[item.sku];
    return {
      id: String(item._id),
      sku: item.sku,
      name: item.name,
      category: item.category,
      hsn: item.hsn || product?.hsnCode || '',
      quantity: item.quantity,
      unitPrice: item.unitPrice || 0,
      productId: product ? String(product._id) : null,
      productKind: product?.productKind || 'RAW',
      gstRate: product?.gstRate ?? 18,
    };
  });

  return sendSuccess(res, { data });
});

export const createManufacture = asyncHandler(async (req, res) => {
  const warehouse = await Warehouse.findById(req.body.warehouseId);
  if (!warehouse) return sendError(res, { message: 'Warehouse not found', statusCode: 404 });

  const qtyProduced = Number(req.body.qtyProduced);
  if (!qtyProduced || qtyProduced < 1) {
    return sendError(res, { message: 'Produce at least 1 unit', statusCode: 400 });
  }

  // Resolve or create finished product
  let finishedProduct;
  if (req.body.finishedProductId) {
    finishedProduct = await Product.findById(req.body.finishedProductId);
    if (!finishedProduct) {
      return sendError(res, { message: 'Finished product not found', statusCode: 404 });
    }
    if (finishedProduct.productKind !== 'FINISHED') {
      finishedProduct.productKind = 'FINISHED';
      await finishedProduct.save();
    }
  } else if (req.body.newFinishedProduct) {
    const np = req.body.newFinishedProduct;
    const sku = String(np.sku).toUpperCase().trim();
    const existing = await Product.findOne({ sku });
    if (existing) {
      return sendError(res, { message: `SKU ${sku} already exists — select it as finished product instead`, statusCode: 400 });
    }
    finishedProduct = await Product.create({
      name: np.name.trim(),
      sku,
      category: np.category || 'Finished Goods',
      brand: np.brand || '',
      hsnCode: np.hsnCode || '8703',
      gstRate: np.gstRate ?? 18,
      unitOfMeasure: np.unitOfMeasure || 'Piece',
      productKind: 'FINISHED',
      status: 'ACTIVE',
      createdBy: req.user._id,
    });
  } else {
    return sendError(res, { message: 'Finished product is required', statusCode: 400 });
  }

  // Build component lines and validate stock
  const components = [];
  const deductLines = [];
  let totalCost = 0;

  for (const raw of req.body.components) {
    const sku = String(raw.sku).toUpperCase().trim();
    if (sku === finishedProduct.sku) {
      return sendError(res, { message: 'Finished product cannot consume itself as a material', statusCode: 400 });
    }

    const qtyPerUnit = Number(raw.qtyPerUnit);
    if (!qtyPerUnit || qtyPerUnit <= 0) {
      return sendError(res, { message: `Invalid qty for material ${sku}`, statusCode: 400 });
    }

    const totalConsumed = Math.round(qtyPerUnit * qtyProduced * 1000) / 1000;
    const inv = await Inventory.findOne({
      sku,
      warehouse: warehouse._id,
      isDeleted: false,
    });
    if (!inv || inv.quantity < totalConsumed) {
      return sendError(res, {
        message: `Insufficient stock for ${sku} — need ${totalConsumed}, available ${inv?.quantity ?? 0}`,
        statusCode: 400,
      });
    }

    const product = raw.productId
      ? await Product.findById(raw.productId).lean()
      : await Product.findOne({ sku }).lean();

    components.push({
      productId: product?._id,
      sku,
      name: raw.name || product?.name || inv.name,
      qtyPerUnit,
      totalConsumed,
    });
    deductLines.push({
      sku,
      name: raw.name || product?.name || inv.name,
      quantity: totalConsumed,
    });
    totalCost += (inv.unitPrice || 0) * totalConsumed;
  }

  const manufactureNo = nextSequence('MFG');
  const unitCost = Math.round((totalCost / qtyProduced) * 100) / 100;
  totalCost = Math.round(totalCost * 100) / 100;

  // Admin decides finished-good selling price; material cost is only a reference
  const sellingPrice = Math.round(Number(req.body.sellingPrice ?? 0) * 100) / 100;
  if (sellingPrice < 0) {
    return sendError(res, { message: 'Selling price cannot be negative', statusCode: 400 });
  }

  // Consume raw materials
  await deductWarehouseStock({
    warehouseId: warehouse._id,
    lineItems: deductLines,
    reference: manufactureNo,
    referenceType: 'Manufacture',
    referenceId: undefined,
    performedBy: req.user.name || req.user.email,
    performedByUser: req.user._id,
    action: 'MANUFACTURE_OUT',
  });

  // Add finished goods — inventory unitPrice = admin selling price (not material cost)
  await upsertWarehouseStock({
    warehouseId: warehouse._id,
    sku: finishedProduct.sku,
    name: finishedProduct.name,
    category: finishedProduct.category || 'Finished Goods',
    hsn: finishedProduct.hsnCode || '',
    qtyDelta: qtyProduced,
    unitPrice: sellingPrice,
    reference: manufactureNo,
    referenceType: 'Manufacture',
    performedBy: req.user.name || req.user.email,
    performedByUser: req.user._id,
  });

  const manufacture = await Manufacture.create({
    manufactureNo,
    warehouse: warehouse._id,
    finishedProduct: finishedProduct._id,
    finishedSku: finishedProduct.sku,
    finishedName: finishedProduct.name,
    finishedHsn: finishedProduct.hsnCode || '',
    qtyProduced,
    components,
    unitCost,
    totalCost,
    sellingPrice,
    status: 'COMPLETED',
    notes: req.body.notes || '',
    manufacturedAt: new Date(),
    manufacturedBy: req.user._id,
    createdBy: req.user._id,
  });

  try {
    const StockMovement = (await import('../models/StockMovement.model.js')).default;
    await StockMovement.updateMany(
      { reference: manufactureNo, referenceType: 'Manufacture' },
      { $set: { referenceId: manufacture._id } }
    );
  } catch {
    // non-fatal
  }

  await manufacture.populate([
    { path: 'warehouse', select: 'code name' },
    { path: 'finishedProduct', select: 'name sku productKind' },
  ]);

  return sendCreated(res, {
    data: mapManufacture(manufacture.toObject()),
    message: `${qtyProduced} × ${finishedProduct.name} manufactured — moved to Finished Goods`,
  });
});
