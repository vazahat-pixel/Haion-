import mongoose from 'mongoose';

const lineItemSchema = new mongoose.Schema(
  {
    sku: { type: String, default: '' },
    name: { type: String, required: true, trim: true },
    hsn: { type: String, default: '' },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    gstRate: { type: Number, default: 18, min: 0, max: 28 },
    amount: { type: Number, required: true, min: 0 },
    taxAmount: { type: Number, default: 0 },
    lineTotal: { type: Number, required: true, min: 0 },
    // ── Unit identification numbers (per vehicle sold) ─────────────────────
    serialNumbers: { type: [String], default: [] },
    controllerNumbers: { type: [String], default: [] },
    batteryNumbers: { type: [String], default: [] },
    // ── Warranty durations (months) ───────────────────────────────────────
    vehicleWarrantyMonths: { type: Number, default: 12 },
    batteryWarrantyMonths: { type: Number, default: 36 },
    controllerWarrantyMonths: { type: Number, default: 24 },
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

const bankDetailSchema = new mongoose.Schema(
  {
    accountNumber: { type: String, trim: true, default: '' },
    ifsc: { type: String, trim: true, default: '' },
    bankName: { type: String, trim: true, default: '' },
    holderName: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const salesInvoiceSchema = new mongoose.Schema(
  {
    invoiceNo: { type: String, required: true, unique: true, uppercase: true, trim: true },
    prefix: { type: String, trim: true, default: 'SI' },
    sequenceNumber: { type: Number, default: 1 },
    dealer: { type: mongoose.Schema.Types.ObjectId, ref: 'Dealer', required: true },
    dealerName: { type: String, required: true, trim: true },
    dealerGstin: { type: String, trim: true, default: '' },
    dealerAddress: { type: String, trim: true, default: '' },
    invoiceDate: { type: Date, default: Date.now },
    paymentTermsDays: { type: Number, default: 30, min: 0 },
    dueDate: { type: Date, default: null },
    eWayBillNo: { type: String, trim: true, default: '' },
    vehicleNo: { type: String, trim: true, default: '' },
    lineItems: { type: [lineItemSchema], default: [] },
    subtotal: { type: Number, default: 0, min: 0 },
    orderDiscount: { type: Number, default: 0, min: 0 },
    additionalCharges: { type: [additionalChargeSchema], default: [] },
    taxableAmount: { type: Number, default: 0, min: 0 },
    tax: { type: Number, default: 0, min: 0 },
    total: { type: Number, default: 0, min: 0 },
    amountReceived: { type: Number, default: 0, min: 0 },
    balanceAmount: { type: Number, default: 0, min: 0 },
    notes: { type: String, maxlength: 1000, default: '' },
    termsAndConditions: { type: String, maxlength: 2000, default: '' },
    bankDetails: { type: bankDetailSchema, default: () => ({}) },
    status: {
      type: String,
      enum: ['DRAFT', 'SENT', 'PAID', 'CANCELLED'],
      default: 'DRAFT',
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

salesInvoiceSchema.index({ dealer: 1, status: 1, invoiceDate: -1 });
salesInvoiceSchema.index({ invoiceNo: 1 });

const SalesInvoice = mongoose.model('SalesInvoice', salesInvoiceSchema);
export default SalesInvoice;
