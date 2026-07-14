import Party from '../models/Party.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess, sendCreated, sendError, sendPaginated } from '../utils/apiResponse.js';
import { parsePagination, buildSearchFilter } from '../utils/pagination.util.js';
import { toPublicDoc } from '../utils/serialize.util.js';

function generatePartyCode(name, type) {
  const typePrefix = (type || 'PTY').slice(0, 3);
  const slug = name.replace(/[^A-Za-z0-9]/g, '').slice(0, 5).toUpperCase() || 'PARTY';
  const suffix = Math.floor(Math.random() * 9000 + 1000);
  return `${typePrefix}-${slug}-${suffix}`;
}

function mapParty(doc) {
  const d = toPublicDoc(doc);
  return {
    ...d,
    typeLabel: d.type?.replace(/_/g, ' '),
    dateOfBirth: d.dateOfBirth ? new Date(d.dateOfBirth).toISOString().slice(0, 10) : null,
  };
}

function normalizePartyBody(body) {
  const payload = { ...body };
  if (payload.dateOfBirth === '' || payload.dateOfBirth === undefined) {
    payload.dateOfBirth = null;
  } else if (payload.dateOfBirth) {
    payload.dateOfBirth = new Date(payload.dateOfBirth);
  }
  if (!payload.billingAddress && payload.address) {
    payload.billingAddress = payload.address;
  }
  return payload;
}

export const listParties = asyncHandler(async (req, res) => {
  const { page, perPage, skip, sort } = parsePagination(req.query);
  const filter = { ...buildSearchFilter(req.query.search, ['name', 'code', 'phone', 'email', 'gstin', 'pan', 'city']) };
  if (req.query.status) filter.status = req.query.status;
  if (req.query.type) filter.type = String(req.query.type).toUpperCase();

  const [data, total] = await Promise.all([
    Party.find(filter).sort(sort).skip(skip).limit(perPage).lean(),
    Party.countDocuments(filter),
  ]);

  return sendPaginated(res, { data: data.map(mapParty), total, page, perPage });
});

export const getParty = asyncHandler(async (req, res) => {
  const party = await Party.findById(req.params.id).lean();
  if (!party) return sendError(res, { message: 'Party not found', statusCode: 404 });
  return sendSuccess(res, { data: mapParty(party) });
});

export const createParty = asyncHandler(async (req, res) => {
  const payload = normalizePartyBody(req.body);
  const code = (payload.code || generatePartyCode(payload.name, payload.type)).toUpperCase();
  const exists = await Party.findOne({ code });
  if (exists) return sendError(res, { message: 'Party code already exists', statusCode: 409 });

  const party = await Party.create({
    ...payload,
    code,
    createdBy: req.user._id,
  });
  return sendCreated(res, { data: mapParty(party.toObject()), message: 'Party created' });
});

export const updateParty = asyncHandler(async (req, res) => {
  const payload = normalizePartyBody(req.body);
  if (payload.code) {
    const dup = await Party.findOne({ code: payload.code.toUpperCase(), _id: { $ne: req.params.id } });
    if (dup) return sendError(res, { message: 'Party code already exists', statusCode: 409 });
    payload.code = payload.code.toUpperCase();
  }

  const party = await Party.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true });
  if (!party) return sendError(res, { message: 'Party not found', statusCode: 404 });
  return sendSuccess(res, { data: mapParty(party.toObject()), message: 'Party updated' });
});

export const updatePartyStatus = asyncHandler(async (req, res) => {
  const party = await Party.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
  if (!party) return sendError(res, { message: 'Party not found', statusCode: 404 });
  return sendSuccess(res, { data: mapParty(party.toObject()) });
});
