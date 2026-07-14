import PricingRule from '../models/PricingRule.model.js';
import Product from '../models/Product.model.js';
import ProductTier from '../models/ProductTier.model.js';
import Inventory from '../models/Inventory.model.js';
import Dealer from '../models/Dealer.model.js';

/**
 * Resolve effective unit price for a SKU using pricing rules cascade.
 * @returns {{ unitPrice: number, basePrice: number, appliedRules: Array<{ name: string, adjustment: number, source: string }> }}
 */
export async function resolveEffectivePrice({ sku, dealerId, region, productTierCode }) {
  const [inventoryItem, dealer, rules, tiers] = await Promise.all([
    Inventory.findOne({ sku: sku.toUpperCase(), isDeleted: false }).lean(),
    dealerId ? Dealer.findById(dealerId).lean() : null,
    PricingRule.find({ sku: sku.toUpperCase(), status: 'ACTIVE' }).lean(),
    productTierCode
      ? ProductTier.findOne({ code: productTierCode, status: 'ACTIVE' }).lean()
      : ProductTier.findOne({ sku: sku.toUpperCase(), status: 'ACTIVE' }).sort({ priority: -1 }).lean(),
  ]);

  const basePrice = inventoryItem?.unitPrice ?? rules[0]?.basePrice ?? 0;
  let effectivePrice = basePrice;
  const appliedRules = [];

  const dealerTier = dealer?.tier || 'Gold';
  const dealerRegion = region || dealer?.state || 'All';

  // Product tier discount
  if (tiers?.discountPct) {
    const adj = Math.round(basePrice * (tiers.discountPct / 100));
    effectivePrice -= adj;
    appliedRules.push({ name: tiers.name || tiers.code, adjustment: -adj, source: 'ProductTier' });
  }

  // Matching pricing rules: region + dealer tier
  const matched = rules.find((r) =>
    (r.region === dealerRegion || r.region === 'All') &&
    (r.dealerTier === dealerTier || !r.dealerTier)
  ) || rules[0];

  if (matched && matched.effectivePrice && matched.effectivePrice !== basePrice) {
    const adj = matched.effectivePrice - basePrice;
    effectivePrice = matched.effectivePrice;
    appliedRules.push({
      name: `${matched.region} / ${matched.dealerTier}`,
      adjustment: adj,
      source: 'PricingRule',
    });
  } else if (matched?.discountPct) {
    const adj = Math.round(basePrice * (matched.discountPct / 100));
    effectivePrice = basePrice - adj;
    appliedRules.push({ name: matched.region, adjustment: -adj, source: 'PricingRule' });
  }

  const floor = matched?.basePrice ? Math.min(matched.basePrice, basePrice) * 0.7 : basePrice * 0.5;
  if (effectivePrice < floor) {
    appliedRules.push({ name: 'Floor price guard', adjustment: floor - effectivePrice, source: 'Floor' });
    effectivePrice = floor;
  }

  if (appliedRules.length === 0) {
    appliedRules.push({ name: 'Standard pricing', adjustment: 0, source: 'Base' });
  }

  return { unitPrice: Math.max(0, Math.round(effectivePrice)), basePrice, appliedRules };
}

export async function priceCatalogForDealer(dealerId) {
  const dealer = await Dealer.findById(dealerId).lean();
  if (!dealer) return [];

  const stock = await import('../models/DealerInventory.model.js').then((m) =>
    m.default.find({ dealer: dealerId, quantity: { $gt: 0 } }).lean()
  );

  const catalog = await Promise.all(stock.map(async (item) => {
    const priced = await resolveEffectivePrice({
      sku: item.sku,
      dealerId,
      region: dealer.state,
    });
    const inv = await Inventory.findOne({ sku: item.sku, isDeleted: false }).lean();
    const product = await Product.findOne({ sku: item.sku }).lean();
    return {
      sku: item.sku,
      name: item.name,
      unitPrice: priced.unitPrice,
      basePrice: priced.basePrice,
      appliedRules: priced.appliedRules,
      hsn: inv?.hsn || product?.hsnCode || '',
      gstRate: product?.gstRate ?? 18,
      availableQty: item.quantity,
    };
  }));

  return catalog;
}
