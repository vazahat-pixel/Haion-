import Category from '../models/Category.model.js';
import Brand from '../models/Brand.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess, sendCreated, sendPaginated, sendError } from '../utils/apiResponse.js';
import { parsePagination, buildSearchFilter } from '../utils/pagination.util.js';
import { toPublicDoc } from '../utils/serialize.util.js';

export const listCategories = asyncHandler(async (req, res) => {
  const { page, perPage, skip, sort } = parsePagination(req.query);
  const filter = { ...buildSearchFilter(req.query.search, ['name']) };
  const [data, total] = await Promise.all([
    Category.find(filter).sort(sort).skip(skip).limit(perPage).lean(),
    Category.countDocuments(filter),
  ]);
  return sendPaginated(res, { data: toPublicDoc(data), total, page, perPage });
});

export const getCategory = asyncHandler(async (req, res) => {
  const doc = await Category.findById(req.params.id).lean();
  if (!doc) return sendSuccess(res, { data: null });
  return sendSuccess(res, { data: toPublicDoc(doc) });
});

export const createCategory = asyncHandler(async (req, res) => {
  const doc = await Category.create(req.body);
  return sendCreated(res, { data: toPublicDoc(doc.toObject()), message: 'Category created' });
});

export const updateCategory = asyncHandler(async (req, res) => {
  const doc = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).lean();
  if (!doc) return sendError(res, { message: 'Category not found', statusCode: 404 });
  return sendSuccess(res, { data: toPublicDoc(doc), message: 'Category updated' });
});

export const listBrands = asyncHandler(async (req, res) => {
  const { page, perPage, skip, sort } = parsePagination(req.query);
  const filter = { ...buildSearchFilter(req.query.search, ['name']) };
  const [data, total] = await Promise.all([
    Brand.find(filter).sort(sort).skip(skip).limit(perPage).lean(),
    Brand.countDocuments(filter),
  ]);
  return sendPaginated(res, { data: toPublicDoc(data), total, page, perPage });
});

export const getBrand = asyncHandler(async (req, res) => {
  const doc = await Brand.findById(req.params.id).lean();
  return sendSuccess(res, { data: doc ? toPublicDoc(doc) : null });
});

export const createBrand = asyncHandler(async (req, res) => {
  const doc = await Brand.create(req.body);
  return sendCreated(res, { data: toPublicDoc(doc.toObject()), message: 'Brand created' });
});

export const updateBrand = asyncHandler(async (req, res) => {
  const doc = await Brand.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).lean();
  if (!doc) return sendError(res, { message: 'Brand not found', statusCode: 404 });
  return sendSuccess(res, { data: toPublicDoc(doc), message: 'Brand updated' });
});
