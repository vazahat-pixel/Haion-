import mongoose from 'mongoose';

const productTierSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, uppercase: true, trim: true },
    basePrice: { type: Number, required: true, min: 0 },
    gstRate: { type: Number, required: true, enum: [0, 5, 12, 18, 28] },
    warrantyDuration: { type: Number, required: true, min: 1 },
    warrantyUnit: { type: String, enum: ['Months', 'Years'], default: 'Months' },
    description: { type: String, default: '' },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
  },
  { timestamps: true }
);

productTierSchema.index({ product: 1, code: 1 }, { unique: true });

const ProductTier = mongoose.model('ProductTier', productTierSchema);
export default ProductTier;
