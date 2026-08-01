import mongoose from 'mongoose';

export const PAYMENT_TYPES = ['PAYMENT_IN', 'PAYMENT_OUT'];
export const PAYMENT_MODES = ['CASH', 'BANK_TRANSFER', 'UPI', 'NETBANKING', 'CHEQUE', 'OTHER'];

const settledInvoiceSchema = new mongoose.Schema(
  {
    invoice: { type: mongoose.Schema.Types.ObjectId, ref: 'SalesInvoice' },
    invoiceNo: { type: String, default: '' },
    invoiceAmount: { type: Number, default: 0 },
    tds: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    amountReceived: { type: Number, default: 0 },
  },
  { _id: false }
);

const settledPurchaseSchema = new mongoose.Schema(
  {
    purchase: { type: mongoose.Schema.Types.ObjectId, ref: 'Purchase' },
    purchaseNo: { type: String, default: '' },
    purchaseAmount: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    amountPaid: { type: Number, default: 0 },
  },
  { _id: false }
);

const paymentSchema = new mongoose.Schema(
  {
    paymentNo: { type: String, required: true, unique: true, uppercase: true, trim: true },
    sequenceNumber: { type: Number, default: 1 },
    type: { type: String, required: true, enum: PAYMENT_TYPES },
    party: { type: mongoose.Schema.Types.ObjectId, ref: 'Party', required: true },
    partyName: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    netAmount: { type: Number, default: 0, min: 0 }, // amount - discount
    paymentDate: { type: Date, default: Date.now },
    paymentMode: { type: String, enum: PAYMENT_MODES, default: 'CASH' },
    referenceNo: { type: String, trim: true, default: '' }, // bank ref, cheque no, UPI ref
    notes: { type: String, maxlength: 1000, default: '' },
    status: { type: String, enum: ['ACTIVE', 'CANCELLED'], default: 'ACTIVE' },
    // Settlement references
    settledInvoices: { type: [settledInvoiceSchema], default: [] },   // for PAYMENT_IN
    settledPurchases: { type: [settledPurchaseSchema], default: [] }, // for PAYMENT_OUT
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

paymentSchema.index({ type: 1, party: 1, paymentDate: -1 });
paymentSchema.index({ paymentNo: 1 });
paymentSchema.index({ sequenceNumber: 1, type: 1 });

const Payment = mongoose.model('Payment', paymentSchema);
export default Payment;
