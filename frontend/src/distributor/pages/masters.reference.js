/**
 * Master pages as the reference shows them (list columns, filters, add-form labels / order, buttons, titles),
 * read from the live reference on 20-Nov-2026. Applied on top of masters.config.js / masters.extra.config.js.
 * Imported for its side effect on MASTERS.
 */
import { fmt } from '../api';
import { MASTERS, STATES, stateCodeOf } from './masters.config';
import './masters.extra.config';

const STATUS = { name: 'status', label: 'Status', type: 'select', options: ['Active', 'Deactive'], placeholder: false };
const statusFilter = { name: 'status', label: 'Status', options: ['Active', 'Deactive'] };
const ATTR = (r) => r.attrs || {};
const attrCol = (key, label, extra = {}) => ({ key, label, text: (r) => ATTR(r)[key], ...extra });
const flat = (r) => ({ ...r, ...ATTR(r) });
const packAttrs = (v, keys) => ({ name: v.name, code: v.code, status: v.status, attrs: Object.fromEntries(keys.map((k) => [k, v[k]])) });
const mapLink = (key, text) => ({ key: 'map', label: text, link: (r) => `/distributor/masters/${key}/${r._id}/map-locations`, linkText: text });
const CIRCLES = ['EAST', 'NORTH', 'SOUTH', 'WEST'];
const set = (key, o) => { MASTERS[key] = { ...MASTERS[key], ...o }; };

/* Account: Account Type BANK / CASH / CHEQUE / OTHER / PAYTM, Address, Ref. Remark; Mapping after View/Edit */
set('account', {
  columns: [{ key: '#', label: '#' }, { key: 'name', label: 'Account Name' }, attrCol('accountNo', 'Account No.'), attrCol('accountType', 'Account Type'), { key: 'status', label: 'Status' }],
  afterEdit: [{ ...mapLink('account', 'Mapping'), linkText: 'Mapping' }],
  fields: [
    { name: 'accountType', label: 'Account Type', type: 'select', required: true, options: ['BANK', 'CASH', 'CHEQUE', 'OTHER', 'PAYTM'], placeholder: '--Please Select--' },
    { name: 'name', label: 'Account Name', required: true }, { name: 'accountNo', label: 'Account No.', required: true },
    { name: 'address', label: 'Address', type: 'textarea' }, { name: 'refRemark', label: 'Ref. Remark', type: 'textarea' }, STATUS,
  ],
  toForm: flat, fromForm: (v) => packAttrs({ ...v, mappedLocations: v.mappedLocations || [] }, ['accountNo', 'accountType', 'address', 'refRemark', 'bankName', 'ifsc', 'mappedLocations']),
  mappingLabel: 'Account Name',
});

/* City: filters State / City; form State Name, City Name */
set('city', {
  filters: [{ name: 'a_state', label: 'State', options: STATES.map((s) => s.value) }, { name: 'search', label: 'City', optionsFrom: 'cities', dependsOn: 'a_state' }],
  fields: [{ name: 'state', label: 'State Name', type: 'select', required: true, options: STATES, placeholder: '--Please Select--' }, { name: 'name', label: 'City Name', required: true }, STATUS],
});

/* Coupon: Coupon Name, Amount, Valid From / To, Remark, Status (Activate / Deactivate); Coupon Mapping page */
set('coupon', {
  columns: [
    { key: '#', label: 'S.No' }, { key: 'name', label: 'Coupon Code' }, attrCol('validFrom', 'Valid From'), attrCol('validTo', 'Valid To'), attrCol('amount', 'Amount', { align: 'r' }),
    { key: 'createdAt', label: 'Create Date', text: (r) => fmt.date(r.createdAt) }, { key: 'status', label: 'Status' },
  ],
  afterEdit: [{ key: 'map', label: 'Coupon Mapping', link: (r) => `/distributor/masters/coupon/${r._id}/map-locations`, linkText: 'Coupon Mapping' }],
  fields: [
    { name: 'name', label: 'Coupon Name', required: true, lockOnEdit: true }, { name: 'amount', label: 'Amount', type: 'number', required: true },
    { name: 'validFrom', label: 'Valid From', type: 'date', required: true }, { name: 'validTo', label: 'Valid To', type: 'date', required: true },
    { name: 'remark', label: 'Remark', type: 'textarea' }, { ...STATUS, options: [{ value: 'Active', label: 'Activate' }, { value: 'Deactive', label: 'Deactivate' }] },
  ],
  toForm: flat, fromForm: (v) => packAttrs(v, ['amount', 'validFrom', 'validTo', 'remark', 'mappedLocations']), mappingLabel: 'Coupon',
});

/* Courier: filters State / City / Status; "Edit" column; title Add/Edit Courier */
set('courier', {
  filters: [{ name: 'a_state', label: 'State', options: STATES.map((s) => s.value) }, { name: 'a_city', label: 'City', optionsFrom: 'cities', dependsOn: 'a_state' }, statusFilter],
  editLabel: 'Edit', addTitle: 'Add/Edit Courier', editTitle: 'Add/Edit Courier',
});

/* Customer: filters, History column, Send Mail / Send SMS, form "Enter New Customer Details" */
set('customers', {
  filters: [
    { name: 'state', label: 'Customer State', options: STATES }, { name: 'city', label: 'Customer City', optionsFrom: 'cities', dependsOn: 'state' },
    { name: 'location', label: 'Location', optionsFrom: 'locations' }, { name: 'customerType', label: 'Customer Type', options: ['RETAIL'] },
    { name: 'status', label: 'Customer Status', options: ['Active', 'Deactive'] },
  ],
  columns: [
    { key: '#', label: '#' }, { key: 'customerId', label: 'Customer Id' }, { key: 'name', label: 'Customer Name' },
    { key: 'state', label: 'State' }, { key: 'customerType', label: 'Customer Type' }, { key: 'status', label: 'Status' },
  ],
  historyCol: true, contactButtons: true, addTitle: 'Enter New Customer Details', submitLabel: 'Add',
  fields: [
    { name: 'name', label: 'Customer Name', required: true }, { name: 'phone', label: 'Contact No', required: true, pattern: '\\d{10}' },
    { name: 'email', label: 'Email:', type: 'email' }, { name: 'country', label: 'Country' },
    { name: 'state', label: 'State', type: 'select', required: true, options: STATES, placeholder: '--None--' },
    { name: 'city', label: 'City', type: 'select', required: true, optionsFrom: 'cities', dependsOn: 'state', placeholder: '--Select City--' },
    { name: 'location', label: 'Location', type: 'select', required: true, optionsFrom: 'locations' },
    { name: 'address', label: 'Address', type: 'textarea', required: true },
    { name: 'customerType', label: 'Customer Type', type: 'select', options: ['RETAIL'], placeholder: false }, { name: 'gstin', label: 'GSTIN' }, STATUS,
  ],
});

/* Location: filters State / City / Type / Status; History column; reference form labels */
const L = MASTERS.locations.fields;
const relabel = (name, label, extra = {}) => ({ ...L.find((x) => x.name === name), label, ...extra });
set('locations', {
  filters: [
    { name: 'state', label: 'Location State', options: STATES }, { name: 'city', label: 'Location City', optionsFrom: 'cities', dependsOn: 'state' },
    { name: 'locationType', label: 'Location Type', optionsFrom: 'locationTypes' }, { name: 'status', label: 'Location Status', options: ['Active', 'Deactive'] },
  ],
  columns: MASTERS.locations.columns.filter((c) => !['parent', 'map'].includes(c.key)),
  afterEdit: [{ key: 'map', label: 'Mapping', link: (r) => `/distributor/masters/locations/${r._id}/mapping`, linkText: 'Mapping' }],
  historyCol: true,
  fields: [
    relabel('region', 'Region/Circle'), relabel('state', 'State'), { name: 'city', label: 'City', type: 'select', required: true, optionsFrom: 'cities', dependsOn: 'state' },
    relabel('locationType', 'Location Type'), relabel('name', 'Organization Name'), relabel('contactPerson', 'Contact Person'),
    relabel('phone', 'Contact Number'), relabel('email', 'Email'), relabel('landline', 'Landline Number'), relabel('landmark', 'Landmark'), relabel('pincode', 'Pincode'),
    relabel('stNo', 'Service Tax No.'), relabel('cstNo', 'LST / CST Number'), relabel('panNo', 'PAN Number'), relabel('gstNo', 'GST Number'),
    relabel('proprietorType', 'Proprietor Type'), relabel('tdsPercent', 'TDS %'),
    relabel('bank.accountHolder', 'Bank Account Holder Name'), relabel('bank.accountNo', 'Bank Account No.'), relabel('bank.bankName', 'Bank Name'), relabel('bank.bankCity', 'Bank City'),
    relabel('billingAddress', 'Billing Address'), relabel('dispatchAddress', 'Delivery/Shipping Address'),
    relabel('docPrefix', 'Unique Document Code (Please enter a 3 character code)'), relabel('parent', 'Parent Location'),
    relabel('remark', 'Remark'), relabel('bank.ifsc', 'IFSC Code'), relabel('creditLimit', 'Credit Limit'), relabel('status', 'Status'),
  ],
});

/* Other Tax: "Tax %" */
set('othertax', { fields: [{ name: 'name', label: 'Tax Name', required: true }, { name: 'percent', label: 'Tax %', type: 'number', required: true }, { ...STATUS, placeholder: '--Please Select--' }] });

/* Parameter: filter by Product Sub Category */
set('parameter', { filters: [{ name: 'parent', label: 'Product Sub Category', optionsFrom: 'subcategories' }, statusFilter] });

/* Price: Product, Product Price, Product Mrp + a tick-box per state (Check All / Uncheck All); one record per state */
set('prices', {
  filters: [{ name: 'state', label: 'Location State', options: STATES }, { name: 'product', label: 'Product', optionsFrom: 'products' }, { name: 'locationType', label: 'Location Type', optionsFrom: 'locationTypes' }],
  fields: [
    { name: 'product', label: 'Product', type: 'select', required: true, optionsFrom: 'products', placeholder: '--Please Select--' },
    { name: 'price', label: 'Product Price', type: 'number', required: true }, { name: 'mrp', label: 'Product Mrp', type: 'number', required: true },
    { name: 'states', label: 'State', tableHeader: 'State *', type: 'checklist', options: STATES.map((s) => s.value), full: true, addOnly: true },
    { name: 'locationTypes', label: 'Location Type', tableHeader: 'Location Type *', type: 'checklist', optionsFrom: 'locationTypes', full: true, addOnly: true },
    { name: 'state', label: 'State', type: 'select', required: true, options: STATES, editOnly: true },
    { name: 'locationType', label: 'Location Type', type: 'select', required: true, optionsFrom: 'locationTypes', editOnly: true }, STATUS,
  ],
  // one price record per ticked state × location type, as the reference creates them
  multiCreate: { expand: ({ states = [], locationTypes = [], ...rest }) => states.flatMap((st) => locationTypes.map((lt) => ({ ...rest, state: st, locationType: lt }))), message: 'Tick at least one state and one location type' },
  defaults: { states: [], locationTypes: [] },
});

/* Product Category: S.No / Product Name columns, Category Name + Short Code */
set('category', {
  addLabel: 'Add New Category', addTitle: 'Product Category', editTitle: 'Product Category',
  columns: [{ key: '#', label: 'S.No' }, { key: 'name', label: 'Product Name' }, { key: 'status', label: 'Status' }],
  fields: [{ name: 'name', label: 'Category Name', required: true }, { name: 'code', label: 'Short Code' }, STATUS],
});

/* Product Sub Category: filter Product Category; "Product Sub Category Name" */
set('subcategory', {
  filters: [statusFilter, { name: 'parent', label: 'Product Category', optionsFrom: 'categories' }],
  addTitle: 'Product Sub Category', editTitle: 'Product Sub Category',
  fields: [{ name: 'parent', label: 'Product Category', type: 'select', required: true, optionsFrom: 'categories' }, { name: 'name', label: 'Product Sub Category Name', required: true }, STATUS],
});

/* Product Delivery: filters From / To Location, Product Category */
set('productdelivery', {
  columns: MASTERS.productdelivery.columns.filter((c) => c.key !== 'status'),
  filters: [{ name: 'a_fromCity', label: 'From Location', optionsFrom: 'cities' }, { name: 'a_toCity', label: 'To Location', optionsFrom: 'cities' }, { name: 'a_category', label: 'Product Category', optionsFrom: 'categories', byName: true }],
});

/* Product Image / Specification: Product Category, Sub Category, Brand, Product pickers */
const productPickers = [
  { name: 'categoryPick', label: 'Product Category', type: 'select', optionsFrom: 'categories', placeholder: 'All' },
  { name: 'subCategoryPick', label: 'Product Sub Category', type: 'select', optionsFrom: 'subcategories', dependsOn: 'categoryPick', placeholder: 'All' },
  { name: 'brandPick', label: 'Brand', type: 'select', optionsFrom: 'brands', placeholder: 'All' },
];
// Product Image / Specification store the names (attrs.categoryName …) and the product id (attrs.product)
const productNameFilters = [
  { name: 'a_categoryName', label: 'Product Category', optionsFrom: 'categories', byName: true }, { name: 'a_subCategoryName', label: 'Product Sub Category', optionsFrom: 'subcategories', byName: true },
  { name: 'a_brandName', label: 'Brand', optionsFrom: 'brands', byName: true }, { name: 'a_product', label: 'Product', optionsFrom: 'products' },
];
const productFilter = { name: 'product', label: 'Product', type: 'select', required: true, optionsFrom: 'productsPicked', lockOnEdit: true };
set('productimage', {
  addTitle: 'Product Image Add',
  filters: productNameFilters,
  fields: [...productPickers, productFilter, STATUS, { name: 'imageUrl', label: 'Image', type: 'file', required: true, full: true }],
});
set('specification', {
  filters: productNameFilters,
  columns: MASTERS.specification.columns.filter((c) => c.key !== 'status'),
  fields: [...productPickers, productFilter, STATUS, MASTERS.specification.fields.find((x) => x.name === 'specs')],
});

/* Product Master: filters Brand / Product; "Product SubCategory", "Reward Points" */
set('products', {
  filters: [{ name: 'brand', label: 'Brand', optionsFrom: 'brands' }, { name: '_id', label: 'Product', optionsFrom: 'products' }],
  columns: MASTERS.products.columns.filter((c) => c.key !== 'ser'),
  fields: MASTERS.products.fields.map((x) => (x.name === 'subCategory' ? { ...x, label: 'Product SubCategory' } : x.name === 'rewardPoint' ? { ...x, label: 'Reward Points' } : x)),
});

/* Scheme: reference filters and form */
set('schemes', {
  filters: [
    { name: 'schemeFrom', label: 'Scheme From', type: 'date' }, { name: 'schemeTo', label: 'Scheme To', type: 'date' },
    { name: 'category', label: 'Product Category', optionsFrom: 'categories' }, { name: 'subCategory', label: 'Product Sub Category', optionsFrom: 'subcategories', dependsOn: 'category' },
    { name: 'brand', label: 'Brand', optionsFrom: 'brands' }, { name: 'product', label: 'Product', optionsFrom: 'products' },
    { name: 'status', label: 'Scheme Status', options: ['Active', 'Deactive'] },
  ],
  columns: [
    { key: '#', label: '#' }, { key: 'name', label: 'Scheme Name' },
    { key: 'period', label: 'Scheme Period', text: (r) => `${fmt.date(r.fromDate)} to ${fmt.date(r.toDate)}` },
    { key: 'products', label: 'Product', text: (r) => (r.products || []).map((p) => p.productCode).join(', ') }, { key: 'status', label: 'Status' },
  ],
  editLabel: 'View',
  fields: [
    { name: 'name', label: 'Scheme Name', required: true },
    { name: 'fromDate', label: 'Valid From', type: 'date', required: true }, { name: 'toDate', label: 'Valid To', type: 'date', required: true },
    ...productPickers,
    { name: 'products', label: 'Product', type: 'multiselect', optionsFrom: 'productsPicked', full: true, required: true },
    { name: 'applicableOn', label: 'Applicable On', type: 'select', options: ['Total Amount', 'Total Qty'], placeholder: '--Please select--' },
    { name: 'discountType', label: 'Scheme Given', type: 'select', options: [{ value: 'FLAT', label: 'Flat amount per unit' }, { value: 'PERCENT', label: 'Percent' }, { value: 'FOC', label: 'Free of cost' }], placeholder: false },
    { name: 'discountValue', label: 'Scheme Value (per unit / %)', type: 'number' }, { name: 'schemeGiven', label: 'Scheme Details' },
    { name: 'remark', label: 'Remark', type: 'textarea' }, { name: 'attachment', label: 'Scheme Attach(Allowed upto 2 MB)', type: 'file' }, STATUS,
  ],
});

/* State: State, Circle / Zone, Code, Statecode; "View/Change" column */
set('state', {
  editLabel: 'View/Change',
  columns: MASTERS.state.columns.filter((c) => c.key !== 'status'),
  fields: [
    { name: 'name', label: 'State', type: 'select', required: true, options: STATES },
    { name: 'zone', label: 'Circle / Zone', type: 'select', options: CIRCLES, required: true, placeholder: 'Please Select' },
    { name: 'code', label: 'Code', required: true }, { name: 'gstCode', label: 'Statecode' }, STATUS,
  ],
});

/* Tax (HSN) Master: "Chapter Number" */
set('hsn', { fields: MASTERS.hsn.fields.map((x) => (x.name === 'chapterNo' ? { ...x, label: 'Chapter Number' } : x)) });

/* Vendor: "Edit" column, "Add Foreign Vendor", form "Enter The New Vendor Details" */
set('vendors', {
  columns: [MASTERS.vendors.columns.find((c) => c.key === 'status'), ...MASTERS.vendors.columns.filter((c) => !['code', 'status'].includes(c.key))],
  editLabel: 'Edit', editFirst: true, toolbar: [{ label: 'Add Foreign Vendor', to: '/distributor/masters/vendors/new?foreign=1' }],
  addTitle: 'Enter The New Vendor Details', submitLabel: 'Add',
  queryDefaults: (sp) => (sp.get('foreign') ? [['isForeign', 'true'], ['vendorOrigin', 'Foreign'], ['country', '']] : []),
  fields: [
    { name: 'name', label: 'Vendor Name', required: true }, { name: 'phone', label: 'Contact No', required: true }, { name: 'email', label: 'Email:', type: 'email' },
    { name: 'country', label: 'Country', required: true }, { name: 'state', label: 'State', type: 'select', options: STATES }, { name: 'city', label: 'City', required: true },
    { name: 'billingAddress', label: 'Billing Address', type: 'textarea' }, { name: 'shippingAddress', label: 'Shipping Address', type: 'textarea' },
    { name: 'vendorOrigin', label: 'Vendor Origin', type: 'select', options: ['Foreign'], placeholder: '--Please Select--' },
    { name: 'modeOfShipment', label: 'Mode of Shipment', type: 'select', options: ['By Air', 'By Road', 'By Train', 'By Ship'], placeholder: '--Please Select--' },
    { name: 'gstNo', label: 'GST No.' }, { name: 'taxRegistration', label: 'Tax Registration' }, { name: 'fax', label: 'Fax' },
    { name: 'address', label: 'Vendor Address', type: 'textarea', required: true },
    { name: 'isForeign', label: 'Vendor Type', type: 'select', options: [{ value: 'false', label: 'Domestic' }, { value: 'true', label: 'Foreign' }], placeholder: false },
    { name: 'contactPerson', label: 'Contact Person' }, { name: 'panNo', label: 'PAN No.' }, STATUS,
  ],
  fromForm: (v) => ({ ...v, isForeign: v.isForeign === 'true' || v.vendorOrigin === 'Foreign', stateCode: stateCodeOf(v.state) }),
});
