import mongoose from 'mongoose';

const lineItemSchema = new mongoose.Schema(
  {
    sku: String,
    product: String,
    hsn: String,
    quantity: Number,
    unitPrice: Number,
    gstRate: Number,
    amount: Number,
    cgst: Number,
    sgst: Number,
    igst: Number,
  },
  { _id: false }
);

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNo: { type: String, required: true, unique: true, uppercase: true, trim: true },
    bill: { type: mongoose.Schema.Types.ObjectId, ref: 'Bill', required: true },
    billNo: { type: String, required: true },
    dealer: { type: mongoose.Schema.Types.ObjectId, ref: 'Dealer', required: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    customerName: { type: String, required: true },
    customerGstin: { type: String, default: '' },
    dealerName: { type: String },
    dealerGstin: { type: String },
    dealerAddress: { type: String },
    lineItems: { type: [lineItemSchema], default: [] },
    amount: { type: Number, required: true },
    tax: { type: Number, default: 0 },
    total: { type: Number, required: true },
    cgst: { type: Number, default: 0 },
    sgst: { type: Number, default: 0 },
    igst: { type: Number, default: 0 },
    status: { type: String, enum: ['SENT', 'PAID', 'CANCELLED'], default: 'SENT' },
    issuedAt: { type: Date, default: Date.now },
    paidAt: { type: Date },
  },
  { timestamps: true }
);

invoiceSchema.index({ dealer: 1, status: 1, issuedAt: -1 });

const Invoice = mongoose.model('Invoice', invoiceSchema);
export default Invoice;
