import mongoose from 'mongoose';
import { deriveStatus } from './Inventory.model.js';

const serviceCenterInventorySchema = new mongoose.Schema(
  {
    serviceCenter: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceCenter', required: true },
    sku: { type: String, required: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    category: { type: String, default: 'Spare Parts' },
    availableStock: { type: Number, default: 0, min: 0 },
    defectiveStock: { type: Number, default: 0, min: 0 },
    reorderLevel: { type: Number, default: 5, min: 0 },
    unitPrice: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: ['IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK'], default: 'IN_STOCK' },
  },
  { timestamps: true }
);

serviceCenterInventorySchema.index({ serviceCenter: 1, sku: 1 }, { unique: true });

serviceCenterInventorySchema.pre('save', function (next) {
  this.status = deriveStatus(this.availableStock, this.reorderLevel);
  next();
});

const ServiceCenterInventory = mongoose.model('ServiceCenterInventory', serviceCenterInventorySchema);
export default ServiceCenterInventory;
