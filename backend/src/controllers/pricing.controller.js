import PricingRule from '../models/PricingRule.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess, sendCreated, sendError, sendPaginated } from '../utils/apiResponse.js';
import { parsePagination, buildSearchFilter } from '../utils/pagination.util.js';
import { mapPricingRule } from '../utils/docMapper.util.js';

export const listPricing = asyncHandler(async (req, res) => {
  const { page, perPage, skip, sort } = parsePagination(req.query);
  const filter = { ...buildSearchFilter(req.query.search, ['productName', 'sku', 'region', 'dealerTier']) };
  if (req.query.status) filter.status = req.query.status;
  if (req.query.region) filter.region = req.query.region;
  if (req.query.sku) filter.sku = req.query.sku.toUpperCase();

  const [rows, total] = await Promise.all([
    PricingRule.find(filter).sort(sort).skip(skip).limit(perPage).lean(),
    PricingRule.countDocuments(filter),
  ]);
  return sendPaginated(res, { data: rows.map(mapPricingRule), total, page, perPage });
});

export const getPricing = asyncHandler(async (req, res) => {
  const doc = await PricingRule.findById(req.params.id).lean();
  if (!doc) return sendError(res, { message: 'Pricing rule not found', statusCode: 404 });
  return sendSuccess(res, { data: mapPricingRule(doc) });
});

export const createPricing = asyncHandler(async (req, res) => {
  const basePrice = req.body.basePrice;
  const discountPct = req.body.discountPct ?? 0;
  const effectivePrice = req.body.effectivePrice ?? Math.round(basePrice * (1 - discountPct / 100));

  const doc = await PricingRule.create({
    ...req.body,
    sku: req.body.sku?.toUpperCase(),
    basePrice,
    effectivePrice,
    discountPct,
    gst: req.body.gst ?? 18,
    status: req.body.status || 'ACTIVE',
    changeHistory: [{
      changedAt: new Date(),
      changedBy: req.user?.email || 'system',
      basePrice,
      discountPct,
      effectivePrice,
      gst: req.body.gst ?? 18,
      note: 'Initial pricing rule created',
    }],
  });
  return sendCreated(res, { data: mapPricingRule(doc.toObject()), message: 'Pricing rule created' });
});

export const updatePricing = asyncHandler(async (req, res) => {
  const doc = await PricingRule.findById(req.params.id);
  if (!doc) return sendError(res, { message: 'Pricing rule not found', statusCode: 404 });

  const previous = {
    basePrice: doc.basePrice,
    discountPct: doc.discountPct,
    effectivePrice: doc.effectivePrice,
    gst: doc.gst,
  };
  Object.assign(doc, req.body);
  if (req.body.basePrice != null && req.body.discountPct != null) {
    doc.effectivePrice = Math.round(doc.basePrice * (1 - doc.discountPct / 100));
  }
  if (
    previous.basePrice !== doc.basePrice
    || previous.discountPct !== doc.discountPct
    || previous.effectivePrice !== doc.effectivePrice
    || previous.gst !== doc.gst
  ) {
    doc.changeHistory.push({
      changedAt: new Date(),
      changedBy: req.user?.email || 'system',
      basePrice: doc.basePrice,
      discountPct: doc.discountPct,
      effectivePrice: doc.effectivePrice,
      gst: doc.gst,
      note: req.body.changeNote || 'Pricing parameters updated',
    });
  }
  await doc.save();
  return sendSuccess(res, { data: mapPricingRule(doc.toObject()), message: 'Pricing rule updated' });
});
