/* Masters — list columns and add forms follow the reference masters (Admin + Call Centre/ASP users). */
import { useParams } from 'react-router-dom';
import { Database, Users, UserCircle } from 'lucide-react';
import { MasterPage, o, STATUS2, useLk, useMe, PageTitle, Panel, KV, ListPage } from '../kit';

const ST = { n: 'status', label: 'Status', t: 'select', o: STATUS2, ph: false };
const PRODUCT = { n: 'product', label: 'Product Name', t: 'select', o: (lk) => o.named(lk.products), req: true };
const BRAND = { n: 'brand', label: 'Brand', t: 'select', o: (lk) => o.named(lk.brands), req: true };
const stateOpts = (lk) => o.text(lk.states);
const cityOpts = (lk, v) => {
  const st = (lk.states || []).find((s) => s.name === v.state);
  return o.text((lk.cities || []).filter((c) => !st || String(c.parent?._id || c.parent) === String(st._id)));
};
const nm = (x) => x?.name || '';

/** Generic CRM master (crm_masters): name/code/brand/product/model/state/city + attrs. */
function crmMaster(type, def) {
  const attrKeys = def.attrs || [];
  return {
    url: `/masters/${type}`,
    icon: Database,
    ...def,
    toBody: (v) => {
      const attrs = {}; for (const k of attrKeys) attrs[k] = v[k];
      return { name: v.name, code: v.code, brand: v.brand || null, product: v.product || null, model: v.model || null, state: v.state, city: v.city, status: v.status || 'Active', attrs };
    },
    fromRow: (r) => ({ ...r, ...(r.attrs || {}), brand: r.brand?._id || r.brand || '', product: r.product?._id || r.product || '', model: r.model?._id || r.model || '' }),
    rowsOf: (rows) => rows.map((r) => ({ ...r, ...(r.attrs || {}), brandName: nm(r.brand), productName: nm(r.product), modelName: r.model?.modelName || '' })),
  };
}

const CONFIGS = {
  'admin-users': {
    title: 'Admin Users Master', icon: Users, url: '/users', addLabel: 'Add User', formTitle: 'Admin Users Details',
    rowsOf: (rows) => rows.filter((r) => ['Admin', 'Call Center', 'ASP', 'WH'].includes(r.userType)).map((r) => ({ ...r, locationName: r.location ? `${r.location.name} (${r.location.code})` : '' })),
    columns: [{ key: 'loginId', label: 'Login Id' }, { key: 'displayName', label: 'User Name' }, { key: 'userType', label: 'User Type' }, { key: 'locationName', label: 'Location' }, { key: 'phone', label: 'Phone No.' }, { key: 'email', label: 'Email-id' }, { key: 'status', label: 'Status' }],
    fields: [
      { n: 'displayName', label: 'User Name', req: true }, { n: 'loginId', label: 'User Id', req: true, when: (v) => !v._id },
      { n: 'password', label: 'Password', req: true, when: (v) => !v._id }, { n: 'password', label: 'New Password', when: (v) => Boolean(v._id) },
      { n: 'userType', label: 'User Type', t: 'select', o: ['Admin', 'Call Center', 'ASP', 'WH'], req: true },
      { n: 'location', label: 'Location', t: 'select', o: (lk, v) => o.loc((lk.locations || []).filter((l) => !v.userType || v.userType === 'Admin' || l.locationType === v.userType)), when: (v) => v.userType && v.userType !== 'Admin', req: true },
      { n: 'phone', label: 'Mobile No.', req: true }, { n: 'email', label: 'Email-Id', t: 'email', req: true }, ST,
    ],
    fromRow: (r) => ({ ...r, location: r.location?._id || '', password: '' }),
    toBody: (v) => ({ ...v, crmRole: v.userType, location: v.userType === 'Admin' ? null : v.location }),
  },
  users: {
    title: 'Users Master', icon: Users, url: '/users', addLabel: 'Add New User', formTitle: 'Add New User', canAdd: () => true, statusFilter: false,
    rowsOf: (rows) => rows.filter((r) => ['Engineer', 'Pickup Boy', 'Delivery boy', 'Cordinator'].includes(r.userType)),
    columns: [{ key: 'loginId', label: 'User Login Id' }, { key: 'displayName', label: 'UserName' }, { key: 'userType', label: 'User Type' }, { key: 'email', label: 'Email Id' }, { key: 'phone', label: 'Contact No.' }, { key: 'status', label: 'Status' }],
    fields: [
      { n: 'displayName', label: 'User Name', req: true }, { n: 'loginId', label: 'User Login Id', req: true, when: (v) => !v._id },
      { n: 'password', label: 'User Password', req: true, when: (v) => !v._id }, { n: 'password', label: 'New Password', when: (v) => Boolean(v._id) },
      { n: 'email', label: 'Email Id', t: 'email' }, { n: 'phone', label: 'Contact No.' },
      { n: 'userType', label: 'User Type', t: 'select', o: ['Engineer', 'Pickup Boy', 'Delivery boy', 'Cordinator'], req: true }, ST,
    ],
    fromRow: (r) => ({ ...r, password: '' }),
    toBody: (v) => { const b = { ...v }; delete b.location; if (!b.password) delete b.password; return b; },
  },
  'user-list': {
    title: 'Users Master', icon: Users, url: '/users', statusFilter: false, canAdd: () => false,
    columns: [{ key: 'loginId', label: 'User Login Id' }, { key: 'displayName', label: 'UserName' }, { key: 'email', label: 'Email Id' }, { key: 'phone', label: 'Contact No.' }, { key: 'status', label: 'Status' }],
  },
  city: {
    title: 'City Master', icon: Database, url: '/shared/city', addLabel: 'Add New City', formTitle: 'City', statusFilter: false,
    rowsOf: (rows) => rows.map((r) => ({ ...r, state: nm(r.parent) })),
    columns: [{ key: 'state', label: 'State' }, { key: 'name', label: 'City' }],
    fields: [{ n: 'state', label: 'State', t: 'select', o: stateOpts, req: true }, { n: 'name', label: 'City Name', req: true }, { n: 'isDistrict', label: 'Is District?', t: 'check' }],
    fromRow: (r) => ({ ...r, state: nm(r.parent), isDistrict: r.attrs?.isDistrict }),
  },
  product: {
    title: 'Product Master', icon: Database, url: '/shared/product', addLabel: 'Add New Product', formTitle: 'Product',
    columns: [{ key: 'name', label: 'Product Name' }, { key: 'status', label: 'Status' }],
    fields: [{ n: 'name', label: 'Product Name', req: true }, ST, { n: 'brands', label: 'Brand', t: 'checks', o: (lk) => o.named(lk.brands), full: true }],
    fromRow: (r) => ({ ...r, brands: r.attrs?.brands || [] }),
    toBody: (v) => ({ name: v.name, status: v.status, attrs: { brands: v.brands || [] } }),
  },
  brand: {
    title: 'Brand Master', icon: Database, url: '/shared/brand', addLabel: 'Add New Brand', formTitle: 'Brand',
    columns: [{ key: 'name', label: 'Brand Name' }, { key: 'status', label: 'Status' }],
    fields: [{ n: 'name', label: 'Brand Name', req: true }, ST],
  },
  state: {
    title: 'State Master', icon: Database, url: '/shared/state', addLabel: 'Add New State', formTitle: 'State', statusFilter: false,
    rowsOf: (rows) => rows.map((r) => ({ ...r, circle: r.attrs?.circle || '', country: r.attrs?.country || 'India' })),
    columns: [{ key: 'name', label: 'State' }, { key: 'circle', label: 'Circle' }, { key: 'code', label: 'StateCode' }, { key: 'country', label: 'Country' }],
    fields: [{ n: 'name', label: 'State', req: true }, { n: 'circle', label: 'Circle', t: 'select', o: ['EAST', 'WEST', 'NORTH', 'SOUTH', 'CENTRAL'], req: true }, { n: 'code', label: 'Code', req: true }, { n: 'country', label: 'Country', t: 'select', o: ['India'], ph: false }],
    fromRow: (r) => ({ ...r, circle: r.attrs?.circle, country: r.attrs?.country || 'India' }),
    defaults: { country: 'India' },
  },
  hsn: {
    title: 'HSN Master', icon: Database, url: '/shared/hsn', addLabel: 'Add New HSN', formTitle: 'HSN',
    columns: [{ key: 'hsnCode', label: 'HSN Code' }, { key: 'chapterNo', label: 'Chapter No' }, { key: 'description', label: 'HSN Description' }, { key: 'cgst', label: 'CGST' }, { key: 'sgst', label: 'SGST' }, { key: 'igst', label: 'IGST' }, { key: 'status', label: 'Status' }],
    fields: [{ n: 'hsnCode', label: 'HSN Code', req: true }, { n: 'chapterNo', label: 'Chapter No', req: true }, { n: 'description', label: 'HSN Description', req: true }, ST,
      { n: 'sgst', label: 'SGST', t: 'number', req: true }, { n: 'cgst', label: 'CGST', t: 'number', req: true }, { n: 'igst', label: 'IGST', t: 'number', req: true }],
  },
  supplier: {
    title: 'Supplier Master', icon: Database, url: '/shared/supplier', addLabel: 'Add Domestic Supplier', formTitle: 'Supplier', statusFilter: false,
    columns: [{ key: 'name', label: 'Supplier Name' }, { key: 'city', label: 'City' }, { key: 'state', label: 'State' }, { key: 'country', label: 'Country' }, { key: 'phone', label: 'Contact No.' }, { key: 'email', label: 'Email' }, { key: 'address', label: 'Address' }],
    fields: [
      { n: 'vendorOrigin', label: 'Vendor Origin', t: 'select', o: ['Domestic', 'Foreign'], req: true },
      { n: 'name', label: 'Supplier Name', req: true }, { n: 'phone', label: 'Contact No', req: true }, { n: 'email', label: 'Email', t: 'email', req: true },
      { n: 'modeOfShipment', label: 'Mode of Shipment', t: 'select', o: ['By Air', 'By Road', 'By Train', 'By Ship'], req: true },
      { n: 'state', label: 'State', t: 'select', o: stateOpts, req: true, when: (v) => v.vendorOrigin !== 'Foreign' }, { n: 'state', label: 'State', req: true, when: (v) => v.vendorOrigin === 'Foreign' },
      { n: 'city', label: 'City', t: 'select', o: cityOpts, req: true, when: (v) => v.vendorOrigin !== 'Foreign' }, { n: 'city', label: 'City', req: true, when: (v) => v.vendorOrigin === 'Foreign' },
      { n: 'country', label: 'Country', req: true }, { n: 'billingAddress', label: 'Billing Address', t: 'textarea', req: true }, { n: 'shippingAddress', label: 'Shipping Address', t: 'textarea' },
      { n: 'address', label: 'Supplier Address', t: 'textarea', req: true }, { n: 'gstNo', label: 'GST No.' }, { n: 'taxRegistration', label: 'Tax Registration' }, { n: 'fax', label: 'Fax' },
    ],
    defaults: { vendorOrigin: 'Domestic', country: 'India' },
    toBody: (v) => ({ ...v, isForeign: v.vendorOrigin === 'Foreign' }),
  },
  location: {
    title: 'Location Master', icon: Database, url: '/shared/location', params: { locationType: 'ASP,Call Center,Distributor,WH' }, addLabel: 'Add New Location', formTitle: 'Add New Location',
    columns: [{ key: 'code', label: 'Login Id' }, { key: 'name', label: 'Location Name' }, { key: 'locationType', label: 'Location Type' }, { key: 'district', label: 'District' }, { key: 'city', label: 'City' }, { key: 'state', label: 'State' }, { key: 'phone', label: 'Contact No.' }, { key: 'email', label: 'Email-id' }, { key: 'status', label: 'Status' }],
    fields: [
      { n: 'country', label: 'Country', t: 'select', o: ['India'], req: true }, { n: 'locationType', label: 'Party Type', t: 'select', o: ['ASP', 'Call Center', 'Distributor', 'WH'], req: true },
      { n: 'state', label: 'State', t: 'select', o: stateOpts, req: true }, { n: 'name', label: 'Party Name', req: true },
      { n: 'city', label: 'City', t: 'select', o: cityOpts, req: true }, { n: 'contactPerson', label: 'Contact Person', req: true },
      { n: 'district', label: 'District', t: 'select', o: cityOpts }, { n: 'email', label: 'Email', t: 'email', req: true },
      { n: 'pincode', label: 'Pincode', req: true }, { n: 'phone', label: 'Phone Number1', req: true },
      { n: 'billingAddress', label: 'Address', t: 'textarea', req: true }, { n: 'landline', label: 'Phone Number2' },
      { n: 'proprietorType', label: 'Firm Type', t: 'select', o: [{ value: 'OWNED', label: 'Owned' }, { value: 'PARTNERSHIP', label: 'Partnership' }], req: true },
      { n: 'helplineNo', label: 'Helpline No.' }, { n: 'panNo', label: 'PAN No.', req: true }, { n: 'gstNo', label: 'GST No.' },
      { n: 'otherTaxNo', label: 'Other Tax Reg. No.' }, { n: 'otherTaxName', label: 'Other Tax Name' }, { n: 'erpCode', label: 'ERP/SAP Code' }, { n: 'otherCode', label: 'Other Code' },
      { n: 'purchaseFrom', label: 'Purchase From', t: 'select', o: (lk) => o.text(lk.purchaseFrom) },
      { n: 'loginId', label: 'User id', req: true, when: (v) => !v._id }, { n: 'password', label: 'Password', req: true, when: (v) => !v._id },
      { n: 'region', label: 'Zone', t: 'select', o: ['CENTRAL', 'EAST', 'NORTH', 'SOUTH', 'WEST'], req: true },
    ],
    defaults: { country: 'India' },
    fromRow: (r) => ({ ...r, ...(r.attrs || {}) }),
  },
  model: {
    title: 'Model Master', icon: Database, url: '/models', addLabel: 'Add New Model', formTitle: 'Model',
    rowsOf: (rows) => rows.map((r) => ({ ...r, brandName: nm(r.brand), productName: nm(r.product) })),
    columns: [{ key: 'modelCode', label: 'Model Code' }, { key: 'modelName', label: 'Model Name' }, { key: 'brandName', label: 'Brand' }, { key: 'productName', label: 'Product' }, { key: 'status', label: 'Status' }],
    fields: [
      PRODUCT, BRAND, { n: 'modelName', label: 'Model Name', req: true }, { n: 'technicalName', label: 'Technical Name' }, { n: 'imeiLength', label: 'IMEI/Serial No. length', t: 'number' },
      { n: 'softwareVersion', label: 'Software Version' }, { n: 'makeJob', label: 'Make JOB', t: 'yn', req: true }, { n: 'repairWarrantyDays', label: 'Repair Warranty Days', t: 'number' },
      { n: 'makeDoa', label: 'Make DOA', t: 'yn', req: true }, { n: 'doaDays', label: 'DOA Days', t: 'number' }, { n: 'repairable', label: 'Repairable', t: 'yn', req: true },
      { n: 'outWarranty', label: 'Out Warranty', t: 'yn', req: true }, { n: 'replacement', label: 'Replacement', t: 'yn', req: true }, { n: 'replaceDays', label: 'Replace Days', t: 'number' },
      { n: 'checkImei', label: 'Check IMEI/Serial No.', t: 'yn', req: true }, { n: 'customerWarrantyDays', label: 'Customer Warranty Days', t: 'number' }, { n: 'amcDays', label: 'AMC Days', t: 'number' },
      { n: 'amcAmount', label: 'AMC Amount', t: 'number' }, { n: 'terms', label: 'Term and Conditions', t: 'textarea' }, { n: 'releaseDate', label: 'Release Date', t: 'date', req: true }, ST,
      { n: 'serviceCharges', label: 'Service Charges', t: 'number', req: true }, { n: 'companyModel', label: 'Company Model' }, { n: 'dealerWarranty', label: 'Dealar Warranty', t: 'number' },
    ],
    defaults: { makeJob: true, makeDoa: false, repairable: true, outWarranty: true, replacement: false, checkImei: false, customerWarrantyDays: 365, repairWarrantyDays: 90 },
    fromRow: (r) => ({ ...r, brand: r.brand?._id || r.brand, product: r.product?._id || r.product, releaseDate: r.releaseDate ? String(r.releaseDate).slice(0, 10) : '' }),
  },
  partcode: {
    title: 'Partcode Master', icon: Database, url: '/parts', addLabel: 'Add New Partcode', formTitle: 'Partcode',
    rowsOf: (rows) => rows.map((r) => ({ ...r, brandName: nm(r.brand), productName: nm(r.product), modelNames: (r.models || []).map((m) => m.modelName || '').join(', ') })),
    columns: [{ key: 'brandName', label: 'Brand' }, { key: 'productName', label: 'Product' }, { key: 'modelNames', label: 'Model Name' }, { key: 'partcode', label: 'Partcode' }, { key: 'hsnCode', label: 'HSN Code' }, { key: 'partName', label: 'Part Name' }, { key: 'vendorPartcode', label: 'Vendor Partcode' }, { key: 'partCategory', label: 'Part Category' }, { key: 'status', label: 'Status' }],
    fields: [
      PRODUCT, BRAND, { n: 'models', label: 'Model', t: 'multi', o: (lk, v) => o.model((lk.models || []).filter((m) => (!v.brand || String(m.brand?._id) === v.brand) && (!v.product || String(m.product?._id) === v.product))) },
      { n: 'partcode', label: 'Partcode', req: true, when: (v) => !v._id }, { n: 'hsnCode', label: 'HSN CODE', t: 'select', o: (lk) => (lk.hsns || []).map((h) => h.hsnCode), req: true },
      { n: 'vendorPartcode', label: 'Vendor Partcode' }, { n: 'purchasePrice', label: 'Purchase Price', t: 'number', req: true }, { n: 'partName', label: 'Part Name', req: true },
      { n: 'description', label: 'Part Description', t: 'textarea' }, { n: 'locationPrice', label: 'Location Price', t: 'number', req: true }, { n: 'customerPrice', label: 'Customer Price', t: 'number', req: true },
      { n: 'partCategory', label: 'Part Category', t: 'select', o: ['Accessory', 'Component', 'Box', 'Unit', 'TAG'], req: true }, { n: 'partFor', label: 'Part For', t: 'select', o: ['ALL', 'ASP', 'DIST', 'WH'], req: true },
      { n: 'faultyDispatchToWh', label: 'Faulty Part Dispatch to WH', t: 'yn', req: true }, ST, { n: 'warrantyDays', label: 'Warranty Days', t: 'number', req: true }, { n: 'dealerWarrantyDays', label: 'Dealer Warranty Days', t: 'number', req: true },
    ],
    defaults: { faultyDispatchToWh: true, partFor: 'ALL', partCategory: 'Component', warrantyDays: 90, dealerWarrantyDays: 90 },
    fromRow: (r) => ({ ...r, brand: r.brand?._id || r.brand, product: r.product?._id || r.product, models: (r.models || []).map((m) => m._id || m) }),
  },
  purchaseFrom: crmMaster('purchaseFrom', {
    title: 'Purchase From', addLabel: 'Add New Purchase', formTitle: 'Purchase From',
    columns: [{ key: 'name', label: 'Purchase From' }, { key: 'status', label: 'Status' }],
    fields: [{ n: 'name', label: 'Purchase From', req: true }, ST],
  }),
  voc: crmMaster('voc', {
    title: 'VOC Master', addLabel: 'Add New VOC', formTitle: 'VOC',
    columns: [{ key: 'code', label: 'VOC Code' }, { key: 'name', label: 'Description' }, { key: 'brandName', label: 'Brand' }, { key: 'productName', label: 'Product' }, { key: 'status', label: 'Status' }],
    fields: [PRODUCT, BRAND, { n: 'name', label: 'VOC', req: true }, ST],
  }),
  repairAction: crmMaster('repairAction', {
    title: 'Repair Master', addLabel: 'Add New Repair Action', formTitle: 'Repair Action', attrs: ['partReplaceCheck', 'repairFor', 'partReplace', 'repairLevel'],
    columns: [{ key: 'code', label: 'Repair Code' }, { key: 'name', label: 'Description' }, { key: 'brandName', label: 'Brand' }, { key: 'productName', label: 'Product' }, { key: 'status', label: 'Status' }],
    fields: [PRODUCT, BRAND, { n: 'code', label: 'Repair Code', req: true }, { n: 'name', label: 'Repair Action', req: true },
      { n: 'partReplaceCheck', label: 'Part Replace Check', t: 'select', o: ['Yes', 'No'], req: true }, { n: 'repairFor', label: 'Repair For', t: 'select', o: ['ALL', 'ASP', 'CC', 'DIST', 'WH'], req: true },
      { n: 'partReplace', label: 'Part Replace', t: 'check' }, { n: 'repairLevel', label: 'Repair Level' }, ST],
    defaults: { repairFor: 'ALL' },
  }),
  fault: crmMaster('fault', {
    title: 'Defect Master', addLabel: 'Add New Defect', formTitle: 'Defect',
    columns: [{ key: 'code', label: 'Defect Code' }, { key: 'name', label: 'Description' }, { key: 'brandName', label: 'Brand' }, { key: 'productName', label: 'Product' }, { key: 'status', label: 'Status' }],
    fields: [PRODUCT, BRAND, { n: 'code', label: 'Defect Code', req: true }, { n: 'name', label: 'Defect Description', req: true }, ST],
  }),
  feedback: crmMaster('feedback', {
    title: 'Feedback Master', addLabel: 'Add New Feedback', formTitle: 'Feedback',
    columns: [{ key: 'name', label: 'Feedback' }, { key: 'status', label: 'Status' }],
    fields: [{ n: 'name', label: 'Feedback', req: true }, ST],
  }),
  pendingReason: crmMaster('pendingReason', {
    title: 'Pending Reason Master', addLabel: 'Add New Reason', formTitle: 'Pending Reason',
    columns: [{ key: 'name', label: 'Reason' }, { key: 'code', label: 'Reason Code' }, { key: 'status', label: 'Status' }],
    fields: [{ n: 'name', label: 'Reason', req: true }, ST, { n: 'code', label: 'Reason Code', req: true }],
  }),
  holiday: crmMaster('holiday', {
    title: 'Holidays Master', addLabel: 'Add New Holiday', formTitle: 'Holiday', attrs: ['holidayType', 'date', 'weekDay'],
    columns: [{ key: 'date', label: 'Date', t: 'date' }, { key: 'name', label: 'Description' }, { key: 'holidayType', label: 'Holiday Type' }, { key: 'state', label: 'State' }, { key: 'weekDay', label: 'Weak Holiday' }, { key: 'status', label: 'Status' }],
    fields: [{ n: 'holidayType', label: 'Holiday Type', t: 'select', o: ['National Holiday', 'State Holiday', 'Weakly off'], req: true }, { n: 'date', label: 'Date', t: 'date', req: true },
      { n: 'name', label: 'Description', t: 'textarea', req: true }, { n: 'state', label: 'State', t: 'select', o: stateOpts, req: true },
      { n: 'weekDay', label: 'Weak Day', t: 'select', o: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], req: true }, ST],
  }),
  pincode: crmMaster('pincode', {
    title: 'Create Pincode', addLabel: 'Add New Pincode', formTitle: 'Pincode', statusFilter: false, attrs: ['aspId'],
    columns: [{ key: 'state', label: 'State' }, { key: 'city', label: 'City' }, { key: 'code', label: 'Pincode' }, { key: 'name', label: 'Area' }, { key: 'aspName', label: 'Mapped ASP' }, { key: 'status', label: 'Status' }],
    fields: [{ n: 'state', label: 'State', t: 'select', o: stateOpts, req: true }, { n: 'city', label: 'City', t: 'select', o: cityOpts, req: true }, { n: 'name', label: 'Area', req: true },
      { n: 'code', label: 'Pin Code', req: true }, { n: 'aspId', label: 'Mapped ASP', t: 'select', o: (lk) => o.loc(lk.asps) }, ST],
  }),
  accountHead: crmMaster('accountHead', {
    title: 'Account Head Master', addLabel: 'Add New', formTitle: 'New Account Head', attrs: ['nature'],
    columns: [{ key: 'name', label: 'Head Name' }, { key: 'nature', label: 'Nature Of Head' }, { key: 'status', label: 'Status' }],
    fields: [{ n: 'name', label: 'Head Name', req: true }, { n: 'nature', label: 'Nature of Head', t: 'select', o: ['Debit', 'Credit'], req: true }],
  }),
  accountSection: crmMaster('accountSection', {
    title: 'Account Section Master', addLabel: 'Add New', formTitle: 'New Account Section', attrs: ['accountHead', 'calcType'],
    columns: [{ key: 'name', label: 'Section Name' }, { key: 'accountHead', label: 'Account Head' }, { key: 'status', label: 'Status' }],
    fields: [{ n: 'name', label: 'Section Name', req: true }, { n: 'accountHead', label: 'Account Head', t: 'select', o: (lk) => o.text(lk.accountHead), req: true },
      { n: 'calcType', label: 'Calculation Type', t: 'select', o: ['None', 'Plus(+)', 'Minus(-)'] }],
  }),
  voucherMaster: crmMaster('voucherMaster', {
    title: 'Voucher Master', addLabel: 'Add New', formTitle: 'New Voucher', attrs: ['section'],
    columns: [{ key: 'name', label: 'Voucher Name' }, { key: 'section', label: 'Type' }, { key: 'status', label: 'Status' }],
    fields: [{ n: 'name', label: 'Voucher Name', req: true }, { n: 'section', label: 'Section Type', t: 'select', o: (lk) => o.text(lk.accountSection), req: true }],
  }),
  bankAccount: crmMaster('bankAccount', {
    title: 'Bank Account Master', addLabel: 'Add New', formTitle: 'New Bank Account', attrs: ['acType', 'bankName', 'ifsc', 'acNo', 'branch'],
    columns: [{ key: 'name', label: 'Account Name' }, { key: 'acNo', label: 'A/C Number' }, { key: 'ifsc', label: 'IFSC' }, { key: 'bankName', label: 'Bank Name' }, { key: 'acType', label: 'A/C Type' }, { key: 'branch', label: 'Branch' }, { key: 'status', label: 'Status' }],
    fields: [{ n: 'name', label: 'Account Name', req: true }, { n: 'acType', label: 'Account Type', t: 'select', o: ['Current', 'Saving', 'Joint'], req: true }, { n: 'bankName', label: 'Bank Name', req: true },
      { n: 'ifsc', label: 'IFSC' }, { n: 'acNo', label: 'Account No.', req: true }, { n: 'branch', label: 'Branch', req: true }],
  }),
  software: crmMaster('software', {
    title: 'Software Master', addLabel: 'Add New Software', formTitle: 'Software', statusFilter: false, attrs: ['folderType', 'remark', 'fileUrl'],
    columns: [{ key: 'productName', label: 'Product' }, { key: 'brandName', label: 'Brand' }, { key: 'modelName', label: 'Model' }, { key: 'remark', label: 'Remark' }, { key: 'name', label: 'Software Version' }, { key: 'status', label: 'Status' },
      { key: 'fileUrl', label: 'Download.', render: (r) => (r.fileUrl ? <a href={r.fileUrl} target="_blank" rel="noreferrer">Download</a> : '') }],
    fields: [{ ...PRODUCT, label: 'Product' }, BRAND, { n: 'model', label: 'Model', t: 'select', o: (lk, v) => o.model((lk.models || []).filter((m) => !v.brand || String(m.brand?._id) === v.brand)), req: true },
      { n: 'folderType', label: 'Folder Type', t: 'select', o: ['Software', 'Service Manaul'], req: true }, { n: 'remark', label: 'Remarks', t: 'textarea', req: true },
      { n: 'fileUrl', label: 'File Name', req: true }, { n: 'name', label: 'Software version', req: true }, ST],
  }),
  notice: crmMaster('notice', {
    title: 'Notice Master', addLabel: 'Add New Notice', formTitle: 'Notice', statusFilter: false, attrs: ['message', 'from', 'to', 'fileUrl'],
    columns: [{ key: 'name', label: 'Subject' }, { key: 'message', label: 'Massage' }, { key: 'from', label: 'From', t: 'date' }, { key: 'to', label: 'To', t: 'date' }, { key: 'status', label: 'Status' },
      { key: 'fileUrl', label: 'Download.', render: (r) => (r.fileUrl ? <a href={r.fileUrl} target="_blank" rel="noreferrer">Download</a> : '') }],
    fields: [{ n: 'name', label: 'Subject', req: true }, { n: 'message', label: 'Message', t: 'textarea', req: true }, { n: 'from', label: 'From Date', t: 'date', req: true }, { n: 'to', label: 'To Date', t: 'date', req: true },
      { n: 'fileUrl', label: 'File Name' }, ST],
  }),
  claimRate: crmMaster('claimRate', {
    title: 'Claim Master', addLabel: 'Add New Claim', formTitle: 'Claim', attrs: ['aspPrice', 'areaType', 'partnerPrice', 'fromTat', 'toTat', 'claimPct', 'jobStatus', 'entity'],
    columns: [{ key: 'productName', label: 'Product Name' }, { key: 'brandName', label: 'Brand Name' }, { key: 'jobStatus', label: 'Job Status' }, { key: 'entity', label: 'Entity' }, { key: 'areaType', label: 'Area Type' }, { key: 'aspPrice', label: 'ASP Price' }, { key: 'partnerPrice', label: 'Partner Price' }, { key: 'status', label: 'Status' }],
    fields: [PRODUCT, BRAND, { n: 'aspPrice', label: 'ASP Price', t: 'number', req: true }, { n: 'areaType', label: 'Area Type', t: 'select', o: ['Local', 'Upcountry', 'Workshop'], req: true },
      { n: 'partnerPrice', label: 'Partner Price', t: 'number', req: true }, { n: 'fromTat', label: 'From TAT', t: 'number', req: true }, { n: 'toTat', label: 'To TAT', t: 'number', req: true },
      { n: 'claimPct', label: 'Claim Price (%)', t: 'select', o: ['100', '90', '80', '70', '60', '50', '40', '30', '20', '10'], req: true },
      { n: 'jobStatus', label: 'Job Status', t: 'select', o: ['Repair Done', 'Replacement Done', 'Closed Without Repair', 'Replacement', 'Installation Done', 'Demo Done'], req: true },
      { n: 'entity', label: 'Entity', t: 'select', o: (lk) => o.text(lk.purchaseFrom) }],
    defaults: { claimPct: '100', areaType: 'Local' },
    toBodyName: true,
  }),
};
// claim rows have no "name" in the reference; keep one for the generic store
CONFIGS.claimRate.toBody = ((orig) => (v) => ({ ...orig(v), name: `${v.jobStatus || 'Claim'} ${v.areaType || ''}`.trim() }))(CONFIGS.claimRate.toBody);

export function CrmMasterPage() {
  const { type } = useParams();
  const cfg = CONFIGS[type];
  if (!cfg) return <div className="dms-loading">Unknown master</div>;
  return <MasterPage key={type} cfg={cfg} />;
}

export function MyProfilePage() {
  const me = useMe();
  const lk = useLk();
  const l = (lk.locations || []).find((x) => x._id === me?.location?._id) || {};
  return (
    <div>
      <PageTitle icon={UserCircle}>{l.name || me?.displayName}</PageTitle>
      <Panel title="Location Details">
        <KV pairs={[
          ['Location Name', l.name], ['Location Code', l.code], ['Location Type', l.locationType], ['Contact Person', l.contactPerson], ['Contact No.', l.phone], ['Email', l.email],
          ['Address', l.billingAddress], ['City', l.city], ['State', l.state], ['Pincode', l.pincode], ['GST No.', l.gstNo], ['PAN No.', l.panNo],
        ]} />
      </Panel>
    </div>
  );
}

export function NoticePage() {
  return (
    <ListPage title="Notice Master" icon={Database} url="/masters/notice"
      rowsOf={(rows) => rows.filter((r) => r.status === 'Active').map((r) => ({ ...r, ...(r.attrs || {}) }))}
      columns={[{ key: 'name', label: 'Subject' }, { key: 'message', label: 'Massage' }, { key: 'fileUrl', label: 'Download.', render: (r) => (r.fileUrl ? <a href={r.fileUrl} target="_blank" rel="noreferrer">Download</a> : '') }]} />
  );
}
