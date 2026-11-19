/**
 * DMS transaction models: counters, purchase orders, invoices (all stock-moving
 * documents), stock, serials, stock ledger, payments and party ledger.
 */
import mongoose from 'mongoose';

const { Schema } = mongoose;

/* Atomic document counters per scope (location/docType/financial year) */
const counterSchema = new Schema(
  { key: { type: String, required: true, unique: true }, seq: { type: Number, default: 0 } },
  { collection: 'dms_counters' },
);
export const DmsCounter = mongoose.models.DmsCounter || mongoose.model('DmsCounter', counterSchema);

/* Party reference: either a DMS location, a vendor or a retail customer */
const partySchema = new Schema(
  {
    kind: { type: String, enum: ['LOCATION', 'VENDOR', 'CUSTOMER'], required: true },
    location: { type: Schema.Types.ObjectId, ref: 'DmsLocation' },
    vendor: { type: Schema.Types.ObjectId, ref: 'DmsVendor' },
    customer: { type: Schema.Types.ObjectId, ref: 'DmsCustomer' },
    name: String, // snapshot
    city: String,
    state: String,
    stateCode: String,
    address: String,
    gstNo: String,
  },
  { _id: false },
);

const lineSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: 'DmsProduct', required: true },
    productCode: String,
    productName: String,
    color: String,
    hsnCode: String,
    reqQty: { type: Number, default: 0 }, // PO qty
    qty: { type: Number, required: true, min: 0 }, // billed / dispatched qty
    okQty: { type: Number, default: 0 },
    damageQty: { type: Number, default: 0 },
    missingQty: { type: Number, default: 0 },
    price: { type: Number, required: true, min: 0 },
    value: { type: Number, default: 0 },
    discountPerUnit: { type: Number, default: 0 },
    afterDiscount: { type: Number, default: 0 },
    sgstPer: { type: Number, default: 0 },
    sgstAmt: { type: Number, default: 0 },
    cgstPer: { type: Number, default: 0 },
    cgstAmt: { type: Number, default: 0 },
    igstPer: { type: Number, default: 0 },
    igstAmt: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    warrantyDays: Number,
    deliveryDate: Date,
    scheme: { type: Schema.Types.ObjectId, ref: 'DmsScheme' },
    schemeName: String,
    schemeCode: String,
    serials: [{ type: String }],
  },
  { _id: true },
);

const actionSchema = new Schema(
  { at: { type: Date, default: Date.now }, by: String, byUser: { type: Schema.Types.ObjectId, ref: 'User' }, action: String, remark: String },
  { _id: false },
);

const totalsFields = {
  subTotal: { type: Number, default: 0 },
  totalQty: { type: Number, default: 0 },
  totalDiscount: { type: Number, default: 0 },
  totalSgst: { type: Number, default: 0 },
  totalCgst: { type: Number, default: 0 },
  totalIgst: { type: Number, default: 0 },
  taxAmount: { type: Number, default: 0 },
  roundOff: { type: Number, default: 0 },
  grandTotal: { type: Number, default: 0 },
};

/* Purchase Order — location→parent ("PO") and HO→vendor ("VENDOR") */
export const PO_STATUS = ['PFA', 'Approved', 'Rejected', 'Processed', 'Cancelled', 'Received'];
const poSchema = new Schema(
  {
    poType: { type: String, enum: ['LOCATION', 'VENDOR'], default: 'LOCATION', index: true },
    poNo: { type: String, required: true, unique: true },
    poDate: { type: Date, default: Date.now },
    from: { type: partySchema, required: true }, // ordering party
    to: { type: partySchema, required: true }, // supplier party
    salesExecutive: { type: Schema.Types.ObjectId, ref: 'DmsProfile' },
    salesExecutiveName: String,
    discountType: { type: String, default: 'Productwise Discount' },
    currency: { type: String, enum: ['INR', 'USD'], default: 'INR' },
    lines: [lineSchema],
    ...totalsFields,
    deliveryAddress: String,
    paymentTerms: String,
    remark: String,
    status: { type: String, enum: PO_STATUS, default: 'PFA', index: true },
    actions: [actionSchema],
    invoices: [{ type: Schema.Types.ObjectId, ref: 'DmsInvoice' }],
    entryBy: String,
    entryByUser: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true, collection: 'dms_purchase_orders' },
);
export const DmsPurchaseOrder = mongoose.models.DmsPurchaseOrder || mongoose.model('DmsPurchaseOrder', poSchema);

/* Invoice-type documents (anything that moves stock between parties).
 * kind:
 *   CORPORATE        invoice against PO (location → location)
 *   UPLOAD_BILLING   corporate invoice created from an Excel upload
 *   RETAIL_LOCATION  retail billing to a location
 *   RETAIL_CUSTOMER  retail billing to a customer (serial based)
 *   STN              stock transfer note
 *   JOBWORK          stock transfer for job work
 *   PRN              purchase return (location → parent), needs approval
 *   CUSTOMER_RETURN  retail customer return (customer → location)
 *   LOCAL_PURCHASE   purchase from vendor (vendor → HO)
 *   VENDOR_RETURN    return to vendor (HO → vendor)
 *   OPENING          opening stock
 */
export const INVOICE_KINDS = [
  'CORPORATE', 'UPLOAD_BILLING', 'RETAIL_LOCATION', 'RETAIL_CUSTOMER', 'STN', 'JOBWORK',
  'PRN', 'CUSTOMER_RETURN', 'LOCAL_PURCHASE', 'VENDOR_RETURN', 'OPENING',
];
export const INVOICE_STATUS = ['PFA', 'Pending', 'Dispatched', 'Received', 'Cancelled', 'Rejected', 'Completed'];
const logisticSchema = new Schema(
  {
    courier: { type: Schema.Types.ObjectId, ref: 'DmsMaster' },
    courierName: String,
    docketNo: String,
    dispatchDate: Date,
    logisticPerson: String,
    transportMode: { type: String, enum: ['By Road', 'By Air', 'By Transport', 'By Hand Held', ''] },
    contactNo: String,
    carrierNo: String,
    ewayBillNo: String,
    deliveryAddress: String,
    remark: String,
    updatedBy: String,
    updatedAt: Date,
  },
  { _id: false },
);
const invoiceSchema = new Schema(
  {
    kind: { type: String, enum: INVOICE_KINDS, required: true, index: true },
    docType: { type: String, enum: ['INVOICE', 'DELIVERY CHALLAN'], default: 'INVOICE' },
    invoiceNo: { type: String, required: true, unique: true },
    invoiceDate: { type: Date, default: Date.now },
    refNo: String, // vendor invoice no / external ref
    refDate: Date,
    po: { type: Schema.Types.ObjectId, ref: 'DmsPurchaseOrder' },
    poNo: String,
    sourceInvoice: { type: Schema.Types.ObjectId, ref: 'DmsInvoice' }, // returns
    sourceInvoiceNo: String,
    from: { type: partySchema, required: true },
    to: { type: partySchema, required: true },
    taxType: { type: String, default: 'Productwise Tax' },
    discountType: { type: String, default: 'Productwise Discount' },
    currency: { type: String, default: 'INR' },
    lines: [lineSchema],
    ...totalsFields,
    marginAmount: { type: Number, default: 0 },
    deliveryAddress: String,
    dispatchAddress: String,
    remark: String,
    status: { type: String, enum: INVOICE_STATUS, default: 'Pending', index: true },
    logistic: logisticSchema,
    receiving: { by: String, at: Date, remark: String },
    actions: [actionSchema],
    paidAmount: { type: Number, default: 0 },
    entryBy: String,
    entryByUser: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true, collection: 'dms_invoices' },
);
invoiceSchema.index({ 'from.location': 1, kind: 1 });
invoiceSchema.index({ 'to.location': 1, kind: 1 });
export const DmsInvoice = mongoose.models.DmsInvoice || mongoose.model('DmsInvoice', invoiceSchema);

/* Stock per location × product, in three buckets */
const stockSchema = new Schema(
  {
    location: { type: Schema.Types.ObjectId, ref: 'DmsLocation', required: true },
    product: { type: Schema.Types.ObjectId, ref: 'DmsProduct', required: true },
    okQty: { type: Number, default: 0 },
    damageQty: { type: Number, default: 0 },
    missingQty: { type: Number, default: 0 },
    lastInAt: Date,
  },
  { timestamps: true, collection: 'dms_stock' },
);
stockSchema.index({ location: 1, product: 1 }, { unique: true });
export const DmsStock = mongoose.models.DmsStock || mongoose.model('DmsStock', stockSchema);

/* Serial / IMEI register */
const serialSchema = new Schema(
  {
    serialNo: { type: String, required: true, unique: true, trim: true, uppercase: true },
    product: { type: Schema.Types.ObjectId, ref: 'DmsProduct', required: true },
    location: { type: Schema.Types.ObjectId, ref: 'DmsLocation' }, // current holder (null when sold / in transit)
    status: { type: String, enum: ['IN_STOCK', 'IN_TRANSIT', 'SOLD', 'RETURNED_TO_VENDOR'], default: 'IN_STOCK' },
    activated: { type: Boolean, default: false },
    activatedAt: Date,
    history: [
      {
        _id: false,
        at: { type: Date, default: Date.now },
        docNo: String,
        docKind: String,
        from: String,
        to: String,
        status: String,
      },
    ],
  },
  { timestamps: true, collection: 'dms_serials' },
);
export const DmsSerial = mongoose.models.DmsSerial || mongoose.model('DmsSerial', serialSchema);

/* Stock ledger — one row per stock movement */
const stockLedgerSchema = new Schema(
  {
    location: { type: Schema.Types.ObjectId, ref: 'DmsLocation', required: true, index: true },
    product: { type: Schema.Types.ObjectId, ref: 'DmsProduct', required: true },
    bucket: { type: String, enum: ['OK', 'DAMAGE', 'MISSING'], default: 'OK' },
    opening: Number,
    inQty: { type: Number, default: 0 },
    outQty: { type: Number, default: 0 },
    closing: Number,
    docNo: String,
    docKind: String,
    transferType: String,
    counterparty: String,
  },
  { timestamps: true, collection: 'dms_stock_ledger' },
);
export const DmsStockLedger = mongoose.models.DmsStockLedger || mongoose.model('DmsStockLedger', stockLedgerSchema);

/* Payment receive + account adjustment */
const paymentSchema = new Schema(
  {
    kind: { type: String, enum: ['RECEIPT', 'ADJUSTMENT'], default: 'RECEIPT', index: true },
    docNo: { type: String, required: true, unique: true },
    fromLocation: { type: Schema.Types.ObjectId, ref: 'DmsLocation', required: true }, // payer
    toLocation: { type: Schema.Types.ObjectId, ref: 'DmsLocation', required: true }, // receiver
    adjustType: { type: String, enum: ['CR', 'DR', ''], default: '' },
    payMode: { type: String, enum: ['BANK', 'CASH', 'PAYTM', 'CHEQUE', 'OTHER'], required: true },
    bankName: String,
    bankBranch: String,
    ddChequeNo: String,
    ddChequeDate: Date,
    receiptNo: String,
    transactionId: String,
    amount: { type: Number, required: true, min: 0.01 },
    receivedAmount: { type: Number, default: 0 },
    paymentDate: { type: Date, default: Date.now },
    invoice: { type: Schema.Types.ObjectId, ref: 'DmsInvoice' },
    remark: String,
    status: { type: String, enum: ['PFA', 'Approve', 'Reject', 'Cancelled'], default: 'PFA', index: true },
    approveBy: String,
    approveAt: Date,
    approveRemark: String,
    entryBy: String,
    entryByUser: { type: Schema.Types.ObjectId, ref: 'User' },
    entryIp: String,
  },
  { timestamps: true, collection: 'dms_payments' },
);
export const DmsPayment = mongoose.models.DmsPayment || mongoose.model('DmsPayment', paymentSchema);

/* Party ledger. Convention: `party` is the location whose account is affected.
 * DR = party owes more (invoice raised on it); CR = party paid / credited. */
const ledgerSchema = new Schema(
  {
    party: { type: Schema.Types.ObjectId, ref: 'DmsLocation', required: true, index: true },
    counterparty: { type: Schema.Types.ObjectId, ref: 'DmsLocation' },
    counterpartyName: String,
    docNo: { type: String, required: true },
    docType: { type: String, required: true },
    txnDate: { type: Date, default: Date.now },
    dr: { type: Number, default: 0 },
    cr: { type: Number, default: 0 },
    paymentRemark: String,
    approvalRemark: String,
  },
  { timestamps: true, collection: 'dms_ledger' },
);
export const DmsLedger = mongoose.models.DmsLedger || mongoose.model('DmsLedger', ledgerSchema);
