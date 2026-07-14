import mongoose from 'mongoose';

const purchaseLineSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    sku: { type: String, required: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    hsn: { type: String, default: '' },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    gstRate: { type: Number, required: true, min: 0, max: 28, default: 18 },
    amount: { type: Number, required: true, min: 0 },
    taxAmount: { type: Number, default: 0, min: 0 },
    lineTotal: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const additionalChargeSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const purchaseSchema = new mongoose.Schema(
  {
    purchaseNo: { type: String, required: true, unique: true, uppercase: true },
    billNo: { type: String, required: true, trim: true },
    purchaseInvDate: { type: Date, default: Date.now },
    originalInvNo: { type: String, trim: true, default: '' },
    paymentTermsDays: { type: Number, default: 30, min: 0 },
    dueDate: { type: Date, default: null },
    party: { type: mongoose.Schema.Types.ObjectId, ref: 'Party', required: true },
    partyName: { type: String, required: true, trim: true },
    warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
    lineItems: { type: [purchaseLineSchema], default: [] },
    subtotal: { type: Number, default: 0, min: 0 },
    orderDiscount: { type: Number, default: 0, min: 0 },
    additionalCharges: { type: [additionalChargeSchema], default: [] },
    taxableAmount: { type: Number, default: 0, min: 0 },
    tax: { type: Number, default: 0, min: 0 },
    total: { type: Number, default: 0, min: 0 },
    amountPaid: { type: Number, default: 0, min: 0 },
    balanceAmount: { type: Number, default: 0, min: 0 },
    termsAndConditions: { type: String, maxlength: 2000, default: '' },
    signatureUrl: { type: String, default: null },
    status: {
      type: String,
      enum: ['PENDING', 'RECEIVED', 'CANCELLED'],
      default: 'PENDING',
    },
    receivedAt: { type: Date, default: null },
    receivedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    notes: { type: String, maxlength: 1000, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

purchaseSchema.virtual('itemCount').get(function () {
  return this.lineItems?.length || 0;
});

purchaseSchema.set('toJSON', { virtuals: true });
purchaseSchema.set('toObject', { virtuals: true });

const Purchase = mongoose.model('Purchase', purchaseSchema);
export default Purchase;
