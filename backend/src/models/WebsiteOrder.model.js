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
    productId: { type: String, required: true },
    cmsItemId: { type: String },
    name: { type: String, required: true },
    image: { type: String },
    color: { type: String },
    sku: { type: String },
    quantity: { type: Number, min: 1, required: true },
    unitPrice: { type: Number, min: 0, required: true },
    amount: { type: Number, min: 0, required: true },
  },
  { _id: false }
);

const websiteOrderSchema = new mongoose.Schema(
  {
    orderNo: { type: String, required: true, unique: true, uppercase: true, trim: true },
    source: { type: String, default: 'website', enum: ['website'] },
    customerName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true },
    shippingAddress: { type: String, required: true, trim: true },
    lineItems: { type: [lineItemSchema], default: [] },
    items: { type: Number, default: 0, min: 0 },
    subtotal: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    paymentMethod: { type: String, enum: ['cod', 'razorpay'], required: true },
    paymentStatus: {
      type: String,
      enum: ['pending', 'cod_pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
    },
    razorpayOrderId: { type: String, trim: true },
    razorpayPaymentId: { type: String, trim: true },
    razorpaySignature: { type: String },
    /** Actual INR collected via Razorpay (may differ in dev test mode) */
    razorpayChargeAmount: { type: Number, min: 0 },
    status: {
      type: String,
      enum: ['PENDING', 'CONFIRMED', 'PROCESSING', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'],
      default: 'PENDING',
    },
    placedAt: { type: Date, default: Date.now },
    paidAt: { type: Date },
    eta: { type: Date },
    trackingNo: { type: String, trim: true },
    timeline: { type: [timelineSchema], default: [] },
  },
  { timestamps: true }
);

websiteOrderSchema.index({ phone: 1, placedAt: -1 });
websiteOrderSchema.index({ status: 1, placedAt: -1 });
websiteOrderSchema.index({ paymentStatus: 1, placedAt: -1 });

const WebsiteOrder = mongoose.model('WebsiteOrder', websiteOrderSchema);
export default WebsiteOrder;
