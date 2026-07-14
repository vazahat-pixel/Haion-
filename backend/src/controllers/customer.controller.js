import Customer from '../models/Customer.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess, sendCreated, sendError, sendPaginated } from '../utils/apiResponse.js';
import { parsePagination, buildSearchFilter } from '../utils/pagination.util.js';
import { mapCustomer } from '../utils/docMapper.util.js';
import { nextSequence } from '../utils/sequence.util.js';

function dealerFilter(req) {
  if (req.user.dealerId) return { dealer: req.user.dealerId };
  if (req.query.dealerId) return { dealer: req.query.dealerId };
  return {};
}

export const listCustomers = asyncHandler(async (req, res) => {
  const { page, perPage, skip, sort } = parsePagination(req.query);
  const filter = {
    ...dealerFilter(req),
    ...buildSearchFilter(req.query.search, ['name', 'code', 'phone', 'email', 'city']),
  };
  if (req.query.status) filter.status = req.query.status;

  const [rows, total] = await Promise.all([
    Customer.find(filter).populate('assignedSalesMember', 'name role').sort(sort).skip(skip).limit(perPage).lean(),
    Customer.countDocuments(filter),
  ]);
  return sendPaginated(res, { data: rows.map(mapCustomer), total, page, perPage });
});

export const getCustomer = asyncHandler(async (req, res) => {
  const filter = { _id: req.params.id, ...dealerFilter(req) };
  const customer = await Customer.findOne(filter).populate('assignedSalesMember', 'name role').lean();
  if (!customer) return sendError(res, { message: 'Customer not found', statusCode: 404 });
  return sendSuccess(res, { data: mapCustomer(customer) });
});

export const createCustomer = asyncHandler(async (req, res) => {
  const dealerId = req.user.dealerId || req.body.dealerId;
  if (!dealerId) return sendError(res, { message: 'Dealer context required', statusCode: 400 });

  const code = req.body.code || nextSequence('CUS');
  const customer = await Customer.create({
    dealer: dealerId,
    code,
    name: req.body.name,
    phone: req.body.phone,
    email: req.body.email,
    city: req.body.city,
    state: req.body.state,
    address: req.body.address,
    gstin: req.body.gstin || '',
    status: req.body.status || 'ACTIVE',
    assignedSalesMember: req.body.assignedSalesMember || undefined,
  });
  const populated = await Customer.findById(customer._id).populate('assignedSalesMember', 'name role').lean();
  return sendCreated(res, { data: mapCustomer(populated), message: 'Customer created' });
});

export const updateCustomer = asyncHandler(async (req, res) => {
  const filter = { _id: req.params.id, ...dealerFilter(req) };
  const updates = { ...req.body };
  if (updates.assignedSalesMember === '') updates.assignedSalesMember = null;
  const customer = await Customer.findOneAndUpdate(filter, updates, { new: true, runValidators: true })
    .populate('assignedSalesMember', 'name role')
    .lean();
  if (!customer) return sendError(res, { message: 'Customer not found', statusCode: 404 });
  return sendSuccess(res, { data: mapCustomer(customer), message: 'Customer updated' });
});
