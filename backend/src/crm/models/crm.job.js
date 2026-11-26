/**
 * Service CRM Job, Customer, Registered Product, and AMC Models.
 * Supports 23 statuses, 54 sub-statuses, full activity history, repair details,
 * estimates, approval requests, and handover / happy calling.
 */
import mongoose from 'mongoose';

const { Schema } = mongoose;

export const JOB_STATUSES = [
  'Open', 'Asigned', 'PNA', 'SFR', 'EP', 'Repair Done', 'WIP', 'Replacement',
  'DOA', 'Handover', 'RWR', 'Cancel', 'BER', 'Received', 'Dispatched', 'QC',
  'Installation Done', 'Demo Done', 'Request For Approval', 'Part Demand',
  'Acknowledged', 'Appointment', 'Pending For Pickup',
];

export const JOB_SUB_STATUSES = [
  'PNA PO Raised', 'PNA PO Processed', 'PNA PO Partial Processed', 'PNA Part Received',
  'SFR Dispatched By ASP', 'Assigned to Engineer', 'PNA at L3/L4', 'SFR Received at L3/L4',
  'Rejected by L3/L4', 'Missing in Courier', 'Repair Done', 'RWR', 'BER',
  'QC Pending', 'QC Pass', 'QC Fail', 'Dispatch Back To ASP', 'Received At ASP',
  'DOA Request', 'DOA Approval', 'DOA Reject', 'DOA Certificate Print',
  'DOA faulty at ASP', 'DOA Faulty Dispatch', 'DOA Faulty Received At WH', 'DOA Poly bag Pending',
  'Replacement Request', 'Replacement Approved', 'Replacement Reject', 'Replacement Issue',
  'Replacement pending due to stock', 'DOA Received At Location(WH)', 'DOA ELS Pass',
  'DOA ELS Fail', 'DOA Replacement issue', 'DOA CN Issue', 'SFR Missing at L3/L4',
  'ELS Done at L3', 'Replacement', 'Estimation Accept', 'Estimation Refused',
  'Other Approval', 'Request Approved', 'Request Rejected', 'Pickup Received',
  'Pickup Approved', 'Visit Scheduled For Pickup', 'Call Assigned to pickup Boy',
  'Pending For Delivery', 'Issue to Delivery Boy',
  'Registered', 'Set Delivered', 'Closed Without Repair', 'Pending',
];

const crmCustomerSchema = new Schema(
  {
    customerId: { type: String, required: true, unique: true, uppercase: true, trim: true },
    category: {
      type: String,
      enum: ['Customer', 'Dealer', 'Distributor', 'ASP', 'Entity', 'VVIP', 'Customer Unit At Dealer Location'],
      default: 'Customer',
    },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true, index: true },
    altPhone: String,
    residenceNo: String,
    email: { type: String, trim: true, index: true },
    address: { type: String, required: true },
    landmark: String,
    state: { type: String, required: true },
    city: { type: String, required: true },
    area: String,
    pincode: { type: String, required: true, index: true },
    gstNo: String,
    registrationName: String,
    dob: Date,
    marriageDate: Date,
  },
  { timestamps: true, collection: 'crm_customers' },
);
export const CrmCustomer = mongoose.models.CrmCustomer || mongoose.model('CrmCustomer', crmCustomerSchema);

const crmRegisteredProductSchema = new Schema(
  {
    customer: { type: Schema.Types.ObjectId, ref: 'CrmCustomer', required: true, index: true },
    product: { type: Schema.Types.ObjectId, ref: 'DmsMaster', required: true },
    brand: { type: Schema.Types.ObjectId, ref: 'DmsMaster', required: true },
    model: { type: Schema.Types.ObjectId, ref: 'CrmModel', required: true },
    serialNo: { type: String, trim: true, index: true },
    purchaseDate: Date,
    installationDate: Date,
    warrantyEndDate: Date,
    warrantyStatus: { type: String, enum: ['IN', 'OUT'], default: 'IN' },
    dealerName: String,
    invoiceNo: String,
    purchaseFrom: String,
    amcNo: { type: String, trim: true, index: true },
    amcStartDate: Date,
    amcExpiryDate: Date,
    amcDurationDays: Number,
    amcType: { type: String, enum: ['Comprehensive', 'Non Comprehensive', ''], default: '' },
    amcAmount: { type: Number, default: 0 },
    amcPaymentMode: String,
    amcPaymentRef: String,
    amcStatus: { type: String, enum: ['None', 'Pending', 'Approved', 'Expired'], default: 'None' },
  },
  { timestamps: true, collection: 'crm_registered_products' },
);
export const CrmRegisteredProduct = mongoose.models.CrmRegisteredProduct || mongoose.model('CrmRegisteredProduct', crmRegisteredProductSchema);

const repairDetailSchema = new Schema(
  {
    faultCode: String,
    faultName: String,
    repairCode: String,
    repairName: String,
    part: { type: Schema.Types.ObjectId, ref: 'CrmPart' },
    partcode: String,
    partName: String,
    qty: { type: Number, default: 1 },
    price: { type: Number, default: 0 },
    swapImei1: String,
    swapImei2: String,
    tagNo: String,
  },
  { _id: false },
);

const historyEntrySchema = new Schema(
  {
    location: String,
    activity: String,
    outcome: String,
    travelKm: { type: Number, default: 0 },
    updateBy: String,
    remark: String,
    priority: { type: String, default: 'Normal' },
    updateOn: { type: Date, default: Date.now },
  },
  { _id: false },
);

const crmJobSchema = new Schema(
  {
    jobNo: { type: String, required: true, unique: true, uppercase: true, trim: true },
    customer: { type: Schema.Types.ObjectId, ref: 'CrmCustomer', required: true, index: true },
    registeredProduct: { type: Schema.Types.ObjectId, ref: 'CrmRegisteredProduct' },
    customerIdCode: String,
    customerName: { type: String, required: true },
    customerCategory: { type: String, default: 'Customer' },
    contactNo: { type: String, required: true },
    altContactNo: String,
    email: String,
    address: String,
    landmark: String,
    state: String,
    city: String,
    area: String,
    pincode: String,

    product: { type: Schema.Types.ObjectId, ref: 'DmsMaster', required: true },
    brand: { type: Schema.Types.ObjectId, ref: 'DmsMaster', required: true },
    model: { type: Schema.Types.ObjectId, ref: 'CrmModel', required: true },
    productName: String,
    brandName: String,
    modelName: String,
    serialNo: { type: String, trim: true, index: true },
    purchaseDate: Date,
    installationDate: Date,
    warrantyEndDate: Date,
    warrantyStatus: { type: String, enum: ['IN', 'OUT'], default: 'IN' },
    callType: {
      type: String,
      enum: ['Repair', 'Installation', 'Re-installation', 'Demo', 'Stock Repair', 'Maintenance service', 'Accessory'],
      default: 'Repair',
    },
    callSource: { type: String, default: 'Call Center' },
    purchaseFrom: { type: String, default: 'Others' },
    dealerName: String,
    invoiceNo: String,
    serviceType: {
      type: String,
      enum: ['Pick and Drop', 'DoorStep', 'Walk in', 'Walk in Appointment'],
      default: 'DoorStep',
    },
    areaType: { type: String, enum: ['Local', 'Upcountry', 'Workshop'], default: 'Local' },

    vocs: [{ type: String }],
    vocText: String,
    remark: String,
    accessories: [{ type: String }],
    deviceImages: [{ type: String }],

    assignLocation: { type: Schema.Types.ObjectId, ref: 'DmsLocation', index: true },
    assignLocationName: String,
    engineer: { type: Schema.Types.ObjectId, ref: 'CrmUserProfile', index: true },
    engineerName: String,
    pickupBoy: { type: Schema.Types.ObjectId, ref: 'CrmUserProfile' },
    deliveryBoy: { type: Schema.Types.ObjectId, ref: 'CrmUserProfile' },

    status: { type: String, enum: JOB_STATUSES, default: 'Open', index: true },
    subStatus: { type: String, enum: JOB_SUB_STATUSES, default: 'Registered' },
    priority: { type: String, enum: ['Normal', 'High'], default: 'Normal' },
    happyCode: String,

    ackStatus: { type: String, enum: ['Pending', 'Accepted', 'Rejected'], default: 'Pending' },
    ackRemark: String,
    ackAt: Date,

    visitDate: Date,
    visitTime: String,
    visitApprovedBy: String,
    visitRemark: String,

    closeType: String,
    closeDocNo: String,
    customerReadyToPay: { type: Boolean, default: false },
    pendingReason: String,
    closeReason: String,

    repairDetails: [repairDetailSchema],

    estimate: {
      parts: [
        {
          part: { type: Schema.Types.ObjectId, ref: 'CrmPart' },
          partcode: String,
          partName: String,
          qty: Number,
          cost: Number,
          taxPct: Number,
          taxAmt: Number,
          total: Number,
        },
      ],
      serviceCharge: { type: Number, default: 0 },
      partCost: { type: Number, default: 0 },
      taxAmt: { type: Number, default: 0 },
      totalAmt: { type: Number, default: 0 },
      status: { type: String, enum: ['None', 'Pending', 'Accepted', 'Refused'], default: 'None' },
    },

    approvalRequest: {
      requestFor: String,
      status: { type: String, enum: ['None', 'Pending', 'Approved', 'Rejected'], default: 'None' },
      remark: String,
      by: String,
      at: Date,
    },

    handover: {
      confirmBy: String,
      contactNo: String,
      remark: String,
      rating: { type: Number, min: 1, max: 5 },
      at: Date,
      happyCallDone: { type: Boolean, default: false },
      happyCallRemark: String,
      happyCallAt: Date,
    },

    openDate: { type: Date, default: Date.now, index: true },
    closeDate: Date,
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    history: [historyEntrySchema],
  },
  { timestamps: true, collection: 'crm_jobs' },
);
export const CrmJob = mongoose.models.CrmJob || mongoose.model('CrmJob', crmJobSchema);
