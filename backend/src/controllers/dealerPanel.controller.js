import DealerInventory from '../models/DealerInventory.model.js';
import Dispatch from '../models/Dispatch.model.js';
import Product from '../models/Product.model.js';
import Inventory from '../models/Inventory.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess, sendError, sendPaginated } from '../utils/apiResponse.js';
import { parsePagination, buildSearchFilter } from '../utils/pagination.util.js';
import DealerTeamMember from '../models/DealerTeamMember.model.js';
import DealerReport from '../models/DealerReport.model.js';
import { mapDealerInventory, mapDispatch, mapDealerTeamMember, mapDealerReport } from '../utils/docMapper.util.js';

function dealerIdFromUser(user) {
  return user.dealerId;
}

const HSN_RATES = { '8501': 18, '8537': 18, '8413': 18, '4010': 12 };

export const getBillingCatalog = asyncHandler(async (req, res) => {
  const dealerId = dealerIdFromUser(req.user);
  if (!dealerId) return sendError(res, { message: 'Dealer context required', statusCode: 403 });

  const stock = await DealerInventory.find({ dealer: dealerId, quantity: { $gt: 0 } }).lean();
  const skus = stock.map((s) => s.sku);
  const [products, prices] = await Promise.all([
    Product.find({ sku: { $in: skus } }).lean(),
    Inventory.find({ sku: { $in: skus }, isDeleted: false }).select('sku unitPrice hsn').lean(),
  ]);
  const productMap = Object.fromEntries(products.map((p) => [p.sku, p]));
  const priceMap = Object.fromEntries(prices.map((p) => [p.sku, p]));

  const catalog = stock.map((item) => {
    const product = productMap[item.sku];
    const price = priceMap[item.sku];
    const hsn = product?.hsnCode || price?.hsn || '';
    return {
      sku: item.sku,
      name: item.name,
      unitPrice: price?.unitPrice || 0,
      hsn,
      gstRate: HSN_RATES[hsn] || 18,
      availableQty: item.quantity,
    };
  });

  return sendSuccess(res, { data: catalog });
});

export const listDealerInventory = asyncHandler(async (req, res) => {  const dealerId = dealerIdFromUser(req.user);
  if (!dealerId) return sendError(res, { message: 'Dealer context required', statusCode: 403 });

  const { page, perPage, skip, sort } = parsePagination(req.query);
  const filter = { dealer: dealerId, ...buildSearchFilter(req.query.search, ['name', 'sku']) };
  const [data, total] = await Promise.all([
    DealerInventory.find(filter).sort(sort).skip(skip).limit(perPage).lean(),
    DealerInventory.countDocuments(filter),
  ]);
  return sendPaginated(res, { data: data.map(mapDealerInventory), total, page, perPage });
});

export const getDealerInventoryItem = asyncHandler(async (req, res) => {
  const dealerId = dealerIdFromUser(req.user);
  const item = await DealerInventory.findOne({ _id: req.params.id, dealer: dealerId }).lean();
  if (!item) return sendError(res, { message: 'Item not found', statusCode: 404 });
  return sendSuccess(res, { data: mapDealerInventory(item) });
});

export const listDealerDispatches = asyncHandler(async (req, res) => {
  const dealerId = dealerIdFromUser(req.user);
  if (!dealerId) return sendError(res, { message: 'Dealer context required', statusCode: 403 });

  const { page, perPage, skip, sort } = parsePagination(req.query);
  const filter = { dealer: dealerId, ...buildSearchFilter(req.query.search, ['dispatchNo']) };
  const [rows, total] = await Promise.all([
    Dispatch.find(filter).populate('warehouse', 'code').sort(sort).skip(skip).limit(perPage).lean(),
    Dispatch.countDocuments(filter),
  ]);
  return sendPaginated(res, { data: rows.map(mapDispatch), total, page, perPage });
});

export const getDealerDispatch = asyncHandler(async (req, res) => {
  const dealerId = dealerIdFromUser(req.user);
  const doc = await Dispatch.findOne({ _id: req.params.id, dealer: dealerId })
    .populate('warehouse', 'code').lean();
  if (!doc) return sendError(res, { message: 'Dispatch not found', statusCode: 404 });
  return sendSuccess(res, { data: mapDispatch(doc) });
});

export const listDealerGRN = asyncHandler(async (req, res) => {
  const dealerId = dealerIdFromUser(req.user);
  if (!dealerId) return sendError(res, { message: 'Dealer context required', statusCode: 403 });

  const { page, perPage, skip, sort } = parsePagination(req.query);
  const filter = {
    dealer: dealerId,
    status: { $in: ['IN_TRANSIT', 'DELIVERED'] },
    ...buildSearchFilter(req.query.search, ['dispatchNo']),
  };
  const [rows, total] = await Promise.all([
    Dispatch.find(filter).populate('warehouse', 'code').sort(sort).skip(skip).limit(perPage).lean(),
    Dispatch.countDocuments(filter),
  ]);
  const data = rows.map((d) => ({
    ...mapDispatch(d),
    grnNo: `DGRN-${d.dispatchNo}`,
    status: d.dealerConfirmedAt ? 'VERIFIED' : 'PENDING_VERIFICATION',
  }));
  return sendPaginated(res, { data, total, page, perPage });
});

export const getDealerGRN = asyncHandler(async (req, res) => {
  const dealerId = dealerIdFromUser(req.user);
  const doc = await Dispatch.findOne({ _id: req.params.id, dealer: dealerId }).populate('warehouse', 'code').lean();
  if (!doc) return sendError(res, { message: 'GRN not found', statusCode: 404 });
  return sendSuccess(res, {
    data: {
      ...mapDispatch(doc),
      grnNo: `DGRN-${doc.dispatchNo}`,
      status: doc.dealerConfirmedAt ? 'VERIFIED' : 'PENDING_VERIFICATION',
      lineItems: doc.lineItems,
    },
  });
});

export const listDealerTeam = asyncHandler(async (req, res) => {
  const dealerId = dealerIdFromUser(req.user);
  if (!dealerId) return sendError(res, { message: 'Dealer context required', statusCode: 403 });

  const { page, perPage, skip, sort } = parsePagination(req.query);
  const filter = { dealer: dealerId, status: 'ACTIVE' };
  const [rows, total] = await Promise.all([
    DealerTeamMember.find(filter).sort(sort).skip(skip).limit(perPage).lean(),
    DealerTeamMember.countDocuments(filter),
  ]);
  return sendPaginated(res, { data: rows.map(mapDealerTeamMember), total, page, perPage });
});

export const listDealerReports = asyncHandler(async (req, res) => {
  const dealerId = dealerIdFromUser(req.user);
  if (!dealerId) return sendError(res, { message: 'Dealer context required', statusCode: 403 });

  const { page, perPage, skip, sort } = parsePagination(req.query);
  const filter = { dealer: dealerId };
  if (req.query.status) filter.status = req.query.status;

  const [rows, total] = await Promise.all([
    DealerReport.find(filter).sort(sort).skip(skip).limit(perPage).lean(),
    DealerReport.countDocuments(filter),
  ]);
  return sendPaginated(res, { data: rows.map(mapDealerReport), total, page, perPage });
});
