import mongoose from 'mongoose';

function deriveStatus(quantity, reorderLevel) {
  if (quantity <= 0) return 'OUT_OF_STOCK';
  if (quantity <= reorderLevel) return 'LOW_STOCK';
  return 'IN_STOCK';
}

const inventorySchema = new mongoose.Schema(
  {
    sku: { type: String, required: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    hsn: { type: String, default: '' },
    quantity: { type: Number, default: 0, min: 0 },
    reorderLevel: { type: Number, default: 10, min: 0 },
    unitPrice: { type: Number, default: 0, min: 0 },
    warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null },
    status: { type: String, enum: ['IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK', 'DISCONTINUED'], default: 'IN_STOCK' },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

inventorySchema.index({ sku: 1, warehouse: 1 }, { unique: true });
inventorySchema.index({ warehouse: 1, status: 1 });
inventorySchema.index({ name: 'text', sku: 'text', category: 1 });

inventorySchema.pre('save', function (next) {
  if (!this.isDeleted) {
    this.status = deriveStatus(this.quantity, this.reorderLevel);
  }
  next();
});

const Inventory = mongoose.model('Inventory', inventorySchema);
export { deriveStatus };
export default Inventory;
