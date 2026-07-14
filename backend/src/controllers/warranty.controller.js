import Warranty from '../models/Warranty.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess, sendError, sendPaginated } from '../utils/apiResponse.js';
import { parsePagination, buildSearchFilter } from '../utils/pagination.util.js';
import { mapWarranty } from '../utils/docMapper.util.js';
import { streamWarrantyPdf } from '../utils/warrantyPdf.util.js';

function dealerFilter(req) {
  if (req.user.dealerId) return { dealer: req.user.dealerId };
  if (req.query.dealerId) return { dealer: req.query.dealerId };
  return {};
}

function buildCertificateHtml(warranty) {
  const start = new Date(warranty.startDate).toLocaleDateString('en-IN');
  const end = new Date(warranty.endDate).toLocaleDateString('en-IN');
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Warranty ${warranty.serialNo}</title>
<style>body{font-family:system-ui,sans-serif;max-width:720px;margin:2rem auto;padding:2rem;border:1px solid #e2e8f0}
h1{color:#4f46e5;font-size:1.25rem;text-align:center}.meta{display:grid;grid-template-columns:1fr 1fr;gap:.75rem;font-size:.9rem}
.label{color:#64748b}</style></head><body>
<h1>Haion Industries — Warranty Certificate</h1>
<div class="meta">
<p><span class="label">Serial:</span> <strong>${warranty.serialNo}</strong></p>
<p><span class="label">Product:</span> <strong>${warranty.product}</strong></p>
<p><span class="label">Customer:</span> <strong>${warranty.customerName || warranty.customer}</strong></p>
<p><span class="label">Invoice:</span> <strong>${warranty.billNo}</strong></p>
<p><span class="label">Coverage:</span> <strong>${start} — ${end}</strong></p>
<p><span class="label">Status:</span> <strong>${warranty.status}</strong></p>
</div>
<p style="margin-top:1.5rem;font-size:.8rem;color:#64748b">Manufacturer warranty subject to standard terms and conditions.</p>
</body></html>`;
}

function customerFilter(req) {
  if (req.user?.role === 'CUSTOMER') {
    return async () => {
      const Customer = (await import('../models/Customer.model.js')).default;
      let profile = null;
      if (req.user.email) profile = await Customer.findOne({ email: req.user.email.toLowerCase() }).lean();
      if (!profile && req.user.phone) profile = await Customer.findOne({ phone: req.user.phone }).lean();
      if (profile) return { $or: [{ customer: profile._id }, { customerName: profile.name }] };
      return { customerName: `${req.user.firstName} ${req.user.lastName}`.trim() };
    };
  }
  return null;
}

export const listWarranties = asyncHandler(async (req, res) => {
  const { page, perPage, skip, sort } = parsePagination(req.query);
  const filter = {
    ...dealerFilter(req),
    ...buildSearchFilter(req.query.search, ['serialNo', 'customerName', 'billNo', 'product']),
  };
  if (req.query.status) filter.status = req.query.status;

  const custFilterFn = customerFilter(req);
  if (custFilterFn) {
    const custFilter = await custFilterFn();
    Object.assign(filter, custFilter);
  }

  const [rows, total] = await Promise.all([
    Warranty.find(filter).sort(sort).skip(skip).limit(perPage).lean(),
    Warranty.countDocuments(filter),
  ]);
  return sendPaginated(res, { data: rows.map(mapWarranty), total, page, perPage });
});

export const getWarranty = asyncHandler(async (req, res) => {
  const filter = { _id: req.params.id, ...dealerFilter(req) };
  const warranty = await Warranty.findOne(filter).lean();
  if (!warranty) return sendError(res, { message: 'Warranty not found', statusCode: 404 });
  return sendSuccess(res, { data: mapWarranty(warranty) });
});

export const getCertificate = asyncHandler(async (req, res) => {
  const filter = { _id: req.params.id, ...dealerFilter(req) };
  const warranty = await Warranty.findOne(filter).lean();
  if (!warranty) return sendError(res, { message: 'Warranty not found', statusCode: 404 });
  const mapped = mapWarranty(warranty);
  const certificateHtml = buildCertificateHtml(warranty);
  return sendSuccess(res, {
    data: {
      ...mapped,
      certificateHtml,
      filename: `warranty-${mapped.serialNo}.html`,
    },
  });
});

export const downloadCertificatePdf = asyncHandler(async (req, res) => {
  const filter = { _id: req.params.id, ...dealerFilter(req) };
  const warranty = await Warranty.findOne(filter).lean();
  if (!warranty) return sendError(res, { message: 'Warranty not found', statusCode: 404 });
  streamWarrantyPdf(mapWarranty(warranty), res);
});

export const checkEligibility = asyncHandler(async (req, res) => {
  const serial = (req.query.serial || req.query.serialNo || '').trim();
  const billNo = (req.query.billNo || req.query.bill || '').trim().toUpperCase();
  if (!serial && !billNo) {
    return sendError(res, { message: 'Serial number or bill number required', statusCode: 400 });
  }

  const filter = serial
    ? { serialNo: serial.toUpperCase() }
    : { billNo };

  const warranty = await Warranty.findOne(filter).lean();
  if (!warranty) {
    return sendSuccess(res, { data: { eligible: false, reason: serial ? 'Serial not found' : 'Bill not found' } });
  }

  const now = new Date();
  const expired = warranty.endDate < now || warranty.status === 'EXPIRED';
  const voided = warranty.status === 'VOID';
  const eligible = !expired && !voided && warranty.status === 'ACTIVE';

  let reason = eligible ? 'Active warranty' : `Status: ${warranty.status}`;
  if (expired) reason = 'Warranty expired';
  if (voided) reason = 'Warranty voided (bill cancelled)';

  return sendSuccess(res, {
    data: {
      eligible,
      warranty: mapWarranty(warranty),
      reason,
    },
  });
});

export const publicLookup = asyncHandler(async (req, res) => {
  const serial = (req.query.serial || req.query.serialNo || '').trim();
  const billNo = (req.query.billNo || req.query.bill || '').trim().toUpperCase();
  if (!serial && !billNo) {
    return sendError(res, { message: 'Serial number or bill number required', statusCode: 400 });
  }

  const filter = serial ? { serialNo: serial.toUpperCase() } : { billNo };
  const warranties = await Warranty.find(filter).sort({ createdAt: -1 }).limit(20).lean();
  if (warranties.length === 0) {
    return sendSuccess(res, { data: { found: false, warranties: [] } });
  }

  return sendSuccess(res, {
    data: {
      found: true,
      warranties: warranties.map(mapWarranty),
      shareUrl: billNo ? `/warranty/check?bill=${billNo}` : undefined,
    },
  });
});

export const claimWarranty = asyncHandler(async (req, res) => {
  const filter = { _id: req.params.id, ...dealerFilter(req) };
  const warranty = await Warranty.findOne(filter);
  if (!warranty) return sendError(res, { message: 'Warranty not found', statusCode: 404 });
  if (warranty.status !== 'ACTIVE') {
    return sendError(res, { message: 'Warranty is not active', statusCode: 400 });
  }
  if (warranty.endDate < new Date()) {
    warranty.status = 'EXPIRED';
    await warranty.save();
    return sendError(res, { message: 'Warranty has expired', statusCode: 400 });
  }

  warranty.status = 'CLAIMED';
  await warranty.save();
  return sendSuccess(res, { data: mapWarranty(warranty.toObject()), message: 'Warranty claim recorded' });
});
