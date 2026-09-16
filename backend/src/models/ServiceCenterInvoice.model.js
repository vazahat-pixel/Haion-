import mongoose from 'mongoose';

const lineItemSchema = new mongoose.Schema(
  {
    sku: { type: String, uppercase: true, trim: true, default: '' },
    name: { type: String, required: true, trim: true },
    hsn: { type: String, trim: true, default: '8711' },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    taxableAmount: { type: Number, required: true, min: 0 },
    gstRate: { type: Number, default: 18, min: 0, max: 28 },
    cgstRate: { type: Number, default: 0 },
    cgstAmount: { type: Number, default: 0 },
    sgstRate: { type: Number, default: 0 },
    sgstAmount: { type: Number, default: 0 },
    igstRate: { type: Number, default: 0 },
    igstAmount: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    lineTotal: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const serviceCenterInvoiceSchema = new mongoose.Schema(
  {
    invoiceNo: { type: String, required: true, unique: true, uppercase: true, trim: true },
    serviceCenter: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceCenter', required: true },
    serviceCenterCode: { type: String, uppercase: true, trim: true },
    serviceCenterName: { type: String, required: true, trim: true },
    serviceCenterGstin: { type: String, trim: true, uppercase: true, default: '' },
    serviceCenterState: { type: String, trim: true, default: '' },
    billingAddress: { type: String, trim: true, default: '' },
    party: { type: mongoose.Schema.Types.ObjectId, ref: 'Party', default: null },

    invoiceDate: { type: Date, default: Date.now },
    dueDate: { type: Date, default: null },

    lineItems: { type: [lineItemSchema], default: [] },

    subtotal: { type: Number, default: 0, min: 0 },
    taxableAmount: { type: Number, default: 0, min: 0 },
    cgstTotal: { type: Number, default: 0, min: 0 },
    sgstTotal: { type: Number, default: 0, min: 0 },
    igstTotal: { type: Number, default: 0, min: 0 },
    taxTotal: { type: Number, default: 0, min: 0 },
    grandTotal: { type: Number, default: 0, min: 0 },

    amountReceived: { type: Number, default: 0, min: 0 },
    balanceAmount: { type: Number, default: 0, min: 0 },
    paymentMode: { type: String, default: '' },
    paymentStatus: {
      type: String,
      enum: ['UNPAID', 'PARTIAL', 'PAID'],
      default: 'UNPAID',
    },

    dispatchStatus: {
      type: String,
      enum: ['PENDING', 'DISPATCHED', 'DELIVERED'],
      default: 'DELIVERED',
    },

    status: {
      type: String,
      enum: ['DRAFT', 'ISSUED', 'CANCELLED'],
      default: 'ISSUED',
    },

    warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', default: null },
    companyLedgerRef: { type: mongoose.Schema.Types.ObjectId, ref: 'CompanyLedger', default: null },
    partyLedgerRef: { type: mongoose.Schema.Types.ObjectId, ref: 'LedgerEntry', default: null },

    notes: { type: String, maxlength: 1000, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

serviceCenterInvoiceSchema.index({ serviceCenter: 1, invoiceDate: -1 });
serviceCenterInvoiceSchema.index({ status: 1 });

const ServiceCenterInvoice = mongoose.model('ServiceCenterInvoice', serviceCenterInvoiceSchema);
export default ServiceCenterInvoice;
