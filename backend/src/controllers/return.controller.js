import Return from '../models/Return.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess, sendCreated, sendError, sendPaginated } from '../utils/apiResponse.js';
import { parsePagination, buildSearchFilter } from '../utils/pagination.util.js';
import { toPublicDoc } from '../utils/serialize.util.js';
import { nextSequence } from '../utils/sequence.util.js';
import { logAudit } from '../services/audit.service.js';

function mapReturn(doc) {
  return toPublicDoc(doc);
}

// Helper: mark overdue if > 7 days in EXPECTED/SHIPPED state
async function markOverdueReturns() {
  const threshold = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  await Return.updateMany(
    {
      status: { $in: ['EXPECTED', 'SHIPPED'] },
      createdAt: { $lt: threshold },
      overdue: false,
    },
    {
      $set: { overdue: true, status: 'OVERDUE', overdueAt: new Date() },
    }
  );
}

export const listReturns = asyncHandler(async (req, res) => {
  // Check and flag overdue returns on each list call
  await markOverdueReturns();

  const { page, perPage, skip, sort } = parsePagination(req.query);
  const filter = { ...buildSearchFilter(req.query.search, ['returnNo', 'product', 'serialNo']) };
  if (req.query.status) filter.status = req.query.status;
  if (req.query.overdue === 'true') filter.overdue = true;

  const [rows, total] = await Promise.all([
    Return.find(filter).sort(sort).skip(skip).limit(perPage).lean(),
    Return.countDocuments(filter),
  ]);
  return sendPaginated(res, { data: rows.map(mapReturn), total, page, perPage });
});

export const getReturn = asyncHandler(async (req, res) => {
  const doc = await Return.findById(req.params.id).lean();
  if (!doc) return sendError(res, { message: 'Return not found', statusCode: 404 });
  return sendSuccess(res, { data: mapReturn(doc) });
});

export const createReturn = asyncHandler(async (req, res) => {
  const returnNo = req.body.returnNo || nextSequence('RET');

  // Determine expected return date (7 days from now by default)
  const dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const doc = await Return.create({
    returnNo,
    product: req.body.product,
    serialNo: req.body.serialNo,
    reason: req.body.reason,
    warranty: req.body.warrantyId || req.body.warranty,
    spareRequest: req.body.spareRequestId || req.body.spareRequest,
    serviceRequest: req.body.serviceRequestId || req.body.serviceRequest,
    complaint: req.body.complaintId || req.body.complaint,
    returnedBy: req.body.returnedBy,
    status: 'EXPECTED',
    overdueAt: dueDate,
    timeline: [{ title: 'Return expected', variant: 'info', at: new Date(), by: req.user?.email }],
  });
  return sendCreated(res, { data: mapReturn(doc.toObject()), message: 'Return created — awaiting shipment' });
});

export const shipReturn = asyncHandler(async (req, res) => {
  const doc = await Return.findById(req.params.id);
  if (!doc) return sendError(res, { message: 'Return not found', statusCode: 404 });
  if (!['EXPECTED', 'OVERDUE'].includes(doc.status)) {
    return sendError(res, { message: 'Only expected returns can be marked shipped', statusCode: 400 });
  }
  doc.status = 'SHIPPED';
  doc.shippedAt = new Date();
  doc.overdue = false; // Reset overdue if shipped
  doc.timeline.push({ title: 'Item shipped back', description: req.body.notes, variant: 'info', at: new Date(), by: req.user?.email });
  await doc.save();
  return sendSuccess(res, { data: mapReturn(doc.toObject()), message: 'Return marked as shipped' });
});

export const receiveReturn = asyncHandler(async (req, res) => {
  const doc = await Return.findById(req.params.id);
  if (!doc) return sendError(res, { message: 'Return not found', statusCode: 404 });
  if (doc.status !== 'SHIPPED') {
    return sendError(res, { message: 'Return must be shipped before marking received', statusCode: 400 });
  }
  doc.status = 'RECEIVED';
  doc.receivedAt = new Date();
  doc.conditionOnArrival = req.body.conditionOnArrival || 'UNKNOWN';
  doc.timeline.push({ title: 'Item received at warehouse', description: req.body.notes, variant: 'default', at: new Date(), by: req.user?.email });
  await doc.save();
  return sendSuccess(res, { data: mapReturn(doc.toObject()), message: 'Return received' });
});

export const inspectReturn = asyncHandler(async (req, res) => {
  const doc = await Return.findById(req.params.id);
  if (!doc) return sendError(res, { message: 'Return not found', statusCode: 404 });
  if (doc.status !== 'RECEIVED') {
    return sendError(res, { message: 'Return must be received before inspection', statusCode: 400 });
  }
  doc.inspectionNotes = req.body.notes || req.body.inspectionNotes;
  doc.inspectedAt = new Date();
  doc.status = 'RECEIVED'; // Stays RECEIVED until verified/rejected
  doc.timeline.push({ title: 'Inspection recorded', description: doc.inspectionNotes, at: new Date(), by: req.user?.email });
  await doc.save();
  return sendSuccess(res, { data: mapReturn(doc.toObject()), message: 'Inspection recorded' });
});

export const verifyReturn = asyncHandler(async (req, res) => {
  const doc = await Return.findById(req.params.id);
  if (!doc) return sendError(res, { message: 'Return not found', statusCode: 404 });
  if (!['RECEIVED'].includes(doc.status)) {
    return sendError(res, { message: 'Return must be received before verification', statusCode: 400 });
  }
  const approved = req.body.approved !== false;
  doc.status = approved ? 'VERIFIED' : 'REJECTED';
  doc.verifiedAt = new Date();
  if (!doc.receivedAt) doc.receivedAt = new Date();
  doc.inspectionNotes = req.body.notes || req.body.inspectionNotes || doc.inspectionNotes;
  doc.conditionOnArrival = req.body.conditionOnArrival || doc.conditionOnArrival;
  doc.timeline.push({
    title: approved ? 'Return verified and accepted' : 'Return rejected',
    description: doc.inspectionNotes,
    variant: approved ? 'success' : 'danger',
    at: new Date(),
    by: req.user?.email,
  });
  await doc.save();

  await logAudit({
    action: approved ? 'VERIFY' : 'REJECT',
    user: req.user?.email,
    userId: req.user?._id,
    module: 'Returns',
    ip: req.ip,
    resourceId: doc.returnNo,
  });

  return sendSuccess(res, { data: mapReturn(doc.toObject()), message: approved ? 'Return verified' : 'Return rejected' });
});

export const getReturnTimeline = asyncHandler(async (req, res) => {
  const doc = await Return.findById(req.params.id).select('timeline returnNo status').lean();
  if (!doc) return sendError(res, { message: 'Return not found', statusCode: 404 });
  return sendSuccess(res, { data: doc.timeline || [] });
});

export const getReturnKpis = asyncHandler(async (_req, res) => {
  await markOverdueReturns();
  const [expected, shipped, received, verified, rejected, overdue] = await Promise.all([
    Return.countDocuments({ status: 'EXPECTED' }),
    Return.countDocuments({ status: 'SHIPPED' }),
    Return.countDocuments({ status: 'RECEIVED' }),
    Return.countDocuments({ status: 'VERIFIED' }),
    Return.countDocuments({ status: 'REJECTED' }),
    Return.countDocuments({ overdue: true }),
  ]);
  return sendSuccess(res, { data: { expected, shipped, received, verified, rejected, overdue, total: expected + shipped + received } });
});
