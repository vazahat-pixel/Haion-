import Complaint from '../models/Complaint.model.js';
import Warranty from '../models/Warranty.model.js';
import Bill from '../models/Bill.model.js';
import Customer from '../models/Customer.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess, sendCreated, sendError, sendPaginated } from '../utils/apiResponse.js';
import { parsePagination, buildSearchFilter } from '../utils/pagination.util.js';
import { toPublicDoc } from '../utils/serialize.util.js';
import { nextSequence } from '../utils/sequence.util.js';
import { notifyUsers } from '../services/notification.service.js';
import {
  customerUserIds,
  contactUserIds,
  supportUserIds,
  serviceCenterUserIds,
} from '../services/notificationTargets.service.js';

/** Who is this complaint's customer, on the login side? */
async function complaintCustomerUsers(doc) {
  const byCustomer = await customerUserIds(doc.customerId);
  if (byCustomer.length) return byCustomer;
  return contactUserIds({ email: doc.email, phone: doc.phone });
}

/** Notifications are a side effect — never let one fail the request. */
async function safeNotify(label, fn) {
  try {
    await fn();
  } catch (err) {
    console.error(`[Notification] ${label} failed:`, err.message);
  }
}

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
  const filter = { ...buildSearchFilter(req.query.search, ['ticketNo', 'customer', 'product', 'serialNo', 'phone']) };
  if (req.query.status) filter.status = req.query.status;
  if (req.query.priority) filter.priority = req.query.priority;
  if (req.query.source) filter.source = req.query.source;
  if (req.query.serviceCenter) filter.serviceCenter = req.query.serviceCenter;

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

export const searchCustomer360 = asyncHandler(async (req, res) => {
  const phone = (req.query.phone || req.body?.phone || '').trim();
  const serialNo = (req.query.serialNo || req.body?.serialNo || '').trim().toUpperCase();

  if (!phone && !serialNo) {
    return sendError(res, { message: 'Mobile number or Serial number is required', statusCode: 400 });
  }

  let warrantyMeta = {};
  if (serialNo) {
    warrantyMeta = await resolveWarrantyForBill('', serialNo);
  }

  const contactMeta = await lookupByContact({ phone, email: '' });

  const complaintFilter = { $or: [] };
  if (phone) complaintFilter.$or.push({ phone });
  if (serialNo) complaintFilter.$or.push({ serialNo });

  const existingComplaints = complaintFilter.$or.length
    ? await Complaint.find(complaintFilter).sort({ createdAt: -1 }).limit(10).lean()
    : [];

  const costType = (warrantyMeta.eligible || contactMeta.eligible) ? 'FOC' : 'PAID';

  return sendSuccess(res, {
    data: {
      found: !!(warrantyMeta.warranty || contactMeta.matches?.length || existingComplaints.length),
      customerName: warrantyMeta.customerName || contactMeta.matches?.[0]?.customerName || 'Walk-in Customer',
      phone: phone || '',
      product: warrantyMeta.product || contactMeta.matches?.[0]?.product || 'Standard Appliance',
      serialNo: serialNo || '',
      billNo: warrantyMeta.warranty?.billNo || contactMeta.matches?.[0]?.billNo || '',
      warrantyStatus: warrantyMeta.warrantyStatus || contactMeta.warrantyStatus || 'OUT_OF_WARRANTY',
      warrantyEligible: !!(warrantyMeta.eligible || contactMeta.eligible),
      costType,
      warrantyReason: warrantyMeta.warrantyReason || contactMeta.warrantyReason || 'Calculated during lookup',
      complaintHistory: existingComplaints.map(mapComplaint),
      purchaseMatches: contactMeta.matches || [],
    },
  });
});

export const createComplaint = asyncHandler(async (req, res) => {
  const ticketNo = req.body.ticketNo || nextSequence('CMP');
  let warrantyMeta = {};
  if (req.body.billNo || req.body.serialNo) {
    warrantyMeta = await resolveWarrantyForBill(req.body.billNo || '', req.body.serialNo || '');
  }

  const isEligible = req.body.warrantyEligible !== undefined ? !!req.body.warrantyEligible : !!warrantyMeta.eligible;
  const costType = req.body.costType || (isEligible ? 'FOC' : 'PAID');
  const source = req.body.source || 'CUSTOMER_PANEL';

  const doc = await Complaint.create({
    ticketNo,
    customer: req.body.customer || warrantyMeta.customerName || 'Customer',
    customerId: req.body.customerId,
    phone: req.body.phone,
    email: req.body.email,
    billNo: req.body.billNo?.trim().toUpperCase(),
    product: req.body.product || warrantyMeta.product || 'Standard Product',
    serialNo: req.body.serialNo?.trim().toUpperCase(),
    priority: req.body.priority || 'MEDIUM',
    description: req.body.description || req.body.issue || 'Service Complaint',
    assignedTo: req.body.assignedTo,
    source,
    serviceCenter: req.body.serviceCenter,
    serviceCenterName: req.body.serviceCenterName,
    warrantyEligible: isEligible,
    warrantyStatus: warrantyMeta.warrantyStatus || (isEligible ? 'ACTIVE' : 'EXPIRED'),
    warrantyReason: warrantyMeta.warrantyReason || (isEligible ? 'Active warranty' : 'Out of warranty'),
    costType,
    timeline: [{
      title: `Complaint created (${source.replace(/_/g, ' ')})`,
      description: `Warranty: ${costType} (${warrantyMeta.warrantyReason || 'Evaluated'})`,
      at: new Date(),
      by: req.user?.email || 'system',
    }],
  });

  try {
    const JobCard = (await import('../models/JobCard.model.js')).default;
    const jobCardNo = nextSequence('JC');
    const jobCard = await JobCard.create({
      jobCardNo,
      complaint: doc._id,
      source,
      customer: {
        name: doc.customer,
        phone: doc.phone,
        email: doc.email,
        customerId: doc.customerId,
      },
      product: {
        name: doc.product,
        serialNo: doc.serialNo,
        billNo: doc.billNo,
      },
      complaintDescription: doc.description,
      serviceCenter: doc.serviceCenter,
      serviceCenterName: doc.serviceCenterName,
      warrantyStatus: {
        isWarranty: isEligible,
        costType,
        status: doc.warrantyStatus,
        reason: doc.warrantyReason,
      },
      status: 'OPEN',
      timeline: [{
        title: 'Job Card Auto-Created',
        description: `Source: ${source}, Cost: ${costType}`,
        at: new Date(),
        by: req.user?.email || 'system',
      }],
    });

    doc.jobCard = jobCard._id;
    await doc.save();
  } catch (err) {
    console.error('JobCard auto-creation notice:', err.message);
  }

  await safeNotify('complaint created', async () => {
    const [customers, support] = await Promise.all([complaintCustomerUsers(doc), supportUserIds()]);
    await Promise.all([
      notifyUsers(customers, {
        title: 'Complaint registered',
        message: `Ticket ${doc.ticketNo} for ${doc.product} has been registered. We will update you shortly.`,
        type: 'CUSTOMER',
        module: 'Complaint',
        resourceId: doc.ticketNo,
        link: '/customer/complaints',
      }),
      notifyUsers(support, {
        title: 'New complaint',
        message: `${doc.ticketNo} — ${doc.product} from ${doc.customer} (${doc.priority})`,
        type: 'SERVICE',
        module: 'Complaint',
        resourceId: doc.ticketNo,
        link: '/admin/complaints',
      }),
    ]);
  });

  return sendCreated(res, { data: mapComplaint(doc.toObject()), message: 'Complaint created successfully' });
});

export const assignServiceCenter = asyncHandler(async (req, res) => {
  const doc = await Complaint.findById(req.params.id);
  if (!doc) return sendError(res, { message: 'Complaint not found', statusCode: 404 });

  doc.serviceCenter = req.body.serviceCenterId || req.body.serviceCenter;
  doc.serviceCenterName = req.body.serviceCenterName || req.body.name;
  doc.timeline.push({
    title: `Assigned to Service Center: ${doc.serviceCenterName || 'Center'}`,
    at: new Date(),
    by: req.user?.email,
  });
  await doc.save();

  try {
    const JobCard = (await import('../models/JobCard.model.js')).default;
    const jobCard = await JobCard.findOne({ complaint: doc._id });
    if (jobCard) {
      jobCard.serviceCenter = doc.serviceCenter;
      jobCard.serviceCenterName = doc.serviceCenterName;
      await jobCard.save();
    }
  } catch {}

  await safeNotify('complaint assigned', async () => {
    const [customers, centre] = await Promise.all([
      complaintCustomerUsers(doc),
      serviceCenterUserIds(doc.serviceCenter),
    ]);
    await Promise.all([
      notifyUsers(customers, {
        title: 'Service centre assigned',
        message: `Ticket ${doc.ticketNo} is now with ${doc.serviceCenterName || 'a service centre'}.`,
        type: 'CUSTOMER',
        module: 'Complaint',
        resourceId: doc.ticketNo,
        link: '/customer/complaints',
      }),
      notifyUsers(centre, {
        title: 'Complaint assigned to you',
        message: `${doc.ticketNo} — ${doc.product} for ${doc.customer}`,
        type: 'SERVICE',
        module: 'Complaint',
        resourceId: doc.ticketNo,
        link: '/service/complaints',
      }),
    ]);
  });

  return sendSuccess(res, { data: mapComplaint(doc.toObject()), message: 'Service Center assigned successfully' });
});

export const createPublicComplaint = asyncHandler(async (req, res) => {
  const { customer, product, description, billNo, phone, email, serialNo, source } = req.body;
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
  if (billNo?.trim() || serialNo?.trim()) {
    warrantyMeta = await resolveWarrantyForBill(billNo?.trim() || '', serialNo?.trim() || '');
  }

  const isEligible = !!warrantyMeta.eligible;
  const costType = isEligible ? 'FOC' : 'PAID';
  const cmpSource = source || 'CUSTOMER_PANEL';

  const doc = await Complaint.create({
    ticketNo,
    customer: customer.trim(),
    phone: phone?.trim(),
    email: email?.trim(),
    billNo: billNo?.trim().toUpperCase(),
    product: product.trim(),
    serialNo: serialNo?.trim().toUpperCase(),
    priority: 'MEDIUM',
    description: description.trim(),
    source: cmpSource,
    warrantyEligible: isEligible,
    warrantyStatus: warrantyMeta.warrantyStatus || (isEligible ? 'ACTIVE' : 'EXPIRED'),
    warrantyReason: warrantyMeta.warrantyReason || (isEligible ? 'Active warranty' : 'Out of warranty'),
    costType,
    timeline: [{
      title: `Complaint submitted (${cmpSource.replace(/_/g, ' ')})`,
      description: warrantyMeta.warrantyReason ? `Warranty: ${warrantyMeta.warrantyReason}` : undefined,
      at: new Date(),
      by: 'customer',
    }],
  });

  try {
    const JobCard = (await import('../models/JobCard.model.js')).default;
    const jobCardNo = nextSequence('JC');
    const jobCard = await JobCard.create({
      jobCardNo,
      complaint: doc._id,
      source: cmpSource,
      customer: { name: doc.customer, phone: doc.phone, email: doc.email },
      product: { name: doc.product, serialNo: doc.serialNo, billNo: doc.billNo },
      complaintDescription: doc.description,
      warrantyStatus: { isWarranty: isEligible, costType, status: doc.warrantyStatus, reason: doc.warrantyReason },
      status: 'OPEN',
      timeline: [{ title: 'Job Card Auto-Created', at: new Date(), by: 'customer' }],
    });
    doc.jobCard = jobCard._id;
    await doc.save();
  } catch {}

  await safeNotify('public complaint created', async () => {
    const support = await supportUserIds();
    await notifyUsers(support, {
      title: 'New complaint from website',
      message: `${doc.ticketNo} — ${doc.product} from ${doc.customer}`,
      type: 'SERVICE',
      module: 'Complaint',
      resourceId: doc.ticketNo,
      link: '/admin/complaints',
    });
  });

  return sendCreated(res, { data: mapComplaint(doc.toObject()), message: 'Complaint submitted successfully' });
});

export const updateComplaint = asyncHandler(async (req, res) => {
  const doc = await Complaint.findById(req.params.id);
  if (!doc) return sendError(res, { message: 'Complaint not found', statusCode: 404 });

  const previousStatus = doc.status;
  const allowed = ['status', 'priority', 'assignedTo', 'description', 'resolution'];
  for (const key of allowed) {
    if (req.body[key] !== undefined) doc[key] = req.body[key];
  }
  if (req.body.status && req.body.status !== doc.status) {
    doc.timeline.push({ title: `Status → ${req.body.status}`, at: new Date(), by: req.user?.email });
  }
  await doc.save();

  if (req.body.status && req.body.status !== previousStatus) {
    await safeNotify('complaint status change', async () => {
      const customers = await complaintCustomerUsers(doc);
      await notifyUsers(customers, {
        title: `Complaint ${doc.ticketNo} updated`,
        message: `Your complaint is now ${String(doc.status).replace(/_/g, ' ').toLowerCase()}.`,
        type: 'CUSTOMER',
        module: 'Complaint',
        resourceId: doc.ticketNo,
        link: '/customer/complaints',
      });
    });
  }

  return sendSuccess(res, { data: mapComplaint(doc.toObject()), message: 'Complaint updated' });
});

export const escalateComplaint = asyncHandler(async (req, res) => {
  const doc = await Complaint.findById(req.params.id);
  if (!doc) return sendError(res, { message: 'Complaint not found', statusCode: 404 });
  doc.status = 'ESCALATED';
  doc.priority = 'CRITICAL';
  doc.timeline.push({ title: 'Escalated', description: req.body.reason, variant: 'danger', at: new Date(), by: req.user?.email });
  await doc.save();

  await safeNotify('complaint escalated', async () => {
    const [customers, support] = await Promise.all([complaintCustomerUsers(doc), supportUserIds()]);
    await Promise.all([
      notifyUsers(customers, {
        title: 'Complaint escalated',
        message: `Ticket ${doc.ticketNo} has been escalated and is now top priority.`,
        type: 'CUSTOMER',
        module: 'Complaint',
        resourceId: doc.ticketNo,
        link: '/customer/complaints',
      }),
      notifyUsers(support, {
        title: 'Complaint escalated',
        message: `${doc.ticketNo} — ${doc.product} for ${doc.customer}. ${req.body.reason || ''}`.trim(),
        type: 'SERVICE',
        module: 'Complaint',
        resourceId: doc.ticketNo,
        link: '/admin/complaints',
      }),
    ]);
  });

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

  await safeNotify('complaint resolved', async () => {
    const customers = await complaintCustomerUsers(doc);
    await notifyUsers(customers, {
      title: 'Complaint resolved',
      message: `Ticket ${doc.ticketNo} has been resolved. ${doc.resolution || ''}`.trim(),
      type: 'CUSTOMER',
      module: 'Complaint',
      resourceId: doc.ticketNo,
      link: '/customer/complaints',
    });
  });

  return sendSuccess(res, { data: mapComplaint(doc.toObject()), message: 'Complaint resolved' });
});
