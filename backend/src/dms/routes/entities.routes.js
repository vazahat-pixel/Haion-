/**
 * Generic entity API (/api/dms/entities): Sale Force, General Query, App data and HRMS.
 * Behaviour is driven by ../entities.config.js.
 */
import { Router } from 'express';
import mongoose from 'mongoose';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess, sendCreated, sendPaginated } from '../../utils/apiResponse.js';
import { parsePagination } from '../../utils/pagination.util.js';
import { DmsEntity } from '../models/entity.model.js';
import { DmsLocation, DmsProduct, DmsProfile, DmsMaster } from '../models/master.models.js';
import { DmsInvoice, DmsPayment } from '../models/txn.models.js';
import { ENTITY_TYPES, LEAD_STATUSES, MONTHS } from '../entities.config.js';
import { DmsError, nextSeq, round2, localDay } from '../services/core.service.js';
import { uploadImage, uploadDocument } from '../../middleware/upload.middleware.js';

const router = Router();
const isId = (v) => mongoose.isValidObjectId(v);
const esc = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const lower = (s) => String(s || '').toLowerCase();
const today = () => localDay();
const hasPage = (req, ...keys) => req.dms.isAdmin || keys.some((k) => k && req.dms.pages.includes(k));
const me = (req) => lower(req.dms.loginId);

function cfgOf(type) {
  const c = ENTITY_TYPES[type];
  if (!c) throw new DmsError('Unknown record type', 404);
  return c;
}
const EDITABLE = (c) => [c.initial, 'Active', 'Deactive', 'Open', 'Pending', 'Scheduled'].filter(Boolean);

/* ───────── ref label resolution ───────── */
async function refLabel(kind, id) {
  if (!isId(id)) return null;
  switch (kind) {
    case 'location': { const l = await DmsLocation.findById(id).select('name city').lean(); return l && `${l.name}, ${l.city}`; }
    case 'product': { const p = await DmsProduct.findById(id).select('name productCode').lean(); return p && `${p.name} | ${p.productCode}`; }
    case 'profile': { const p = await DmsProfile.findById(id).select('displayName loginId').lean(); return p && `${p.displayName} (${p.loginId})`; }
    case 'state': case 'city': { const m = await DmsMaster.findOne({ _id: id, type: kind }).select('name').lean(); return m?.name || null; }
    default: {
      const e = await DmsEntity.findOne({ _id: id, type: kind }).select('docNo data').lean();
      if (!e) return null;
      const d = e.data || {};
      if (kind === 'employee') return `${d.name} (${e.docNo})`;
      if (kind === 'lead') return `${e.docNo} - ${d.partyName}`;
      if (kind === 'leavetype') return d.typeOfLeave;
      if (kind === 'beat') return `${d.date} ${d.task} ${d.area}`;
      return d.name || e.docNo;
    }
  }
}

/* ───────── validation / build ───────── */
async function buildData(cfg, body, { partial } = {}) {
  const data = {};
  const errors = {};
  let status;
  for (const fd of cfg.fields) {
    if (cfg.computed && ['duration', 'amount'].includes(fd.n)) continue;
    let v = body[fd.n];
    if (v === undefined && partial) continue;
    if (typeof v === 'string') v = v.trim();
    const empty = v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0);
    if (empty) {
      if (fd.req) errors[fd.n] = ['Required'];
      else if (fd.def !== undefined && fd.n !== 'status') data[fd.n] = fd.def;
      else if (fd.n === 'status' && fd.def) status = fd.def;
      continue;
    }
    switch (fd.t) {
      case 'number': {
        const n = Number(v);
        if (!Number.isFinite(n)) errors[fd.n] = ['Must be a number'];
        else if (fd.min !== undefined && n < fd.min) errors[fd.n] = [`Must be at least ${fd.min}`];
        else data[fd.n] = n;
        break;
      }
      case 'date':
        if (!/^\d{4}-\d{2}-\d{2}$/.test(v) || Number.isNaN(Date.parse(v))) errors[fd.n] = ['Invalid date'];
        else data[fd.n] = v;
        break;
      case 'email':
        if (!/^\S+@\S+\.\S+$/.test(v)) errors[fd.n] = ['Invalid email'];
        else data[fd.n] = v;
        break;
      case 'tel':
        if (!/^\d{10}$/.test(v)) errors[fd.n] = ['Must be 10 digits'];
        else data[fd.n] = v;
        break;
      case 'url':
        if (!/^https?:\/\/\S+$/i.test(v)) errors[fd.n] = ['Must be a http(s) URL'];
        else data[fd.n] = v;
        break;
      case 'file': // path returned by POST /entities/upload
        // an uploaded file, or (older records / seed) a link to a document
        if (!/^\/uploads\/[A-Za-z0-9._-]+$/.test(v) && !/^https?:\/\/\S+$/i.test(v)) errors[fd.n] = ['Upload the file again'];
        else data[fd.n] = v;
        break;
      case 'multiselect': {
        const vals = (Array.isArray(v) ? v : [v]).map(String);
        if (vals.some((x) => !fd.opts.includes(x))) errors[fd.n] = ['Invalid choice'];
        else data[fd.n] = vals;
        break;
      }
      case 'select':
        if (!fd.opts.includes(v) && !(fd.legacy || []).includes(v)) errors[fd.n] = ['Invalid choice'];
        else if (fd.n === 'status') status = v;
        else data[fd.n] = v;
        break;
      case 'ref': {
        const label = await refLabel(fd.ref, v);
        if (!label) errors[fd.n] = ['Not found'];
        else { data[fd.n] = String(v); data[`${fd.n}_label`] = label; }
        break;
      }
      case 'multiref': {
        const ids = (Array.isArray(v) ? v : [v]).filter(isId);
        const labels = (await Promise.all(ids.map((i) => refLabel(fd.ref, i)))).filter(Boolean);
        if (labels.length !== ids.length) errors[fd.n] = ['Contains an unknown item'];
        else { data[fd.n] = ids; data[`${fd.n}_label`] = labels.join(', '); }
        break;
      }
      case 'lines': {
        if (!Array.isArray(v) || !v.length) { errors[fd.n] = ['Add at least one item']; break; }
        const out = [];
        for (const [i, l] of v.entries()) {
          const p = isId(l.product) ? await DmsProduct.findById(l.product).select('name productCode').lean() : null;
          const qty = Number(l.qty); const price = Number(l.price); const disc = Number(l.discountPerUnit || 0);
          const taxPer = Number(l.taxPer || 0); // quote lines: Tax Type / Tax % as in the reference
          if (!p || !(qty > 0) || !(price >= 0) || disc < 0 || disc > price || !(taxPer >= 0 && taxPer <= 100)) { errors[fd.n] = [`Item ${i + 1} is invalid`]; break; }
          const value = round2(qty * (price - disc));
          const taxAmt = round2((value * taxPer) / 100);
          out.push({
            product: String(p._id), productName: `${p.name} | ${p.productCode}`, qty, price, discountPerUnit: disc, value,
            ...(l.taxType || taxPer ? { taxType: String(l.taxType || '').slice(0, 60), taxPer, taxAmt } : {}), total: round2(value + taxAmt),
          });
        }
        data[fd.n] = out;
        break;
      }
      case 'grid': { // a table of simple rows (claim travel lines, target products); fd.cols describes the columns
        if (!Array.isArray(v)) { errors[fd.n] = ['Invalid rows']; break; }
        const out = [];
        for (const [i, row] of v.entries()) {
          const r = {};
          for (const c of fd.cols) {
            let x = row?.[c.n];
            if (typeof x === 'string') x = x.trim();
            if (x === undefined || x === null || x === '') { if (c.req) { errors[fd.n] = [`Row ${i + 1}: ${c.l} is required`]; } continue; }
            if (c.t === 'number') { x = Number(x); if (!Number.isFinite(x) || x < 0) { errors[fd.n] = [`Row ${i + 1}: ${c.l} must be a number`]; continue; } }
            else if (c.t === 'date') { if (!/^\d{4}-\d{2}-\d{2}$/.test(x)) { errors[fd.n] = [`Row ${i + 1}: ${c.l} is not a date`]; continue; } }
            else if (c.t === 'select') { if (!c.opts.includes(x)) { errors[fd.n] = [`Row ${i + 1}: ${c.l} is not valid`]; continue; } }
            else if (c.t === 'product') {
              const p = isId(x) ? await DmsProduct.findById(x).select('name productCode').lean() : null;
              if (!p) { errors[fd.n] = [`Row ${i + 1}: ${c.l} not found`]; continue; }
              r[`${c.n}_label`] = `${p.name} | ${p.productCode}`; x = String(p._id);
            } else x = String(x).slice(0, 300);
            r[c.n] = x;
          }
          if (Object.keys(r).length) out.push(r);
        }
        if (fd.req && !out.length) errors[fd.n] = ['Add at least one row'];
        data[fd.n] = out;
        if (fd.sumTo) data[fd.sumTo] = round2((data[fd.sumTo] || 0) + out.reduce((n, r) => n + (Number(r[fd.sumCol]) || 0), 0));
        break;
      }
      default:
        data[fd.n] = String(v);
    }
  }
  if (cfg.validate?.startsWith('dateRange') && !Object.keys(errors).length) {
    const [, a, b] = cfg.validate.split(':');
    if (data[a] && data[b] && data[b] < data[a]) errors[b] = ['Must not be before the start date'];
  }
  if (Object.keys(errors).length) throw new DmsError('Please correct the highlighted fields', 422, errors);
  return { data, status };
}

async function assertUnique(cfg, type, data, excludeId) {
  if (!cfg.unique) return;
  const q = { type };
  for (const k of cfg.unique) {
    if (data[k] === undefined || data[k] === '') return;
    q[`data.${k}`] = typeof data[k] === 'string' ? new RegExp(`^${esc(data[k])}$`, 'i') : data[k];
  }
  if (excludeId) q._id = { $ne: excludeId };
  if (await DmsEntity.exists(q)) throw new DmsError('A record with the same details already exists', 409, { [cfg.unique[0]]: ['Already exists'] });
}

const dayDiff = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 86400000) + 1;

async function applyComputed(cfg, req, data, ownerLoginId, excludeId) {
  // Application / claim lists show the employee's designation and manager (reference columns), taken from the Employee Master
  if ((cfg === ENTITY_TYPES.application || cfg === ENTITY_TYPES.claim) && ownerLoginId) {
    const want = String(ownerLoginId).toLowerCase();
    const emp = (await DmsEntity.find({ type: 'employee', 'data.loginId': { $exists: true, $ne: '' } }).select('data').lean()).find((e) => String(e.data.loginId).toLowerCase() === want);
    if (emp) { data.empDesignation = emp.data.designation_label || ''; data.empManager = emp.data.manager_label || ''; }
  }
  if (cfg === ENTITY_TYPES.employee && data.location) data.locationType = (await DmsLocation.findById(data.location).select('locationType').lean())?.locationType || '';
  if (cfg.computed === 'tada') data.amount = round2((data.travelAmount || 0) + (data.daAmount || 0));
  if (cfg.computed === 'leave') {
    data.duration = data.durationOfLeave === 'Half Day' && data.fromDate === data.toDate ? 0.5 : dayDiff(data.fromDate, data.toDate);
    const mine = await DmsEntity.find({ type: 'leave', ownerLoginId, status: { $in: ['Pending', 'Approved'] }, ...(excludeId ? { _id: { $ne: excludeId } } : {}) }).lean();
    if (mine.some((l) => l.data.fromDate <= data.toDate && l.data.toDate >= data.fromDate)) throw new DmsError('You already have leave in this period', 422, { fromDate: ['Overlaps an existing leave'] });
    const lt = await DmsEntity.findOne({ _id: data.leaveType, type: 'leavetype' }).lean();
    if (lt) {
      if (lt.status !== 'Active') throw new DmsError('This leave type is not active', 422, { leaveType: ['Inactive'] });
      const year = data.fromDate.slice(0, 4);
      const used = mine.filter((l) => l.data.leaveType === data.leaveType && l.data.fromDate.startsWith(year)).reduce((n, l) => n + (l.data.duration || 0), 0);
      if (used + data.duration > lt.data.noOfDays) throw new DmsError(`Leave balance exceeded (available ${Math.max(0, lt.data.noOfDays - used)} day(s))`, 422, { leaveType: ['Balance exceeded'] });
    }
  }
}

async function ownerOf(cfg, req, data, body) {
  if (cfg.ownerRaw) return lower(body[cfg.ownerField]) || me(req);
  if (cfg.ownerField && data[cfg.ownerField]) {
    const p = await DmsProfile.findById(data[cfg.ownerField]).select('loginId').lean();
    if (p) return lower(p.loginId);
  }
  return me(req);
}

/* ───────── access helpers ───────── */
function scopeQuery(req, cfg, view) {
  if (view === 'mine') return { ownerLoginId: me(req) };
  if (req.dms.isAdmin || cfg.global) return {};
  return { $or: [{ location: { $in: req.dms.allowedLocationIds } }, { ownerLoginId: me(req) }] };
}
function canRead(req, cfg, doc) {
  if (!hasPage(req, cfg.page, cfg.approvePage, cfg.selfPage)) return false;
  if (doc.ownerLoginId === me(req)) return true;
  if (!hasPage(req, cfg.page, cfg.approvePage)) return false;
  if (req.dms.isAdmin || cfg.global) return true;
  return Boolean(doc.location && req.dms.canSee(doc.location));
}
const stamp = (req) => ({ createdBy: req.user._id, createdByName: req.dms.displayName });

/* ───────── schemas + options ───────── */
router.get('/schemas', (req, res) => {
  const types = {};
  for (const [k, c] of Object.entries(ENTITY_TYPES)) {
    types[k] = {
      key: k, label: c.label, title: c.title || c.label, page: c.page, selfPage: c.selfPage, approvePage: c.approvePage, docLabel: c.docLabel, noCreate: c.noCreate, noEdit: c.noEdit,
      dateField: c.dateField, global: c.global, fields: c.fields.map((x) => ({ ...x, label: x.l })), cols: c.cols, filters: c.filters || [], statusFilter: c.statusFilter,
      actions: (c.actions || []).map(({ key, label, from, to, page, remark, statuses, owner }) => ({ key, label, from, to, page, remark, statuses, owner })), editStatuses: EDITABLE(c),
      // presentation (reference list / form wording): column labels, action column style, add button / form title, filter labels
      colLabels: c.colLabels || {}, actionCol: c.actionCol || 'view+edit', addLabel: c.addLabel, addTitle: c.addTitle, editTitle: c.editTitle,
      dateLabels: c.dateLabels, filterLabels: c.filterLabels || {}, noList: c.noList, bulk: c.bulk, byFilter: c.byFilter, goFirst: c.goFirst, goLabel: c.goLabel, linkCol: c.linkCol, formOnly: c.formOnly, snoLabel: c.snoLabel, colFormat: c.colFormat, titles: c.titles, modeCols: c.modeCols,
      addButtons: c.addButtons, submitLabel: c.submitLabel, formWithList: c.formWithList,
    };
  }
  sendSuccess(res, { data: { types, months: MONTHS, leadStatuses: LEAD_STATUSES } });
});

router.get('/options/:kind', asyncHandler(async (req, res) => {
  const { kind } = req.params;
  let rows = [];
  if (kind === 'profile') rows = (await DmsProfile.find({ status: 'Active' }).select('displayName loginId').limit(500).lean()).map((p) => ({ value: String(p._id), label: `${p.displayName} (${p.loginId})` }));
  else if (kind === 'location') rows = (await DmsLocation.find({ status: 'Active', ...(req.dms.isAdmin ? {} : { _id: { $in: req.dms.allowedLocationIds } }) }).select('name city code').limit(500).lean()).map((l) => ({ value: String(l._id), label: `${l.name}, ${l.city} | ${l.code}` }));
  else if (kind === 'state' || kind === 'city') rows = (await DmsMaster.find({ type: kind, status: 'Active' }).select('name').sort({ name: 1 }).limit(2000).lean()).map((m) => ({ value: String(m._id), label: m.name }));
  else if (kind === 'product') rows = (await DmsProduct.find({ status: 'Active' }).select('name productCode').limit(500).lean()).map((p) => ({ value: String(p._id), label: `${p.name} | ${p.productCode}` }));
  else if (ENTITY_TYPES[kind]) {
    const q = { type: kind };
    if (!['lead', 'beat'].includes(kind)) q.status = { $in: ['Active', 'Open', 'Scheduled', 'Pending'] };
    else if (!req.dms.isAdmin) q.$or = [{ ownerLoginId: me(req) }, { location: { $in: req.dms.allowedLocationIds } }];
    const docs = await DmsEntity.find(q).select('_id').sort({ createdAt: -1 }).limit(500).lean();
    rows = (await Promise.all(docs.map(async (d) => ({ value: String(d._id), label: await refLabel(kind, d._id) })))).filter((r) => r.label);
  } else throw new DmsError('Unknown option list', 404);
  sendSuccess(res, { data: rows });
}));

/* ───────── attendance ───────── */
router.get('/attendance-today', asyncHandler(async (req, res) => {
  if (!hasPage(req, 'hr_attendance', 'e_attendance', 'attendance_report')) throw new DmsError('You do not have permission for this page', 403);
  sendSuccess(res, { data: await DmsEntity.findOne({ type: 'attendance', ownerLoginId: me(req), 'data.date': today() }).lean() });
}));
router.post('/attendance-punch', asyncHandler(async (req, res) => {
  if (!hasPage(req, 'hr_attendance', 'e_attendance')) throw new DmsError('You do not have permission for this page', 403);
  const { kind, address = '', image = '' } = req.body;
  // offline-captured punches (mobile app) carry capturedAt; accept up to 24 h old, never in the future
  let when = new Date();
  if (req.body.capturedAt) {
    const c = new Date(req.body.capturedAt);
    const age = Date.now() - c.getTime();
    if (Number.isNaN(c.getTime()) || age < -120000 || age > 24 * 3600000) throw new DmsError('capturedAt must be within the last 24 hours', 422, { capturedAt: ['Invalid'] });
    when = c;
  }
  const day = localDay(when);
  // optional device location (a mobile client sends it); stored only when it is a plausible coordinate
  const geo = (p) => (Number.isFinite(Number(req.body.lat)) && Math.abs(Number(req.body.lat)) <= 90 && Number.isFinite(Number(req.body.lng)) && Math.abs(Number(req.body.lng)) <= 180 && req.body.lat !== '' ? { [`${p}Lat`]: Number(req.body.lat), [`${p}Lng`]: Number(req.body.lng) } : {});
  if (!['in', 'out'].includes(kind)) throw new DmsError('kind must be in or out', 422);
  const now = when.toISOString();
  const rec = await DmsEntity.findOne({ type: 'attendance', ownerLoginId: me(req), 'data.date': day });
  if (kind === 'in') {
    if (rec) throw new DmsError('You have already logged in today', 422);
    const created = await DmsEntity.create({
      type: 'attendance', status: 'Present', ownerLoginId: me(req), ...stamp(req), location: req.dms.location?._id || null,
      data: { date: day, employeeName: req.dms.displayName, inAt: now, inAddress: String(address).slice(0, 300), inImage: String(image).slice(0, 500), ...geo('in') },
    });
    return sendCreated(res, { data: created, message: 'Login time recorded' });
  }
  if (!rec) throw new DmsError('Log in first', 422);
  if (rec.data.outAt) throw new DmsError('You have already logged out today', 422);
  if (now < rec.data.inAt) throw new DmsError('Logout time cannot be before login time', 422);
  rec.data = { ...rec.data, outAt: now, outAddress: String(address).slice(0, 300), outImage: String(image).slice(0, 500), ...geo('out') };
  rec.markModified('data');
  await rec.save();
  return sendSuccess(res, { data: rec, message: 'Logout time recorded' });
}));

/** Selfie for attendance (mobile app). Returns a /uploads URL to pass as `image` to attendance-punch. */
router.post('/attendance-photo', (req, res, next) => {
  if (!hasPage(req, 'hr_attendance', 'e_attendance')) return next(new DmsError('You do not have permission for this page', 403));
  return uploadImage.single('photo')(req, res, (err) => (err ? next(new DmsError(err.message, 422)) : next()));
}, asyncHandler(async (req, res) => {
  if (!req.file) throw new DmsError('Attach a photo (JPEG, PNG or WebP, max 2 MB)', 422, { photo: ['Required'] });
  sendCreated(res, { data: { url: `/uploads/${req.file.filename}` }, message: 'Photo saved' });
}));

/** Attachment for a "file" field of any record type (PDF, JPG or PNG, up to 2 MB as in the reference). */
router.post('/upload', (req, res, next) => uploadDocument.single('file')(req, res, (err) => (err ? next(new DmsError(err.message, 422, { file: [err.message] })) : next())),
  asyncHandler(async (req, res) => {
    if (!req.file) throw new DmsError('Choose a file to upload', 422, { file: ['Required'] });
    if (req.file.size > 2 * 1024 * 1024) throw new DmsError('Upload upto 2 MB', 422, { file: ['Upload upto 2 MB'] });
    sendCreated(res, { data: { url: `/uploads/${req.file.filename}`, name: req.file.originalname }, message: 'File uploaded' });
  }));

/* ───────── salary ───────── */
const daysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
router.post('/salary-generate', asyncHandler(async (req, res) => {
  if (!hasPage(req, 'hr_salary_gen')) throw new DmsError('You do not have permission for this page', 403);
  const { employee, month, year } = req.body;
  const mIdx = MONTHS.indexOf(month);
  const y = Number(year);
  const errors = {};
  if (!isId(employee)) errors.employee = ['Required'];
  if (mIdx < 0) errors.month = ['Required'];
  if (!(y >= 2000 && y <= 2100)) errors.year = ['Required'];
  if (Object.keys(errors).length) throw new DmsError('Please fill all required fields', 422, errors);
  const emp = await DmsEntity.findOne({ _id: employee, type: 'employee' }).lean();
  if (!emp) throw new DmsError('Employee not found', 404);
  if (emp.status !== 'Active') throw new DmsError('Employee is not active', 422);
  if (await DmsEntity.exists({ type: 'salary', 'data.employee': String(emp._id), 'data.month': month, 'data.year': y })) throw new DmsError('Salary is already generated for this month', 409);
  const e = emp.data;
  const basic = Number(e.basicSalary || 0);
  if (!(basic > 0)) throw new DmsError('Set the employee basic salary first', 422);

  const mm = String(mIdx + 1).padStart(2, '0');
  const start = `${y}-${mm}-01`; const end = `${y}-${mm}-${String(daysInMonth(y, mIdx)).padStart(2, '0')}`;
  const holidays = new Set((await DmsEntity.find({ type: 'holiday', status: 'Active', 'data.date': { $gte: start, $lte: end } }).lean()).map((h) => h.data.date));
  const workDays = [];
  for (let d = 1; d <= daysInMonth(y, mIdx); d += 1) {
    const iso = `${y}-${mm}-${String(d).padStart(2, '0')}`;
    if (new Date(`${iso}T00:00:00Z`).getUTCDay() !== 0 && !holidays.has(iso)) workDays.push(iso);
  }
  const wd = new Set(workDays);
  let present = workDays.length; let note = 'No login ID linked: assumed full attendance';
  if (emp.ownerLoginId) {
    const att = await DmsEntity.find({ type: 'attendance', ownerLoginId: emp.ownerLoginId, 'data.date': { $gte: start, $lte: end } }).select('data.date').lean();
    present = new Set(att.map((a) => a.data.date).filter((d) => wd.has(d))).size; note = '';
  }
  const leaves = emp.ownerLoginId ? await DmsEntity.find({ type: 'leave', ownerLoginId: emp.ownerLoginId, status: 'Approved', 'data.fromDate': { $lte: end }, 'data.toDate': { $gte: start } }).lean() : [];
  const onLeave = new Set();
  for (const l of leaves) for (const d of workDays) if (d >= l.data.fromDate && d <= l.data.toDate) onLeave.add(d);
  const leaveDays = onLeave.size;
  const lop = Math.max(0, workDays.length - Math.min(workDays.length, present + leaveDays));
  const hra = Number(e.hra || 0); const allow = Number(e.allowances || 0);
  const gross = round2(basic + hra + allow);
  const lopDeduction = round2((gross / workDays.length) * lop);
  const pf = round2((basic * Number(e.pfPercent || 0)) / 100);
  const bonus = Math.max(0, Number(req.body.bonus || 0)); const other = Math.max(0, Number(req.body.otherDeduction || 0));
  const net = round2(gross - pf - lopDeduction + bonus - other);
  const rec = await DmsEntity.create({
    type: 'salary', status: 'Generated', ownerLoginId: emp.ownerLoginId, ...stamp(req),
    data: {
      employee: String(emp._id), employee_label: `${e.name} (${emp.docNo})`, month, year: y, workingDays: workDays.length, presentDays: present, leaveDays, lopDays: lop,
      basic, hra, allowances: allow, gross, pf, lopDeduction, bonus, otherDeduction: other, net, note,
    },
    actions: [{ by: req.dms.displayName, action: 'Generated' }],
  });
  sendCreated(res, { data: rec, message: `Salary generated for ${e.name}` });
}));

/* ───────── beat upload + deviation request ───────── */
router.post('/beat-upload', asyncHandler(async (req, res) => {
  if (!hasPage(req, 'beat_sched')) throw new DmsError('You do not have permission for this page', 403);
  const rows = Array.isArray(req.body.rows) ? req.body.rows.slice(0, 1000) : [];
  if (!rows.length) throw new DmsError('The file has no rows', 422);
  const tasks = ENTITY_TYPES.beat.fields.find((x) => x.n === 'task').opts;
  const errs = []; const docs = [];
  for (const [i, r] of rows.entries()) {
    const p = await DmsProfile.findOne({ loginId: String(r.loginId || '').trim().toUpperCase() }).lean();
    if (!p) errs.push({ row: i + 2, message: `Unknown login ID ${r.loginId}` });
    else if (!/^\d{4}-\d{2}-\d{2}$/.test(r.date || '')) errs.push({ row: i + 2, message: 'Date must be YYYY-MM-DD' });
    else if (!tasks.includes(r.task)) errs.push({ row: i + 2, message: `Task must be one of ${tasks.join(', ')}` });
    else if (!String(r.area || '').trim()) errs.push({ row: i + 2, message: 'Area is required' });
    else {
      docs.push({
        type: 'beat', status: 'Scheduled', ownerLoginId: lower(p.loginId), location: p.location || null, ...stamp(req), actions: [{ by: req.dms.displayName, action: 'Scheduled (upload)' }],
        data: { assignedTo: String(p._id), assignedTo_label: `${p.displayName} (${p.loginId})`, date: r.date, task: r.task, area: String(r.area).trim() },
      });
    }
  }
  if (errs.length) throw new DmsError(`${errs.length} row(s) have errors; nothing was uploaded`, 422, { rows: errs.slice(0, 20).map((e) => `Row ${e.row}: ${e.message}`) });
  await DmsEntity.insertMany(docs);
  sendCreated(res, { data: { created: docs.length }, message: `${docs.length} beat(s) scheduled` });
}));

router.post('/beat/:id/deviate', asyncHandler(async (req, res) => {
  const beat = isId(req.params.id) ? await DmsEntity.findOne({ _id: req.params.id, type: 'beat' }) : null;
  if (!beat) throw new DmsError('Beat not found', 404);
  if (beat.ownerLoginId !== me(req) && !hasPage(req, 'beat_sched')) throw new DmsError('Beat not found', 404);
  if (!hasPage(req, 'my_beat', 'beat_sched')) throw new DmsError('You do not have permission for this page', 403);
  if (beat.status !== 'Scheduled') throw new DmsError(`A ${beat.status} beat cannot be changed`);
  const changeVisit = String(req.body.changeVisit || '').trim(); const requestRemark = String(req.body.requestRemark || '').trim();
  if (!changeVisit || !requestRemark) throw new DmsError('Please fill all required fields', 422, { ...(changeVisit ? {} : { changeVisit: ['Required'] }), ...(requestRemark ? {} : { requestRemark: ['Required'] }) });
  if (await DmsEntity.exists({ type: 'deviation', 'data.beat': String(beat._id), status: 'Pending' })) throw new DmsError('A deviation request is already pending for this beat', 409);
  const dev = await DmsEntity.create({
    type: 'deviation', status: 'Pending', ownerLoginId: beat.ownerLoginId, location: beat.location, ...stamp(req),
    data: { beat: String(beat._id), beat_label: `${beat.data.date} ${beat.data.task} ${beat.data.area}`, scheduledDate: beat.data.date, scheduledVisit: `${beat.data.task} — ${beat.data.area}`, changeVisit, requestRemark },
    actions: [{ by: req.dms.displayName, action: 'Requested', remark: requestRemark }],
  });
  sendCreated(res, { data: dev, message: 'Deviation request sent for approval' });
}));

/* ───────── generic list / create / read / update / action ───────── */
router.get('/:type', asyncHandler(async (req, res) => {
  const cfg = cfgOf(req.params.type);
  const view = req.query.view === 'mine' ? 'mine' : 'all';
  if (view === 'mine' ? !hasPage(req, cfg.page, cfg.selfPage) : !hasPage(req, cfg.page, cfg.approvePage)) throw new DmsError('You do not have permission for this page', 403);
  const { skip, perPage, page } = parsePagination(req.query);
  const q = { type: req.params.type, ...scopeQuery(req, cfg, view) };
  if (req.query.queue === 'approval') {
    const pend = (cfg.actions || []).find((a) => a.key === 'approve');
    q.status = { $in: pend ? pend.from : [cfg.initial] };
  } else if (req.query.status) q.status = { $in: String(req.query.status).split(',') };
  for (const fd of cfg.fields) {
    const v = req.query[`f_${fd.n}`];
    if (v === undefined || v === '') continue;
    if (['text', 'textarea', 'tel', 'email'].includes(fd.t)) q[`data.${fd.n}`] = new RegExp(esc(String(v)), 'i');
    else q[`data.${fd.n}`] = fd.t === 'number' ? Number(v) : String(v);
  }
  if (req.query.by) q.createdByName = new RegExp(esc(String(req.query.by)), 'i'); // "Feedback By" / "Task By"
  if (req.query.cfrom || req.query.cto) {
    q.createdAt = { ...(req.query.cfrom ? { $gte: new Date(req.query.cfrom) } : {}), ...(req.query.cto ? { $lte: new Date(`${req.query.cto}T23:59:59`) } : {}) };
  }
  if (cfg.dateField && (req.query.from || req.query.to)) {
    q[`data.${cfg.dateField}`] = {
      ...(req.query.from ? { $gte: String(req.query.from) } : {}), ...(req.query.to ? { $lte: String(req.query.to) } : {}),
    };
  }
  if (req.query.search) {
    const rx = new RegExp(esc(req.query.search), 'i');
    const textCols = cfg.cols.filter((c) => !['status', 'createdAt', 'docNo', 'createdByName'].includes(c));
    const or = [{ docNo: rx }, { createdByName: rx }, ...textCols.flatMap((c) => [{ [`data.${c}`]: rx }, { [`data.${c}_label`]: rx }])];
    q.$and = [...(q.$and || []), { $or: or }];
  }
  const [data, total] = await Promise.all([
    DmsEntity.find(q).select('-actions').sort(cfg.dateField && req.query.sortBy === 'date' ? { [`data.${cfg.dateField}`]: -1 } : { createdAt: -1 }).skip(skip).limit(perPage).lean(),
    DmsEntity.countDocuments(q),
  ]);
  sendPaginated(res, { data, total, page, perPage });
}));

async function decorate(cfg, doc) {
  if (cfg.decorate !== 'target') return doc;
  const t = doc.data; const mIdx = MONTHS.indexOf(t.month);
  const prof = isId(t.employee) ? await DmsProfile.findById(t.employee).select('user').lean() : null;
  let achieved = 0;
  if (prof && mIdx >= 0) {
    const from = new Date(t.year, mIdx, 1); const to = new Date(t.year, mIdx + 1, 1);
    if (t.type === 'Collection') {
      const [r] = await DmsPayment.aggregate([{ $match: { kind: 'RECEIPT', status: 'Approve', entryByUser: prof.user, paymentDate: { $gte: from, $lt: to } } }, { $group: { _id: null, v: { $sum: '$receivedAmount' } } }]);
      achieved = r?.v || 0;
    } else {
      const [r] = await DmsInvoice.aggregate([
        { $match: { kind: { $in: ['CORPORATE', 'UPLOAD_BILLING', 'RETAIL_LOCATION', 'RETAIL_CUSTOMER'] }, status: { $nin: ['Cancelled', 'Rejected'] }, entryByUser: prof.user, invoiceDate: { $gte: from, $lt: to } } },
        { $group: { _id: null, amt: { $sum: '$grandTotal' }, qty: { $sum: '$totalQty' } } }]);
      achieved = ['Sale Qty', 'Qty'].includes(t.type) ? r?.qty || 0 : r?.amt || 0;
    }
  }
  return { ...doc, achieved: round2(achieved), achievedPercent: t.targetValue ? round2((achieved / t.targetValue) * 100) : 0 };
}

router.get('/:type/:id', asyncHandler(async (req, res) => {
  const cfg = cfgOf(req.params.type);
  const doc = isId(req.params.id) ? await DmsEntity.findOne({ _id: req.params.id, type: req.params.type }).lean() : null;
  if (!doc || !canRead(req, cfg, doc)) throw new DmsError('Record not found', 404);
  sendSuccess(res, { data: await decorate(cfg, doc) });
}));

router.post('/:type/bulk', asyncHandler(async (req, res) => {
  const cfg = cfgOf(req.params.type);
  if (cfg.noCreate || !cfg.bulk) throw new DmsError('Bulk upload is not available for this record type', 400);
  if (!hasPage(req, cfg.page, cfg.selfPage)) throw new DmsError('You do not have permission for this page', 403);
  const rows = Array.isArray(req.body.rows) ? req.body.rows : [];
  if (!rows.length) throw new DmsError('The file has no rows', 422, { rows: ['The file has no rows'] });
  if (rows.length > 1000) throw new DmsError('Upload at most 1000 rows at a time', 422, { rows: ['Too many rows'] });
  const ready = []; const errs = [];
  for (const [i, row] of rows.entries()) {
    try {
      const { data, status } = await buildData(cfg, row); // eslint-disable-line no-await-in-loop
      await assertUnique(cfg, req.params.type, data); // eslint-disable-line no-await-in-loop
      const owner = await ownerOf(cfg, req, data, row); // eslint-disable-line no-await-in-loop
      await applyComputed(cfg, req, data, owner); // eslint-disable-line no-await-in-loop
      ready.push({ data, status, owner });
    } catch (e) {
      const detail = e.errors ? Object.entries(e.errors).map(([k, v]) => `${cfg.fields.find((x) => x.n === k)?.l || k}: ${[].concat(v)[0]}`).join('; ') : e.message;
      errs.push(`Row ${i + 2}: ${detail}`);
    }
  }
  if (errs.length) throw new DmsError(`${errs.length} row(s) have errors; nothing was saved`, 422, { rows: errs.slice(0, 50) });
  const location = req.dms.location?._id || null;
  const created = [];
  for (const r of ready) {
    const docNo = cfg.prefix ? `${cfg.prefix}${String(await nextSeq(`ENT:${req.params.type}`)).padStart(cfg.pad || 4, '0')}` : undefined; // eslint-disable-line no-await-in-loop
    created.push(await DmsEntity.create({ // eslint-disable-line no-await-in-loop
      type: req.params.type, docNo, data: r.data, status: r.status || cfg.initial || 'Active', location, ownerLoginId: r.owner, ...stamp(req),
      actions: [{ by: req.dms.displayName, action: 'Created (upload)' }],
    }));
  }
  sendCreated(res, { data: { count: created.length, docNos: created.map((d) => d.docNo).filter(Boolean) }, message: `${created.length} record(s) uploaded` });
}));

router.post('/:type', asyncHandler(async (req, res) => {
  const cfg = cfgOf(req.params.type);
  if (cfg.noCreate) throw new DmsError('Records of this type are created by the system', 400);
  if (!hasPage(req, cfg.page, cfg.selfPage)) throw new DmsError('You do not have permission for this page', 403);
  const { data, status } = await buildData(cfg, req.body);
  await assertUnique(cfg, req.params.type, data);
  const owner = await ownerOf(cfg, req, data, req.body);
  await applyComputed(cfg, req, data, owner);
  const locField = cfg.fields.find((x) => x.n === 'location' && x.t === 'ref');
  const location = locField ? data.location : req.dms.location?._id || null;
  if (location && !req.dms.canSee(location)) throw new DmsError('Location is outside your access', 403);
  let docNo;
  if (cfg.prefix) docNo = `${cfg.prefix}${String(await nextSeq(`ENT:${req.params.type}`)).padStart(cfg.pad || 4, '0')}`;
  const doc = await DmsEntity.create({
    type: req.params.type, docNo, data, status: status || cfg.initial || 'Active', location: location || null, ownerLoginId: owner, ...stamp(req),
    actions: [{ by: req.dms.displayName, action: 'Created' }],
  });
  if (req.params.type === 'quote' && data.lead) {
    const lead = await DmsEntity.findOne({ _id: data.lead, type: 'lead' });
    if (lead && !['Closed', 'Cancelled', 'Won', 'Converted'].includes(lead.status)) {
      lead.actions.push({ by: req.dms.displayName, action: 'Quote Shared', from: lead.status, to: 'Quote Shared', remark: docNo });
      lead.status = 'Quote Shared';
      await lead.save();
    }
  }
  sendCreated(res, { data: doc, message: `${cfg.label} saved${docNo ? ` (${docNo})` : ''}` });
}));

router.put('/:type/:id', asyncHandler(async (req, res) => {
  const cfg = cfgOf(req.params.type);
  if (cfg.noEdit) throw new DmsError('Records of this type cannot be edited', 400);
  const doc = isId(req.params.id) ? await DmsEntity.findOne({ _id: req.params.id, type: req.params.type }) : null;
  if (!doc || !canRead(req, cfg, doc)) throw new DmsError('Record not found', 404);
  const own = doc.ownerLoginId === me(req) && hasPage(req, cfg.selfPage);
  if (!hasPage(req, cfg.page) && !own) throw new DmsError('You do not have permission for this page', 403);
  if (!EDITABLE(cfg).includes(doc.status) && !(cfg.global || cfg.fields.some((x) => x.n === 'status'))) throw new DmsError(`A ${doc.status} record cannot be edited`);
  const { data, status } = await buildData(cfg, req.body);
  await assertUnique(cfg, req.params.type, data, doc._id);
  await applyComputed(cfg, req, data, doc.ownerLoginId, doc._id);
  doc.data = data;
  if (status) doc.status = status;
  if (cfg.fields.find((x) => x.n === 'location' && x.t === 'ref')) doc.location = data.location;
  doc.actions.push({ by: req.dms.displayName, action: 'Edited' });
  doc.markModified('data');
  await doc.save();
  sendSuccess(res, { data: doc, message: `${cfg.label} updated` });
}));

router.post('/:type/:id/action', asyncHandler(async (req, res) => {
  const cfg = cfgOf(req.params.type);
  const doc = isId(req.params.id) ? await DmsEntity.findOne({ _id: req.params.id, type: req.params.type }) : null;
  if (!doc || !canRead(req, cfg, doc)) throw new DmsError('Record not found', 404);
  const def = (cfg.actions || []).find((a) => a.key === req.body.action);
  if (!def) throw new DmsError('Unknown action', 400);
  const owns = doc.ownerLoginId === me(req);
  if (!hasPage(req, def.page) && !(def.owner && owns && hasPage(req, cfg.selfPage))) throw new DmsError('You do not have permission for this action', 403);
  if (['approve', 'reject'].includes(def.key) && owns && !req.dms.isAdmin) throw new DmsError('You cannot approve or reject your own request', 403);
  if (!def.from.includes(doc.status)) throw new DmsError(`A ${doc.status} record cannot be ${def.label.toLowerCase()}d`, 422);
  const remark = String(req.body.remark || '').trim();
  if (def.remark && !remark) throw new DmsError('Remark is required', 422, { remark: ['Required'] });
  let to = def.to;
  if (def.key === 'setStatus') {
    to = String(req.body.status || '');
    if (!def.statuses.includes(to)) throw new DmsError('Choose a valid status', 422, { status: ['Required'] });
    if (to === doc.status) throw new DmsError('The record already has this status', 422);
  }
  const from = doc.status;
  doc.status = to;
  doc.actions.push({ by: req.dms.displayName, action: def.label, remark, from, to });
  await doc.save();
  if (cfg.onApprove === 'deviation' && def.key === 'approve' && doc.data.beat) {
    const beat = await DmsEntity.findOne({ _id: doc.data.beat, type: 'beat' });
    if (beat && beat.status === 'Scheduled') {
      beat.data = { ...beat.data, area: doc.data.changeVisit };
      beat.actions.push({ by: req.dms.displayName, action: 'Visit changed (deviation approved)', remark: doc.data.changeVisit });
      beat.markModified('data');
      await beat.save();
    }
  }
  sendSuccess(res, { data: doc, message: `${cfg.label}: ${to}` });
}));

export default router;
