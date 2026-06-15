import mongoose from 'mongoose';
import { deriveStatus } from './Inventory.model.js';

const dealerInventorySchema = new mongoose.Schema(
  {
    dealer: { type: mongoose.Schema.Types.ObjectId, ref: 'Dealer', required: true },
    sku: { type: String, required: true, uppercase: true },
    name: { type: String, required: true },
    quantity: { type: Number, default: 0, min: 0 },
    reorderLevel: { type: Number, default: 8, min: 0 },
    status: { type: String, enum: ['IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK'], default: 'IN_STOCK' },
  },
  { timestamps: true }
);

dealerInventorySchema.index({ dealer: 1, sku: 1 }, { unique: true });

dealerInventorySchema.pre('save', function (next) {
  this.status = deriveStatus(this.quantity, this.reorderLevel);
  next();
});

const DealerInventory = mongoose.model('DealerInventory', dealerInventorySchema);
export default DealerInventory;
