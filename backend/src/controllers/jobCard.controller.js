import JobCard from '../models/JobCard.model.js';
import Complaint from '../models/Complaint.model.js';
import ServiceCenterInventory from '../models/ServiceCenterInventory.model.js';
import SpareRequest from '../models/SpareRequest.model.js';
import Return from '../models/Return.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess, sendCreated, sendError, sendPaginated } from '../utils/apiResponse.js';
import { parsePagination, buildSearchFilter } from '../utils/pagination.util.js';
import { toPublicDoc } from '../utils/serialize.util.js';
import { nextSequence } from '../utils/sequence.util.js';
import { notifyUsers } from '../services/notification.service.js';
import { customerUserIds, contactUserIds, serviceCenterUserIds } from '../services/notificationTargets.service.js';

function mapJobCard(doc) {
  return toPublicDoc(doc);
}

/** The customer's login for a job card, by linked record then by contact details. */
async function jobCardCustomerUsers(jobCard) {
  const byCustomer = await customerUserIds(jobCard.customer?.customerId);
  if (byCustomer.length) return byCustomer;
  return contactUserIds({ email: jobCard.customer?.email, phone: jobCard.customer?.phone });
}

/** Notifications are a side effect — never let one fail the request. */
async function safeNotify(label, fn) {
  try {
    await fn();
  } catch (err) {
    console.error(`[Notification] ${label} failed:`, err.message);
  }
}

export const listJobCards = asyncHandler(async (req, res) => {
  const { page, perPage, skip, sort } = parsePagination(req.query);
  const filter = { ...buildSearchFilter(req.query.search, ['jobCardNo', 'complaintDescription', 'customer.name', 'product.name', 'product.serialNo']) };
  if (req.query.status) filter.status = req.query.status;
  if (req.query.source) filter.source = req.query.source;
  if (req.query.serviceCenter) filter.serviceCenter = req.query.serviceCenter;

  const [rows, total] = await Promise.all([
    JobCard.find(filter).sort(sort).skip(skip).limit(perPage).lean(),
    JobCard.countDocuments(filter),
  ]);
  return sendPaginated(res, { data: rows.map(mapJobCard), total, page, perPage });
});

export const getJobCard = asyncHandler(async (req, res) => {
  const doc = await JobCard.findById(req.params.id).lean();
  if (!doc) return sendError(res, { message: 'Job card not found', statusCode: 404 });
  return sendSuccess(res, { data: mapJobCard(doc) });
});

export const getJobCardByComplaint = asyncHandler(async (req, res) => {
  const doc = await JobCard.findOne({ complaint: req.params.complaintId }).lean();
  if (!doc) return sendError(res, { message: 'Job card not found for this complaint', statusCode: 404 });
  return sendSuccess(res, { data: mapJobCard(doc) });
});

export const createJobCard = asyncHandler(async (req, res) => {
  const { complaintId, assignedEngineer, labourCharges, serviceCenter } = req.body;
  const complaint = await Complaint.findById(complaintId);
  if (!complaint) return sendError(res, { message: 'Complaint not found', statusCode: 400 });

  const existing = await JobCard.findOne({ complaint: complaintId });
  if (existing) {
    return sendSuccess(res, { data: mapJobCard(existing.toObject()), message: 'Job Card already exists' });
  }

  const jobCardNo = nextSequence('JC');
  const costType = complaint.costType || (complaint.warrantyEligible ? 'FOC' : 'PAID');

  const doc = await JobCard.create({
    jobCardNo,
    complaint: complaint._id,
    source: complaint.source || 'CUSTOMER_PANEL',
    customer: {
      name: complaint.customer,
      phone: complaint.phone,
      email: complaint.email,
      customerId: complaint.customerId,
    },
    product: {
      name: complaint.product,
      serialNo: complaint.serialNo,
      billNo: complaint.billNo,
    },
    complaintDescription: complaint.description,
    serviceCenter: serviceCenter || complaint.serviceCenter,
    serviceCenterName: complaint.serviceCenterName,
    assignedEngineer: assignedEngineer ? { name: assignedEngineer } : undefined,
    warrantyStatus: {
      isWarranty: !!complaint.warrantyEligible,
      costType,
      status: complaint.warrantyStatus || 'ACTIVE',
      reason: complaint.warrantyReason || (complaint.warrantyEligible ? 'Active warranty' : 'Out of warranty'),
    },
    labourCharges: labourCharges || 0,
    totalAmount: costType === 'FOC' ? 0 : (labourCharges || 0),
    status: 'OPEN',
    timeline: [
      {
        title: 'Job Card Generated',
        description: `Generated for ticket ${complaint.ticketNo} (${costType})`,
        variant: 'info',
        at: new Date(),
        by: req.user?.email || 'system',
      },
    ],
  });

  complaint.jobCard = doc._id;
  await complaint.save();

  await safeNotify('job card created', async () => {
    const [customers, centre] = await Promise.all([
      jobCardCustomerUsers(doc),
      serviceCenterUserIds(doc.serviceCenter),
    ]);
    await Promise.all([
      notifyUsers(customers, {
        title: 'Repair job opened',
        message: `Job card ${doc.jobCardNo} has been opened for your ${doc.product?.name || 'product'}.`,
        type: 'CUSTOMER',
        module: 'JobCard',
        resourceId: doc.jobCardNo,
        link: '/customer/complaints',
      }),
      notifyUsers(centre, {
        title: 'New job card assigned',
        message: `${doc.jobCardNo} — ${doc.product?.name || 'product'} for ${doc.customer?.name || 'customer'}`,
        type: 'SERVICE',
        module: 'JobCard',
        resourceId: doc.jobCardNo,
        link: '/service/job-cards',
      }),
    ]);
  });

  return sendCreated(res, { data: mapJobCard(doc.toObject()), message: 'Job Card created successfully' });
});

export const consumeParts = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { sku, name, quantity, unitPrice, isDefective, serviceCenterId } = req.body;

  const jobCard = await JobCard.findById(id);
  if (!jobCard) return sendError(res, { message: 'Job Card not found', statusCode: 404 });

  const centerId = serviceCenterId || jobCard.serviceCenter;
  const qty = Number(quantity) || 1;

  if (centerId && sku) {
    const inv = await ServiceCenterInventory.findOne({ serviceCenter: centerId, sku: sku.toUpperCase() });
    if (inv) {
      if (inv.availableStock < qty) {
        return sendError(res, {
          message: `Insufficient inventory for SKU ${sku}. Available: ${inv.availableStock}`,
          statusCode: 400,
        });
      }
      inv.availableStock -= qty;
      if (isDefective) inv.defectiveStock += qty;
      await inv.save();
    }
  }

  const price = Number(unitPrice) || 0;
  jobCard.partsUsed.push({
    sku: (sku || 'PART').toUpperCase(),
    name: name || sku || 'Spare Part',
    quantity: qty,
    unitPrice: price,
    isDefective: !!isDefective,
  });

  const partsTotal = jobCard.partsUsed.reduce((sum, p) => sum + p.quantity * p.unitPrice, 0);
  const isFOC = jobCard.warrantyStatus?.costType === 'FOC';
  jobCard.totalAmount = isFOC ? 0 : partsTotal + (jobCard.labourCharges || 0);

  jobCard.timeline.push({
    title: 'Parts Consumed',
    description: `${qty} × ${name || sku} added to job card`,
    variant: 'success',
    at: new Date(),
    by: req.user?.email,
  });

  await jobCard.save();
  return sendSuccess(res, { data: mapJobCard(jobCard.toObject()), message: 'Parts updated and inventory deducted' });
});

export const markDefectivePart = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { partId, requestReplacement, serviceCenterId } = req.body;

  const jobCard = await JobCard.findById(id);
  if (!jobCard) return sendError(res, { message: 'Job Card not found', statusCode: 404 });

  const part = jobCard.partsUsed.id(partId);
  if (!part) return sendError(res, { message: 'Part not found in Job Card', statusCode: 404 });

  part.isDefective = true;

  const centerId = serviceCenterId || jobCard.serviceCenter;
  if (centerId && part.sku) {
    const inv = await ServiceCenterInventory.findOne({ serviceCenter: centerId, sku: part.sku.toUpperCase() });
    if (inv) {
      inv.defectiveStock += part.quantity;
      await inv.save();
    }
  }

  let spareReq = null;
  if (requestReplacement) {
    const requestNo = nextSequence('SPR');
    spareReq = await SpareRequest.create({
      requestNo,
      partName: part.name,
      sku: part.sku,
      quantity: part.quantity,
      requestedBy: req.user?.firstName || 'Service Center',
      requestedUser: req.user?._id,
      complaint: jobCard.complaint,
      notes: `Defective replacement requested from Job Card ${jobCard.jobCardNo}`,
      status: 'PENDING',
      timeline: [{ title: 'Defective replacement requested', variant: 'warning', at: new Date(), by: req.user?.email }],
    });

    await Return.create({
      returnNo: nextSequence('RET'),
      product: part.name,
      serialNo: `DEF-${jobCard.jobCardNo}`,
      reason: 'Defective part removed during repair',
      status: 'EXPECTED',
      spareRequest: spareReq._id,
      returnedBy: jobCard.customer.name,
      timeline: [{ title: 'Defective part return expected', variant: 'info', at: new Date(), by: req.user?.email }],
    });
  }

  jobCard.timeline.push({
    title: 'Part Marked Defective',
    description: `${part.name} marked defective. Replacement request: ${requestReplacement ? 'Yes' : 'No'}`,
    variant: 'warning',
    at: new Date(),
    by: req.user?.email,
  });

  await jobCard.save();
  return sendSuccess(res, {
    data: { jobCard: mapJobCard(jobCard.toObject()), spareRequest: spareReq ? toPublicDoc(spareReq) : null },
    message: 'Part marked defective successfully',
  });
});

export const updateJobCardStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, labourCharges, engineerName, engineerPhone } = req.body;

  const jobCard = await JobCard.findById(id);
  if (!jobCard) return sendError(res, { message: 'Job Card not found', statusCode: 404 });

  if (status) jobCard.status = status;
  if (labourCharges !== undefined) jobCard.labourCharges = Number(labourCharges) || 0;
  if (engineerName) {
    jobCard.assignedEngineer = {
      name: engineerName,
      phone: engineerPhone || jobCard.assignedEngineer?.phone,
    };
  }

  const partsTotal = jobCard.partsUsed.reduce((sum, p) => sum + p.quantity * p.unitPrice, 0);
  const isFOC = jobCard.warrantyStatus?.costType === 'FOC';
  jobCard.totalAmount = isFOC ? 0 : partsTotal + (jobCard.labourCharges || 0);

  if (status === 'RESOLVED') jobCard.resolvedAt = new Date();
  if (status === 'CLOSED') jobCard.closedAt = new Date();

  jobCard.timeline.push({
    title: `Job Status → ${status || 'UPDATED'}`,
    at: new Date(),
    by: req.user?.email,
  });

  await jobCard.save();

  if (status) {
    const complaint = await Complaint.findById(jobCard.complaint);
    if (complaint) {
      if (['REPAIRED', 'RESOLVED'].includes(status)) {
        complaint.status = 'RESOLVED';
        complaint.resolvedAt = new Date();
        complaint.timeline.push({ title: 'Job completed & resolved', variant: 'success', at: new Date(), by: req.user?.email });
        await complaint.save();
      } else if (status === 'CLOSED') {
        complaint.status = 'CLOSED';
        await complaint.save();
      }
    }
  }

  if (status) {
    await safeNotify('job card status', async () => {
      const customers = await jobCardCustomerUsers(jobCard);
      await notifyUsers(customers, {
        title: `Repair update: ${jobCard.jobCardNo}`,
        message: `Your ${jobCard.product?.name || 'product'} is now ${String(status).replace(/_/g, ' ').toLowerCase()}.`,
        type: 'CUSTOMER',
        module: 'JobCard',
        resourceId: jobCard.jobCardNo,
        link: '/customer/complaints',
      });
    });
  }

  return sendSuccess(res, { data: mapJobCard(jobCard.toObject()), message: 'Job Card status updated' });
});

export const submitCustomerFeedback = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rating, comment } = req.body;

  const jobCard = await JobCard.findById(id);
  if (!jobCard) return sendError(res, { message: 'Job Card not found', statusCode: 404 });

  jobCard.customerFeedback = {
    rating: Number(rating) || 5,
    comment: comment || '',
    submittedAt: new Date(),
  };

  jobCard.timeline.push({
    title: `Feedback Received: ${rating}★`,
    description: comment,
    variant: 'success',
    at: new Date(),
    by: 'customer',
  });

  await jobCard.save();

  const complaint = await Complaint.findById(jobCard.complaint);
  if (complaint) {
    complaint.feedback = jobCard.customerFeedback;
    await complaint.save();
  }

  return sendSuccess(res, { data: mapJobCard(jobCard.toObject()), message: 'Thank you for your feedback!' });
});
