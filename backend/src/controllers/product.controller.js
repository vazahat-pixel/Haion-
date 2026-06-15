import Product from '../models/Product.model.js';
import ProductTier from '../models/ProductTier.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess, sendCreated, sendError, sendPaginated } from '../utils/apiResponse.js';
import { parsePagination, buildSearchFilter } from '../utils/pagination.util.js';
import { toPublicDoc } from '../utils/serialize.util.js';

export const listProducts = asyncHandler(async (req, res) => {
  const { page, perPage, skip, sort } = parsePagination(req.query);
  const filter = { ...buildSearchFilter(req.query.search, ['name', 'sku', 'category']) };
  if (req.query.status) filter.status = req.query.status;
  if (req.query.category) filter.category = req.query.category;

  const [data, total] = await Promise.all([
    Product.find(filter).sort(sort).skip(skip).limit(perPage).lean(),
    Product.countDocuments(filter),
  ]);

  return sendPaginated(res, { data: toPublicDoc(data), total, page, perPage });
});

export const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).lean();
  if (!product) return sendError(res, { message: 'Product not found', statusCode: 404 });
  const tiers = await ProductTier.find({ product: product._id }).sort({ basePrice: 1 }).lean();
  return sendSuccess(res, { data: { ...toPublicDoc(product), tiers: toPublicDoc(tiers) } });
});

export const createProduct = asyncHandler(async (req, res) => {
  const product = await Product.create({ ...req.body, createdBy: req.user._id });
  return sendCreated(res, { data: toPublicDoc(product.toObject()), message: 'Product created' });
});

export const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!product) return sendError(res, { message: 'Product not found', statusCode: 404 });
  return sendSuccess(res, { data: toPublicDoc(product.toObject()), message: 'Product updated' });
});

export const updateProductStatus = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndUpdate(
    req.params.id,
    { status: req.body.status },
    { new: true }
  );
  if (!product) return sendError(res, { message: 'Product not found', statusCode: 404 });
  return sendSuccess(res, { data: toPublicDoc(product.toObject()) });
});

export const listAllTiers = asyncHandler(async (req, res) => {
  const { page, perPage, skip, sort } = parsePagination(req.query);
  const filter = {};
  if (req.query.status) filter.status = req.query.status;

  const [rows, total] = await Promise.all([
    ProductTier.find(filter).populate('product', 'name sku').sort(sort).skip(skip).limit(perPage).lean(),
    ProductTier.countDocuments(filter),
  ]);

  const data = rows.map((t) => {
    const d = toPublicDoc(t);
    return {
      ...d,
      productId: String(t.product?._id || t.product || ''),
      productName: t.product?.name || '',
      productSku: t.product?.sku || '',
      tier: d.name,
      price: d.basePrice,
    };
  });
  return sendPaginated(res, { data, total, page, perPage });
});

export const getTier = asyncHandler(async (req, res) => {
  const tier = await ProductTier.findById(req.params.tierId).populate('product', 'name sku').lean();
  if (!tier) return sendError(res, { message: 'Tier not found', statusCode: 404 });
  const d = toPublicDoc(tier);
  return sendSuccess(res, {
    data: {
      ...d,
      productId: String(tier.product?._id || tier.product || ''),
      productName: tier.product?.name || '',
      productSku: tier.product?.sku || '',
      tier: d.name,
      price: d.basePrice,
    },
  });
});

export const listTiers = asyncHandler(async (req, res) => {
  const tiers = await ProductTier.find({ product: req.params.id }).sort({ basePrice: 1 }).lean();
  return sendSuccess(res, { data: toPublicDoc(tiers) });
});

export const createTier = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return sendError(res, { message: 'Product not found', statusCode: 404 });

  const code = req.body.code || req.body.name.replace(/\s+/g, '-').toUpperCase().slice(0, 20);
  const tier = await ProductTier.create({ ...req.body, code, product: product._id });
  return sendCreated(res, { data: tier, message: 'Tier created' });
});

export const updateTier = asyncHandler(async (req, res) => {
  const tier = await ProductTier.findOneAndUpdate(
    { _id: req.params.tierId, product: req.params.id },
    req.body,
    { new: true, runValidators: true }
  );
  if (!tier) return sendError(res, { message: 'Tier not found', statusCode: 404 });
  return sendSuccess(res, { data: tier, message: 'Tier updated' });
});

export const updateTierStatus = asyncHandler(async (req, res) => {
  const tier = await ProductTier.findOneAndUpdate(
    { _id: req.params.tierId, product: req.params.id },
    { status: req.body.status },
    { new: true }
  );
  if (!tier) return sendError(res, { message: 'Tier not found', statusCode: 404 });
  return sendSuccess(res, { data: tier });
});

export const getCategories = asyncHandler(async (_req, res) => {
  const categories = await Product.distinct('category', { status: 'ACTIVE' });
  return sendSuccess(res, { data: categories.sort() });
});
