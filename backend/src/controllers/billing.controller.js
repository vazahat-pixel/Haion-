import Bill from '../models/Bill.model.js';
import Customer from '../models/Customer.model.js';
import mongoose from 'mongoose';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess, sendCreated, sendError, sendPaginated } from '../utils/apiResponse.js';
import { parsePagination, buildSearchFilter } from '../utils/pagination.util.js';
import { mapBill } from '../utils/docMapper.util.js';
import { nextSequence } from '../utils/sequence.util.js';
import {
  computeBillTotals,
  sendBill as sendBillService,
  markBillPaid,
  validateDealerStock,
  voidWarrantiesForBill,
  registerWarrantiesForBill,
  createInvoiceFromBill,
} from '../services/billing.service.js';
import { assertDealerCanTransact } from '../services/dealerCompliance.service.js';
import Dealer from '../models/Dealer.model.js';
import DealerTeamMember from '../models/DealerTeamMember.model.js';
import { ROLES } from '../config/constants.js';

function dealerFilter(req) {
  if (req.user.dealerId) return { dealer: req.user.dealerId };
  if (req.query.dealerId) return { dealer: req.query.dealerId };
  return {};
}

async function resolveCustomer(req, body) {
  if (body.customerId) {
    const filter = { _id: body.customerId, ...dealerFilter(req) };
    const customer = await Customer.findOne(filter).lean();
    if (!customer) throw Object.assign(new Error('Customer not found'), { statusCode: 404 });
    return {
      customerId: customer._id,
      customerName: customer.name,
      customerGstin: body.customerGstin || customer.gstin,
      customerState: body.customerState || customer.state,
      customerPhone: body.customerPhone || customer.phone,
      customerAddress: body.customerAddress || customer.address || [customer.city, customer.state].filter(Boolean).join(', '),
    };
  }
  return {
    customerId: body.customer,
    customerName: body.customer || body.customerName,
    customerGstin: body.customerGstin || '',
    customerState: body.customerState || '',
    customerPhone: body.customerPhone || '',
    customerAddress: body.customerAddress || '',
  };
}

async function resolveTeamMember(req, dealerId, body) {
  if (body.teamMemberId || body.teamMember) return body.teamMemberId || body.teamMember;
  if (req.user.role === ROLES.DEALER_SALES) {
    const member = await DealerTeamMember.findOne({
      dealer: dealerId,
      email: req.user.email,
      status: 'ACTIVE',
    }).lean();
    return member?._id;
  }
  return undefined;
}

export const listBills = asyncHandler(async (req, res) => {
  const { page, perPage, skip, sort } = parsePagination(req.query);
  const filter = {
    ...dealerFilter(req),
    ...buildSearchFilter(req.query.search, ['billNo', 'customerName']),
  };
  if (req.query.status) filter.status = req.query.status;
  if (req.user.role === ROLES.DEALER_SALES && req.user.dealerId) {
    const member = await DealerTeamMember.findOne({
      dealer: req.user.dealerId,
      email: req.user.email,
      status: 'ACTIVE',
    }).lean();
    if (member) filter.teamMember = member._id;
  }

  const [rows, total] = await Promise.all([
    Bill.find(filter).sort(sort).skip(skip).limit(perPage).lean(),
    Bill.countDocuments(filter),
  ]);
  return sendPaginated(res, { data: rows.map(mapBill), total, page, perPage });
});

export const getBill = asyncHandler(async (req, res) => {
  const filter = { _id: req.params.id, ...dealerFilter(req) };
  const bill = await Bill.findOne(filter).lean();
  if (!bill) return sendError(res, { message: 'Bill not found', statusCode: 404 });
  return sendSuccess(res, { data: mapBill(bill) });
});

export const getNextBillNumber = asyncHandler(async (_req, res) => {
  return sendSuccess(res, { data: { billNo: nextSequence('BILL') } });
});

export const createBill = asyncHandler(async (req, res) => {
  const dealerId = req.user.dealerId || req.body.dealerId;
  if (!dealerId) return sendError(res, { message: 'Dealer context required', statusCode: 400 });

  try {
    await assertDealerCanTransact(dealerId);
  } catch (err) {
    return sendError(res, { message: err.message, statusCode: err.statusCode || 403 });
  }

  const { customerId, customerName, customerGstin, customerState, customerPhone, customerAddress } = await resolveCustomer(req, req.body);
  if (!customerName) return sendError(res, { message: 'Customer name required', statusCode: 400 });
  if (!req.body.lineItems?.length) return sendError(res, { message: 'At least one line item required', statusCode: 400 });

  const totals = await computeBillTotals(req.body.lineItems, {
    customerGstin,
    customerState,
    isInterState: req.body.isInterstate ?? req.body.isInterState,
  });

  const status = req.body.status === 'SENT' ? 'SENT' : 'DRAFT';
  if (status === 'SENT') {
    await validateDealerStock(dealerId, totals.lineItems);
  }

  const billNo = req.body.billNo || nextSequence('BILL');
  const teamMember = await resolveTeamMember(req, dealerId, req.body);

  const session = await mongoose.startSession();
  try {
    let bill;
    await session.withTransaction(async () => {
      const [created] = await Bill.create([{
        billNo,
        dealer: dealerId,
        customer: customerId,
        customerName,
        customerGstin,
        customerPhone,
        customerAddress,
        customerState,
        lineItems: totals.lineItems.map((item) => ({
          sku: item.sku,
          product: item.product,
          hsn: item.hsn,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          gstRate: item.gstRate,
          amount: item.quantity * item.unitPrice,
          cgst: item.cgst,
          sgst: item.sgst,
          igst: item.igst,
        })),
        amount: totals.subtotal,
        tax: totals.totalGST,
        total: totals.grandTotal,
        cgst: totals.totalCGST,
        sgst: totals.totalSGST,
        igst: totals.totalIGST,
        isInterState: totals.isInterState,
        status,
        dueDate: req.body.dueDate,
        notes: req.body.notes,
        sentAt: status === 'SENT' ? new Date() : undefined,
        createdBy: req.user._id,
        teamMember,
      }], { session });
      bill = created;

      if (status === 'SENT') {
        const dealer = await Dealer.findById(dealerId).session(session).lean();
        await createInvoiceFromBill(bill, dealer, { session });
        await registerWarrantiesForBill(bill, { session });
      }
    });
    return sendCreated(res, { data: mapBill(bill.toObject()), message: 'Bill created' });
  } finally {
    await session.endSession();
  }
});

export const updateBill = asyncHandler(async (req, res) => {
  const filter = { _id: req.params.id, ...dealerFilter(req) };
  const existing = await Bill.findOne(filter);
  if (!existing) return sendError(res, { message: 'Bill not found', statusCode: 404 });
  if (existing.status !== 'DRAFT') return sendError(res, { message: 'Only draft bills can be edited', statusCode: 400 });

  if (req.body.lineItems?.length) {
    const totals = await computeBillTotals(req.body.lineItems, {
      customerGstin: req.body.customerGstin ?? existing.customerGstin,
      isInterState: req.body.isInterstate ?? req.body.isInterState ?? existing.isInterState,
    });
    existing.lineItems = totals.lineItems.map((item) => ({
      sku: item.sku,
      product: item.product,
      hsn: item.hsn,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      gstRate: item.gstRate,
      amount: item.quantity * item.unitPrice,
      cgst: item.cgst,
      sgst: item.sgst,
      igst: item.igst,
    }));
    existing.amount = totals.subtotal;
    existing.tax = totals.totalGST;
    existing.total = totals.grandTotal;
    existing.cgst = totals.totalCGST;
    existing.sgst = totals.totalSGST;
    existing.igst = totals.totalIGST;
    existing.isInterState = totals.isInterState;
  }

  if (req.body.customer) existing.customerName = req.body.customer;
  if (req.body.customerGstin !== undefined) existing.customerGstin = req.body.customerGstin;
  if (req.body.notes !== undefined) existing.notes = req.body.notes;

  await existing.save();
  return sendSuccess(res, { data: mapBill(existing.toObject()), message: 'Bill updated' });
});

export const sendBill = asyncHandler(async (req, res) => {
  try {
    const filter = { _id: req.params.id, ...dealerFilter(req) };
    const bill = await Bill.findOne(filter);
    if (!bill) return sendError(res, { message: 'Bill not found', statusCode: 404 });
    const result = await sendBillService(bill._id);
    return sendSuccess(res, { data: mapBill(result.bill.toObject()), message: 'Bill sent' });
  } catch (err) {
    return sendError(res, { message: err.message, statusCode: err.statusCode || 400 });
  }
});

export const markPaid = asyncHandler(async (req, res) => {
  try {
    const filter = { _id: req.params.id, ...dealerFilter(req) };
    const exists = await Bill.findOne(filter);
    if (!exists) return sendError(res, { message: 'Bill not found', statusCode: 404 });
    const { bill } = await markBillPaid(req.params.id, req.user._id);
    return sendSuccess(res, { data: mapBill(bill.toObject()), message: 'Bill marked paid — stock deducted' });
  } catch (err) {
    return sendError(res, { message: err.message, statusCode: err.statusCode || 400 });
  }
});

export const cancelBill = asyncHandler(async (req, res) => {
  const filter = { _id: req.params.id, ...dealerFilter(req) };
  const bill = await Bill.findOne(filter);
  if (!bill) return sendError(res, { message: 'Bill not found', statusCode: 404 });
  if (bill.status === 'PAID') return sendError(res, { message: 'Paid bills cannot be cancelled', statusCode: 400 });

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      bill.status = 'CANCELLED';
      await bill.save({ session });
      await voidWarrantiesForBill(bill._id, { session });
    });
    return sendSuccess(res, { data: mapBill(bill.toObject()), message: 'Bill cancelled — linked warranties voided' });
  } finally {
    await session.endSession();
  }
});
