import mongoose from 'mongoose';

const timelineSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    variant: { type: String, enum: ['default', 'success', 'warning', 'danger'], default: 'default' },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const lineItemSchema = new mongoose.Schema(
  {
    sku: String,
    product: String,
    quantity: { type: Number, min: 1 },
    unitPrice: { type: Number, min: 0 },
    amount: { type: Number, min: 0 },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNo: { type: String, required: true, unique: true, uppercase: true, trim: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    customerName: { type: String, trim: true },
    dealer: { type: mongoose.Schema.Types.ObjectId, ref: 'Dealer' },
    lineItems: { type: [lineItemSchema], default: [] },
    items: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['PENDING', 'CONFIRMED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'],
      default: 'PENDING',
    },
    placedAt: { type: Date, default: Date.now },
    eta: { type: Date },
    trackingNo: { type: String, trim: true },
    timeline: { type: [timelineSchema], default: [] },
  },
  { timestamps: true }
);

orderSchema.index({ customer: 1, status: 1, placedAt: -1 });
orderSchema.index({ dealer: 1, placedAt: -1 });

const Order = mongoose.model('Order', orderSchema);
export default Order;
