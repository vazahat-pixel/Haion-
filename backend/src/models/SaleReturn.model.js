import mongoose from 'mongoose';

const lineItemSchema = new mongoose.Schema(
  {
    sku: { type: String, required: true, uppercase: true, trim: true },
    product: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    amount: { type: Number, required: true, min: 0 },
    serialNos: { type: [String], default: [] },
  },
  { _id: false }
);

const timelineEntrySchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    variant: { type: String, enum: ['default', 'success', 'warning', 'danger'], default: 'default' },
    at: { type: Date, default: Date.now },
    by: { type: String },
  },
  { _id: false }
);

const saleReturnSchema = new mongoose.Schema(
  {
    returnNo: { type: String, required: true, unique: true, uppercase: true, trim: true },
    sequenceNumber: { type: Number, default: 1 },
    dealer: { type: mongoose.Schema.Types.ObjectId, ref: 'Dealer', required: true },
    dealerName: { type: String, required: true, trim: true },
    billNo: { type: String, trim: true, uppercase: true, default: '' },
    customerName: { type: String, required: true, trim: true },
    customerPhone: { type: String, trim: true, default: '' },
    lineItems: { type: [lineItemSchema], default: [] },
    reason: { type: String, required: true, maxlength: 1000 },
    refundAmount: { type: Number, required: true, min: 0 },
    restock: { type: Boolean, default: true },
    status: { type: String, enum: ['COMPLETED', 'VOIDED'], default: 'COMPLETED' },
    voidedAt: { type: Date },
    voidedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    timeline: { type: [timelineEntrySchema], default: [] },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

saleReturnSchema.index({ dealer: 1, status: 1, createdAt: -1 });
saleReturnSchema.index({ returnNo: 1 });
saleReturnSchema.index({ customerName: 'text', billNo: 'text' });

const SaleReturn = mongoose.model('SaleReturn', saleReturnSchema);
export default SaleReturn;
