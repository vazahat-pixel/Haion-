/** Attrs-based masters (stored in dms_masters.attrs). Imported for its side effect on MASTERS. */
import { fmt } from '../api';
import { MASTERS } from './masters.config';

const STATUS = { name: 'status', label: 'Status', type: 'select', options: ['Active', 'Deactive'], placeholder: false };
const statusFilter = { name: 'status', label: 'Status', options: ['Active', 'Deactive'] };
const ATTR = (r) => r.attrs || {};
const MAP_FIELD = { name: 'mappedLocations', label: 'Mapped Locations (hold Ctrl to select several)', type: 'multiselect', optionsFrom: 'allLocations', full: true };
const packAttrs = (v, keys) => ({ name: v.name, code: v.code, status: v.status, attrs: Object.fromEntries(keys.map((k) => [k, v[k]])) });
const attrCol = (key, label, extra = {}) => ({ key, label, text: (r) => ATTR(r)[key], ...extra });
const flat = (r) => ({ ...r, ...ATTR(r) });
const mapCount = (r) => `${(ATTR(r).mappedLocations || []).length} location(s)`;

Object.assign(MASTERS, {
  account: {
    title: 'Account Master', endpoint: '/masters/account', page: 'm_account', addLabel: 'Add New Account', filters: [statusFilter],
    columns: [{ key: '#', label: '#' }, { key: 'name', label: 'Account Name' }, attrCol('accountNo', 'Account No.'), attrCol('accountType', 'Account Type'), { key: 'status', label: 'Status' }, { key: 'map', label: 'Mapping', text: mapCount }],
    fields: [
      { name: 'name', label: 'Account Name', required: true }, { name: 'accountNo', label: 'Account No.', required: true },
      { name: 'accountType', label: 'Account Type', type: 'select', options: ['Savings', 'Current', 'Cash', 'Wallet', 'Other'], required: true },
      { name: 'bankName', label: 'Bank Name' }, { name: 'ifsc', label: 'IFSC Code' }, STATUS, MAP_FIELD,
    ],
    toForm: flat, fromForm: (v) => packAttrs(v, ['accountNo', 'accountType', 'bankName', 'ifsc', 'mappedLocations']),
  },
  coupon: {
    title: 'Coupon Master', endpoint: '/masters/coupon', page: 'm_coupon', addLabel: 'Add Coupon', filters: [statusFilter], exportable: true,
    columns: [
      { key: '#', label: 'S.No' }, { key: 'name', label: 'Coupon Code' }, attrCol('validFrom', 'Valid From'), attrCol('validTo', 'Valid To'), attrCol('amount', 'Amount', { align: 'r' }),
      { key: 'createdAt', label: 'Create Date', text: (r) => fmt.date(r.createdAt) }, { key: 'status', label: 'Status' }, { key: 'map', label: 'Coupon Mapping', text: mapCount },
    ],
    fields: [
      { name: 'name', label: 'Coupon Code', required: true, lockOnEdit: true }, { name: 'amount', label: 'Amount', type: 'number', required: true },
      { name: 'validFrom', label: 'Valid From', type: 'date', required: true }, { name: 'validTo', label: 'Valid To', type: 'date', required: true }, STATUS, MAP_FIELD,
    ],
    toForm: flat, fromForm: (v) => packAttrs(v, ['amount', 'validFrom', 'validTo', 'mappedLocations']),
  },
  othertax: {
    title: 'Tax Master', endpoint: '/masters/othertax', page: 'm_othertax', addLabel: 'Add New Tax', filters: [statusFilter],
    columns: [{ key: '#', label: '#' }, { key: 'name', label: 'Tax Name' }, attrCol('percent', 'Tax Percentage', { align: 'r' }), { key: 'status', label: 'Status' }],
    fields: [{ name: 'name', label: 'Tax Name', required: true }, { name: 'percent', label: 'Tax Percentage', type: 'number', required: true }, STATUS],
    toForm: flat, fromForm: (v) => packAttrs(v, ['percent']),
  },
  parameter: {
    title: 'Parameter Master', endpoint: '/masters/parameter', page: 'm_parameter', addLabel: 'Add New Parameter', filters: [statusFilter],
    columns: [{ key: '#', label: '#' }, { key: 'name', label: 'Parameter Name' }, { key: 'parent', label: 'Product Sub Category', text: (r) => r.parent?.name }, { key: 'status', label: 'Status' }],
    fields: [{ name: 'parent', label: 'Product Sub Category', type: 'select', required: true, optionsFrom: 'subcategories' }, { name: 'name', label: 'Parameter Name', required: true }, STATUS],
    toForm: (r) => ({ ...r, parent: r.parent?._id || r.parent }),
  },
  specification: {
    title: 'Specification Master', endpoint: '/masters/specification', page: 'm_specification', addLabel: 'Add New Specification', filters: [statusFilter],
    columns: [
      { key: '#', label: '#' }, attrCol('productLabel', 'Product Name'), attrCol('categoryName', 'Product Category'), attrCol('subCategoryName', 'Product Sub Category'),
      attrCol('brandName', 'Brand'), { key: 'status', label: 'Status' },
    ],
    fields: [
      { name: 'product', label: 'Product', type: 'select', required: true, optionsFrom: 'products', lockOnEdit: true }, STATUS,
      { name: 'specs', label: 'Specifications (one per line, e.g. RAM: 4 GB)', type: 'textarea', required: true, full: true },
    ],
    toForm: flat, fromForm: (v) => ({ ...packAttrs(v, ['product', 'specs']), name: '-' }),
  },
  productimage: {
    title: 'Product Image', endpoint: '/masters/productimage', page: 'm_product', addLabel: 'Add Image', filters: [statusFilter],
    columns: [
      { key: '#', label: '#' }, attrCol('brandName', 'Brand'), attrCol('categoryName', 'Product Category'), attrCol('subCategoryName', 'Product Sub Category'),
      attrCol('productLabel', 'Product Name'), { key: 'status', label: 'Status' },
    ],
    fields: [
      { name: 'product', label: 'Product', type: 'select', required: true, optionsFrom: 'products', lockOnEdit: true }, STATUS,
      { name: 'imageUrl', label: 'Image URL', type: 'url', required: true, full: true },
    ],
    toForm: flat, fromForm: (v) => ({ ...packAttrs(v, ['product', 'imageUrl']), name: '-' }),
  },
  productdelivery: {
    title: 'Product Delivery', endpoint: '/masters/productdelivery', page: 'm_delivery', addLabel: 'Add Delivery', filters: [statusFilter],
    toolbar: [{ label: 'Upload Delivery Matrix', to: '/distributor/masters-upload/delivery' }],
    columns: [
      { key: '#', label: '#' }, attrCol('fromCity', 'From Location'), attrCol('toCity', 'To Location'), attrCol('category', 'Product Category'),
      attrCol('days', 'Delivery Days', { align: 'r' }), { key: 'status', label: 'Status' },
    ],
    fields: [
      { name: 'fromCity', label: 'From City', required: true }, { name: 'toCity', label: 'To City', required: true }, { name: 'category', label: 'Product Category', required: true },
      { name: 'days', label: 'Delivery Days', type: 'number', required: true }, STATUS,
    ],
    toForm: flat, fromForm: (v) => ({ ...packAttrs(v, ['fromCity', 'toCity', 'category', 'days']), name: '-' }),
  },
});

MASTERS.locations.columns.push({ key: 'map', label: 'Mapping', link: (r) => `/distributor/masters/locations/${r._id}/mapping`, linkText: 'Mapping' });
