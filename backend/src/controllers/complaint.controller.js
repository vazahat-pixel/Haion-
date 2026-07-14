import Complaint from '../models/Complaint.model.js';
import Warranty from '../models/Warranty.model.js';
import Bill from '../models/Bill.model.js';
import Customer from '../models/Customer.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess, sendCreated, sendError, sendPaginated } from '../utils/apiResponse.js';
import { parsePagination, buildSearchFilter } from '../utils/pagination.util.js';
import { toPublicDoc } from '../utils/serialize.util.js';
import { nextSequence } from '../utils/sequence.util.js';

function mapComplaint(doc) {
  const d = toPublicDoc(doc);
  return { ...d, createdAt: d.createdAt };
}

async function resolveWarrantyForBill(billNo, serialNo) {
  const filter = serialNo
    ? { serialNo: serialNo.trim().toUpperCase() }
    : { billNo: billNo.trim().toUpperCase() };
  const warranty = await Warranty.findOne(filter).lean();
  if (!warranty) {
    return { eligible: false, warrantyStatus: 'NOT_FOUND', warrantyReason: 'No warranty found for this bill/serial' };
  }
  const now = new Date();
  const expired = warranty.endDate < now || warranty.status === 'EXPIRED';
  const voided = warranty.status === 'VOID';
  const eligible = !expired && !voided && warranty.status === 'ACTIVE';
  let reason = eligible ? 'Active warranty' : `Status: ${warranty.status}`;
  if (expired) reason = 'Warranty expired';
  if (voided) reason = 'Warranty voided (bill cancelled)';
  return {
    eligible,
    warrantyStatus: warranty.status,
    warrantyReason: reason,
    warranty,
    product: warranty.product,
    customerName: warranty.customerName,
  };
}

export const validateBill = asyncHandler(async (req, res) => {
  const billNo = (req.query.billNo || req.body?.billNo || '').trim().toUpperCase();
  const serialNo = (req.query.serialNo || req.body?.serialNo || '').trim();
  const phone = (req.query.phone || req.body?.phone || '').trim();
  const email = (req.query.email || req.body?.email || '').trim().toLowerCase();

  if (!billNo && !serialNo && !phone && !email) {
    return sendError(res, { message: 'Bill number, serial, phone, or email required', statusCode: 400 });
  }

  if (billNo || serialNo) {
    const result = await resolveWarrantyForBill(billNo || serialNo, serialNo || null);
    return sendSuccess(res, { data: result });
  }

  const contactResult = await lookupByContact({ phone, email });
  return sendSuccess(res, { data: contactResult });
});

async function lookupByContact({ phone, email }) {
  const customerFilter = { $or: [] };
  if (phone) customerFilter.$or.push({ phone });
  if (email) customerFilter.$or.push({ email });

  const customers = customerFilter.$or.length
    ? await Customer.find(customerFilter).limit(5).lean()
    : [];

  const billFilter = { $or: [] };
  if (phone) billFilter.$or.push({ customerPhone: phone });
  if (email) billFilter.$or.push({ customerName: new RegExp(email, 'i') });

  const bills = billFilter.$or.length
    ? await Bill.find(billFilter).sort({ createdAt: -1 }).limit(5).lean()
    : [];

  let warranties = [];
  if (bills.length) {
    warranties = await Warranty.find({ billNo: { $in: bills.map((b) => b.billNo) } }).limit(5).lean();
  }

  if (!bills.length && !warranties.length && customers.length) {
    const customerIds = customers.map((c) => c._id);
    const customerBills = await Bill.find({ customer: { $in: customerIds } }).sort({ createdAt: -1 }).limit(5).lean();
    bills.push(...customerBills);
    if (customerBills.length) {
      warranties = await Warranty.find({ billNo: { $in: customerBills.map((b) => b.billNo) } }).limit(5).lean();
    }
  }

  if (!bills.length && !warranties.length) {
    return {
      found: false,
      eligible: false,
      warrantyStatus: 'NOT_FOUND',
      warrantyReason: 'No bills or warranties found for this contact',
      matches: [],
    };
  }

  const primaryBill = bills[0];
  const primaryWarranty = warranties[0];
  if (primaryBill?.billNo) {
    return {
      ...(await resolveWarrantyForBill(primaryBill.billNo, primaryWarranty?.serialNo)),
      matches: bills.map((b) => ({
        billNo: b.billNo,
        customerName: b.customerName,
        product: b.lineItems?.[0]?.product,
        total: b.total,
        date: b.createdAt,
      })),
    };
  }

  return {
    found: false,
    eligible: false,
    warrantyStatus: 'NOT_FOUND',
    warrantyReason: 'No warranty found for contact',
    matches: [],
  };
}

export const lookupContact = asyncHandler(async (req, res) => {
  const phone = (req.query.phone || '').trim();
  const email = (req.query.email || '').trim().toLowerCase();
  if (!phone && !email) {
    return sendError(res, { message: 'Phone or email required', statusCode: 400 });
  }
  const result = await lookupByContact({ phone, email });
  return sendSuccess(res, { data: result });
});

export const listComplaints = asyncHandler(async (req, res) => {
  const { page, perPage, skip, sort } = parsePagination(req.query);
  const filter = { ...buildSearchFilter(req.query.search, ['ticketNo', 'customer', 'product']) };
  if (req.query.status) filter.status = req.query.status;
  if (req.query.priority) filter.priority = req.query.priority;

  const [rows, total] = await Promise.all([
    Complaint.find(filter).sort(sort).skip(skip).limit(perPage).lean(),
    Complaint.countDocuments(filter),
  ]);
  return sendPaginated(res, { data: rows.map(mapComplaint), total, page, perPage });
});

export const getComplaint = asyncHandler(async (req, res) => {
  const doc = await Complaint.findById(req.params.id).lean();
  if (!doc) return sendError(res, { message: 'Complaint not found', statusCode: 404 });
  return sendSuccess(res, { data: mapComplaint(doc) });
});

export const getComplaintTimeline = asyncHandler(async (req, res) => {
  const doc = await Complaint.findById(req.params.id).select('timeline ticketNo').lean();
  if (!doc) return sendError(res, { message: 'Complaint not found', statusCode: 404 });
  return sendSuccess(res, { data: doc.timeline || [] });
});

export const getOpenCount = asyncHandler(async (_req, res) => {
  const count = await Complaint.countDocuments({ status: { $in: ['OPEN', 'IN_PROGRESS', 'ESCALATED'] } });
  return sendSuccess(res, { data: { count } });
});

export const createComplaint = asyncHandler(async (req, res) => {
  const ticketNo = req.body.ticketNo || nextSequence('CMP');
  let warrantyMeta = {};
  if (req.body.billNo || req.body.serialNo) {
    warrantyMeta = await resolveWarrantyForBill(req.body.billNo || '', req.body.serialNo || '');
  }

  const doc = await Complaint.create({
    ticketNo,
    customer: req.body.customer || warrantyMeta.customerName,
    customerId: req.body.customerId,
    phone: req.body.phone,
    email: req.body.email,
    billNo: req.body.billNo?.trim().toUpperCase(),
    product: req.body.product || warrantyMeta.product,
    serialNo: req.body.serialNo,
    priority: req.body.priority || 'MEDIUM',
    description: req.body.description || req.body.issue,
    assignedTo: req.body.assignedTo,
    warrantyEligible: warrantyMeta.eligible,
    warrantyStatus: warrantyMeta.warrantyStatus,
    warrantyReason: warrantyMeta.warrantyReason,
    timeline: [{
      title: 'Ticket created',
      description: warrantyMeta.warrantyReason ? `Warranty check: ${warrantyMeta.warrantyReason}` : undefined,
      at: new Date(),
      by: req.user?.email || 'system',
    }],
  });
  return sendCreated(res, { data: mapComplaint(doc.toObject()), message: 'Complaint created' });
});

export const createPublicComplaint = asyncHandler(async (req, res) => {
  const { customer, product, description, billNo, phone, email, serialNo } = req.body;
  if (!customer?.trim() || !product?.trim() || !description?.trim()) {
    return sendError(res, { message: 'Customer name, product, and description are required', statusCode: 400 });
  }

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const duplicateFilter = {
    customer: customer.trim(),
    product: product.trim(),
    createdAt: { $gte: since },
  };
  if (billNo) duplicateFilter.billNo = billNo.trim().toUpperCase();
  else if (phone) duplicateFilter.phone = phone.trim();

  const duplicate = await Complaint.findOne(duplicateFilter).lean();
  if (duplicate) {
    return sendSuccess(res, {
      data: mapComplaint(duplicate),
      message: 'A similar complaint was already submitted recently',
    });
  }

  const ticketNo = nextSequence('CMP');
  let warrantyMeta = {};
  if (billNo?.trim()) {
    warrantyMeta = await resolveWarrantyForBill(billNo.trim(), serialNo?.trim() || '');
  }

  const doc = await Complaint.create({
    ticketNo,
    customer: customer.trim(),
    phone: phone?.trim(),
    email: email?.trim(),
    billNo: billNo?.trim().toUpperCase(),
    product: product.trim(),
    serialNo: serialNo?.trim(),
    priority: 'MEDIUM',
    description: description.trim(),
    warrantyEligible: warrantyMeta.eligible,
    warrantyStatus: warrantyMeta.warrantyStatus,
    warrantyReason: warrantyMeta.warrantyReason,
    timeline: [{
      title: 'Public complaint submitted',
      description: warrantyMeta.warrantyReason ? `Warranty: ${warrantyMeta.warrantyReason}` : undefined,
      at: new Date(),
      by: 'customer',
    }],
  });
  return sendCreated(res, { data: mapComplaint(doc.toObject()), message: 'Complaint submitted successfully' });
});

export const updateComplaint = asyncHandler(async (req, res) => {
  const doc = await Complaint.findById(req.params.id);
  if (!doc) return sendError(res, { message: 'Complaint not found', statusCode: 404 });

  const allowed = ['status', 'priority', 'assignedTo', 'description', 'resolution'];
  for (const key of allowed) {
    if (req.body[key] !== undefined) doc[key] = req.body[key];
  }
  if (req.body.status && req.body.status !== doc.status) {
    doc.timeline.push({ title: `Status → ${req.body.status}`, at: new Date(), by: req.user?.email });
  }
  await doc.save();
  return sendSuccess(res, { data: mapComplaint(doc.toObject()), message: 'Complaint updated' });
});

export const escalateComplaint = asyncHandler(async (req, res) => {
  const doc = await Complaint.findById(req.params.id);
  if (!doc) return sendError(res, { message: 'Complaint not found', statusCode: 404 });
  doc.status = 'ESCALATED';
  doc.priority = 'CRITICAL';
  doc.timeline.push({ title: 'Escalated', description: req.body.reason, variant: 'danger', at: new Date(), by: req.user?.email });
  await doc.save();
  return sendSuccess(res, { data: mapComplaint(doc.toObject()), message: 'Complaint escalated' });
});

export const resolveComplaint = asyncHandler(async (req, res) => {
  const doc = await Complaint.findById(req.params.id);
  if (!doc) return sendError(res, { message: 'Complaint not found', statusCode: 404 });
  doc.status = 'RESOLVED';
  doc.resolution = req.body.resolution || 'Resolved';
  doc.resolvedAt = new Date();
  doc.timeline.push({ title: 'Resolved', variant: 'success', at: new Date(), by: req.user?.email });
  await doc.save();
  return sendSuccess(res, { data: mapComplaint(doc.toObject()), message: 'Complaint resolved' });
});
