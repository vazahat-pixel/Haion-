import mongoose from 'mongoose';

const stockMovementSchema = new mongoose.Schema(
  {
    sku: { type: String, required: true, uppercase: true, trim: true },
    name: { type: String, trim: true },
    action: {
      type: String,
      required: true,
      enum: ['GRN', 'DISPATCH', 'BILLING_DEDUCTION', 'RETURN', 'ADJUSTMENT', 'SPARE_DISPATCH', 'DEALER_CONFIRM', 'STOCK_CORRECTION', 'WAREHOUSE_TRANSFER', 'PURCHASE'],
      uppercase: true,
    },
    qtyBefore: { type: Number, required: true },
    qtyDelta: { type: Number, required: true },
    qtyAfter: { type: Number, required: true },
    warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },
    dealer: { type: mongoose.Schema.Types.ObjectId, ref: 'Dealer' },
    reference: { type: String, trim: true },
    referenceId: { type: mongoose.Schema.Types.ObjectId },
    referenceType: { type: String, enum: ['GRN', 'Dispatch', 'Bill', 'Return', 'SpareRequest', 'Manual', 'Purchase'] },
    performedBy: { type: String, trim: true },
    performedByUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

stockMovementSchema.index({ sku: 1, createdAt: -1 });
stockMovementSchema.index({ warehouse: 1, action: 1 });
stockMovementSchema.index({ dealer: 1, action: 1 });
stockMovementSchema.index({ reference: 1 });

const StockMovement = mongoose.model('StockMovement', stockMovementSchema);
export default StockMovement;
