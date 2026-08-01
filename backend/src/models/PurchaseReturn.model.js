import mongoose from 'mongoose';

const lineItemSchema = new mongoose.Schema(
  {
    sku: { type: String, required: true, uppercase: true, trim: true },
    product: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, default: 0, min: 0 },
    amount: { type: Number, default: 0, min: 0 },
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

export const PURCHASE_RETURN_STATUSES = ['REQUESTED', 'SHIPPED', 'RECEIVED', 'REJECTED'];

const purchaseReturnSchema = new mongoose.Schema(
  {
    returnNo: { type: String, required: true, unique: true, uppercase: true, trim: true },
    sequenceNumber: { type: Number, default: 1 },
    dealer: { type: mongoose.Schema.Types.ObjectId, ref: 'Dealer', required: true },
    dealerName: { type: String, required: true, trim: true },
    warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', default: null },
    lineItems: { type: [lineItemSchema], default: [] },
    reason: { type: String, required: true, maxlength: 1000 },
    returnAmount: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: PURCHASE_RETURN_STATUSES, default: 'REQUESTED' },
    rejectReason: { type: String, maxlength: 1000, default: '' },
    shippedAt: { type: Date },
    receivedAt: { type: Date },
    rejectedAt: { type: Date },
    timeline: { type: [timelineEntrySchema], default: [] },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

purchaseReturnSchema.index({ dealer: 1, status: 1, createdAt: -1 });
purchaseReturnSchema.index({ returnNo: 1 });

const PurchaseReturn = mongoose.model('PurchaseReturn', purchaseReturnSchema);
export default PurchaseReturn;
