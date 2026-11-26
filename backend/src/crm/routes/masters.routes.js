import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess, sendCreated } from '../../utils/apiResponse.js';
import User from '../../models/User.model.js';
import { DmsMaster, DmsHsn, DmsLocation, DmsVendor } from '../../dms/models/master.models.js';
import { CrmMaster, CRM_MASTER_TYPES, CrmModel, CrmPart, CrmUserProfile, nextCrmSeq } from '../models/crm.masters.js';
import { CrmError, requireCrmRole } from '../middleware/context.js';

const router = Router();

/* Combined lookups for forms & filters (shares Brand, Product, State, City, Location, HSN, Vendor with DMS) */
router.get('/lookups', asyncHandler(async (_req, res) => {
  const [
    brands, products, states, cities, couriers, hsns, locations, vendors,
    models, parts, crmMasters, engineers,
  ] = await Promise.all([
    DmsMaster.find({ type: 'brand', status: 'Active' }).sort('name').lean(),
    DmsMaster.find({ type: 'category', status: 'Active' }).sort('name').lean(),
    DmsMaster.find({ type: 'state', status: 'Active' }).sort('name').lean(),
    DmsMaster.find({ type: 'city', status: 'Active' }).sort('name').lean(),
    DmsMaster.find({ type: 'courier', status: 'Active' }).sort('name').lean(),
    DmsHsn.find({ status: 'Active' }).sort('hsnCode').lean(),
    DmsLocation.find({ status: 'Active' }).sort('name').lean(),
    DmsVendor.find({ status: 'Active' }).sort('name').lean(),
    CrmModel.find({ status: 'Active' }).populate('brand product', 'name').sort('modelName').lean(),
    CrmPart.find({ status: 'Active' }).populate('brand product', 'name').sort('partcode').lean(),
    CrmMaster.find({ status: 'Active' }).sort('name').lean(),
    CrmUserProfile.find({ status: 'Active', userType: { $in: ['Engineer', 'Pickup Boy', 'Delivery boy', 'Cordinator'] } })
      .populate('location', 'name code').sort('displayName').lean(),
  ]);

  const byType = {};
  for (const t of CRM_MASTER_TYPES) byType[t] = [];
  for (const m of crmMasters) {
    if (byType[m.type]) byType[m.type].push(m);
  }

  sendSuccess(res, {
    data: {
      brands,
      products,
      states,
      cities,
      couriers,
      hsns,
      locations,
      asps: locations.filter((l) => l.locationType === 'ASP'),
      whs: locations.filter((l) => l.locationType === 'WH' || l.locationType === 'Head Office'),
      vendors,
      models,
      parts,
      engineers,
      ...byType,
    },
  });
}));

/* Generic CRM Masters CRUD */
router.get('/masters/:type', asyncHandler(async (req, res) => {
  const { type } = req.params;
  if (!CRM_MASTER_TYPES.includes(type)) throw new CrmError(`Invalid master type: ${type}`, 400);
  const rows = await CrmMaster.find({ type }).populate('brand product', 'name').populate('model', 'modelName modelCode').sort({ createdAt: -1 }).lean();
  if (type === 'pincode') {
    const locs = await DmsLocation.find({ _id: { $in: rows.map((r) => r.attrs?.aspId).filter(Boolean) } }).select('name code').lean();
    for (const r of rows) { const l = locs.find((x) => String(x._id) === String(r.attrs?.aspId)); r.aspName = l ? `${l.name} (${l.code})` : ''; }
  }
  sendSuccess(res, { data: rows });
}));

router.post('/masters/:type', requireCrmRole('Admin'), asyncHandler(async (req, res) => {
  const { type } = req.params;
  if (!CRM_MASTER_TYPES.includes(type)) throw new CrmError(`Invalid master type: ${type}`, 400);
  const { name, brand, product, model, state, city, attrs, status } = req.body || {};
  let { code } = req.body || {};
  if (!name?.trim()) throw new CrmError('Name is required', 422, { name: ['Required'] });
  if (!code && type === 'voc') code = `V${String(await nextCrmSeq('voc')).padStart(4, '0')}`;
  const doc = await CrmMaster.create({
    type,
    name: name.trim(),
    code: code?.trim() || undefined,
    brand: brand || null,
    product: product || null,
    model: model || null,
    state: state || undefined,
    city: city || undefined,
    attrs: attrs || {},
    status: status || 'Active',
    createdBy: req.user._id,
  });
  sendCreated(res, { data: doc, message: `${type} created` });
}));

router.put('/masters/:type/:id', requireCrmRole('Admin'), asyncHandler(async (req, res) => {
  const { type, id } = req.params;
  const doc = await CrmMaster.findOneAndUpdate({ _id: id, type }, req.body, { new: true });
  if (!doc) throw new CrmError('Master record not found', 404);
  sendSuccess(res, { data: doc, message: 'Updated' });
}));

/* Models CRUD */
router.get('/models', asyncHandler(async (_req, res) => {
  const rows = await CrmModel.find().populate('brand product', 'name').sort({ createdAt: -1 }).lean();
  sendSuccess(res, { data: rows });
}));

router.post('/models', requireCrmRole('Admin'), asyncHandler(async (req, res) => {
  const body = req.body || {};
  if (!body.modelName || !body.brand || !body.product) {
    throw new CrmError('Product, Brand and Model Name are required', 422);
  }
  const modelCode = (body.modelCode || `${body.modelName}`.replace(/[^A-Z0-9]/gi, '').slice(0, 12)).toUpperCase();
  const doc = await CrmModel.create({ ...body, modelCode });
  sendCreated(res, { data: doc, message: 'Model created' });
}));

router.put('/models/:id', requireCrmRole('Admin'), asyncHandler(async (req, res) => {
  const doc = await CrmModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!doc) throw new CrmError('Model not found', 404);
  sendSuccess(res, { data: doc, message: 'Model updated' });
}));

/* Parts CRUD */
router.get('/parts', asyncHandler(async (_req, res) => {
  const rows = await CrmPart.find().populate('brand product', 'name').populate('models', 'modelName modelCode').sort({ createdAt: -1 }).lean();
  sendSuccess(res, { data: rows });
}));

router.post('/parts', requireCrmRole('Admin'), asyncHandler(async (req, res) => {
  const body = req.body || {};
  if (!body.partcode || !body.partName || !body.brand || !body.product) {
    throw new CrmError('Partcode, Part Name, Brand and Product are required', 422);
  }
  const doc = await CrmPart.create({ ...body, partcode: body.partcode.toUpperCase().trim() });
  sendCreated(res, { data: doc, message: 'Partcode created' });
}));

router.put('/parts/:id', requireCrmRole('Admin'), asyncHandler(async (req, res) => {
  const doc = await CrmPart.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!doc) throw new CrmError('Partcode not found', 404);
  sendSuccess(res, { data: doc, message: 'Partcode updated' });
}));

/* CRM Users (Admin, Call Center, ASP, WH, Engineer, Pickup Boy, Delivery boy, Cordinator) */
router.get('/users', asyncHandler(async (req, res) => {
  const q = {};
  if (!req.crm.isAdmin && req.crm.locationId) q.location = req.crm.locationId;
  const rows = await CrmUserProfile.find(q).populate('location', 'name code locationType').sort({ createdAt: -1 }).lean();
  sendSuccess(res, { data: rows });
}));

router.post('/users', requireCrmRole('Admin', 'ASP', 'Call Center'), asyncHandler(async (req, res) => {
  const { loginId, displayName, password, crmRole, userType, location, phone, email, pages, status } = req.body || {};
  if (!loginId || !displayName || !password || !userType) {
    throw new CrmError('Login ID, Name, Password and User Type are required', 422);
  }
  if (!req.crm.isAdmin && !['Engineer', 'Pickup Boy', 'Delivery boy', 'Cordinator'].includes(userType)) throw new CrmError('You can add only Engineer, Pickup Boy, Delivery boy or Cordinator users', 403);
  if (!/^[A-Z0-9_]{3,30}$/i.test(String(loginId).trim())) throw new CrmError('Login ID must be 3–30 letters/digits', 422, { loginId: ['Invalid'] });
  const cleanLogin = loginId.toUpperCase().trim();
  const exists = await CrmUserProfile.findOne({ loginId: cleanLogin });
  if (exists) throw new CrmError('Login ID already exists', 409);

  const userEmail = `${cleanLogin.toLowerCase()}@crm.local`;
  const userPhone = `9${String(Date.now()).slice(-5)}${Math.floor(1000 + Math.random() * 9000)}`;
  const hashedPassword = await User.hashPassword(String(password));
  const [firstName, ...rest] = displayName.trim().split(' ');
  const user = await User.create({
    email: userEmail,
    phone: userPhone,
    password: hashedPassword,
    firstName: firstName || cleanLogin,
    lastName: rest.join(' ') || 'User',
    role: 'SERVICE_CENTER',
    isActive: true,
  });

  const resolvedRole = crmRole || (['Engineer', 'Pickup Boy', 'Delivery boy', 'Cordinator'].includes(userType) ? 'ASP' : userType);
  const resolvedLoc = req.crm.isAdmin ? (location || null) : req.crm.locationId;
  const profile = await CrmUserProfile.create({
    user: user._id,
    loginId: cleanLogin,
    displayName: displayName.trim(),
    crmRole: resolvedRole,
    userType,
    location: resolvedLoc,
    phone: phone || '',
    email: email || '',
    pages: pages || [],
    status: status || 'Active',
  });
  sendCreated(res, { data: profile, message: 'CRM User created' });
}));

router.put('/users/:id', requireCrmRole('Admin', 'ASP', 'Call Center'), asyncHandler(async (req, res) => {
  const current = await CrmUserProfile.findById(req.params.id);
  if (!current) throw new CrmError('User not found', 404);
  const b = { ...(req.body || {}) };
  if (!req.crm.isAdmin) {
    if (String(current.location) !== req.crm.locationId || !['Engineer', 'Pickup Boy', 'Delivery boy', 'Cordinator'].includes(current.userType)) throw new CrmError('You can edit only your own field users', 403);
    if (b.userType && !['Engineer', 'Pickup Boy', 'Delivery boy', 'Cordinator'].includes(b.userType)) throw new CrmError('Invalid user type', 403);
    delete b.crmRole; delete b.location; delete b.pages;
  }
  delete b.user; delete b.loginId;
  if (b.password) {
    await User.findByIdAndUpdate(current.user, { password: await User.hashPassword(String(b.password)) });
    delete b.password;
  }
  if (b.status) await User.findByIdAndUpdate(current.user, { isActive: b.status === 'Active' });
  const profile = await CrmUserProfile.findByIdAndUpdate(req.params.id, b, { new: true });
  sendSuccess(res, { data: profile, message: 'User updated' });
}));

export default router;
