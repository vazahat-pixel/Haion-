import { Router } from 'express';
import mongoose from 'mongoose';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess, sendCreated, sendPaginated } from '../../utils/apiResponse.js';
import { parsePagination } from '../../utils/pagination.util.js';
import User from '../../models/User.model.js';
import {
  DmsMaster, MASTER_TYPES, DmsHsn, DmsProduct, DmsLocation, DmsVendor, DmsCustomer, DmsPrice,
  DmsScheme, DmsProfile, DMS_USER_TYPES, DMS_USER_TYPE_CODES, DMS_REGIONS, LOCATION_TYPES,
} from '../models/master.models.js';
import { requirePage, DMS_PAGES, scopeFilter, assertCanSee } from '../middleware/context.js';
import { DmsError, nextLocationCode, nextSeq } from '../services/core.service.js';

const router = Router();
const esc = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const pick = (obj, keys) => Object.fromEntries(keys.filter((k) => obj[k] !== undefined).map((k) => [k, obj[k]]));
const isId = (v) => mongoose.isValidObjectId(v);

/**
 * Generic list/get/create/update for one master.
 * Masters have no hard delete — the reference only toggles Active/Deactive.
 */
function crud(path, { model, page, readPages = [], search = [], filters = [], populate = '', editable, prepare, scope, sort = { createdAt: -1 } }) {
  router.get(path, requirePage(page, ...readPages), asyncHandler(async (req, res) => {
    const { skip, perPage, page: pg } = parsePagination(req.query);
    const q = { ...(scope ? scopeFilter(req, scope) : {}) };
    for (const f of filters) if (req.query[f] !== undefined && req.query[f] !== '') q[f] = req.query[f];
    if (req.query.search && search.length) {
      const rx = new RegExp(esc(req.query.search), 'i');
      q.$and = [...(q.$and || []), { $or: search.map((f) => ({ [f]: rx })) }];
    }
    const [data, total] = await Promise.all([
      model.find(q).populate(populate).sort(sort).skip(skip).limit(perPage).lean(),
      model.countDocuments(q),
    ]);
    sendPaginated(res, { data, total, page: pg, perPage });
  }));
  router.get(`${path}/:id`, requirePage(page, ...readPages), asyncHandler(async (req, res) => {
    if (!isId(req.params.id)) throw new DmsError('Invalid id', 400);
    const doc = await model.findById(req.params.id).populate(populate).lean();
    if (!doc) throw new DmsError('Not found', 404);
    sendSuccess(res, { data: doc });
  }));
  router.post(path, requirePage(page), asyncHandler(async (req, res) => {
    let body = pick(req.body, editable);
    if (prepare) body = await prepare(body, req, null);
    const doc = await model.create(body);
    sendCreated(res, { data: doc, message: 'Saved successfully' });
  }));
  router.put(`${path}/:id`, requirePage(page), asyncHandler(async (req, res) => {
    if (!isId(req.params.id)) throw new DmsError('Invalid id', 400);
    const existing = await model.findById(req.params.id);
    if (!existing) throw new DmsError('Not found', 404);
    let body = pick(req.body, editable);
    if (prepare) body = await prepare(body, req, existing);
    existing.set(body);
    await existing.save();
    sendSuccess(res, { data: existing, message: 'Updated successfully' });
  }));
}


/** Per-type validation / enrichment for the attrs-based masters. */
async function prepareMaster(type, body) {
  const a = { ...(body.attrs || {}) };
  const bad = (field, msg) => { throw new DmsError('Please correct the highlighted fields', 422, { [field]: [msg] }); };
  if (type === 'account' && !String(a.accountNo || '').trim()) bad('accountNo', 'Required');
  if (type === 'coupon') {
    if (!(Number(a.amount) > 0)) bad('amount', 'Enter a valid amount');
    if (!a.validFrom || !a.validTo) bad('validFrom', 'Required');
    if (a.validTo < a.validFrom) bad('validTo', 'Must not be before Valid From');
    a.amount = Number(a.amount);
  }
  if (type === 'othertax') { const p = Number(a.percent); if (!(p >= 0 && p <= 100)) bad('percent', 'Enter 0 to 100'); a.percent = p; }
  if (type === 'productdelivery') {
    const d = Number(a.days);
    if (!a.fromCity || !a.toCity || !a.category) bad('fromCity', 'From city, to city and category are required');
    if (!Number.isInteger(d) || d < 0) bad('days', 'Whole number of days');
    a.days = d; body.name = `${a.fromCity}>${a.toCity}>${a.category}`;
  }
  if (type === 'specification' || type === 'productimage') {
    if (!isId(a.product)) bad('product', 'Required');
    const p = await DmsProduct.findById(a.product).populate('brand category subCategory', 'name').lean();
    if (!p) bad('product', 'Not found');
    Object.assign(a, { productLabel: `${p.name} | ${p.productCode}`, brandName: p.brand?.name, categoryName: p.category?.name, subCategoryName: p.subCategory?.name });
    body.name = a.productLabel;
    if (type === 'productimage' && !/^https?:\/\/\S+$/i.test(String(a.imageUrl || ''))) bad('imageUrl', 'Enter a http(s) image URL');
    if (type === 'specification' && !String(a.specs || '').trim()) bad('specs', 'Required');
  }
  return { ...body, attrs: a };
}

/* ── simple masters: /masters/:type ── */
const MASTER_PAGE = {
  brand: 'm_brand', category: 'm_category', subcategory: 'm_subcategory', color: 'm_color', state: 'm_state',
  city: 'm_city', courier: 'm_courier', account: 'm_account', othertax: 'm_othertax', parameter: 'm_parameter',
  coupon: 'm_coupon', specification: 'm_specification', productdelivery: 'm_delivery', productimage: 'm_product',
};
router.param('mtype', (req, res, next, t) => (MASTER_TYPES.includes(t) ? next() : next(new DmsError('Unknown master', 404))));
router.get('/masters/:mtype', (req, res, next) => requirePage(MASTER_PAGE[req.params.mtype])(req, res, next), asyncHandler(async (req, res) => {
  const { skip, perPage, page } = parsePagination(req.query);
  const q = { type: req.params.mtype };
  if (req.query.status) q.status = req.query.status;
  if (req.query.parent && isId(req.query.parent)) q.parent = req.query.parent;
  if (req.query.search) q.name = new RegExp(esc(req.query.search), 'i');
  const [data, total] = await Promise.all([
    DmsMaster.find(q).populate('parent', 'name code').sort({ name: 1 }).skip(skip).limit(perPage).lean(),
    DmsMaster.countDocuments(q),
  ]);
  sendPaginated(res, { data, total, page, perPage });
}));
router.post('/masters/:mtype', (req, res, next) => requirePage(MASTER_PAGE[req.params.mtype])(req, res, next), asyncHandler(async (req, res) => {
  const body = await prepareMaster(req.params.mtype, pick(req.body, ['name', 'code', 'parent', 'attrs', 'status']));
  if (!body.parent) delete body.parent;
  const doc = await DmsMaster.create({ ...body, type: req.params.mtype, createdBy: req.user._id });
  sendCreated(res, { data: doc, message: 'Saved successfully' });
}));
router.put('/masters/:mtype/:id', (req, res, next) => requirePage(MASTER_PAGE[req.params.mtype])(req, res, next), asyncHandler(async (req, res) => {
  if (!isId(req.params.id)) throw new DmsError('Invalid id', 400);
  const doc = await DmsMaster.findOne({ _id: req.params.id, type: req.params.mtype });
  if (!doc) throw new DmsError('Not found', 404);
  const body = await prepareMaster(req.params.mtype, pick(req.body, ['name', 'code', 'parent', 'attrs', 'status']));
  if (body.parent === '') body.parent = null;
  doc.set(body);
  await doc.save();
  sendSuccess(res, { data: doc, message: 'Updated successfully' });
}));

/* ── HSN tax ── */
crud('/hsn', {
  model: DmsHsn, page: 'm_tax', search: ['hsnCode', 'description'], filters: ['status'],
  editable: ['chapterNo', 'hsnCode', 'description', 'cgst', 'sgst', 'igst', 'status'],
  prepare: (b) => {
    if (b.cgst !== undefined && b.sgst !== undefined && b.igst === undefined) b.igst = Number(b.cgst) + Number(b.sgst);
    return b;
  },
});

/* ── Products ── */
crud('/products', {
  model: DmsProduct, page: 'm_product', search: ['productCode', 'name'], filters: ['status', 'brand', 'category', 'subCategory'],
  populate: [{ path: 'brand', select: 'name' }, { path: 'category', select: 'name' }, { path: 'subCategory', select: 'name' }],
  editable: ['productCode', 'name', 'category', 'subCategory', 'brand', 'color', 'hsnCode', 'description', 'warrantyDays',
    'eol', 'warrantyTerms', 'rewardPoint', 'rewardStartDate', 'rewardEndDate', 'isSerialized', 'status'],
  prepare: async (b) => {
    if (b.subCategory === '') b.subCategory = undefined;
    if (b.hsnCode && !(await DmsHsn.exists({ hsnCode: b.hsnCode }))) throw new DmsError('HSN code not found in HSN Tax Master', 422, { hsnCode: ['Unknown HSN'] });
    return b;
  },
});

/* ── Locations ── */
const LOC_FIELDS = ['name', 'locationType', 'region', 'state', 'stateCode', 'city', 'contactPerson', 'phone', 'email', 'landline',
  'landmark', 'pincode', 'stNo', 'cstNo', 'panNo', 'gstNo', 'proprietorType', 'tdsPercent', 'bank', 'billingAddress',
  'dispatchAddress', 'docPrefix', 'parent', 'creditLimit', 'remark', 'status'];
crud('/locations', {
  model: DmsLocation, page: 'm_location', search: ['code', 'name', 'city'], filters: ['status', 'locationType', 'state', 'city'],
  populate: { path: 'parent', select: 'name code' }, sort: { code: 1 },
  editable: [...LOC_FIELDS, 'code'],
  prepare: async (b, req, existing) => {
    if (b.parent === '' || b.parent === 'NONE') b.parent = null;
    if (!existing) {
      if (b.code) b.code = String(b.code).toUpperCase();
      else b.code = await nextLocationCode(b.locationType, b.stateCode);
      b.history = [{ at: new Date(), by: req.dms.loginId, change: 'Created' }];
    } else {
      delete b.code; // codes are immutable once issued
      existing.history.push({ at: new Date(), by: req.dms.loginId, change: `Updated: ${Object.keys(b).join(', ')}` });
    }
    if (b.docPrefix) b.docPrefix = String(b.docPrefix).toUpperCase();
    return b;
  },
});
router.put('/locations/:id/mapping', requirePage('m_location'), asyncHandler(async (req, res) => {
  const ids = (req.body.mappedLocations || []).filter(isId);
  const doc = await DmsLocation.findByIdAndUpdate(req.params.id, { mappedLocations: ids }, { new: true });
  if (!doc) throw new DmsError('Not found', 404);
  sendSuccess(res, { data: doc, message: 'Mapping updated' });
}));

/* ── Vendors ── */
crud('/vendors', {
  model: DmsVendor, page: 'm_vendor', search: ['code', 'name', 'city'], filters: ['status', 'isForeign'],
  editable: ['name', 'isForeign', 'contactPerson', 'phone', 'email', 'address', 'city', 'state', 'stateCode', 'country', 'gstNo', 'panNo', 'status'],
  prepare: async (b, req, existing) => {
    if (!existing) b.code = `VNDR${await nextSeq('VENDOR')}`;
    return b;
  },
});

/* ── Customers (scoped to the caller's locations) ── */
crud('/customers', {
  model: DmsCustomer, page: 'm_customer', readPages: ['retail', 'customer_return'], search: ['customerId', 'name', 'phone'], filters: ['status', 'state', 'city', 'location', 'customerType'],
  populate: { path: 'location', select: 'name code city' }, scope: ['location'],
  editable: ['name', 'phone', 'email', 'country', 'state', 'stateCode', 'city', 'location', 'address', 'customerType', 'gstin', 'status'],
  prepare: async (b, req, existing) => {
    assertCanSee(req, b.location || existing?.location);
    if (!existing) b.customerId = `CUST${String(await nextSeq('CUSTOMER')).padStart(5, '0')}`;
    return b;
  },
});

/* ── Price master ── */
crud('/prices', {
  model: DmsPrice, page: 'm_price', filters: ['state', 'locationType', 'product', 'status'],
  populate: { path: 'product', select: 'productCode name color' },
  editable: ['state', 'locationType', 'product', 'mrp', 'price', 'status'],
});
/** Resolve a price for (product, buyer location). Falls back to null. */
router.get('/price-lookup', asyncHandler(async (req, res) => {
  const { product, location } = req.query;
  if (!isId(product) || !isId(location)) throw new DmsError('product and location are required', 400);
  const loc = await DmsLocation.findById(location).lean();
  const p = loc && (await DmsPrice.findOne({ product, state: loc.state, locationType: loc.locationType, status: 'Active' }).lean());
  sendSuccess(res, { data: p ? { price: p.price, mrp: p.mrp } : null });
}));

/* ── Schemes ── */
crud('/schemes', {
  model: DmsScheme, page: 'm_scheme', readPages: ['corporate', 'retail'], search: ['name', 'code'], filters: ['status'],
  populate: { path: 'products', select: 'productCode name' },
  editable: ['name', 'fromDate', 'toDate', 'products', 'discountType', 'discountValue', 'status'],
  prepare: async (b, req, existing) => {
    if (b.fromDate && b.toDate && new Date(b.toDate) < new Date(b.fromDate)) throw new DmsError('Scheme To date must be after From date');
    if (!existing) b.code = `SCH/${new Date().getFullYear()}/${await nextSeq(`SCH:${new Date().getFullYear()}`)}`;
    return b;
  },
});

/* ── DMS users (Admin/Users master) ── */
const MAX_IMG = 300 * 1024; // data URL length; the reference asks for a 220 x 220 image
function cleanImg(v) {
  if (v === undefined) return undefined;
  if (v === '' || v === null) return '';
  if (!/^data:image\/(png|jpe?g|gif|webp);base64,/.test(String(v))) throw new DmsError('Profile Img must be a PNG, JPG, GIF or WEBP image', 422, { profileImg: ['Image only'] });
  if (String(v).length > MAX_IMG) throw new DmsError('Profile Img is too large (use a 220 x 220 image)', 422, { profileImg: ['Too large'] });
  return String(v);
}
function cleanScopes(v) {
  if (!v || typeof v !== 'object') return undefined;
  const ids = (a) => (Array.isArray(a) ? a.filter(isId) : []);
  return {
    regions: (Array.isArray(v.regions) ? v.regions : []).filter((r) => DMS_REGIONS.includes(r)),
    locationTypes: (Array.isArray(v.locationTypes) ? v.locationTypes : []).filter((t) => Object.keys(LOCATION_TYPES).includes(t)),
    categories: ids(v.categories),
    brands: ids(v.brands),
  };
}
const FIELD_LABEL = { displayName: 'User Name', userType: 'User Type', location: 'Location', status: 'Status', pages: 'Rights', profileImg: 'Profile Img', scopes: 'Region / Location / Category / Brand', phone: 'Mobile No.' };

router.get('/users', requirePage('m_users'), asyncHandler(async (req, res) => {
  const { skip, perPage, page } = parsePagination(req.query);
  const q = {};
  if (req.query.status) q.status = req.query.status;
  if (req.query.userType) q.userType = req.query.userType;
  if (req.query.search) q.$or = [{ loginId: new RegExp(esc(req.query.search), 'i') }, { displayName: new RegExp(esc(req.query.search), 'i') }];
  const [rows, total] = await Promise.all([
    DmsProfile.find(q).select('-profileImg -history').populate('user', 'email phone isActive').populate('location', 'name code').sort({ createdAt: -1 }).skip(skip).limit(perPage).lean(),
    DmsProfile.countDocuments(q),
  ]);
  sendPaginated(res, { data: rows, total, page, perPage });
}));
router.get('/users/:id/history', requirePage('m_users'), asyncHandler(async (req, res) => {
  if (!isId(req.params.id)) throw new DmsError('Invalid id', 400);
  const p = await DmsProfile.findById(req.params.id).select('displayName loginId history').lean();
  if (!p) throw new DmsError('Not found', 404);
  sendSuccess(res, { data: { displayName: p.displayName, loginId: p.loginId, history: [...(p.history || [])].reverse() } });
}));
router.get('/users/:id', requirePage('m_users'), asyncHandler(async (req, res) => {
  if (!isId(req.params.id)) throw new DmsError('Invalid id', 400);
  const p = await DmsProfile.findById(req.params.id).select('-history').populate('user', 'email phone isActive').populate('location', 'name code').lean();
  if (!p) throw new DmsError('Not found', 404);
  sendSuccess(res, { data: p });
}));
router.post('/users', requirePage('m_users'), asyncHandler(async (req, res) => {
  const { displayName, password, userType, phone, email, status = 'Active', location, pages = [] } = req.body;
  const profileImg = cleanImg(req.body.profileImg);
  const scopes = cleanScopes(req.body.scopes);
  const missing = Object.fromEntries(['displayName', 'password', 'userType', 'email', 'phone'].filter((k) => !req.body[k]).map((k) => [k, ['Required']]));
  if (Object.keys(missing).length) throw new DmsError('Please fill all required fields', 422, missing);
  if (!/^\d{10}$/.test(String(phone).trim())) throw new DmsError('Mobile No. must be 10 digits', 422, { phone: ['10 digits'] });
  if (String(password).length < 8) throw new DmsError('Password must be at least 8 characters', 422, { password: ['Min 8 characters'] });
  if (!DMS_USER_TYPES.includes(userType)) throw new DmsError('Invalid user type');
  if (userType !== 'Admin' && !isId(location)) throw new DmsError('Location is required for non-admin users', 422, { location: ['Required'] });
  const loc = isId(location) ? await DmsLocation.findById(location).lean() : null;
  const loginId = req.body.loginId
    ? String(req.body.loginId).toUpperCase()
    : `${loc ? (loc.code.startsWith('IN') ? 'INUSR' : 'DEUSR') + loc.code.slice(2, 6) : 'INUSR'}${await nextSeq('USR')}`;
  const [firstName, ...rest] = String(displayName).trim().split(/\s+/);
  const user = await User.create({
    email: String(email).toLowerCase(), password: await User.hashPassword(String(password)), firstName, lastName: rest.join(' ') || '-', phone,
    role: 'DMS_USER', isActive: status === 'Active',
  });
  const profile = await DmsProfile.create({
    user: user._id, loginId, displayName, userType, location: loc?._id, status,
    pages: pages.filter((p) => DMS_PAGES.includes(p)),
    ...(profileImg ? { profileImg } : {}),
    ...(scopes ? { scopes } : {}),
    history: [{ at: new Date(), by: req.dms.loginId, change: 'Created' }],
  });
  sendCreated(res, { data: profile, message: `User created. Login ID: ${loginId}` });
}));
router.put('/users/:id', requirePage('m_users'), asyncHandler(async (req, res) => {
  const profile = await DmsProfile.findById(req.params.id);
  if (!profile) throw new DmsError('Not found', 404);
  const b = pick(req.body, ['displayName', 'userType', 'location', 'status', 'pages']);
  if (b.pages) b.pages = b.pages.filter((p) => DMS_PAGES.includes(p));
  const img = cleanImg(req.body.profileImg);
  if (img !== undefined) b.profileImg = img;
  const scopes = cleanScopes(req.body.scopes);
  if (scopes) b.scopes = scopes;
  const same = (k) => JSON.stringify(k === 'location' ? String(profile.location || '') : profile.toObject()[k] ?? '') === JSON.stringify(k === 'location' ? String(b.location || '') : b[k] ?? '');
  const changed = Object.keys(b).filter((k) => !same(k)).map((k) => FIELD_LABEL[k] || k);
  if (req.body.phone !== undefined) {
    const cur = await User.findById(profile.user).select('phone').lean();
    if (String(cur?.phone || '') !== String(req.body.phone)) changed.push(FIELD_LABEL.phone);
  }
  if (req.body.password) changed.push('Password');
  profile.set(b);
  if (changed.length) profile.history.push({ at: new Date(), by: req.dms.loginId, change: `Updated: ${changed.join(', ')}` });
  await profile.save();
  const userUpd = { isActive: profile.status === 'Active' };
  if (req.body.phone !== undefined) userUpd.phone = req.body.phone;
  if (req.body.password) {
    if (String(req.body.password).length < 8) throw new DmsError('Password must be at least 8 characters');
    userUpd.password = await User.hashPassword(String(req.body.password));
  }
  await User.updateOne({ _id: profile.user }, userUpd);
  sendSuccess(res, { data: profile, message: 'Updated successfully' });
}));

/** Product Category / Brand rights of a non-admin user limit the products offered in the forms. */
function productScope(req) {
  const s = req.dms?.isAdmin ? null : req.dms?.profile?.scopes;
  const q = {};
  if (s?.categories?.length) q.$or = [{ category: { $in: s.categories } }, { subCategory: { $in: s.categories } }];
  if (s?.brands?.length) q.brand = { $in: s.brands };
  return q;
}

/* ── lookups for dropdowns ── */
router.get('/lookups', asyncHandler(async (req, res) => {
  const locQ = { status: 'Active', ...scopeFilter(req, ['_id']) };
  const [locations, allLocations, products, vendors, couriers, brands, categories, subcategories, colors, executives, hsn, schemes] = await Promise.all([
    DmsLocation.find(locQ).select('code name city state stateCode locationType parent mappedLocations creditLimit billingAddress dispatchAddress docPrefix').sort({ name: 1 }).lean(),
    DmsLocation.find({ status: 'Active' }).select('code name city state stateCode locationType parent billingAddress dispatchAddress pincode panNo gstNo cstNo stNo').sort({ name: 1 }).lean(),
    DmsProduct.find({ status: 'Active', ...productScope(req) }).select('productCode name color hsnCode isSerialized brand category subCategory warrantyDays').sort({ name: 1 }).lean(),
    DmsVendor.find({ status: 'Active' }).select('code name city state stateCode country address gstNo panNo').sort({ name: 1 }).lean(),
    DmsMaster.find({ type: 'courier', status: 'Active' }).select('name attrs').lean(),
    DmsMaster.find({ type: 'brand', status: 'Active' }).select('name').sort({ name: 1 }).lean(),
    DmsMaster.find({ type: 'category', status: 'Active' }).select('name').sort({ name: 1 }).lean(),
    DmsMaster.find({ type: 'subcategory', status: 'Active' }).select('name parent').sort({ name: 1 }).lean(),
    DmsMaster.find({ type: 'color', status: 'Active' }).select('name').sort({ name: 1 }).lean(),
    DmsProfile.find({ status: 'Active', userType: { $ne: 'Admin' } }).select('displayName loginId userType').lean(),
    DmsHsn.find({ status: 'Active' }).select('hsnCode cgst sgst igst').lean(),
    DmsScheme.find({ status: 'Active', toDate: { $gte: new Date() } }).select('name code products discountType discountValue').lean(),
  ]);
  sendSuccess(res, {
    data: {
      locations, allLocations, products, vendors, couriers, brands, categories, subcategories, colors, executives, hsn, schemes,
      locationTypes: Object.keys(LOCATION_TYPES), userTypes: DMS_USER_TYPES, userTypeCodes: DMS_USER_TYPE_CODES, regions: DMS_REGIONS, pages: DMS_PAGES,
    },
  });
}));

export default router;
