import mongoose from 'mongoose';

const pricingRuleSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    productName: { type: String, required: true, trim: true },
    sku: { type: String, required: true, uppercase: true, trim: true },
    region: { type: String, required: true, trim: true },
    dealerTier: { type: String, enum: ['Bronze', 'Silver', 'Gold', 'Platinum'], default: 'Gold' },
    basePrice: { type: Number, required: true, min: 0 },
    effectivePrice: { type: Number, required: true, min: 0 },
    discountPct: { type: Number, default: 0, min: 0, max: 100 },
    gst: { type: Number, default: 18, min: 0, max: 28 },
    validFrom: { type: Date, default: Date.now },
    validTo: { type: Date },
    status: { type: String, enum: ['ACTIVE', 'EXPIRED', 'DRAFT'], default: 'ACTIVE' },
    changeHistory: {
      type: [{
        changedAt: { type: Date, default: Date.now },
        changedBy: { type: String, default: 'system' },
        basePrice: { type: Number },
        discountPct: { type: Number },
        effectivePrice: { type: Number },
        gst: { type: Number },
        note: { type: String, default: '' },
      }],
      default: [],
    },
  },
  { timestamps: true }
);

pricingRuleSchema.index({ sku: 1, region: 1, dealerTier: 1 });
pricingRuleSchema.index({ status: 1 });

const PricingRule = mongoose.model('PricingRule', pricingRuleSchema);
export default PricingRule;
