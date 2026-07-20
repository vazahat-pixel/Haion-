import mongoose from 'mongoose';

const componentSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    sku: { type: String, required: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    qtyPerUnit: { type: Number, required: true, min: 0.001 },
    totalConsumed: { type: Number, required: true, min: 0.001 },
  },
  { _id: false }
);

const manufactureSchema = new mongoose.Schema(
  {
    manufactureNo: { type: String, required: true, unique: true, uppercase: true },
    warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
    finishedProduct: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    finishedSku: { type: String, required: true, uppercase: true, trim: true },
    finishedName: { type: String, required: true, trim: true },
    finishedHsn: { type: String, default: '' },
    qtyProduced: { type: Number, required: true, min: 1 },
    components: { type: [componentSchema], default: [] },
    /** Auto: sum of consumed raw material purchase prices */
    unitCost: { type: Number, default: 0, min: 0 },
    totalCost: { type: Number, default: 0, min: 0 },
    /** Admin-decided selling / finished price per unit */
    sellingPrice: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: ['COMPLETED', 'CANCELLED'],
      default: 'COMPLETED',
    },
    notes: { type: String, maxlength: 1000, default: '' },
    manufacturedAt: { type: Date, default: Date.now },
    manufacturedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

manufactureSchema.index({ warehouse: 1, createdAt: -1 });
manufactureSchema.index({ finishedSku: 1 });
manufactureSchema.index({ status: 1 });

const Manufacture = mongoose.model('Manufacture', manufactureSchema);
export default Manufacture;
