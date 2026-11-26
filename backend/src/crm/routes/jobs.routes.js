import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess, sendCreated } from '../../utils/apiResponse.js';
import { DmsLocation, DmsMaster } from '../../dms/models/master.models.js';
import { CrmMaster, CrmModel, CrmPart, CrmUserProfile, nextCrmSeq } from '../models/crm.masters.js';
import { CrmCustomer, CrmRegisteredProduct, CrmJob } from '../models/crm.job.js';
import { CrmStock, CrmEngineerStock, CrmStockLedger, CrmPnaBucket } from '../models/crm.inventory.js';
import { CrmError } from '../middleware/context.js';
import { jobStatusText } from './extra.routes.js';

const router = Router();

function formatJobNo(seq) {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yy}${mm}${dd}${String(seq).padStart(4, '0')}`;
}

/** Loads a job and enforces role + ASP location scope. */
async function getJob(req, roles) {
  if (roles && !req.crm.isAdmin && !roles.includes(req.crm.crmRole)) throw new CrmError('You do not have permission for this action', 403);
  const job = await CrmJob.findById(req.params.id);
  if (!job) throw new CrmError('Job not found', 404);
  if (req.crm.crmRole === 'ASP' && req.crm.locationId && String(job.assignLocation) !== req.crm.locationId) {
    throw new CrmError('This job is not assigned to your location', 403);
  }
  return job;
}

function addHistory(job, { location, activity, outcome, updateBy, remark, priority, travelKm = 0 }) {
  job.history.push({
    location: location || job.assignLocationName || 'System',
    activity,
    outcome,
    travelKm,
    updateBy,
    remark: remark || '',
    priority: priority || job.priority || 'Normal',
    updateOn: new Date(),
  });
}

/* Customer Search (Mobile / Customer ID / Email / Serial No) */
router.get('/customers/search', asyncHandler(async (req, res) => {
  const { phone, customerId, email, serialNo } = req.query;
  let customer = null;
  let products = [];

  if (serialNo) {
    const prod = await CrmRegisteredProduct.findOne({ serialNo: String(serialNo).trim() })
      .populate('customer product brand model').lean();
    if (prod) {
      customer = prod.customer;
      products = await CrmRegisteredProduct.find({ customer: customer._id })
        .populate('product brand model').lean();
    }
  } else if (phone || customerId || email) {
    const or = [];
    if (phone) or.push({ phone: String(phone).trim() }, { altPhone: String(phone).trim() });
    if (customerId) or.push({ customerId: String(customerId).trim().toUpperCase() });
    if (email) or.push({ email: String(email).trim().toLowerCase() });
    customer = await CrmCustomer.findOne({ $or: or }).lean();
    if (customer) {
      products = await CrmRegisteredProduct.find({ customer: customer._id })
        .populate('product brand model').lean();
    }
  }

  const jobs = customer
    ? await CrmJob.find({ customer: customer._id }).sort({ createdAt: -1 }).limit(30).lean()
    : [];

  sendSuccess(res, { data: { customer, products, jobs: jobs.map((j) => ({ ...j, statusText: jobStatusText(j) })) } });
}));

/* Add Customer + Registered Product */
router.post('/customers', asyncHandler(async (req, res) => {
  const b = req.body || {};
  if (!b.name || !b.phone || !b.address || !b.state || !b.city || !b.pincode) {
    throw new CrmError('Customer Name, Phone, Address, State, City and Pincode are required', 422);
  }
  const seq = await nextCrmSeq('customer');
  const customerId = `CUST${String(seq).padStart(5, '0')}`;
  const customer = await CrmCustomer.create({
    customerId,
    category: b.category || 'Customer',
    name: b.name.trim(),
    phone: b.phone.trim(),
    altPhone: b.altPhone,
    residenceNo: b.residenceNo,
    email: b.email,
    address: b.address,
    landmark: b.landmark,
    state: b.state,
    city: b.city,
    area: b.area,
    pincode: b.pincode,
    gstNo: b.gstNo,
    registrationName: b.registrationName,
  });

  let registeredProduct = null;
  if (b.product && b.brand && b.model) {
    const mod = await CrmModel.findById(b.model).lean();
    const pDate = b.purchaseDate ? new Date(b.purchaseDate) : new Date();
    const wDays = mod?.customerWarrantyDays || 365;
    const wEnd = b.warrantyEndDate ? new Date(b.warrantyEndDate) : new Date(pDate.getTime() + wDays * 86400000);
    const wStatus = b.warrantyStatus || (wEnd >= new Date() ? 'IN' : 'OUT');
    registeredProduct = await CrmRegisteredProduct.create({
      customer: customer._id,
      product: b.product,
      brand: b.brand,
      model: b.model,
      serialNo: b.serialNo,
      purchaseDate: pDate,
      installationDate: b.installationDate,
      warrantyEndDate: wEnd,
      warrantyStatus: wStatus,
      dealerName: b.dealerName,
      invoiceNo: b.invoiceNo,
      purchaseFrom: b.purchaseFrom || 'Others',
    });
  }
  sendCreated(res, { data: { customer, registeredProduct }, message: 'Customer registered' });
}));

/* AMC Registration */
router.post('/customers/amc', asyncHandler(async (req, res) => {
  const b = req.body || {};
  if (!b.customerId && (!b.name || !b.phone)) throw new CrmError('Customer details required', 422);
  if (!b.product || !b.brand || !b.model || !b.serialNo) throw new CrmError('Product, Brand, Model and Serial No are required', 422);

  let customer = b.customerId ? await CrmCustomer.findById(b.customerId) : null;
  if (!customer) {
    const seq = await nextCrmSeq('customer');
    customer = await CrmCustomer.create({
      customerId: `CUST${String(seq).padStart(5, '0')}`,
      category: b.category || 'Customer',
      name: b.name,
      phone: b.phone,
      address: b.address || '-',
      state: b.state || '-',
      city: b.city || '-',
      pincode: b.pincode || '000000',
    });
  }
  const amcSeq = await nextCrmSeq('amc');
  const amcNo = `AMC${String(amcSeq).padStart(6, '0')}`;
  const start = b.amcStartDate ? new Date(b.amcStartDate) : new Date();
  const days = Number(b.amcDurationDays || 365);
  const expiry = new Date(start.getTime() + days * 86400000);
  const prod = await CrmRegisteredProduct.create({
    customer: customer._id,
    product: b.product,
    brand: b.brand,
    model: b.model,
    serialNo: b.serialNo,
    purchaseDate: b.purchaseDate || start,
    warrantyEndDate: expiry,
    warrantyStatus: 'IN',
    amcNo,
    amcStartDate: start,
    amcExpiryDate: expiry,
    amcDurationDays: days,
    amcType: b.amcType || 'Comprehensive',
    amcAmount: Number(b.amcAmount || 0),
    amcPaymentMode: b.amcPaymentMode || 'Cash',
    amcPaymentRef: b.amcPaymentRef,
    amcStatus: 'Approved',
  });
  sendCreated(res, { data: prod, message: `AMC ${amcNo} created` });
}));

router.get('/amc', asyncHandler(async (_req, res) => {
  const rows = await CrmRegisteredProduct.find({ amcNo: { $exists: true, $ne: null } })
    .populate('customer', 'customerId name phone city state')
    .populate('product brand', 'name')
    .populate('model', 'modelName modelCode')
    .sort({ createdAt: -1 }).lean();
  sendSuccess(res, { data: rows });
}));

/* List Jobs */
router.get('/jobs', asyncHandler(async (req, res) => {
  const { status, subStatus, brand, product, model, assignLocation, search, openOnly, happyCalling, rejected, closed, from, to, serviceType, warranty } = req.query;
  const q = {};

  if (req.crm.crmRole === 'ASP' && req.crm.locationId) {
    q.assignLocation = req.crm.locationId;
  } else if (assignLocation) {
    q.assignLocation = assignLocation;
  }

  if (status) q.status = { $in: String(status).split(',') };
  if (subStatus) q.subStatus = { $in: String(subStatus).split(',') };
  if (brand) q.brand = { $in: String(brand).split(',') };
  if (product) q.product = { $in: String(product).split(',') };
  if (model) q.model = { $in: String(model).split(',') };
  if (openOnly === '1') q.status = { $nin: ['Handover', 'Cancel', 'RWR', 'BER'] };
  if (happyCalling === '1') q.status = { $in: ['Repair Done', 'Handover', 'Installation Done', 'Demo Done'] };
  if (rejected === '1') q.ackStatus = 'Rejected';
  if (closed === '1') q.status = { $in: ['Repair Done', 'Handover', 'Installation Done', 'Demo Done', 'Replacement', 'RWR', 'Cancel'] };
  if (closed === '0') q.status = { $nin: ['Handover', 'Cancel', 'RWR'] };
  if (serviceType) q.serviceType = { $in: String(serviceType).split(',') };
  if (warranty) q.warrantyStatus = warranty;
  if (from || to) { q.openDate = {}; if (from) q.openDate.$gte = new Date(from); if (to) q.openDate.$lte = new Date(new Date(to).getTime() + 86399999); }
  if (search) {
    const rx = new RegExp(String(search).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    q.$or = [{ jobNo: rx }, { customerName: rx }, { contactNo: rx }, { serialNo: rx }];
  }

  const rows = await CrmJob.find(q)
    .populate('assignLocation', 'name code city state')
    .populate('engineer', 'displayName loginId phone')
    .sort({ createdAt: -1 })
    .limit(1000)
    .lean();
  sendSuccess(res, { data: rows.map((r) => ({ ...r, statusText: jobStatusText(r) })) });
}));

/* Get Single Job */
router.get('/jobs/:id', asyncHandler(async (req, res) => {
  const job = await CrmJob.findById(req.params.id)
    .populate('customer')
    .populate('assignLocation', 'name code billingAddress city state pincode phone email')
    .populate('engineer', 'displayName loginId phone')
    .populate('product brand', 'name')
    .populate('model', 'modelName modelCode serviceCharges')
    .lean();
  if (!job) throw new CrmError('Job not found', 404);
  if (req.crm.crmRole === 'ASP' && req.crm.locationId && String(job.assignLocation?._id) !== req.crm.locationId) throw new CrmError('This job is not assigned to your location', 403);
  sendSuccess(res, { data: job });
}));

/* Create Job (Call Booking) */
router.post('/jobs', asyncHandler(async (req, res) => {
  if (!req.crm.isAdmin && !['Call Center', 'ASP'].includes(req.crm.crmRole)) throw new CrmError('You do not have permission for this action', 403);
  const b = req.body || {};
  if (!b.customerName || !b.contactNo || !b.address || !b.state || !b.city || !b.pincode) {
    throw new CrmError('Customer Name, Contact No, Address, State, City and Pincode are required', 422);
  }
  if (!b.product || !b.brand || !b.model) {
    throw new CrmError('Product, Brand and Model are required', 422);
  }

  let customer = b.customerId ? await CrmCustomer.findById(b.customerId) : await CrmCustomer.findOne({ phone: b.contactNo.trim() });
  if (!customer) {
    const cSeq = await nextCrmSeq('customer');
    customer = await CrmCustomer.create({
      customerId: `CUST${String(cSeq).padStart(5, '0')}`,
      category: b.customerCategory || 'Customer',
      name: b.customerName.trim(),
      phone: b.contactNo.trim(),
      altPhone: b.altContactNo,
      email: b.email,
      address: b.address,
      landmark: b.landmark,
      state: b.state,
      city: b.city,
      area: b.area,
      pincode: b.pincode,
    });
  }

  const [prodDoc, brandDoc, modDoc] = await Promise.all([
    DmsMaster.findById(b.product).lean(),
    DmsMaster.findById(b.brand).lean(),
    CrmModel.findById(b.model).lean(),
  ]);
  if (!prodDoc || !brandDoc || !modDoc) throw new CrmError('Invalid Product, Brand or Model', 422);

  let assignLoc = null;
  if (b.assignLocation) {
    assignLoc = await DmsLocation.findById(b.assignLocation).lean();
  } else {
    const pin = await CrmMaster.findOne({ type: 'pincode', code: b.pincode }).lean();
    if (pin?.attrs?.aspId) assignLoc = await DmsLocation.findById(pin.attrs.aspId).lean();
    if (!assignLoc) assignLoc = await DmsLocation.findOne({ locationType: 'ASP', status: 'Active' }).lean();
  }

  const pDate = b.purchaseDate ? new Date(b.purchaseDate) : new Date();
  const wEnd = b.warrantyEndDate
    ? new Date(b.warrantyEndDate)
    : new Date(pDate.getTime() + (modDoc.customerWarrantyDays || 365) * 86400000);
  const warrantyStatus = b.warrantyStatus || (wEnd >= new Date() ? 'IN' : 'OUT');

  // register the product on the customer so the next call can use Call Log
  let regProd = b.registeredProduct ? await CrmRegisteredProduct.findById(b.registeredProduct) : null;
  if (!regProd && b.serialNo) regProd = await CrmRegisteredProduct.findOne({ customer: customer._id, serialNo: String(b.serialNo).trim() });
  if (!regProd && b.callType !== 'Accessory') {
    regProd = await CrmRegisteredProduct.create({
      customer: customer._id, product: prodDoc._id, brand: brandDoc._id, model: modDoc._id, serialNo: b.serialNo || '', purchaseDate: pDate,
      installationDate: b.installationDate, warrantyEndDate: wEnd, warrantyStatus, dealerName: b.dealerName, invoiceNo: b.invoiceNo, purchaseFrom: b.purchaseFrom || 'Others',
    });
  }

  const jobSeq = await nextCrmSeq('job');
  const jobNo = formatJobNo(jobSeq);
  const happyCode = `HC${String(Math.floor(100000 + Math.random() * 900000))}`;

  const job = await CrmJob.create({
    jobNo,
    customer: customer._id,
    registeredProduct: regProd?._id || undefined,
    customerIdCode: customer.customerId,
    customerName: b.customerName.trim(),
    customerCategory: b.customerCategory || customer.category,
    contactNo: b.contactNo.trim(),
    altContactNo: b.altContactNo,
    email: b.email,
    address: b.address,
    landmark: b.landmark,
    state: b.state,
    city: b.city,
    area: b.area,
    pincode: b.pincode,
    product: prodDoc._id,
    brand: brandDoc._id,
    model: modDoc._id,
    productName: prodDoc.name,
    brandName: brandDoc.name,
    modelName: modDoc.modelName,
    serialNo: b.serialNo || '',
    purchaseDate: pDate,
    installationDate: b.installationDate,
    warrantyEndDate: wEnd,
    warrantyStatus,
    callType: b.callType || 'Repair',
    callSource: b.callSource || 'Call Center',
    purchaseFrom: b.purchaseFrom || 'Others',
    dealerName: b.dealerName,
    invoiceNo: b.invoiceNo,
    serviceType: b.serviceType || 'DoorStep',
    areaType: b.areaType || 'Local',
    vocs: Array.isArray(b.vocs) ? b.vocs : b.voc ? [b.voc] : [],
    vocText: b.vocText,
    remark: b.remark,
    accessories: b.accessories || [],
    assignLocation: assignLoc?._id || null,
    assignLocationName: assignLoc?.name || '',
    status: 'Open',
    subStatus: 'Registered',
    happyCode,
    createdBy: req.user._id,
    history: [
      {
        location: req.crm.location?.name || 'Call Center',
        activity: 'Complaint Login',
        outcome: `Registered & Assigned to ${assignLoc?.name || 'Unassigned'}`,
        updateBy: req.crm.loginId,
        remark: b.remark || '',
        priority: 'Normal',
        updateOn: new Date(),
      },
    ],
  });

  sendCreated(res, { data: job, message: `Job ${jobNo} registered` });
}));

/* ASP Acknowledge (Accepted / Rejected) */
router.post('/jobs/:id/acknowledge', asyncHandler(async (req, res) => {
  const { acknowledge, remark } = req.body || {};
  if (!['Accepted', 'Rejected'].includes(acknowledge)) throw new CrmError('Acknowledge must be Accepted or Rejected', 422);
  const job = await getJob(req, ["ASP"]);

  job.ackStatus = acknowledge;
  job.ackRemark = remark || '';
  job.ackAt = new Date();
  if (acknowledge === 'Accepted') {
    job.status = 'Acknowledged';
    job.subStatus = 'Registered';
  } else {
    job.status = 'Open';
    job.subStatus = 'Registered';
  }
  addHistory(job, {
    location: req.crm.location?.name,
    activity: 'Acknowledged',
    outcome: acknowledge === 'Accepted' ? 'Accepted By ASC' : 'Rejected By ASC',
    updateBy: req.crm.loginId,
    remark,
  });
  await job.save();
  sendSuccess(res, { data: job, message: `Job ${acknowledge}` });
}));

/* ASP Visit Schedule */
router.post('/jobs/:id/appointment', asyncHandler(async (req, res) => {
  const { visitDate, visitTime, approvedBy, remark } = req.body || {};
  if (!visitDate || !visitTime) throw new CrmError('Visit Date and Time are required', 422);
  const job = await getJob(req, ["ASP"]);

  job.visitDate = new Date(visitDate);
  job.visitTime = visitTime;
  job.visitApprovedBy = approvedBy || req.crm.displayName;
  job.visitRemark = remark || '';
  job.status = 'Appointment';
  addHistory(job, {
    location: req.crm.location?.name,
    activity: 'Visit Scheduled',
    outcome: `Visit - ${visitDate} ${visitTime}`,
    updateBy: req.crm.loginId,
    remark,
  });
  await job.save();
  sendSuccess(res, { data: job, message: 'Visit scheduled' });
}));

/* Assign Engineer (ASP) or Reassign ASP (Call Centre) */
router.post('/jobs/:id/assign', asyncHandler(async (req, res) => {
  const { engineerId, assignLocationId, remark } = req.body || {};
  const job = await getJob(req, ["ASP","Call Center"]);

  if (assignLocationId && req.crm.crmRole === 'ASP') throw new CrmError('Only the call centre can reassign a job to another ASP', 403);
  if (engineerId && req.crm.crmRole === 'Call Center') throw new CrmError('Only the ASP assigns engineers', 403);
  if (assignLocationId) {
    const loc = await DmsLocation.findById(assignLocationId).lean();
    if (!loc) throw new CrmError('Location not found', 404);
    job.assignLocation = loc._id;
    job.assignLocationName = loc.name;
    job.ackStatus = 'Pending';
    job.status = 'Open';
    job.subStatus = 'Registered';
    addHistory(job, {
      location: req.crm.location?.name || 'Call Center',
      activity: 'Reassign Job',
      outcome: `Reassigned to ${loc.name}`,
      updateBy: req.crm.loginId,
      remark,
    });
  } else if (engineerId) {
    const eng = await CrmUserProfile.findById(engineerId).lean();
    if (!eng) throw new CrmError('Engineer not found', 404);
    job.engineer = eng._id;
    job.engineerName = eng.displayName;
    job.status = 'Asigned';
    job.subStatus = 'Assigned to Engineer';
    addHistory(job, {
      location: req.crm.location?.name,
      activity: 'Assigned to Engineer',
      outcome: eng.displayName,
      updateBy: req.crm.loginId,
      remark,
    });
  } else {
    throw new CrmError('Engineer or Location is required', 422);
  }
  await job.save();
  sendSuccess(res, { data: job, message: 'Job assigned' });
}));

/* Job Repair (Repair Done / PNA / Estimate / Approval Request / Pending / RWR / Cancel / Installation / Demo) */
router.post('/jobs/:id/repair', asyncHandler(async (req, res) => {
  const b = req.body || {};
  const job = await getJob(req, ["ASP"]);
  const repairStatus = b.repairStatus;
  if (!repairStatus) throw new CrmError('Repair Status is required', 422);

  job.closeType = b.closeType || job.closeType;
  job.closeDocNo = b.closeDocNo || job.closeDocNo;
  job.customerReadyToPay = Boolean(b.customerReadyToPay);
  job.pendingReason = b.pendingReason || job.pendingReason;
  job.closeReason = b.closeReason || job.closeReason;

  if (repairStatus === 'Repair Done' || repairStatus === 'Installation Done' || repairStatus === 'Demo Done' || repairStatus === 'Replacement') {
    const rows = Array.isArray(b.repairDetails) ? b.repairDetails : [];
    for (const r of rows) {
      if (r.part) {
        const partDoc = await CrmPart.findById(r.part).lean();
        const qty = Number(r.qty || 1);
        if (job.engineer) {
          const engStk = await CrmEngineerStock.findOne({ location: job.assignLocation, engineer: job.engineer, part: r.part });
          if (engStk && engStk.fresh >= qty) {
            engStk.fresh -= qty;
            engStk.defective += qty;
            await engStk.save();
          } else {
            const locStk = await CrmStock.findOne({ location: job.assignLocation, part: r.part });
            if (!locStk || locStk.fresh < qty) {
              throw new CrmError(`Insufficient fresh stock for ${partDoc?.partcode || r.part}`, 422);
            }
            locStk.fresh -= qty;
            locStk.defective += qty;
            await locStk.save();
          }
        } else if (job.assignLocation) {
          const locStk = await CrmStock.findOne({ location: job.assignLocation, part: r.part });
          if (!locStk || locStk.fresh < qty) {
            throw new CrmError(`Insufficient fresh stock for ${partDoc?.partcode || r.part}`, 422);
          }
          locStk.fresh -= qty;
          locStk.defective += qty;
          await locStk.save();
        }
        await CrmStockLedger.create({
          location: job.assignLocation,
          part: r.part,
          ledgerType: 'Fresh',
          txnType: 'Job Consumption',
          qtyChange: -qty,
          refType: 'JOB',
          refNo: job.jobNo,
          by: req.crm.loginId,
          remark: b.remark || '',
        });
        r.partcode = partDoc?.partcode;
        r.partName = partDoc?.partName;
        r.price = partDoc?.customerPrice || 0;
      }
    }
    job.repairDetails = rows;
    job.status = repairStatus;
    job.subStatus = repairStatus === 'Replacement' ? 'Replacement' : 'Repair Done';
    job.closeDate = new Date();
  } else if (repairStatus === 'Spare Part Unavailable') {
    const pnaParts = Array.isArray(b.pendingParts) ? b.pendingParts : [];
    if (!pnaParts.length) throw new CrmError('Select at least one pending part for PNA', 422);
    for (const p of pnaParts) {
      const partDoc = await CrmPart.findById(p.part).lean();
      if (!partDoc) continue;
      await CrmPnaBucket.create({
        location: job.assignLocation,
        job: job._id,
        jobNo: job.jobNo,
        part: partDoc._id,
        partcode: partDoc.partcode,
        partName: partDoc.partName,
        qty: Number(p.qty || 1),
        status: 'Pending',
      });
    }
    job.status = 'PNA';
    job.subStatus = 'PNA at L3/L4';
  } else if (repairStatus === 'Estimate Pending For Cost') {
    const estParts = Array.isArray(b.estimateParts) ? b.estimateParts : [];
    const partCost = estParts.reduce((s, x) => s + Number(x.cost || 0) * Number(x.qty || 1), 0);
    const taxAmt = estParts.reduce((s, x) => s + Number(x.taxAmt || 0), 0);
    const serviceCharge = Number(b.serviceCharge || 0);
    job.estimate = {
      parts: estParts,
      serviceCharge,
      partCost,
      taxAmt,
      totalAmt: partCost + taxAmt + serviceCharge,
      status: 'Pending',
    };
    job.status = 'EP';
    job.subStatus = 'Pending';
  } else if (repairStatus === 'Request For Approval') {
    job.approvalRequest = {
      requestFor: b.requestFor || 'Deviation',
      status: 'Pending',
      remark: b.remark || '',
      by: req.crm.loginId,
      at: new Date(),
    };
    job.status = 'Request For Approval';
    job.subStatus = 'Other Approval';
  } else if (repairStatus === 'Closed Without Repair') {
    job.status = 'RWR';
    job.subStatus = 'Closed Without Repair';
    job.closeDate = new Date();
  } else if (repairStatus === 'Cancel') {
    job.status = 'Cancel';
    job.subStatus = 'Closed Without Repair';
    job.closeDate = new Date();
  } else {
    job.status = 'Pending';
    job.subStatus = 'Pending';
  }

  addHistory(job, {
    location: req.crm.location?.name,
    activity: 'Repair Update',
    outcome: `${job.status} (${job.subStatus})`,
    updateBy: req.crm.loginId,
    remark: b.remark,
  });
  await job.save();
  sendSuccess(res, { data: job, message: `Job updated to ${job.status}` });
}));

/* Handover / Call Confirmation */
router.post('/jobs/:id/handover', asyncHandler(async (req, res) => {
  const { confirmBy, contactNo, remark, rating } = req.body || {};
  if (!confirmBy || !contactNo) throw new CrmError('Confirm By and Contact No are required', 422);
  const job = await getJob(req, ["ASP"]);

  job.handover = {
    confirmBy,
    contactNo,
    remark: remark || '',
    rating: Number(rating || 5),
    at: new Date(),
  };
  job.status = 'Handover';
  job.subStatus = 'Set Delivered';
  if (!job.closeDate) job.closeDate = new Date();
  addHistory(job, {
    location: req.crm.location?.name,
    activity: 'Call Confirmation / Handover',
    outcome: `Set Delivered (Rating ${job.handover.rating}/5)`,
    updateBy: req.crm.loginId,
    remark,
  });
  await job.save();
  sendSuccess(res, { data: job, message: 'Job handed over & closed' });
}));

/* Happy Calling */
router.post('/jobs/:id/happy-call', asyncHandler(async (req, res) => {
  const { remark, rating } = req.body || {};
  const job = await getJob(req, ["Call Center"]);
  job.handover = {
    ...(job.handover || {}),
    happyCallDone: true,
    happyCallRemark: remark || '',
    happyCallAt: new Date(),
    ...(rating ? { rating: Number(rating) } : {}),
  };
  addHistory(job, {
    location: 'Call Center',
    activity: 'Happy Calling',
    outcome: 'Customer Feedback Recorded',
    updateBy: req.crm.loginId,
    remark,
  });
  await job.save();
  sendSuccess(res, { data: job, message: 'Happy call recorded' });
}));

/* Priority update */
router.post('/jobs/:id/priority', asyncHandler(async (req, res) => {
  const { priority, remark } = req.body || {};
  const job = await getJob(req, ["Call Center","ASP"]);
  job.priority = priority || 'High';
  addHistory(job, {
    location: req.crm.location?.name || 'Call Center',
    activity: 'Priority Update',
    outcome: job.priority,
    updateBy: req.crm.loginId,
    remark,
  });
  await job.save();
  sendSuccess(res, { data: job, message: 'Priority updated' });
}));

/* Admin Request Approval / Job Status Change */
router.post('/jobs/:id/approve', asyncHandler(async (req, res) => {
  const { decision, status, subStatus, remark } = req.body || {};
  const job = await getJob(req, []);

  if (decision) {
    job.approvalRequest = {
      ...(job.approvalRequest || {}),
      status: decision,
      remark: remark || '',
      by: req.crm.loginId,
      at: new Date(),
    };
    job.subStatus = decision === 'Approved' ? 'Request Approved' : 'Request Rejected';
  }
  if (status) job.status = status;
  if (subStatus) job.subStatus = subStatus;
  addHistory(job, {
    location: 'Admin',
    activity: decision ? `Request ${decision}` : 'Status Change',
    outcome: `${job.status} / ${job.subStatus}`,
    updateBy: req.crm.loginId,
    remark,
  });
  await job.save();
  sendSuccess(res, { data: job, message: 'Job updated' });
}));

export default router;
