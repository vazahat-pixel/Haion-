/**
 * DMS (Distributor Management System) master data models.
 * Isolated `dms_*` collections — see reference-audit/reuse-matrix.md for why
 * existing Haion models (Dealer, Product, Party, …) are not reused directly.
 */
import mongoose from 'mongoose';

const { Schema } = mongoose;
const STATUS = ['Active', 'Deactive'];

/* Simple lookup masters: brand, category, subcategory, color, city, courier,
 * account, othertax, parameter, coupon, specification, department, … */
export const MASTER_TYPES = [
  'brand', 'category', 'subcategory', 'color', 'state', 'city', 'courier', 'account',
  'othertax', 'parameter', 'coupon', 'specification', 'productdelivery', 'productimage',
];

const masterSchema = new Schema(
  {
    type: { type: String, enum: MASTER_TYPES, required: true, index: true },
    name: { type: String, required: true, trim: true },
    code: { type: String, trim: true },
    parent: { type: Schema.Types.ObjectId, ref: 'DmsMaster' }, // subcategory → category, city → state
    attrs: { type: Schema.Types.Mixed, default: {} },
    status: { type: String, enum: STATUS, default: 'Active' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true, collection: 'dms_masters' },
);
masterSchema.index({ type: 1, name: 1, parent: 1 }, { unique: true });
export const DmsMaster = mongoose.models.DmsMaster || mongoose.model('DmsMaster', masterSchema);

/* HSN tax master */
const hsnSchema = new Schema(
  {
    chapterNo: String,
    hsnCode: { type: String, required: true, unique: true, trim: true },
    description: String,
    cgst: { type: Number, default: 0, min: 0 },
    sgst: { type: Number, default: 0, min: 0 },
    igst: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: STATUS, default: 'Active' },
  },
  { timestamps: true, collection: 'dms_hsn' },
);
export const DmsHsn = mongoose.models.DmsHsn || mongoose.model('DmsHsn', hsnSchema);

/* Product master */
const productSchema = new Schema(
  {
    productCode: { type: String, required: true, unique: true, trim: true, uppercase: true },
    name: { type: String, required: true, trim: true },
    category: { type: Schema.Types.ObjectId, ref: 'DmsMaster', required: true },
    subCategory: { type: Schema.Types.ObjectId, ref: 'DmsMaster' },
    brand: { type: Schema.Types.ObjectId, ref: 'DmsMaster', required: true },
    color: { type: String, default: 'NONE' },
    hsnCode: { type: String, trim: true },
    description: String,
    warrantyDays: { type: Number, default: 0 },
    eol: String,
    warrantyTerms: String,
    rewardPoint: { type: Number, default: 0 },
    rewardStartDate: Date,
    rewardEndDate: Date,
    isSerialized: { type: Boolean, default: false }, // IMEI / serial tracked
    status: { type: String, enum: STATUS, default: 'Active' },
  },
  { timestamps: true, collection: 'dms_products' },
);
export const DmsProduct = mongoose.models.DmsProduct || mongoose.model('DmsProduct', productSchema);

/* Location master — HO / Branch / Super Stockist / Distributor / Dealer / Retailer */
export const LOCATION_TYPES = {
  'Head Office': 'HO',
  Branch: 'BR',
  'Super Stockist': 'SS',
  Distributor: 'DS',
  Dealer: 'DL',
  Retailer: 'RT',
};
const locationSchema = new Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    locationType: { type: String, enum: Object.keys(LOCATION_TYPES), required: true },
    region: { type: String, enum: ['EAST', 'NORTH', 'SOUTH', 'WEST', ''], default: '' },
    state: { type: String, required: true },
    stateCode: { type: String, required: true }, // 2-letter, e.g. UP
    city: { type: String, required: true },
    contactPerson: String,
    phone: String,
    email: String,
    landline: String,
    landmark: String,
    pincode: String,
    stNo: String,
    cstNo: String,
    panNo: String,
    gstNo: String,
    proprietorType: { type: String, enum: ['OWNED', 'PARTNERSHIP', 'NO PAN NUMBER', ''], default: '' },
    tdsPercent: { type: Number, default: 0 },
    bank: {
      accountHolder: String,
      accountNo: String,
      bankName: String,
      bankCity: String,
      ifsc: String,
    },
    billingAddress: { type: String, required: true },
    dispatchAddress: String,
    docPrefix: { type: String, uppercase: true, trim: true }, // "Unique Document Code" e.g. AGR
    parent: { type: Schema.Types.ObjectId, ref: 'DmsLocation', default: null },
    mappedLocations: [{ type: Schema.Types.ObjectId, ref: 'DmsLocation' }], // who may transact with whom
    creditLimit: { type: Number, default: 0 },
    remark: String,
    status: { type: String, enum: STATUS, default: 'Active' },
    history: [{ at: Date, by: String, change: String }],
  },
  { timestamps: true, collection: 'dms_locations' },
);
export const DmsLocation = mongoose.models.DmsLocation || mongoose.model('DmsLocation', locationSchema);

/* Vendor master (domestic + foreign) */
const vendorSchema = new Schema(
  {
    code: { type: String, unique: true, uppercase: true },
    name: { type: String, required: true, trim: true },
    isForeign: { type: Boolean, default: false },
    contactPerson: String,
    phone: String,
    email: String,
    address: String,
    city: String,
    state: String,
    stateCode: String,
    country: { type: String, default: 'India' },
    gstNo: String,
    panNo: String,
    status: { type: String, enum: STATUS, default: 'Active' },
  },
  { timestamps: true, collection: 'dms_vendors' },
);
export const DmsVendor = mongoose.models.DmsVendor || mongoose.model('DmsVendor', vendorSchema);

/* Retail customer master */
const customerSchema = new Schema(
  {
    customerId: { type: String, unique: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true },
    email: String,
    country: { type: String, default: 'India' },
    state: { type: String, required: true },
    stateCode: String,
    city: { type: String, required: true },
    location: { type: Schema.Types.ObjectId, ref: 'DmsLocation', required: true },
    address: String,
    customerType: { type: String, default: 'RETAIL' },
    gstin: String,
    status: { type: String, enum: STATUS, default: 'Active' },
  },
  { timestamps: true, collection: 'dms_customers' },
);
export const DmsCustomer = mongoose.models.DmsCustomer || mongoose.model('DmsCustomer', customerSchema);

/* Price master: state × location type × product */
const priceSchema = new Schema(
  {
    state: { type: String, required: true },
    locationType: { type: String, enum: Object.keys(LOCATION_TYPES), required: true },
    product: { type: Schema.Types.ObjectId, ref: 'DmsProduct', required: true },
    mrp: { type: Number, default: 0, min: 0 },
    price: { type: Number, required: true, min: 0 },
    status: { type: String, enum: STATUS, default: 'Active' },
  },
  { timestamps: true, collection: 'dms_prices' },
);
priceSchema.index({ state: 1, locationType: 1, product: 1 }, { unique: true });
export const DmsPrice = mongoose.models.DmsPrice || mongoose.model('DmsPrice', priceSchema);

/* Scheme master */
const schemeSchema = new Schema(
  {
    code: { type: String, unique: true },
    name: { type: String, required: true },
    fromDate: { type: Date, required: true },
    toDate: { type: Date, required: true },
    products: [{ type: Schema.Types.ObjectId, ref: 'DmsProduct' }],
    discountType: { type: String, enum: ['PERCENT', 'FLAT', 'FOC'], default: 'FLAT' },
    discountValue: { type: Number, default: 0 },
    status: { type: String, enum: STATUS, default: 'Active' },
  },
  { timestamps: true, collection: 'dms_schemes' },
);
export const DmsScheme = mongoose.models.DmsScheme || mongoose.model('DmsScheme', schemeSchema);

/* DMS user profile — links a Haion login (User) to a DMS user type + location + page rights */
export const DMS_USER_TYPES = [
  'Admin', 'Sales Head', 'Regional Sales Head', 'State Head', 'Area Sales Manager',
  'Territory Sales Manager', 'Sales Executive', 'Location User',
];
const profileSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    loginId: { type: String, required: true, unique: true, uppercase: true, trim: true },
    displayName: { type: String, required: true },
    userType: { type: String, enum: DMS_USER_TYPES, required: true },
    location: { type: Schema.Types.ObjectId, ref: 'DmsLocation' },
    pages: [{ type: String }], // page keys, e.g. "po", "po_approval"; empty + Admin = all
    status: { type: String, enum: STATUS, default: 'Active' },
  },
  { timestamps: true, collection: 'dms_profiles' },
);
export const DmsProfile = mongoose.models.DmsProfile || mongoose.model('DmsProfile', profileSchema);
