import mongoose from 'mongoose';
import { DEFAULT_UNIT_OF_MEASURE } from '../constants/unitsOfMeasure.js';

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 150 },
    sku: { type: String, required: true, unique: true, uppercase: true, trim: true, maxlength: 30 },
    category: { type: String, required: true, trim: true },
    brand: { type: String, trim: true, default: '' },
    description: { type: String, maxlength: 500, default: '' },
    hsnCode: { type: String, required: true, trim: true },
    gstRate: { type: Number, required: true, enum: [0, 5, 12, 18, 28], default: 18 },
    unitOfMeasure: {
      type: String,
      trim: true,
      maxlength: 40,
      default: DEFAULT_UNIT_OF_MEASURE,
    },
    /** RAW = purchased materials; FINISHED = manufactured / assembled goods */
    productKind: {
      type: String,
      enum: ['RAW', 'FINISHED'],
      default: 'RAW',
    },
    imageUrl: { type: String, default: null },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

productSchema.index({ name: 'text', sku: 'text', category: 1 });
productSchema.index({ productKind: 1, status: 1 });

const Product = mongoose.model('Product', productSchema);
export default Product;
