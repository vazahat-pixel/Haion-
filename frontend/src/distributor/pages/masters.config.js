import { fmt } from '../api';

export const STATES = [
  ['Andhra Pradesh', 'AP'], ['Arunachal Pradesh', 'AR'], ['Assam', 'AS'], ['Bihar', 'BR'], ['Chhattisgarh', 'CG'], ['Delhi', 'DL'],
  ['Goa', 'GA'], ['Gujarat', 'GJ'], ['Haryana', 'HR'], ['Himachal Pradesh', 'HP'], ['Jammu and Kashmir', 'JK'], ['Jharkhand', 'JH'],
  ['Karnataka', 'KA'], ['Kerala', 'KL'], ['Ladakh', 'LA'], ['Madhya Pradesh', 'MP'], ['Maharashtra', 'MH'], ['Manipur', 'MN'],
  ['Meghalaya', 'ME'], ['Mizoram', 'MZ'], ['Nagaland', 'NL'], ['Odisha', 'OD'], ['Puducherry', 'PY'], ['Punjab', 'PB'],
  ['Rajasthan', 'RJ'], ['Sikkim', 'SK'], ['Tamil Nadu', 'TN'], ['Telangana', 'TS'], ['Tripura', 'TR'], ['Uttar Pradesh', 'UP'],
  ['Uttarakhand', 'UK'], ['West Bengal', 'WB'], ['Chandigarh', 'CH'], ['Andaman and Nicobar Islands', 'AN'],
  ['Dadra and Nagar Haveli and Daman and Diu', 'DN'], ['Lakshadweep', 'LD'],
].map(([name, code]) => ({ value: name, label: name, code }));
export const stateCodeOf = (name) => STATES.find((s) => s.value === name)?.code || '';

const STATUS = { name: 'status', label: 'Status', type: 'select', options: ['Active', 'Deactive'], placeholder: false };
const statusFilter = { name: 'status', label: 'Status', options: ['Active', 'Deactive'] };
const simple = (title, endpoint, page, nameLabel) => ({
  title, endpoint, page,
  addLabel: `Add New ${title.replace(' Master', '')}`,
  filters: [statusFilter],
  columns: [{ key: '#', label: '#' }, { key: 'name', label: nameLabel }, { key: 'status', label: 'Status' }],
  fields: [{ name: 'name', label: nameLabel, required: true }, STATUS],
});

/** Master page configs keyed by the URL segment /distributor/masters/:key */
export const MASTERS = {
  brand: simple('Brand Master', '/masters/brand', 'm_brand', 'Brand Name'),
  color: simple('Color Master', '/masters/color', 'm_color', 'Color Name'),
  category: simple('Product Category', '/masters/category', 'm_category', 'Product Category'),
  subcategory: {
    ...simple('Product Sub Category', '/masters/subcategory', 'm_subcategory', 'Product Sub Category'),
    columns: [{ key: '#', label: 'S.No' }, { key: 'name', label: 'Product Sub Category' }, { key: 'parent', label: 'Product Category', text: (r) => r.parent?.name }, { key: 'status', label: 'Status' }],
    fields: [{ name: 'parent', label: 'Product Category', type: 'select', required: true, optionsFrom: 'categories' }, { name: 'name', label: 'Product Sub Category', required: true }, STATUS],
    toForm: (r) => ({ ...r, parent: r.parent?._id || r.parent }),
  },
  state: {
    ...simple('State Master', '/masters/state', 'm_state', 'State'),
    columns: [{ key: '#', label: '#' }, { key: 'name', label: 'State' }, { key: 'zone', label: 'Zone', text: (r) => r.attrs?.zone }, { key: 'code', label: 'Code' }, { key: 'gst', label: 'StateCode', text: (r) => r.attrs?.gstCode }, { key: 'status', label: 'Status' }],
    fields: [
      { name: 'name', label: 'State', type: 'select', required: true, options: STATES },
      { name: 'zone', label: 'Zone', type: 'select', options: ['EAST', 'NORTH', 'SOUTH', 'WEST'], required: true },
      { name: 'code', label: 'Code', required: true }, { name: 'gstCode', label: 'GST State Code' }, STATUS,
    ],
    toForm: (r) => ({ ...r, zone: r.attrs?.zone, gstCode: r.attrs?.gstCode }),
    fromForm: (v) => ({ name: v.name, code: v.code, status: v.status, attrs: { zone: v.zone, gstCode: v.gstCode } }),
  },
  city: {
    ...simple('City Master', '/masters/city', 'm_city', 'City Name'),
    columns: [{ key: '#', label: '#' }, { key: 'state', label: 'State', text: (r) => r.attrs?.state }, { key: 'name', label: 'City Name' }, { key: 'status', label: 'Status' }],
    fields: [{ name: 'state', label: 'State', type: 'select', required: true, options: STATES }, { name: 'name', label: 'City Name', required: true }, STATUS],
    toForm: (r) => ({ ...r, state: r.attrs?.state }),
    fromForm: (v) => ({ name: v.name, status: v.status, attrs: { state: v.state } }),
  },
  courier: {
    ...simple('Courier Master', '/masters/courier', 'm_courier', 'Name'),
    addLabel: 'Add New Courier',
    columns: [
      { key: '#', label: 'Sno' }, { key: 'name', label: 'Name' }, { key: 'cp', label: 'Contact Person', text: (r) => r.attrs?.contactPerson },
      { key: 'code', label: 'Code' }, { key: 'em', label: 'Email', text: (r) => r.attrs?.email }, { key: 'ph', label: 'Phone', text: (r) => r.attrs?.phone },
      { key: 'ad', label: 'Address', text: (r) => r.attrs?.address }, { key: 'ct', label: 'City', text: (r) => r.attrs?.city },
      { key: 'st', label: 'State', text: (r) => r.attrs?.state }, { key: 'status', label: 'Status' },
    ],
    fields: [
      { name: 'name', label: 'Courier Name', required: true }, { name: 'code', label: 'Code', required: true },
      { name: 'contactPerson', label: 'Contact Person', required: true }, { name: 'phone', label: 'Phone', required: true, pattern: '\\d{10}' },
      { name: 'email', label: 'Email', type: 'email' }, { name: 'state', label: 'State', type: 'select', options: STATES, required: true },
      { name: 'city', label: 'City', required: true }, STATUS, { name: 'address', label: 'Address', type: 'textarea', full: true },
    ],
    toForm: (r) => ({ ...r, ...r.attrs }),
    fromForm: (v) => ({ name: v.name, code: v.code, status: v.status, attrs: { contactPerson: v.contactPerson, phone: v.phone, email: v.email, state: v.state, city: v.city, address: v.address } }),
  },
  hsn: {
    title: 'HSN Tax Master', endpoint: '/hsn', page: 'm_tax', addLabel: 'Add New Tax',
    columns: [
      { key: '#', label: '#' }, { key: 'chapterNo', label: 'Chapter No.' }, { key: 'hsnCode', label: 'HSN Code' }, { key: 'description', label: 'HSN Description' },
      { key: 'cgst', label: 'CGST %', align: 'r' }, { key: 'sgst', label: 'SGST %', align: 'r' }, { key: 'igst', label: 'IGST %', align: 'r' }, { key: 'status', label: 'Status' },
    ],
    fields: [
      { name: 'chapterNo', label: 'Chapter No.' }, { name: 'hsnCode', label: 'HSN Code', required: true },
      { name: 'cgst', label: 'CGST %', type: 'number', required: true }, { name: 'sgst', label: 'SGST %', type: 'number', required: true },
      { name: 'igst', label: 'IGST %', type: 'number', required: true }, STATUS,
      { name: 'description', label: 'HSN Description', type: 'textarea', full: true },
    ],
  },
  products: {
    title: 'Product Master', endpoint: '/products', page: 'm_product', addLabel: 'Add New Product',
    filters: [{ name: 'brand', label: 'Brand', optionsFrom: 'brands' }, { name: 'category', label: 'Product Category', optionsFrom: 'categories' }, statusFilter],
    columns: [
      { key: '#', label: '#' }, { key: 'productCode', label: 'Product Code' }, { key: 'name', label: 'Product Name' },
      { key: 'category', label: 'Product Category', text: (r) => r.category?.name }, { key: 'hsnCode', label: 'HSN Code' },
      { key: 'color', label: 'Product Color' }, { key: 'brand', label: 'Brand', text: (r) => r.brand?.name },
      { key: 'ser', label: 'Serialized', text: (r) => (r.isSerialized ? 'Yes' : 'No') }, { key: 'status', label: 'Status' },
    ],
    fields: [
      { name: 'category', label: 'Product Category', type: 'select', required: true, optionsFrom: 'categories' },
      { name: 'subCategory', label: 'Product Sub Category', type: 'select', optionsFrom: 'subcategories', dependsOn: 'category' },
      { name: 'productCode', label: 'Product Code', required: true, lockOnEdit: true },
      { name: 'hsnCode', label: 'HSN Code', type: 'select', required: true, optionsFrom: 'hsn' },
      { name: 'name', label: 'Product Name', required: true }, { name: 'brand', label: 'Brand', type: 'select', required: true, optionsFrom: 'brands' },
      { name: 'color', label: 'Product Color', type: 'select', optionsFrom: 'colors', byName: true },
      { name: 'isSerialized', label: 'Serial / IMEI tracked', type: 'select', options: [{ value: 'false', label: 'No' }, { value: 'true', label: 'Yes' }], placeholder: false },
      { name: 'warrantyDays', label: 'Warranty ( Days )', type: 'number' }, { name: 'eol', label: 'EOL' },
      { name: 'rewardPoint', label: 'Reward Point', type: 'number' }, STATUS,
      { name: 'rewardStartDate', label: 'Reward Start Date', type: 'date' }, { name: 'rewardEndDate', label: 'Reward End Date', type: 'date' },
      { name: 'description', label: 'Product Description', type: 'textarea', full: true },
      { name: 'warrantyTerms', label: 'Warranty Terms & Conditions', type: 'textarea', full: true },
    ],
    toForm: (r) => ({
      ...r, category: r.category?._id || r.category, subCategory: r.subCategory?._id || r.subCategory || '', brand: r.brand?._id || r.brand,
      isSerialized: String(Boolean(r.isSerialized)), rewardStartDate: fmt.date(r.rewardStartDate), rewardEndDate: fmt.date(r.rewardEndDate),
    }),
    fromForm: (v) => ({ ...v, isSerialized: v.isSerialized === 'true' }),
  },
  locations: {
    title: 'Locations Master', endpoint: '/locations', page: 'm_location', addLabel: 'Add New Location',
    filters: [{ name: 'state', label: 'Location State', options: STATES }, { name: 'locationType', label: 'Location Type', optionsFrom: 'locationTypes' }, statusFilter],
    columns: [
      { key: '#', label: '#' }, { key: 'code', label: 'Location Id' }, { key: 'name', label: 'Location Name' }, { key: 'state', label: 'State' },
      { key: 'locationType', label: 'Location Type' }, { key: 'parent', label: 'Parent', text: (r) => r.parent?.name }, { key: 'status', label: 'Status' },
    ],
    fields: [
      { name: 'region', label: 'Region/Circle', type: 'select', required: true, options: ['EAST', 'NORTH', 'SOUTH', 'WEST'] },
      { name: 'state', label: 'State', type: 'select', required: true, options: STATES },
      { name: 'city', label: 'City', required: true }, { name: 'locationType', label: 'Location Type', type: 'select', required: true, optionsFrom: 'locationTypes', lockOnEdit: true },
      { name: 'name', label: 'Location Name', required: true }, { name: 'contactPerson', label: 'Contact Person', required: true },
      { name: 'phone', label: 'Phone', required: true, pattern: '\\d{10}' }, { name: 'email', label: 'Email', type: 'email', required: true },
      { name: 'landline', label: 'Landline' }, { name: 'landmark', label: 'Landmark' }, { name: 'pincode', label: 'Pincode', pattern: '\\d{6}' },
      { name: 'stNo', label: 'Service Tax No.' }, { name: 'cstNo', label: 'CST No.' }, { name: 'panNo', label: 'PAN Number', required: true },
      { name: 'gstNo', label: 'GST No.' },
      { name: 'proprietorType', label: 'Proprietor Type', type: 'select', required: true, options: ['OWNED', 'PARTNERSHIP', 'NO PAN NUMBER'] },
      { name: 'tdsPercent', label: 'TDS %', type: 'select', options: ['1', '2', '10'] },
      { name: 'creditLimit', label: 'Credit Limit', type: 'number' },
      { name: 'bank.accountHolder', label: 'Bank Account Holder Name' }, { name: 'bank.accountNo', label: 'Bank Account No.' },
      { name: 'bank.bankName', label: 'Bank Name' }, { name: 'bank.bankCity', label: 'Bank City' }, { name: 'bank.ifsc', label: 'IFSC Code' },
      { name: 'docPrefix', label: 'Unique Document Code (3 letters, used in invoice numbers)', required: true, pattern: '[A-Za-z]{2,5}' },
      { name: 'parent', label: 'Parent Location', type: 'select', optionsFrom: 'allLocations', placeholder: 'NONE' }, STATUS,
      { name: 'billingAddress', label: 'Billing Address', type: 'textarea', required: true, full: true },
      { name: 'dispatchAddress', label: 'Dispatch Address', type: 'textarea', full: true },
      { name: 'remark', label: 'Remark', type: 'textarea', full: true },
    ],
    toForm: (r) => ({ ...r, parent: r.parent?._id || r.parent || '', tdsPercent: r.tdsPercent ? String(r.tdsPercent) : '' }),
    fromForm: (v) => ({ ...v, stateCode: stateCodeOf(v.state), tdsPercent: Number(v.tdsPercent || 0), creditLimit: Number(v.creditLimit || 0) }),
  },
  vendors: {
    title: 'Vendor Master', endpoint: '/vendors', page: 'm_vendor', addLabel: 'Add New Vendor',
    filters: [statusFilter],
    columns: [
      { key: '#', label: 'SNO' }, { key: 'code', label: 'Code' }, { key: 'name', label: 'Vendor Name' }, { key: 'city', label: 'City' }, { key: 'state', label: 'State' },
      { key: 'country', label: 'Country' }, { key: 'phone', label: 'Contact NO' }, { key: 'email', label: 'Email' }, { key: 'address', label: 'Address' }, { key: 'status', label: 'Status' },
    ],
    fields: [
      { name: 'name', label: 'Vendor Name', required: true },
      { name: 'isForeign', label: 'Vendor Type', type: 'select', options: [{ value: 'false', label: 'Domestic' }, { value: 'true', label: 'Foreign' }], placeholder: false },
      { name: 'contactPerson', label: 'Contact Person' }, { name: 'phone', label: 'Contact No.', required: true },
      { name: 'email', label: 'Email', type: 'email' }, { name: 'country', label: 'Country', required: true },
      { name: 'state', label: 'State', type: 'select', options: STATES }, { name: 'city', label: 'City', required: true },
      { name: 'gstNo', label: 'GST No.' }, { name: 'panNo', label: 'PAN No.' }, STATUS,
      { name: 'address', label: 'Address', type: 'textarea', full: true, required: true },
    ],
    toForm: (r) => ({ ...r, isForeign: String(Boolean(r.isForeign)) }),
    fromForm: (v) => ({ ...v, isForeign: v.isForeign === 'true', stateCode: stateCodeOf(v.state) }),
    defaults: { country: 'India', isForeign: 'false' },
  },
  customers: {
    title: 'Customer Master', endpoint: '/customers', page: 'm_customer', addLabel: 'Add Customer',
    filters: [{ name: 'state', label: 'Customer State', options: STATES }, { name: 'location', label: 'Location', optionsFrom: 'locations' }, statusFilter],
    columns: [
      { key: '#', label: '#' }, { key: 'customerId', label: 'Customer Id' }, { key: 'name', label: 'Customer Name' }, { key: 'phone', label: 'Phone' },
      { key: 'state', label: 'State' }, { key: 'location', label: 'Location', text: (r) => r.location?.name }, { key: 'customerType', label: 'Customer Type' }, { key: 'status', label: 'Status' },
    ],
    fields: [
      { name: 'name', label: 'Customer Name', required: true }, { name: 'phone', label: 'Phone', required: true, pattern: '\\d{10}' },
      { name: 'email', label: 'Email', type: 'email' }, { name: 'country', label: 'Country' },
      { name: 'state', label: 'State', type: 'select', required: true, options: STATES }, { name: 'city', label: 'City', required: true },
      { name: 'location', label: 'Location', type: 'select', required: true, optionsFrom: 'locations' },
      { name: 'customerType', label: 'Customer Type', type: 'select', options: ['RETAIL'], placeholder: false },
      { name: 'gstin', label: 'GSTIN' }, STATUS, { name: 'address', label: 'Address', type: 'textarea', full: true, required: true },
    ],
    toForm: (r) => ({ ...r, location: r.location?._id || r.location }),
    fromForm: (v) => ({ ...v, stateCode: stateCodeOf(v.state) }),
    defaults: { country: 'India', customerType: 'RETAIL' },
  },
  prices: {
    title: 'Price Master', endpoint: '/prices', page: 'm_price', addLabel: 'Add New Price',
    filters: [{ name: 'state', label: 'Location State', options: STATES }, { name: 'locationType', label: 'Location Type', optionsFrom: 'locationTypes' }, { name: 'product', label: 'Product', optionsFrom: 'products' }],
    columns: [
      { key: '#', label: '#' }, { key: 'state', label: 'State' }, { key: 'locationType', label: 'Location Type' },
      { key: 'product', label: 'Product', text: (r) => (r.product ? `${r.product.name} | ${r.product.productCode}` : '') },
      { key: 'mrp', label: 'Product Mrp', align: 'r', render: (r) => fmt.money(r.mrp) }, { key: 'price', label: 'Product Price', align: 'r', render: (r) => fmt.money(r.price) }, { key: 'status', label: 'Status' },
    ],
    fields: [
      { name: 'state', label: 'State', type: 'select', required: true, options: STATES },
      { name: 'locationType', label: 'Location Type', type: 'select', required: true, optionsFrom: 'locationTypes' },
      { name: 'product', label: 'Product', type: 'select', required: true, optionsFrom: 'products' },
      { name: 'mrp', label: 'Product MRP', type: 'number', required: true }, { name: 'price', label: 'Product Price', type: 'number', required: true }, STATUS,
    ],
    toForm: (r) => ({ ...r, product: r.product?._id || r.product }),
  },
  schemes: {
    title: 'Scheme Master', endpoint: '/schemes', page: 'm_scheme', addLabel: 'Add New Scheme',
    filters: [statusFilter],
    columns: [
      { key: '#', label: '#' }, { key: 'code', label: 'Scheme Code' }, { key: 'name', label: 'Scheme Name' },
      { key: 'period', label: 'Scheme Period', text: (r) => `${fmt.date(r.fromDate)} to ${fmt.date(r.toDate)}` },
      { key: 'products', label: 'Product', text: (r) => (r.products || []).map((p) => p.productCode).join(', ') },
      { key: 'disc', label: 'Discount', text: (r) => `${r.discountType} ${r.discountType === 'FOC' ? '' : r.discountValue}` }, { key: 'status', label: 'Status' },
    ],
    fields: [
      { name: 'name', label: 'Scheme Name', required: true }, STATUS,
      { name: 'fromDate', label: 'Scheme From', type: 'date', required: true }, { name: 'toDate', label: 'Scheme To', type: 'date', required: true },
      { name: 'discountType', label: 'Discount Type', type: 'select', options: ['FLAT', 'PERCENT', 'FOC'], placeholder: false },
      { name: 'discountValue', label: 'Discount Value (per unit / %)', type: 'number' },
      { name: 'products', label: 'Products (hold Ctrl to select many)', type: 'multiselect', optionsFrom: 'products', full: true, required: true },
    ],
    toForm: (r) => ({ ...r, fromDate: fmt.date(r.fromDate), toDate: fmt.date(r.toDate), products: (r.products || []).map((p) => p._id || p) }),
    defaults: { discountType: 'FLAT', discountValue: 0 },
  },
};
