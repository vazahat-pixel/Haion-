import Customer from '../models/Customer.model.js';
import Bill from '../models/Bill.model.js';
import Warranty from '../models/Warranty.model.js';
import Order from '../models/Order.model.js';
import ServiceRequest from '../models/ServiceRequest.model.js';
import Complaint from '../models/Complaint.model.js';
import Notification from '../models/Notification.model.js';
import User from '../models/User.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { mapCustomer, mapBill, mapWarranty, mapOrder } from '../utils/docMapper.util.js';
import { toPublicDoc } from '../utils/serialize.util.js';
import { getPortalConfig } from '../services/customerPortal.service.js';

function mapServiceRequest(doc) {
  const d = toPublicDoc(doc);
  return { ...d, customerName: d.customerName || d.customer };
}

function mapComplaint(doc) {
  const d = toPublicDoc(doc);
  return { ...d, createdAt: d.createdAt };
}

function mapNotification(doc) {
  const d = toPublicDoc(doc);
  return { ...d, read: d.read ?? false };
}

export async function resolveCustomerProfile({ code, phone, billNo, user }) {
  if (user?.role === 'CUSTOMER') {
    let profile = null;
    if (user.email) profile = await Customer.findOne({ email: user.email.toLowerCase() }).lean();
    if (!profile && user.phone) profile = await Customer.findOne({ phone: user.phone }).lean();
    return profile;
  }

  if (billNo) {
    if (!phone) return null;
    const bill = await Bill.findOne({ billNo: billNo.toUpperCase().trim() }).lean();
    if (!bill?.customer) return null;
    const customer = await Customer.findById(bill.customer).lean();
    if (!customer) return null;
    
    const normalizedCustomerPhone = customer.phone.replace(/\D/g, '').slice(-10);
    const normalizedInputPhone = phone.trim().replace(/\D/g, '').slice(-10);
    if (normalizedCustomerPhone !== normalizedInputPhone) {
      return null;
    }
    return customer;
  }

  if (code && phone) {
    return Customer.findOne({
      code: code.toUpperCase().trim(),
      phone: phone.trim(),
      status: 'ACTIVE',
    }).lean();
  }

  return null;
}

async function resolveLinkedUser(profile) {
  if (!profile?.email) return null;
  return User.findOne({ email: profile.email.toLowerCase(), role: 'CUSTOMER', isActive: true }).lean();
}

export async function buildHub(profile, userId) {
  const customerId = profile._id;
  const orWarranty = customerId
    ? [{ customer: customerId }, { customerName: profile.name }]
    : [{ customerName: profile.name }];

  const [warranties, bills, orders, serviceRequests, complaints, portal] = await Promise.all([
    Warranty.find({ $or: orWarranty }).sort({ createdAt: -1 }).limit(25).lean(),
    customerId
      ? Bill.find({ customer: customerId }).sort({ createdAt: -1 }).limit(15).lean()
      : Bill.find({ customerName: profile.name }).sort({ createdAt: -1 }).limit(15).lean(),
    userId ? Order.find({ customer: userId }).sort({ createdAt: -1 }).limit(15).lean() : [],
    userId ? ServiceRequest.find({ customer: userId }).sort({ createdAt: -1 }).limit(15).lean() : [],
    Complaint.find({
      $or: [
        ...(profile.phone ? [{ phone: profile.phone }] : []),
        ...(profile.email ? [{ email: profile.email }] : []),
        { customer: profile.name },
      ],
    }).sort({ createdAt: -1 }).limit(10).lean(),
    getPortalConfig(),
  ]);

  const activeWarranties = warranties.filter((w) => w.status === 'ACTIVE').length;
  const openService = serviceRequests.filter((s) => !['CLOSED', 'CANCELLED', 'RESOLVED'].includes(s.status)).length;
  const activeOrders = orders.filter((o) => !['CANCELLED', 'DELIVERED'].includes(o.status)).length;
  const totalSpent = bills.filter((b) => b.status === 'PAID').reduce((s, b) => s + (b.total || 0), 0)
    || orders.filter((o) => o.status === 'DELIVERED').reduce((s, o) => s + (o.total || 0), 0);

  return {
    profile: mapCustomer(profile),
    portal,
    stats: {
      activeWarranties,
      openService,
      activeOrders,
      totalSpent,
      totalBills: bills.length,
      openComplaints: complaints.filter((c) => !['RESOLVED', 'CLOSED'].includes(c.status)).length,
    },
    products: warranties.map((w) => {
      const mapped = mapWarranty(w);
      return {
        id: mapped.id,
        warrantyId: mapped.id,
        name: mapped.product,
        product: mapped.product,
        sku: mapped.sku,
        serialNo: mapped.serialNo,
        billNo: mapped.billNo,
        warrantyStatus: mapped.status,
        status: mapped.status,
        warrantyEnd: mapped.endDate,
        purchasedAt: mapped.startDate,
        dealerName: mapped.dealerName,
      };
    }),
    warranties: warranties.map(mapWarranty),
    bills: bills.map(mapBill),
    orders: orders.map(mapOrder),
    serviceRequests: serviceRequests.map(mapServiceRequest),
    complaints: complaints.map(mapComplaint),
    refreshedAt: new Date().toISOString(),
  };
}

export const getPortalConfigPublic = asyncHandler(async (_req, res) => {
  return sendSuccess(res, { data: await getPortalConfig() });
});

export const accessHub = asyncHandler(async (req, res) => {
  const { code, phone, billNo } = req.body;
  if (!phone) {
    return sendError(res, { message: 'Phone number is required for verification', statusCode: 400 });
  }
  if (!billNo && !code) {
    return sendError(res, { message: 'Provide customer code or bill number', statusCode: 400 });
  }
  if (!/^\d{10}$/.test(phone.trim().replace(/\D/g, '').slice(-10))) {
    return sendError(res, { message: 'Enter a valid 10-digit phone number', statusCode: 400 });
  }

  const profile = await resolveCustomerProfile({ code, phone, billNo });
  if (!profile) {
    return sendError(res, { message: 'Customer not found. Check your ID and phone, or bill number.', statusCode: 404 });
  }

  const linkedUser = await resolveLinkedUser(profile);
  const hub = await buildHub(profile, linkedUser?._id);
  return sendSuccess(res, { data: hub, message: 'Welcome back' });
});

export const refreshHub = accessHub;

export const getMyHub = asyncHandler(async (req, res) => {
  const profile = await resolveCustomerProfile({ user: req.user });
  if (!profile) {
    const fallback = {
      _id: req.user._id,
      code: `USR-${String(req.user._id).slice(-6).toUpperCase()}`,
      name: `${req.user.firstName} ${req.user.lastName}`.trim(),
      phone: req.user.phone,
      email: req.user.email,
      city: '',
      state: '',
      status: 'ACTIVE',
    };
    const hub = await buildHub(fallback, req.user._id);
    return sendSuccess(res, { data: hub });
  }

  const hub = await buildHub(profile, req.user._id);
  return sendSuccess(res, { data: hub });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const profile = await resolveCustomerProfile({ user: req.user });
  if (!profile?._id) {
    return sendError(res, { message: 'Customer profile not found', statusCode: 404 });
  }

  const allowed = ['name', 'phone', 'email', 'city', 'state', 'address'];
  const update = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) update[key] = req.body[key];
  }

  const customer = await Customer.findByIdAndUpdate(profile._id, update, { new: true }).lean();
  return sendSuccess(res, { data: mapCustomer(customer), message: 'Profile updated' });
});

export const listCustomerNotifications = asyncHandler(async (req, res) => {
  const rows = await Notification.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .limit(30)
    .lean();
  const unread = await Notification.countDocuments({ user: req.user._id, read: false });
  return sendSuccess(res, { data: { items: rows.map(mapNotification), unread } });
});

export const getComplaintDetail = asyncHandler(async (req, res) => {
  const profile = await resolveCustomerProfile({ user: req.user });
  if (!profile) return sendError(res, { message: 'Profile not found', statusCode: 404 });

  const complaint = await Complaint.findOne({
    $or: [{ _id: req.params.id }, { ticketNo: req.params.id.toUpperCase() }],
    $and: [{
      $or: [
        ...(profile.phone ? [{ phone: profile.phone }] : []),
        ...(profile.email ? [{ email: profile.email }] : []),
        { customer: profile.name },
      ],
    }],
  }).lean();

  if (!complaint) return sendError(res, { message: 'Complaint not found', statusCode: 404 });
  return sendSuccess(res, { data: mapComplaint(complaint) });
});

export const getBillForCustomer = asyncHandler(async (req, res) => {
  const profile = await resolveCustomerProfile({ user: req.user });
  const billNo = req.params.billNo?.toUpperCase();
  const bill = await Bill.findOne({ billNo }).lean();
  if (!bill) return sendError(res, { message: 'Bill not found', statusCode: 404 });

  if (profile?._id && bill.customer && String(bill.customer) !== String(profile._id)) {
    if (bill.customerName !== profile.name) {
      return sendError(res, { message: 'Access denied', statusCode: 403 });
    }
  }

  const warranties = await Warranty.find({ billNo }).lean();
  return sendSuccess(res, {
    data: {
      bill: mapBill(bill),
      warranties: warranties.map(mapWarranty),
    },
  });
});
