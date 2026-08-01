import ServiceCenter from '../models/ServiceCenter.model.js';
import ServiceCenterInventory from '../models/ServiceCenterInventory.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess, sendCreated, sendError, sendPaginated } from '../utils/apiResponse.js';
import { parsePagination, buildSearchFilter } from '../utils/pagination.util.js';
import { toPublicDoc } from '../utils/serialize.util.js';
import { nextSequence } from '../utils/sequence.util.js';

function mapDoc(doc) {
  return toPublicDoc(doc);
}

export const listServiceCenters = asyncHandler(async (req, res) => {
  const { page, perPage, skip, sort } = parsePagination(req.query);
  const filter = { ...buildSearchFilter(req.query.search, ['code', 'name', 'city', 'state']) };
  if (req.query.status) filter.status = req.query.status;

  const [rows, total] = await Promise.all([
    ServiceCenter.find(filter).sort(sort).skip(skip).limit(perPage).lean(),
    ServiceCenter.countDocuments(filter),
  ]);
  return sendPaginated(res, { data: rows.map(mapDoc), total, page, perPage });
});

export const createServiceCenter = asyncHandler(async (req, res) => {
  const code = req.body.code || nextSequence('SC');
  const doc = await ServiceCenter.create({
    code,
    name: req.body.name,
    city: req.body.city,
    state: req.body.state,
    address: req.body.address,
    phone: req.body.phone,
    email: req.body.email,
    status: req.body.status || 'ACTIVE',
  });
  return sendCreated(res, { data: mapDoc(doc.toObject()), message: 'Service Center created' });
});

export const getServiceCenter = asyncHandler(async (req, res) => {
  const doc = await ServiceCenter.findById(req.params.id).lean();
  if (!doc) return sendError(res, { message: 'Service Center not found', statusCode: 404 });
  return sendSuccess(res, { data: mapDoc(doc) });
});

export const updateServiceCenter = asyncHandler(async (req, res) => {
  const doc = await ServiceCenter.findById(req.params.id);
  if (!doc) return sendError(res, { message: 'Service Center not found', statusCode: 404 });
  const allowed = ['name', 'city', 'state', 'address', 'phone', 'email', 'status', 'inchargeUser'];
  allowed.forEach((k) => {
    if (req.body[k] !== undefined) doc[k] = req.body[k];
  });
  await doc.save();
  return sendSuccess(res, { data: mapDoc(doc.toObject()), message: 'Service Center updated' });
});

export const getServiceCenterInventory = asyncHandler(async (req, res) => {
  const { serviceCenterId } = req.params;
  const { page, perPage, skip, sort } = parsePagination(req.query);
  const filter = { serviceCenter: serviceCenterId, ...buildSearchFilter(req.query.search, ['sku', 'name', 'category']) };
  if (req.query.status) filter.status = req.query.status;

  const [rows, total] = await Promise.all([
    ServiceCenterInventory.find(filter).sort(sort).skip(skip).limit(perPage).lean(),
    ServiceCenterInventory.countDocuments(filter),
  ]);
  return sendPaginated(res, { data: rows.map(mapDoc), total, page, perPage });
});

export const upsertInventoryItem = asyncHandler(async (req, res) => {
  const { serviceCenterId } = req.params;
  const { sku, name, category, availableStock, reorderLevel, unitPrice } = req.body;

  if (!sku || !name) {
    return sendError(res, { message: 'SKU and name are required', statusCode: 400 });
  }

  let item = await ServiceCenterInventory.findOne({ serviceCenter: serviceCenterId, sku: sku.toUpperCase() });
  if (item) {
    if (availableStock !== undefined) item.availableStock = availableStock;
    if (name) item.name = name;
    if (category) item.category = category;
    if (reorderLevel !== undefined) item.reorderLevel = reorderLevel;
    if (unitPrice !== undefined) item.unitPrice = unitPrice;
    await item.save();
  } else {
    item = await ServiceCenterInventory.create({
      serviceCenter: serviceCenterId,
      sku: sku.toUpperCase(),
      name,
      category: category || 'Spare Parts',
      availableStock: availableStock || 0,
      reorderLevel: reorderLevel || 5,
      unitPrice: unitPrice || 0,
    });
  }

  return sendSuccess(res, { data: mapDoc(item.toObject()), message: 'Inventory item updated' });
});
