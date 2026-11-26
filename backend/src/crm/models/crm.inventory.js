/**
 * Service CRM Inventory, PO/PNA, Dispatch, GRN, Ledger, Payment, Claim & Expense Models.
 */
import mongoose from 'mongoose';

const { Schema } = mongoose;

/* Location-level parts stock */
const crmStockSchema = new Schema(
  {
    location: { type: Schema.Types.ObjectId, ref: 'DmsLocation', required: true, index: true },
    part: { type: Schema.Types.ObjectId, ref: 'CrmPart', required: true, index: true },
    fresh: { type: Number, default: 0, min: 0 },
    defective: { type: Number, default: 0, min: 0 },
    damage: { type: Number, default: 0, min: 0 },
    missing: { type: Number, default: 0, min: 0 },
    freshInTransit: { type: Number, default: 0, min: 0 },
    defectiveInTransit: { type: Number, default: 0, min: 0 },
    freshReplace: { type: Number, default: 0, min: 0 },
    msl: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true, collection: 'crm_stock' },
);
crmStockSchema.index({ location: 1, part: 1 }, { unique: true });
export const CrmStock = mongoose.models.CrmStock || mongoose.model('CrmStock', crmStockSchema);

/* Engineer-level parts stock */
const crmEngineerStockSchema = new Schema(
  {
    location: { type: Schema.Types.ObjectId, ref: 'DmsLocation', required: true, index: true },
    engineer: { type: Schema.Types.ObjectId, ref: 'CrmUserProfile', required: true, index: true },
    part: { type: Schema.Types.ObjectId, ref: 'CrmPart', required: true, index: true },
    fresh: { type: Number, default: 0, min: 0 },
    defective: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true, collection: 'crm_engineer_stock' },
);
crmEngineerStockSchema.index({ location: 1, engineer: 1, part: 1 }, { unique: true });
export const CrmEngineerStock = mongoose.models.CrmEngineerStock || mongoose.model('CrmEngineerStock', crmEngineerStockSchema);

/* Stock Movement Ledger */
const crmStockLedgerSchema = new Schema(
  {
    location: { type: Schema.Types.ObjectId, ref: 'DmsLocation', required: true, index: true },
    part: { type: Schema.Types.ObjectId, ref: 'CrmPart', required: true, index: true },
    ledgerType: { type: String, default: 'Fresh' },
    txnType: { type: String, required: true },
    opening: { type: Number, default: 0 },
    qtyChange: { type: Number, required: true },
    closing: { type: Number, default: 0 },
    refType: String,
    refNo: String,
    by: String,
    remark: String,
  },
  { timestamps: true, collection: 'crm_stock_ledger' },
);
export const CrmStockLedger = mongoose.models.CrmStockLedger || mongoose.model('CrmStockLedger', crmStockLedgerSchema);

/* PNA Bucket (pending parts for jobs at ASP before PO is raised) */
const crmPnaBucketSchema = new Schema(
  {
    location: { type: Schema.Types.ObjectId, ref: 'DmsLocation', required: true, index: true },
    job: { type: Schema.Types.ObjectId, ref: 'CrmJob', required: true },
    jobNo: { type: String, required: true },
    part: { type: Schema.Types.ObjectId, ref: 'CrmPart', required: true },
    partcode: String,
    partName: String,
    qty: { type: Number, default: 1, min: 1 },
    status: { type: String, enum: ['Pending', 'PO Raised', 'Deleted'], default: 'Pending', index: true },
    poNo: String,
  },
  { timestamps: true, collection: 'crm_pna_bucket' },
);
export const CrmPnaBucket = mongoose.models.CrmPnaBucket || mongoose.model('CrmPnaBucket', crmPnaBucketSchema);

/* Purchase Orders: PNA, MSL (ASP → WH), VENDOR (WH → Vendor) */
const crmPoLineSchema = new Schema(
  {
    part: { type: Schema.Types.ObjectId, ref: 'CrmPart', required: true },
    partcode: String,
    partName: String,
    jobNo: String,
    reqQty: { type: Number, required: true, min: 1 },
    dispQty: { type: Number, default: 0 },
    recQty: { type: Number, default: 0 },
    price: { type: Number, default: 0 },
    cgst: { type: Number, default: 0 },
    sgst: { type: Number, default: 0 },
    igst: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
  },
  { _id: false },
);

const crmPoSchema = new Schema(
  {
    poNo: { type: String, required: true, unique: true, uppercase: true, trim: true },
    poType: { type: String, enum: ['PNA', 'MSL', 'VENDOR'], required: true, index: true },
    fromLocation: { type: Schema.Types.ObjectId, ref: 'DmsLocation', required: true, index: true },
    toLocation: { type: Schema.Types.ObjectId, ref: 'DmsLocation', index: true },
    supplier: { type: Schema.Types.ObjectId, ref: 'DmsVendor' },
    vendorType: { type: String, enum: ['Local', 'Interstate', 'Import', ''], default: '' },
    docType: { type: String, enum: ['Invoice', 'Challan', ''], default: 'Invoice' },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected', 'Processed', 'Partial Processed', 'Dispatched', 'Received', 'Cancelled'],
      default: 'Pending',
      index: true,
    },
    items: [crmPoLineSchema],
    totalQty: { type: Number, default: 0 },
    subTotal: { type: Number, default: 0 },
    taxTotal: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },
    remark: String,
    approvedBy: String,
    approvedAt: Date,
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true, collection: 'crm_pos' },
);
export const CrmPo = mongoose.models.CrmPo || mongoose.model('CrmPo', crmPoSchema);

/* Dispatch / Invoice / Challan / STN / Purchase Return / Faulty Dispatch / Retail Invoice */
const crmDispatchLineSchema = new Schema(
  {
    part: { type: Schema.Types.ObjectId, ref: 'CrmPart', required: true },
    partcode: String,
    partName: String,
    jobNo: String,
    serialNo: String,
    qty: { type: Number, required: true, min: 1 },
    okQty: { type: Number, default: 0 },
    damageQty: { type: Number, default: 0 },
    missingQty: { type: Number, default: 0 },
    price: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    cgst: { type: Number, default: 0 },
    sgst: { type: Number, default: 0 },
    igst: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
  },
  { _id: false },
);

const crmDispatchSchema = new Schema(
  {
    docNo: { type: String, required: true, unique: true, uppercase: true, trim: true },
    docType: {
      type: String,
      enum: ['Invoice', 'Delivery Challan', 'STN', 'Purchase Return', 'Faulty Dispatch', 'Retail Invoice', 'Engineer Issue', 'Engineer Return'],
      required: true,
      index: true,
    },
    fromLocation: { type: Schema.Types.ObjectId, ref: 'DmsLocation', required: true, index: true },
    toLocation: { type: Schema.Types.ObjectId, ref: 'DmsLocation', index: true },
    toEngineer: { type: Schema.Types.ObjectId, ref: 'CrmUserProfile' },
    customerName: String,
    customerState: String,
    customerGstn: String,
    customerPhone: String,
    customerEmail: String,
    deliveryAddress: String,
    poNo: String,
    jobNo: String,
    stockType: { type: String, enum: ['Fresh', 'Faulty', 'OK'], default: 'Fresh' },
    purpose: String,
    courierName: String,
    docketNo: String,
    vehicleNo: String,
    fcaInvoiceNo: String,
    status: { type: String, enum: ['Processed', 'Dispatched', 'Received', 'Cancelled'], default: 'Dispatched', index: true },
    items: [crmDispatchLineSchema],
    totalQty: { type: Number, default: 0 },
    subTotal: { type: Number, default: 0 },
    taxTotal: { type: Number, default: 0 },
    roundOff: { type: Number, default: 0 },
    grandTotal: { type: Number, default: 0 },
    remark: String,
    receivedAt: Date,
    receivedBy: String,
    receiveRemark: String,
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true, collection: 'crm_dispatches' },
);
export const CrmDispatch = mongoose.models.CrmDispatch || mongoose.model('CrmDispatch', crmDispatchSchema);

/* GRN (Vendor PO Gate Entry + Receive GRN + Local GRN) */
const crmGrnSchema = new Schema(
  {
    grnNo: { type: String, required: true, unique: true, uppercase: true, trim: true },
    grnType: { type: String, enum: ['Local', 'PO'], required: true },
    poNo: String,
    supplier: { type: Schema.Types.ObjectId, ref: 'DmsVendor' },
    billTo: { type: Schema.Types.ObjectId, ref: 'DmsLocation' },
    shipTo: { type: Schema.Types.ObjectId, ref: 'DmsLocation', required: true },
    gateEntryNo: String,
    vehicleNo: String,
    transportName: String,
    docketNo: String,
    invoiceNo: String,
    invoiceDate: Date,
    status: { type: String, enum: ['Gate Entry', 'Received'], default: 'Gate Entry' },
    items: [crmDispatchLineSchema],
    totalQty: { type: Number, default: 0 },
    subTotal: { type: Number, default: 0 },
    taxTotal: { type: Number, default: 0 },
    grandTotal: { type: Number, default: 0 },
    remark: String,
    receivedAt: Date,
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true, collection: 'crm_grns' },
);
export const CrmGrn = mongoose.models.CrmGrn || mongoose.model('CrmGrn', crmGrnSchema);

/* Party Account Ledger (Main / Security / Claim) */
const crmLedgerSchema = new Schema(
  {
    location: { type: Schema.Types.ObjectId, ref: 'DmsLocation', required: true, index: true },
    accountType: { type: String, enum: ['Main', 'Security', 'Claim'], required: true, index: true },
    txnType: { type: String, required: true },
    refNo: String,
    details: String,
    cr: { type: Number, default: 0 },
    dr: { type: Number, default: 0 },
    txnDate: { type: Date, default: Date.now },
    by: String,
  },
  { timestamps: true, collection: 'crm_ledgers' },
);
export const CrmLedger = mongoose.models.CrmLedger || mongoose.model('CrmLedger', crmLedgerSchema);

/* Payment (ASP → WH) */
const crmPaymentSchema = new Schema(
  {
    docNo: { type: String, required: true, unique: true, uppercase: true, trim: true },
    fromLocation: { type: Schema.Types.ObjectId, ref: 'DmsLocation', required: true },
    toLocation: { type: Schema.Types.ObjectId, ref: 'DmsLocation', required: true },
    amount: { type: Number, required: true, min: 1 },
    mode: { type: String, enum: ['Cash', 'DD', 'Cheque', 'NEFT', 'RTGS'], required: true },
    bankName: String,
    accountNo: String,
    ddChequeNo: String,
    ddDate: Date,
    courierName: String,
    docketNo: String,
    attachment: String,
    status: { type: String, enum: ['Pending', 'Received', 'Rejected'], default: 'Pending' },
    remark: String,
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true, collection: 'crm_payments' },
);
export const CrmPayment = mongoose.models.CrmPayment || mongoose.model('CrmPayment', crmPaymentSchema);

/* Claims (Labour / Travel / Partner) */
const crmClaimSchema = new Schema(
  {
    docNo: { type: String, required: true, unique: true, uppercase: true, trim: true },
    month: { type: Number, required: true },
    year: { type: Number, required: true },
    location: { type: Schema.Types.ObjectId, ref: 'DmsLocation', required: true },
    claimType: { type: String, enum: ['Labour', 'Travel', 'Partner'], required: true },
    jobs: [{ job: { type: Schema.Types.ObjectId, ref: 'CrmJob' }, jobNo: String, amount: Number }],
    totalAmount: { type: Number, default: 0 },
    status: { type: String, enum: ['Generated', 'Approved', 'Invoiced', 'Paid'], default: 'Generated' },
    courierName: String,
    docketNo: String,
    dispatchDate: Date,
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true, collection: 'crm_claims' },
);
export const CrmClaim = mongoose.models.CrmClaim || mongoose.model('CrmClaim', crmClaimSchema);

/* Expenses */
const crmExpenseSchema = new Schema(
  {
    refNo: { type: String, required: true, unique: true, uppercase: true, trim: true },
    location: { type: Schema.Types.ObjectId, ref: 'DmsLocation', required: true },
    payeeName: { type: String, required: true },
    voucherType: { type: String, required: true },
    expenseDate: { type: Date, default: Date.now },
    items: [{ description: String, amount: Number }],
    amount: { type: Number, default: 0 },
    attachment: String,
    status: { type: String, enum: ['Pending For Approval', 'Paid', 'Unpaid', 'Rejected', 'Cancelled'], default: 'Pending For Approval' },
    remark: String,
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true, collection: 'crm_expenses' },
);
export const CrmExpense = mongoose.models.CrmExpense || mongoose.model('CrmExpense', crmExpenseSchema);
