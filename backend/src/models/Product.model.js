import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 150 },
    sku: { type: String, required: true, unique: true, uppercase: true, trim: true, maxlength: 30 },
    category: { type: String, required: true, trim: true },
    description: { type: String, maxlength: 500, default: '' },
    hsnCode: { type: String, required: true, trim: true },
    unitOfMeasure: {
      type: String,
      enum: ['Piece', 'Box', 'Set', 'Kit'],
      default: 'Piece',
    },
    imageUrl: { type: String, default: null },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

productSchema.index({ name: 'text', sku: 'text', category: 1 });

const Product = mongoose.model('Product', productSchema);
export default Product;
