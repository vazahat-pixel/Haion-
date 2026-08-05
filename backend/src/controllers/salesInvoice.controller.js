import SalesInvoice from '../models/SalesInvoice.model.js';
import Dealer from '../models/Dealer.model.js';
import mongoose from 'mongoose';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess, sendCreated, sendError, sendPaginated } from '../utils/apiResponse.js';
import { parsePagination, buildSearchFilter } from '../utils/pagination.util.js';
import { toPublicDoc } from '../utils/serialize.util.js';
import { env } from '../config/env.js';
import { addCompanyLedgerEntry } from '../services/companyLedger.service.js';

function mapSalesInvoice(doc) {
  if (!doc) return doc;
  return toPublicDoc(doc);
}

/** Auto-generate sequential invoice number: {PREFIX}-{YEAR}-{NNNN} */
async function generateInvoiceNo(prefix = 'SI') {
  const year = new Date().getFullYear();
  const last = await SalesInvoice.findOne(
    { prefix: prefix.toUpperCase(), sequenceNumber: { $exists: true } },
    { sequenceNumber: 1 },
    { sort: { sequenceNumber: -1 } }
  ).lean();
  const seq = (last?.sequenceNumber || 0) + 1;
  const padded = String(seq).padStart(4, '0');
  return { invoiceNo: `${prefix.toUpperCase()}-${year}-${padded}`, sequenceNumber: seq };
}

function calcTotals(lineItems, orderDiscount, additionalCharges) {
  let subtotal = 0;
  let tax = 0;
  (lineItems || []).forEach((item) => {
    const gross = (item.quantity || 0) * (item.unitPrice || 0);
    const disc = Math.min(item.discount || 0, gross);
    const amt = gross - disc;
    const taxAmt = (amt * (item.gstRate || 0)) / 100;
    subtotal += amt;
    tax += taxAmt;
  });
  const charges = (additionalCharges || []).reduce((s, c) => s + (Number(c.amount) || 0), 0);
  const disc = Math.min(orderDiscount || 0, subtotal);
  const taxableAmount = subtotal - disc + charges;
  const total = taxableAmount + tax;
  return { subtotal, tax, taxableAmount, total };
}

export const listSalesInvoices = asyncHandler(async (req, res) => {
  const { page, perPage, skip, sort } = parsePagination(req.query);
  const filter = buildSearchFilter(req.query.search, ['invoiceNo', 'dealerName']);
  if (req.query.dealerId) filter.dealer = req.query.dealerId;
  if (req.query.status) filter.status = req.query.status;

  const [rows, total] = await Promise.all([
    SalesInvoice.find(filter).sort(sort).skip(skip).limit(perPage).lean(),
    SalesInvoice.countDocuments(filter),
  ]);
  return sendPaginated(res, { data: rows.map(mapSalesInvoice), total, page, perPage });
});

export const getSalesInvoice = asyncHandler(async (req, res) => {
  const doc = await SalesInvoice.findById(req.params.id).lean();
  if (!doc) return sendError(res, { message: 'Sales invoice not found', statusCode: 404 });
  return sendSuccess(res, { data: mapSalesInvoice(doc) });
});

export const createSalesInvoice = asyncHandler(async (req, res) => {
  const { dealerId, prefix = 'SI', invoiceDate, paymentTermsDays, dueDate,
    eWayBillNo, vehicleNo, lineItems = [], orderDiscount = 0,
    additionalCharges = [], amountReceived = 0, notes, termsAndConditions, bankDetails } = req.body;

  if (!dealerId) return sendError(res, { message: 'Dealer is required', statusCode: 400 });
  if (!lineItems.length) return sendError(res, { message: 'At least one line item required', statusCode: 400 });

  const dealer = await Dealer.findById(dealerId).lean();
  if (!dealer) return sendError(res, { message: 'Dealer not found', statusCode: 404 });

  const { invoiceNo, sequenceNumber } = await generateInvoiceNo(prefix);
  const totals = calcTotals(lineItems, orderDiscount, additionalCharges);
  const balanceAmount = Math.max(0, totals.total - (amountReceived || 0));

  // Enrich line items
  const enrichedItems = lineItems.map((item) => {
    const gross = (item.quantity || 0) * (item.unitPrice || 0);
    const disc = Math.min(item.discount || 0, gross);
    const amt = gross - disc;
    const taxAmt = (amt * (item.gstRate || 0)) / 100;
    return {
      sku: item.sku || '',
      name: item.name,
      hsn: item.hsn || '',
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discount: item.discount || 0,
      gstRate: item.gstRate || 18,
      amount: amt,
      taxAmount: taxAmt,
      lineTotal: amt + taxAmt,
      // Unit identification numbers
      serialNumbers: item.serialNumbers || [],
      controllerNumbers: item.controllerNumbers || [],
      batteryNumbers: item.batteryNumbers || [],
      // Warranty durations
      vehicleWarrantyMonths: item.vehicleWarrantyMonths ?? 12,
      batteryWarrantyMonths: item.batteryWarrantyMonths ?? 36,
      controllerWarrantyMonths: item.controllerWarrantyMonths ?? 24,
    };
  });

  const doc = await SalesInvoice.create({
    invoiceNo,
    prefix: prefix.toUpperCase(),
    sequenceNumber,
    dealer: dealerId,
    dealerName: dealer.name,
    dealerGstin: dealer.gstin || '',
    dealerAddress: [dealer.city, dealer.state].filter(Boolean).join(', '),
    invoiceDate: invoiceDate || new Date(),
    paymentTermsDays: paymentTermsDays ?? 30,
    dueDate: dueDate || null,
    eWayBillNo: eWayBillNo || '',
    vehicleNo: vehicleNo || '',
    lineItems: enrichedItems,
    subtotal: totals.subtotal,
    orderDiscount: orderDiscount || 0,
    additionalCharges: additionalCharges || [],
    taxableAmount: totals.taxableAmount,
    tax: totals.tax,
    total: totals.total,
    amountReceived: amountReceived || 0,
    balanceAmount,
    notes: notes || '',
    termsAndConditions: termsAndConditions || '',
    bankDetails: bankDetails || {},
    status: req.body.status === 'SENT' ? 'SENT' : 'DRAFT',
    createdBy: req.user._id,
  });

  // Automatically create a corresponding Dispatch set to DELIVERED status so it's instantly available for Dealer GRN
  try {
    const Warehouse = mongoose.model('Warehouse');
    const Dispatch = mongoose.model('Dispatch');
    const warehouse = await Warehouse.findOne({ isActive: { $ne: false } });
    if (warehouse) {
      const dispatchNo = `DSP-${new Date().getFullYear()}-${Math.floor(Math.random() * 90000) + 10000}`;
      await Dispatch.create({
        dispatchNo,
        dealer: dealerId,
        warehouse: warehouse._id,
        lineItems: enrichedItems.map(item => ({
          sku: item.sku,
          name: item.name,
          quantity: item.quantity,
        })),
        status: 'DELIVERED',
        timeline: [
          { title: 'Dispatch created automatically via Invoice', variant: 'success' },
          { title: 'Delivered — awaiting dealer GRN confirmation', timestamp: new Date(), variant: 'warning' }
        ],
      });
      // Deduct warehouse stock immediately
      const { deductWarehouseStock } = await import('../services/inventory.service.js');
      await deductWarehouseStock({
        warehouseId: warehouse._id,
        lineItems: enrichedItems.map(item => ({
          sku: item.sku,
          name: item.name,
          quantity: item.quantity,
        })),
      });
    }
  } catch (err) {
    console.error('Failed to auto-create dispatch for invoice:', err);
  }

  // ── Company ledger: record sale as credit ──────────────────────────────────
  try {
    await addCompanyLedgerEntry({
      txnType: 'SALE_TO_DEALER',
      date: doc.invoiceDate || new Date(),
      credit: totals.total,
      description: `Sale Invoice ${doc.invoiceNo} to ${dealer.name}`,
      partyName: dealer.name,
      referenceNo: doc.invoiceNo,
      sourceRef: doc._id,
      sourceModel: 'SalesInvoice',
      createdBy: req.user._id,
    });
  } catch (ledgerErr) {
    console.error('[CompanyLedger] Failed to record sale entry:', ledgerErr);
  }

  return sendCreated(res, { data: mapSalesInvoice(doc.toObject()), message: 'Sales invoice created' });
});

export const updateSalesInvoice = asyncHandler(async (req, res) => {
  const doc = await SalesInvoice.findById(req.params.id);
  if (!doc) return sendError(res, { message: 'Sales invoice not found', statusCode: 404 });
  if (doc.status !== 'DRAFT') return sendError(res, { message: 'Only draft invoices can be edited', statusCode: 400 });

  const { lineItems, orderDiscount, additionalCharges, amountReceived } = req.body;

  if (lineItems?.length) {
    const totals = calcTotals(lineItems, orderDiscount ?? doc.orderDiscount, additionalCharges ?? doc.additionalCharges);
    const enrichedItems = lineItems.map((item) => {
      const gross = (item.quantity || 0) * (item.unitPrice || 0);
      const disc = Math.min(item.discount || 0, gross);
      const amt = gross - disc;
      const taxAmt = (amt * (item.gstRate || 0)) / 100;
      return { sku: item.sku || '', name: item.name, hsn: item.hsn || '', quantity: item.quantity, unitPrice: item.unitPrice, discount: item.discount || 0, gstRate: item.gstRate || 18, amount: amt, taxAmount: taxAmt, lineTotal: amt + taxAmt };
    });
    doc.lineItems = enrichedItems;
    doc.subtotal = totals.subtotal;
    doc.tax = totals.tax;
    doc.taxableAmount = totals.taxableAmount;
    doc.total = totals.total;
  }

  if (orderDiscount !== undefined) doc.orderDiscount = orderDiscount;
  if (additionalCharges !== undefined) doc.additionalCharges = additionalCharges;
  if (amountReceived !== undefined) {
    doc.amountReceived = amountReceived;
    doc.balanceAmount = Math.max(0, doc.total - amountReceived);
  }

  const fields = ['invoiceDate', 'paymentTermsDays', 'dueDate', 'eWayBillNo', 'vehicleNo', 'notes', 'termsAndConditions', 'bankDetails', 'status'];
  fields.forEach((f) => { if (req.body[f] !== undefined) doc[f] = req.body[f]; });

  await doc.save();
  return sendSuccess(res, { data: mapSalesInvoice(doc.toObject()), message: 'Sales invoice updated' });
});

export const cancelSalesInvoice = asyncHandler(async (req, res) => {
  const doc = await SalesInvoice.findById(req.params.id);
  if (!doc) return sendError(res, { message: 'Sales invoice not found', statusCode: 404 });
  if (doc.status === 'PAID') return sendError(res, { message: 'Paid invoices cannot be cancelled', statusCode: 400 });
  doc.status = 'CANCELLED';
  await doc.save();
  return sendSuccess(res, { data: mapSalesInvoice(doc.toObject()), message: 'Sales invoice cancelled' });
});

export const getNextInvoiceNumber = asyncHandler(async (req, res) => {
  const prefix = req.query.prefix || 'SI';
  const { invoiceNo } = await generateInvoiceNo(prefix);
  return sendSuccess(res, { data: { invoiceNo, prefix } });
});

/** GET /api/sales-invoices/:id/pdf — returns invoice HTML for print/PDF */
export const getSalesInvoicePdf = asyncHandler(async (req, res) => {
  const doc = await SalesInvoice.findById(req.params.id).lean();
  if (!doc) return sendError(res, { message: 'Sales invoice not found', statusCode: 404 });

  const inv = mapSalesInvoice(doc);
  const html = buildSalesInvoiceHtml(inv);
  const download = req.query.download === 'true';

  if (download) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${inv.invoiceNo}.html"`);
    return res.send(html);
  }

  return sendSuccess(res, { data: { ...inv, html } });
});

function fmt(n) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n || 0);
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function buildSalesInvoiceHtml(inv) {
  const rows = (inv.lineItems || []).map((item, i) => `
    <tr>
      <td>${i + 1}</td>
      <td><strong>${item.name || ''}</strong>${item.sku ? `<br/><small style="color:#64748b">${item.sku}</small>` : ''}</td>
      <td>${item.hsn || '—'}</td>
      <td style="text-align:right">${item.quantity}</td>
      <td style="text-align:right">${fmt(item.unitPrice)}</td>
      <td style="text-align:right">${item.discount ? `${item.discount}%` : '—'}</td>
      <td style="text-align:right">${item.gstRate}%</td>
      <td style="text-align:right">${fmt(item.lineTotal)}</td>
    </tr>`).join('');

  const chargeRows = (inv.additionalCharges || []).map((c) => `
    <tr><td colspan="7" style="text-align:right;color:#64748b">${c.label}</td><td style="text-align:right">${fmt(c.amount)}</td></tr>`).join('');

  const companyName = env.companyName || 'Aradhya Brothers';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Sales Invoice ${inv.invoiceNo}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Arial', sans-serif; color: #111; padding: 32px; font-size: 12px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #1e40af; padding-bottom: 16px; margin-bottom: 20px; }
    .company-name { font-size: 22px; font-weight: 800; color: #1e40af; }
    .invoice-title { font-size: 14px; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.1em; }
    .meta { text-align: right; font-size: 11px; color: #374151; }
    .meta strong { display: inline-block; min-width: 80px; }
    .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 20px; }
    .party-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; }
    .party-label { font-size: 9px; text-transform: uppercase; letter-spacing: 0.1em; color: #64748b; font-weight: 700; margin-bottom: 6px; }
    .party-name { font-size: 14px; font-weight: 700; color: #1e293b; }
    .party-detail { font-size: 11px; color: #64748b; margin-top: 2px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    th { background: #1e40af; color: white; text-align: left; padding: 8px 10px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; }
    td { border-bottom: 1px solid #e2e8f0; padding: 7px 10px; font-size: 11px; }
    tr:nth-child(even) td { background: #f8fafc; }
    .totals { width: 300px; margin-left: auto; }
    .totals-row { display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #e2e8f0; }
    .totals-row.grand { font-weight: 700; font-size: 15px; border-top: 2px solid #1e40af; border-bottom: none; padding-top: 10px; color: #1e40af; }
    .section { margin-bottom: 16px; }
    .section-title { font-size: 10px; text-transform: uppercase; font-weight: 700; color: #64748b; margin-bottom: 6px; letter-spacing: 0.1em; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 10px; font-weight: 600; }
    .badge-sent { background: #dcfce7; color: #16a34a; }
    .badge-draft { background: #fef3c7; color: #d97706; }
    .badge-paid { background: #dbeafe; color: #1d4ed8; }
    .footer { margin-top: 40px; text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 12px; }
    .sig-box { border-top: 1px solid #374151; width: 180px; text-align: center; padding-top: 6px; font-size: 10px; color: #64748b; margin-top: 40px; }
    @media print {
      body { padding: 16px; }
      button { display: none !important; }
    }
  </style>
</head>
<body>
  <button onclick="window.print()" style="position:fixed;top:16px;right:16px;background:#1e40af;color:white;border:none;border-radius:6px;padding:8px 18px;cursor:pointer;font-size:13px;font-weight:600;z-index:999">🖨 Print</button>

  <div class="header">
    <div>
      <div class="company-name">${companyName}</div>
      <div class="invoice-title">Sales Invoice (Tax Invoice)</div>
    </div>
    <div class="meta">
      <div><strong>Invoice No:</strong> ${inv.invoiceNo}</div>
      <div><strong>Date:</strong> ${fmtDate(inv.invoiceDate)}</div>
      <div><strong>Due Date:</strong> ${fmtDate(inv.dueDate)}</div>
      <div><strong>Status:</strong> <span class="badge badge-${(inv.status || 'draft').toLowerCase()}">${inv.status || 'DRAFT'}</span></div>
      ${inv.eWayBillNo ? `<div><strong>E-Way Bill:</strong> ${inv.eWayBillNo}</div>` : ''}
      ${inv.vehicleNo ? `<div><strong>Vehicle No:</strong> ${inv.vehicleNo}</div>` : ''}
    </div>
  </div>

  <div class="parties">
    <div class="party-box">
      <div class="party-label">From (Seller)</div>
      <div class="party-name">${companyName}</div>
      ${env.companyGstin ? `<div class="party-detail">GSTIN: ${env.companyGstin}</div>` : ''}
    </div>
    <div class="party-box">
      <div class="party-label">Bill To (Dealer)</div>
      <div class="party-name">${inv.dealerName || '—'}</div>
      ${inv.dealerGstin ? `<div class="party-detail">GSTIN: ${inv.dealerGstin}</div>` : ''}
      ${inv.dealerAddress ? `<div class="party-detail">${inv.dealerAddress}</div>` : ''}
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Item / Description</th>
        <th>HSN/SAC</th>
        <th style="text-align:right">Qty</th>
        <th style="text-align:right">Price (₹)</th>
        <th style="text-align:right">Disc</th>
        <th style="text-align:right">GST%</th>
        <th style="text-align:right">Amount (₹)</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
      ${chargeRows}
    </tbody>
  </table>

  <div class="totals">
    <div class="totals-row"><span>Subtotal</span><span>${fmt(inv.subtotal)}</span></div>
    ${inv.orderDiscount ? `<div class="totals-row"><span>Discount</span><span>- ${fmt(inv.orderDiscount)}</span></div>` : ''}
    <div class="totals-row"><span>Taxable Amount</span><span>${fmt(inv.taxableAmount)}</span></div>
    <div class="totals-row"><span>GST</span><span>${fmt(inv.tax)}</span></div>
    <div class="totals-row grand"><span>Total Amount</span><span>${fmt(inv.total)}</span></div>
    ${inv.amountReceived ? `<div class="totals-row"><span style="color:#16a34a">Amount Received</span><span style="color:#16a34a">${fmt(inv.amountReceived)}</span></div>` : ''}
    ${inv.balanceAmount ? `<div class="totals-row"><span style="color:#dc2626">Balance Due</span><span style="color:#dc2626">${fmt(inv.balanceAmount)}</span></div>` : ''}
  </div>

  ${inv.bankDetails?.accountNumber ? `
  <div class="section" style="margin-top:24px">
    <div class="section-title">Bank Details</div>
    <div>Account No: ${inv.bankDetails.accountNumber}</div>
    <div>IFSC: ${inv.bankDetails.ifsc}</div>
    <div>Bank: ${inv.bankDetails.bankName}</div>
    <div>Account Holder: ${inv.bankDetails.holderName}</div>
  </div>` : ''}

  ${inv.termsAndConditions ? `
  <div class="section" style="margin-top:16px">
    <div class="section-title">Terms &amp; Conditions</div>
    <div style="white-space:pre-line;color:#64748b;font-size:11px">${inv.termsAndConditions}</div>
  </div>` : ''}

  ${inv.notes ? `
  <div class="section" style="margin-top:16px">
    <div class="section-title">Notes</div>
    <div style="color:#64748b;font-size:11px">${inv.notes}</div>
  </div>` : ''}

  <div class="sig-box">
    <p>Authorized Signatory</p>
    <p style="font-weight:700">${companyName}</p>
  </div>

  <div class="footer">Computer-generated invoice · ${companyName}</div>
</body>
</html>`;
}
