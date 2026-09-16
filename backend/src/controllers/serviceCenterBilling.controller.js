import mongoose from 'mongoose';
import ServiceCenter from '../models/ServiceCenter.model.js';
import ServiceCenterInvoice from '../models/ServiceCenterInvoice.model.js';
import ServiceCenterInventory from '../models/ServiceCenterInventory.model.js';
import Party from '../models/Party.model.js';
import Warehouse from '../models/Warehouse.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess, sendCreated, sendError, sendPaginated } from '../utils/apiResponse.js';
import { parsePagination, buildSearchFilter } from '../utils/pagination.util.js';
import { toPublicDoc } from '../utils/serialize.util.js';
import { nextSequence } from '../utils/sequence.util.js';
import { createLinkedCompanyEntry } from '../services/companyLedger.service.js';
import { deductWarehouseStock } from '../services/inventory.service.js';

// Assume company home state (can be matched or defaulted)
const COMPANY_STATE = 'DELHI';

export async function ensureServiceCenterParty(serviceCenter) {
  if (serviceCenter.party) {
    const existing = await Party.findById(serviceCenter.party);
    if (existing) return existing;
  }

  // Find by GSTIN or code or name
  let party = null;
  if (serviceCenter.gstin) {
    party = await Party.findOne({ gstin: serviceCenter.gstin.toUpperCase() });
  }
  if (!party) {
    party = await Party.findOne({ code: serviceCenter.code });
  }

  if (!party) {
    party = await Party.create({
      code: serviceCenter.code || nextSequence('PRT'),
      name: serviceCenter.name,
      type: 'SERVICE_CENTER',
      partyCategory: 'Service Center',
      phone: serviceCenter.phone || '',
      email: serviceCenter.email || '',
      gstin: serviceCenter.gstin || '',
      pan: serviceCenter.pan || '',
      billingAddress: serviceCenter.billingAddress || serviceCenter.address || '',
      shippingAddress: serviceCenter.shippingAddress || serviceCenter.address || '',
      city: serviceCenter.city || '',
      state: serviceCenter.state || '',
      contactPerson: serviceCenter.contactPerson || '',
      openingBalance: serviceCenter.openingBalance || 0,
      creditLimit: serviceCenter.creditLimit || 0,
    });
  } else if (!party.gstin && serviceCenter.gstin) {
    party.gstin = serviceCenter.gstin;
    await party.save();
  }

  serviceCenter.party = party._id;
  await serviceCenter.save();
  return party;
}

export const createServiceCenterInvoice = asyncHandler(async (req, res) => {
  const {
    serviceCenterId,
    invoiceDate = new Date(),
    dueDate = null,
    lineItems = [],
    amountReceived = 0,
    paymentMode = 'BANK_TRANSFER',
    notes = '',
    warehouseId = null,
  } = req.body;

  if (!serviceCenterId) {
    return sendError(res, { message: 'Service Center ID is required', statusCode: 400 });
  }
  if (!Array.isArray(lineItems) || lineItems.length === 0) {
    return sendError(res, { message: 'At least one line item is required for the invoice', statusCode: 400 });
  }

  const serviceCenter = await ServiceCenter.findById(serviceCenterId);
  if (!serviceCenter) {
    return sendError(res, { message: 'Service Center not found', statusCode: 404 });
  }

  // Ensure Party record exists for unified accounting
  const party = await ensureServiceCenterParty(serviceCenter);

  // Check state for GST (Intra-state vs Inter-state)
  const isInterState =
    Boolean(serviceCenter.state) &&
    serviceCenter.state.trim().toUpperCase() !== COMPANY_STATE.toUpperCase();

  let subtotal = 0;
  let taxableAmount = 0;
  let cgstTotal = 0;
  let sgstTotal = 0;
  let igstTotal = 0;

  const processedLineItems = lineItems.map((item) => {
    const qty = Number(item.quantity) || 1;
    const price = Number(item.unitPrice) || 0;
    const disc = Number(item.discount) || 0;
    const gross = qty * price;
    const netTaxable = Math.max(0, gross - disc);
    const rate = Number(item.gstRate) || 18;

    let cgstRate = 0;
    let cgstAmount = 0;
    let sgstRate = 0;
    let sgstAmount = 0;
    let igstRate = 0;
    let igstAmount = 0;

    if (isInterState) {
      igstRate = rate;
      igstAmount = Math.round((netTaxable * igstRate) / 100 * 100) / 100;
    } else {
      cgstRate = rate / 2;
      sgstRate = rate / 2;
      cgstAmount = Math.round((netTaxable * cgstRate) / 100 * 100) / 100;
      sgstAmount = Math.round((netTaxable * sgstRate) / 100 * 100) / 100;
    }

    const taxAmt = Math.round((cgstAmount + sgstAmount + igstAmount) * 100) / 100;
    const lineTotal = Math.round((netTaxable + taxAmt) * 100) / 100;

    subtotal += gross;
    taxableAmount += netTaxable;
    cgstTotal += cgstAmount;
    sgstTotal += sgstAmount;
    igstTotal += igstAmount;

    return {
      sku: item.sku ? item.sku.trim().toUpperCase() : '',
      name: item.name || 'Spare Part',
      hsn: item.hsn || '8711',
      quantity: qty,
      unitPrice: price,
      discount: disc,
      taxableAmount: netTaxable,
      gstRate: rate,
      cgstRate,
      cgstAmount,
      sgstRate,
      sgstAmount,
      igstRate,
      igstAmount,
      taxAmount: taxAmt,
      lineTotal,
    };
  });

  const taxTotal = Math.round((cgstTotal + sgstTotal + igstTotal) * 100) / 100;
  const grandTotal = Math.round((taxableAmount + taxTotal) * 100) / 100;
  const received = Math.min(grandTotal, Number(amountReceived) || 0);
  const balance = Math.round((grandTotal - received) * 100) / 100;
  const paymentStatus = balance <= 0 ? 'PAID' : received > 0 ? 'PARTIAL' : 'UNPAID';

  const invoiceNo = nextSequence('SCI');

  // Warehouse deduction if warehouse is available
  let activeWarehouse = null;
  try {
    if (warehouseId) {
      activeWarehouse = await Warehouse.findById(warehouseId);
    }
    if (!activeWarehouse) {
      activeWarehouse = await Warehouse.findOne({ isActive: { $ne: false } });
    }
    if (activeWarehouse) {
      await deductWarehouseStock({
        warehouseId: activeWarehouse._id,
        lineItems: processedLineItems.map((it) => ({
          sku: it.sku,
          name: it.name,
          quantity: it.quantity,
        })),
      });
    }
  } catch (stockErr) {
    console.warn('[Warehouse] Could not deduct warehouse stock:', stockErr.message);
  }

  // Credit stock to Service Center inventory
  for (const it of processedLineItems) {
    if (it.sku) {
      let scInv = await ServiceCenterInventory.findOne({
        serviceCenter: serviceCenter._id,
        sku: it.sku,
      });
      if (scInv) {
        scInv.availableStock = (scInv.availableStock || 0) + it.quantity;
        scInv.unitPrice = it.unitPrice || scInv.unitPrice;
        await scInv.save();
      } else {
        await ServiceCenterInventory.create({
          serviceCenter: serviceCenter._id,
          sku: it.sku,
          name: it.name,
          category: 'Spare Parts',
          availableStock: it.quantity,
          unitPrice: it.unitPrice || 0,
          reorderLevel: 5,
        });
      }
    }
  }

  // Ledger Posting (Company Ledger & Party Ledger)
  let companyLedgerEntry = null;
  try {
    const ledgerResult = await createLinkedCompanyEntry({
      txnType: 'SALE_TO_SERVICE_CENTER',
      date: invoiceDate,
      credit: grandTotal,
      debit: 0,
      description: `Tax Invoice ${invoiceNo} — Spares sale to ${serviceCenter.name} (GSTIN: ${serviceCenter.gstin || 'URP'})`,
      partyId: party._id,
      partyName: serviceCenter.name,
      referenceNo: invoiceNo,
      paymentMode,
      notes: `Taxable: ₹${taxableAmount}, CGST: ₹${cgstTotal}, SGST: ₹${sgstTotal}, IGST: ₹${igstTotal}, Grand Total: ₹${grandTotal}`,
      dueDate,
      createdBy: req.user?._id,
    });
    companyLedgerEntry = ledgerResult.entry;

    // If initial payment received, record matching payment entry
    if (received > 0) {
      await createLinkedCompanyEntry({
        txnType: 'PAYMENT_FROM_SERVICE_CENTER',
        date: invoiceDate,
        credit: received,
        debit: 0,
        description: `Payment received for Invoice ${invoiceNo} via ${paymentMode}`,
        partyId: party._id,
        partyName: serviceCenter.name,
        referenceNo: `${invoiceNo}-RCPT`,
        paymentMode,
        notes: `Received towards Invoice ${invoiceNo}`,
        createdBy: req.user?._id,
      });
    }
  } catch (ledgerErr) {
    console.error('[CompanyLedger] Error posting service center sale ledger entry:', ledgerErr);
  }

  const invoice = await ServiceCenterInvoice.create({
    invoiceNo,
    serviceCenter: serviceCenter._id,
    serviceCenterCode: serviceCenter.code,
    serviceCenterName: serviceCenter.name,
    serviceCenterGstin: serviceCenter.gstin || '',
    serviceCenterState: serviceCenter.state || '',
    billingAddress: serviceCenter.billingAddress || serviceCenter.address || '',
    party: party._id,
    invoiceDate,
    dueDate,
    lineItems: processedLineItems,
    subtotal,
    taxableAmount,
    cgstTotal,
    sgstTotal,
    igstTotal,
    taxTotal,
    grandTotal,
    amountReceived: received,
    balanceAmount: balance,
    paymentMode,
    paymentStatus,
    dispatchStatus: 'DELIVERED',
    status: 'ISSUED',
    warehouse: activeWarehouse?._id || null,
    companyLedgerRef: companyLedgerEntry?._id || null,
    partyLedgerRef: companyLedgerEntry?.partyLedgerRef || null,
    notes,
    createdBy: req.user?._id,
  });

  return sendCreated(res, {
    data: toPublicDoc(invoice.toObject()),
    message: `Tax Invoice ${invoiceNo} generated successfully and ledger updated.`,
  });
});

export const listServiceCenterInvoices = asyncHandler(async (req, res) => {
  const { page, perPage, skip, sort } = parsePagination(req.query);
  const filter = { ...buildSearchFilter(req.query.search, ['invoiceNo', 'serviceCenterName', 'serviceCenterGstin']) };

  if (req.query.serviceCenterId) {
    filter.serviceCenter = req.query.serviceCenterId;
  }
  if (req.query.paymentStatus) {
    filter.paymentStatus = req.query.paymentStatus;
  }
  if (req.query.status) {
    filter.status = req.query.status;
  }

  const [rows, total] = await Promise.all([
    ServiceCenterInvoice.find(filter).sort(sort).skip(skip).limit(perPage).lean(),
    ServiceCenterInvoice.countDocuments(filter),
  ]);

  return sendPaginated(res, {
    data: rows.map(toPublicDoc),
    total,
    page,
    perPage,
  });
});

export const getServiceCenterInvoice = asyncHandler(async (req, res) => {
  const doc = await ServiceCenterInvoice.findById(req.params.id)
    .populate('serviceCenter')
    .populate('party')
    .lean();

  if (!doc) {
    return sendError(res, { message: 'Service Center Invoice not found', statusCode: 404 });
  }

  return sendSuccess(res, { data: toPublicDoc(doc) });
});

export const recordServiceCenterPayment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { amount, paymentMode = 'BANK_TRANSFER', referenceNo = '', notes = '' } = req.body;

  const invoice = await ServiceCenterInvoice.findById(id);
  if (!invoice) {
    return sendError(res, { message: 'Invoice not found', statusCode: 404 });
  }

  const payAmt = Number(amount);
  if (!payAmt || payAmt <= 0) {
    return sendError(res, { message: 'Valid payment amount is required', statusCode: 400 });
  }

  const newReceived = (invoice.amountReceived || 0) + payAmt;
  const newBalance = Math.max(0, Math.round((invoice.grandTotal - newReceived) * 100) / 100);

  invoice.amountReceived = newReceived;
  invoice.balanceAmount = newBalance;
  invoice.paymentStatus = newBalance <= 0 ? 'PAID' : 'PARTIAL';
  await invoice.save();

  // Record in Ledger
  try {
    const serviceCenter = await ServiceCenter.findById(invoice.serviceCenter);
    const party = await ensureServiceCenterParty(serviceCenter);

    await createLinkedCompanyEntry({
      txnType: 'PAYMENT_FROM_SERVICE_CENTER',
      date: new Date(),
      credit: payAmt,
      debit: 0,
      description: `Payment received for Invoice ${invoice.invoiceNo} via ${paymentMode}`,
      partyId: party._id,
      partyName: invoice.serviceCenterName,
      referenceNo: referenceNo || `${invoice.invoiceNo}-RCPT`,
      paymentMode,
      notes: notes || `Payment for Invoice ${invoice.invoiceNo}`,
      createdBy: req.user?._id,
    });
  } catch (ledgerErr) {
    console.error('[CompanyLedger] Failed to record service center payment receipt:', ledgerErr);
  }

  return sendSuccess(res, {
    data: toPublicDoc(invoice.toObject()),
    message: `Payment of ₹${payAmt} recorded successfully.`,
  });
});
