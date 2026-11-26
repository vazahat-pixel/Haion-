/**
 * Service CRM (CANCRM V6) Master Data Models.
 * Shares Brand, Product, State, City, Courier, HSN, Vendor, and Location with DMS
 * (`DmsMaster`, `DmsHsn`, `DmsLocation`, `DmsVendor`) while keeping CRM-specific
 * masters, models, parts, and user profiles in `crm_*` collections.
 */
import mongoose from 'mongoose';

const { Schema } = mongoose;
const STATUS = ['Active', 'Deactive'];

export const CRM_ROLES = ['Admin', 'Call Center', 'ASP', 'WH'];
export const CRM_USER_TYPES = [
  'Admin', 'Call Center', 'ASP', 'WH',
  'Engineer', 'Pickup Boy', 'Delivery boy', 'Cordinator',
];

/* CRM User Profile — links Haion User to a CRM role, location, and page rights */
const crmUserProfileSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    loginId: { type: String, required: true, unique: true, uppercase: true, trim: true },
    displayName: { type: String, required: true, trim: true },
    crmRole: { type: String, enum: CRM_ROLES, required: true, index: true },
    userType: { type: String, enum: CRM_USER_TYPES, required: true },
    location: { type: Schema.Types.ObjectId, ref: 'DmsLocation', default: null },
    phone: String,
    email: String,
    pages: [{ type: String }],
    scopes: {
      regions: [{ type: String }],
      states: [{ type: String }],
    },
    status: { type: String, enum: STATUS, default: 'Active' },
  },
  { timestamps: true, collection: 'crm_user_profiles' },
);
export const CrmUserProfile = mongoose.models.CrmUserProfile || mongoose.model('CrmUserProfile', crmUserProfileSchema);

/* Generic CRM lookup masters */
export const CRM_MASTER_TYPES = [
  'purchaseFrom',
  'voc',
  'fault',
  'repairAction',
  'pendingReason',
  'feedback',
  'holiday',
  'pincode',
  'accountHead',
  'accountSection',
  'voucherMaster',
  'bankAccount',
  'software',
  'notice',
  'claimRate',
];

const crmMasterSchema = new Schema(
  {
    type: { type: String, enum: CRM_MASTER_TYPES, required: true, index: true },
    code: { type: String, trim: true },
    name: { type: String, required: true, trim: true },
    brand: { type: Schema.Types.ObjectId, ref: 'DmsMaster', default: null },
    product: { type: Schema.Types.ObjectId, ref: 'DmsMaster', default: null },
    model: { type: Schema.Types.ObjectId, ref: 'CrmModel', default: null },
    state: { type: String, trim: true },
    city: { type: String, trim: true },
    attrs: { type: Schema.Types.Mixed, default: {} },
    status: { type: String, enum: STATUS, default: 'Active' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true, collection: 'crm_masters' },
);
crmMasterSchema.index({ type: 1, name: 1, code: 1 });
export const CrmMaster = mongoose.models.CrmMaster || mongoose.model('CrmMaster', crmMasterSchema);

/* Service CRM Model Master */
const crmModelSchema = new Schema(
  {
    modelCode: { type: String, required: true, unique: true, uppercase: true, trim: true },
    modelName: { type: String, required: true, trim: true },
    technicalName: { type: String, trim: true },
    product: { type: Schema.Types.ObjectId, ref: 'DmsMaster', required: true },
    brand: { type: Schema.Types.ObjectId, ref: 'DmsMaster', required: true },
    imeiLength: { type: Number, default: 0 },
    softwareVersion: String,
    makeJob: { type: Boolean, default: true },
    repairWarrantyDays: { type: Number, default: 90 },
    makeDoa: { type: Boolean, default: false },
    doaDays: { type: Number, default: 0 },
    repairable: { type: Boolean, default: true },
    outWarranty: { type: Boolean, default: true },
    replacement: { type: Boolean, default: false },
    replaceDays: { type: Number, default: 0 },
    checkImei: { type: Boolean, default: false },
    customerWarrantyDays: { type: Number, default: 365 },
    amcDays: { type: Number, default: 365 },
    amcAmount: { type: Number, default: 0 },
    terms: String,
    releaseDate: Date,
    serviceCharges: { type: Number, default: 0 },
    companyModel: String,
    dealerWarranty: { type: Number, default: 0 },
    status: { type: String, enum: STATUS, default: 'Active' },
  },
  { timestamps: true, collection: 'crm_models' },
);
export const CrmModel = mongoose.models.CrmModel || mongoose.model('CrmModel', crmModelSchema);

/* Service CRM Partcode Master */
const crmPartSchema = new Schema(
  {
    partcode: { type: String, required: true, unique: true, uppercase: true, trim: true },
    partName: { type: String, required: true, trim: true },
    description: String,
    vendorPartcode: String,
    product: { type: Schema.Types.ObjectId, ref: 'DmsMaster', required: true },
    brand: { type: Schema.Types.ObjectId, ref: 'DmsMaster', required: true },
    models: [{ type: Schema.Types.ObjectId, ref: 'CrmModel' }],
    hsnCode: { type: String, trim: true },
    purchasePrice: { type: Number, default: 0, min: 0 },
    locationPrice: { type: Number, default: 0, min: 0 },
    customerPrice: { type: Number, default: 0, min: 0 },
    partCategory: { type: String, enum: ['Accessory', 'Component', 'Box', 'Unit', 'TAG'], default: 'Component' },
    partFor: { type: String, enum: ['ALL', 'ASP', 'DIST', 'WH'], default: 'ALL' },
    faultyDispatchToWh: { type: Boolean, default: true },
    warrantyDays: { type: Number, default: 90 },
    dealerWarrantyDays: { type: Number, default: 90 },
    alternatePartcodes: [{ type: String, uppercase: true, trim: true }],
    status: { type: String, enum: STATUS, default: 'Active' },
  },
  { timestamps: true, collection: 'crm_parts' },
);
export const CrmPart = mongoose.models.CrmPart || mongoose.model('CrmPart', crmPartSchema);

/* Counter helper for CRM document sequences */
const crmCounterSchema = new Schema(
  {
    _id: { type: String, required: true },
    seq: { type: Number, default: 0 },
  },
  { collection: 'crm_counters' },
);
export const CrmCounter = mongoose.models.CrmCounter || mongoose.model('CrmCounter', crmCounterSchema);

export async function nextCrmSeq(key) {
  const doc = await CrmCounter.findByIdAndUpdate(key, { $inc: { seq: 1 } }, { upsert: true, new: true });
  return doc.seq;
}
