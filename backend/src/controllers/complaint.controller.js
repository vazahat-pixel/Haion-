import Complaint from '../models/Complaint.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess, sendCreated, sendError, sendPaginated } from '../utils/apiResponse.js';
import { parsePagination, buildSearchFilter } from '../utils/pagination.util.js';
import { toPublicDoc } from '../utils/serialize.util.js';
import { nextSequence } from '../utils/sequence.util.js';

function mapComplaint(doc) {
  const d = toPublicDoc(doc);
  return { ...d, createdAt: d.createdAt };
}

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
  const doc = await Complaint.create({
    ticketNo,
    customer: req.body.customer,
    customerId: req.body.customerId,
    product: req.body.product,
    serialNo: req.body.serialNo,
    priority: req.body.priority || 'MEDIUM',
    description: req.body.description || req.body.issue,
    assignedTo: req.body.assignedTo,
    timeline: [{ title: 'Ticket created', at: new Date(), by: req.user?.email }],
  });
  return sendCreated(res, { data: mapComplaint(doc.toObject()), message: 'Complaint created' });
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
