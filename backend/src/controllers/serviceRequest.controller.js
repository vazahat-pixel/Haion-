import ServiceRequest from '../models/ServiceRequest.model.js';
import Warranty from '../models/Warranty.model.js';
import Bill from '../models/Bill.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess, sendCreated, sendError, sendPaginated } from '../utils/apiResponse.js';
import { parsePagination, buildSearchFilter } from '../utils/pagination.util.js';
import { toPublicDoc } from '../utils/serialize.util.js';
import { nextSequence } from '../utils/sequence.util.js';
import { logAudit } from '../services/audit.service.js';
import { notifyCustomerStatusChange } from '../services/notification.service.js';

function mapSR(doc) {
  const d = toPublicDoc(doc);
  return {
    ...d,
    customerName: d.customerName || d.customer,
    assignedToName: d.assignedToName || d.assignedTo,
  };
}

export const listServiceRequests = asyncHandler(async (req, res) => {
  const { page, perPage, skip, sort } = parsePagination(req.query);
  const filter = { ...buildSearchFilter(req.query.search, ['requestNo', 'product', 'issue', 'customerName']) };
  if (req.query.status) filter.status = req.query.status;
  if (req.query.priority) filter.priority = req.query.priority;
  if (req.user.role === 'CUSTOMER') filter.customer = req.user._id;

  const [rows, total] = await Promise.all([
    ServiceRequest.find(filter).sort(sort).skip(skip).limit(perPage).lean(),
    ServiceRequest.countDocuments(filter),
  ]);
  return sendPaginated(res, { data: rows.map(mapSR), total, page, perPage });
});

export const getServiceRequest = asyncHandler(async (req, res) => {
  const filter = { _id: req.params.id };
  if (req.user.role === 'CUSTOMER') filter.customer = req.user._id;
  const doc = await ServiceRequest.findOne(filter).lean();
  if (!doc) return sendError(res, { message: 'Service request not found', statusCode: 404 });
  return sendSuccess(res, { data: mapSR(doc) });
});

export const createServiceRequest = asyncHandler(async (req, res) => {
  const requestNo = req.body.requestNo || nextSequence('SR');
  const billNo = (req.body.billNo || '').trim().toUpperCase();
  const serialNo = (req.body.serialNo || '').trim().toUpperCase();

  let warrantyValid = false;
  let warrantyId = req.body.warrantyId;
  let resolvedProduct = req.body.product;
  let resolvedCustomer = req.body.customerName || `${req.user.firstName} ${req.user.lastName}`;

  if (serialNo) {
    const warranty = await Warranty.findOne({ serialNo, status: 'ACTIVE' }).lean();
    if (warranty) {
      warrantyValid = warranty.endDate > new Date();
      warrantyId = warranty._id;
      resolvedProduct = resolvedProduct || warranty.product;
      resolvedCustomer = resolvedCustomer || warranty.customerName;
    }
  } else if (billNo) {
    const warranty = await Warranty.findOne({ billNo, status: 'ACTIVE' }).lean();
    if (warranty) {
      warrantyValid = warranty.endDate > new Date();
      warrantyId = warranty._id;
      resolvedProduct = resolvedProduct || warranty.product;
      resolvedCustomer = resolvedCustomer || warranty.customerName;
    } else {
      const bill = await Bill.findOne({ billNo }).lean();
      if (bill) {
        resolvedProduct = resolvedProduct || bill.lineItems?.[0]?.product;
        resolvedCustomer = resolvedCustomer || bill.customerName;
      }
    }
  }

  const doc = await ServiceRequest.create({
    requestNo,
    customer: req.user._id,
    customerName: resolvedCustomer,
    product: resolvedProduct,
    serialNo: serialNo || undefined,
    billNo: billNo || undefined,
    issue: req.body.issue,
    priority: req.body.priority || 'MEDIUM',
    status: 'NEW',
    warrantyValid,
    warranty: warrantyId,
    estimatedCompletion: req.body.estimatedCompletion,
    timeline: [{
      title: 'Service request submitted',
      description: billNo ? `Bill ${billNo} validated` : undefined,
      variant: 'info',
      at: new Date(),
      by: `${req.user.firstName} ${req.user.lastName}`,
    }],
  });
  return sendCreated(res, { data: mapSR(doc.toObject()), message: 'Service request submitted' });
});

export const updateServiceRequest = asyncHandler(async (req, res) => {
  const doc = await ServiceRequest.findById(req.params.id);
  if (!doc) return sendError(res, { message: 'Service request not found', statusCode: 404 });
  if (req.user.role === 'CUSTOMER' && String(doc.customer) !== String(req.user._id)) {
    return sendError(res, { message: 'Access denied', statusCode: 403 });
  }

  const allowed = ['priority', 'estimatedCompletion', 'serviceCenter'];
  for (const key of allowed) {
    if (req.body[key] !== undefined) doc[key] = req.body[key];
  }
  doc.timeline.push({ title: 'Service request updated', at: new Date(), by: req.user?.email });
  await doc.save();
  return sendSuccess(res, { data: mapSR(doc.toObject()), message: 'Service request updated' });
});

export const assignServiceRequest = asyncHandler(async (req, res) => {
  const doc = await ServiceRequest.findById(req.params.id);
  if (!doc) return sendError(res, { message: 'Service request not found', statusCode: 404 });

  const techName = req.body.assignedToName || req.body.technicianName || req.user.firstName;
  doc.assignedTo = req.body.assignedTo || req.user._id;
  doc.assignedToName = techName;
  doc.serviceCenter = req.body.serviceCenter || doc.serviceCenter;
  if (doc.status === 'NEW') doc.status = 'ASSIGNED';
  doc.timeline.push({ title: `Assigned to ${techName}`, variant: 'info', at: new Date(), by: req.user?.email });
  await doc.save();

  await logAudit({
    action: 'ASSIGN',
    user: req.user?.email,
    userId: req.user?._id,
    module: 'ServiceRequests',
    ip: req.ip,
    resourceId: doc.requestNo,
  });

  return sendSuccess(res, { data: mapSR(doc.toObject()), message: 'Service request assigned' });
});

const VALID_STATUS_TRANSITIONS = {
  NEW: ['ASSIGNED', 'CANCELLED'],
  ASSIGNED: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['WAITING_PARTS', 'RESOLVED', 'CANCELLED'],
  WAITING_PARTS: ['PARTS_RECEIVED', 'IN_PROGRESS', 'CANCELLED'],
  PARTS_RECEIVED: ['IN_PROGRESS', 'RESOLVED', 'CANCELLED'],
  RESOLVED: ['CLOSED'],
  CLOSED: [],
  CANCELLED: [],
};

export const updateServiceStatus = asyncHandler(async (req, res) => {
  const doc = await ServiceRequest.findById(req.params.id);
  if (!doc) return sendError(res, { message: 'Service request not found', statusCode: 404 });

  const { status } = req.body;
  const allowed = VALID_STATUS_TRANSITIONS[doc.status] || [];
  if (!allowed.includes(status)) {
    return sendError(res, {
      message: `Cannot transition from ${doc.status} to ${status}`,
      statusCode: 400,
    });
  }

  doc.status = status;
  if (status === 'RESOLVED') {
    doc.resolvedAt = new Date();
    doc.resolvedNotes = req.body.notes || req.body.resolvedNotes;
  }
  if (status === 'CLOSED') doc.closedAt = new Date();

  const variantMap = { RESOLVED: 'success', CANCELLED: 'danger', CLOSED: 'success', WAITING_PARTS: 'warning' };
  doc.timeline.push({
    title: `Status changed to ${status.replace(/_/g, ' ')}`,
    description: req.body.notes,
    variant: variantMap[status] || 'default',
    at: new Date(),
    by: req.user?.email,
  });
  await doc.save();

  if (doc.customer) {
    await notifyCustomerStatusChange({
      userId: doc.customer,
      title: `Service update: ${doc.requestNo}`,
      message: `Status changed to ${status.replace(/_/g, ' ')}`,
      resourceId: doc.requestNo,
      link: `/customer/service-requests/${doc._id}`,
    });
  }

  await logAudit({
    action: `STATUS_${status}`,
    user: req.user?.email,
    userId: req.user?._id,
    module: 'ServiceRequests',
    ip: req.ip,
    resourceId: doc.requestNo,
  });

  return sendSuccess(res, { data: mapSR(doc.toObject()), message: `Status updated to ${status}` });
});

export const addServiceNote = asyncHandler(async (req, res) => {
  const doc = await ServiceRequest.findById(req.params.id);
  if (!doc) return sendError(res, { message: 'Service request not found', statusCode: 404 });

  const note = {
    text: req.body.text,
    addedBy: req.user?.email || req.user?.firstName,
    addedByUser: req.user?._id,
    addedAt: new Date(),
    attachmentUrl: req.body.attachmentUrl,
    attachmentName: req.body.attachmentName,
  };
  doc.notes.push(note);
  doc.timeline.push({
    title: 'Note added',
    description: req.body.text?.substring(0, 80),
    at: new Date(),
    by: req.user?.email,
  });
  await doc.save();
  return sendSuccess(res, { data: mapSR(doc.toObject()), message: 'Note added' });
});

export const getServiceTimeline = asyncHandler(async (req, res) => {
  const filter = { _id: req.params.id };
  if (req.user.role === 'CUSTOMER') filter.customer = req.user._id;
  const doc = await ServiceRequest.findOne(filter).select('timeline requestNo status').lean();
  if (!doc) return sendError(res, { message: 'Service request not found', statusCode: 404 });
  return sendSuccess(res, { data: doc.timeline || [] });
});

export const closeServiceRequest = asyncHandler(async (req, res) => {
  const doc = await ServiceRequest.findById(req.params.id);
  if (!doc) return sendError(res, { message: 'Service request not found', statusCode: 404 });
  if (doc.status !== 'RESOLVED') {
    return sendError(res, { message: 'Only resolved requests can be closed', statusCode: 400 });
  }

  const SpareRequest = (await import('../models/SpareRequest.model.js')).default;
  const Return = (await import('../models/Return.model.js')).default;
  const dispatchedSpares = await SpareRequest.countDocuments({
    serviceRequest: doc._id,
    status: { $in: ['DISPATCHED', 'RECEIVED', 'COMPLETED'] },
  });
  const completedReturns = await Return.countDocuments({
    serviceRequest: doc._id,
    status: { $in: ['RECEIVED', 'VERIFIED'] },
  });
  const missingReturn = dispatchedSpares > 0 && completedReturns < dispatchedSpares;
  if (missingReturn && !req.body.confirmMissingReturn) {
    return sendError(res, {
      message: 'Spare parts were dispatched but defective return is incomplete. Confirm to close anyway.',
      statusCode: 409,
      data: { missingDefectiveReturn: true, dispatchedSpares, completedReturns },
    });
  }

  doc.status = 'CLOSED';
  doc.closedAt = new Date();
  doc.timeline.push({
    title: missingReturn ? 'Request closed (defective return pending)' : 'Request closed',
    variant: missingReturn ? 'warning' : 'success',
    at: new Date(),
    by: req.user?.email,
  });
  await doc.save();
  return sendSuccess(res, {
    data: mapSR(doc.toObject()),
    message: missingReturn ? 'Closed with pending defective return flagged' : 'Service request closed',
  });
});

export const getServiceDashboardKpis = asyncHandler(async (_req, res) => {
  const [newCount, assignedCount, inProgressCount, waitingParts, resolvedToday, overdueCount] = await Promise.all([
    ServiceRequest.countDocuments({ status: 'NEW' }),
    ServiceRequest.countDocuments({ status: 'ASSIGNED' }),
    ServiceRequest.countDocuments({ status: 'IN_PROGRESS' }),
    ServiceRequest.countDocuments({ status: 'WAITING_PARTS' }),
    ServiceRequest.countDocuments({
      status: 'RESOLVED',
      resolvedAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
    }),
    ServiceRequest.countDocuments({
      status: { $nin: ['RESOLVED', 'CLOSED', 'CANCELLED'] },
      estimatedCompletion: { $lt: new Date() },
    }),
  ]);
  return sendSuccess(res, {
    data: {
      new: newCount,
      assigned: assignedCount,
      inProgress: inProgressCount,
      waitingParts,
      resolvedToday,
      overdue: overdueCount,
      total: newCount + assignedCount + inProgressCount + waitingParts,
    },
  });
});

export const lookupWarrantyForService = asyncHandler(async (req, res) => {
  const serial = (req.query.serialNo || req.query.serial || '').trim().toUpperCase();
  const billNo = (req.query.billNo || '').trim().toUpperCase();
  if (!serial && !billNo) {
    return sendError(res, { message: 'Provide serialNo or billNo', statusCode: 400 });
  }
  const filter = {};
  if (serial) filter.serialNo = serial;
  if (billNo) filter.billNo = billNo;
  const warranty = await Warranty.findOne(filter).lean();
  if (!warranty) {
    return sendSuccess(res, { data: { found: false, eligible: false, reason: 'No warranty record found' } });
  }
  const now = new Date();
  const eligible = warranty.status === 'ACTIVE' && warranty.endDate > now;
  return sendSuccess(res, {
    data: {
      found: true,
      eligible,
      warranty: {
        id: String(warranty._id),
        serialNo: warranty.serialNo,
        product: warranty.product,
        customerName: warranty.customerName,
        billNo: warranty.billNo,
        status: warranty.status,
        startDate: warranty.startDate,
        endDate: warranty.endDate,
      },
      reason: eligible ? 'Active warranty' : `Warranty ${warranty.status.toLowerCase()}`,
    },
  });
});
