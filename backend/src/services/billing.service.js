import Bill from '../models/Bill.model.js';
import Invoice from '../models/Invoice.model.js';
import Product from '../models/Product.model.js';
import Warranty from '../models/Warranty.model.js';
import Customer from '../models/Customer.model.js';
import Dealer from '../models/Dealer.model.js';
import DealerInventory from '../models/DealerInventory.model.js';
import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { calculateInvoiceTotals, extractStateCodeFromGSTIN } from '../utils/gst.util.js';
import { nextSequence } from '../utils/sequence.util.js';
import { deductDealerStock } from './inventory.service.js';
import { assertDealerCanTransact } from './dealerCompliance.service.js';

const HSN_RATES = {
  '8501': 18, '8537': 18, '8413': 18, '4010': 12,
};

export function resolveCustomerStateCode(customerGstin, customerState) {
  if (customerGstin?.length >= 2) return extractStateCodeFromGSTIN(customerGstin);
  const stateMap = {
    Rajasthan: '08', Gujarat: '24', 'Uttar Pradesh': '09', Karnataka: '29',
    Maharashtra: '27', Haryana: '06', Delhi: '07',
  };
  return stateMap[customerState] || env.companyStateCode;
}

export async function computeBillTotals(lineItems, { customerGstin, customerState, isInterState }) {
  const customerStateCode = resolveCustomerStateCode(customerGstin, customerState);
  const interstate = isInterState ?? (customerStateCode !== env.companyStateCode);
  const skus = [...new Set(lineItems.map((item) => item.sku?.toUpperCase()).filter(Boolean))];
  const products = skus.length
    ? await Product.find({ sku: { $in: skus } }).select('sku gstRate hsnCode').lean()
    : [];
  const productGstMap = Object.fromEntries(products.map((p) => [p.sku, p.gstRate]));

  const normalized = lineItems.map((item) => ({
    sku: item.sku,
    product: item.product || item.name,
    hsn: item.hsn || '',
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    gstRate: item.gstRate ?? productGstMap[item.sku?.toUpperCase()] ?? HSN_RATES[item.hsn] ?? 18,
  }));
  const totals = calculateInvoiceTotals(normalized, env.companyStateCode, customerStateCode);
  if (isInterState === true || isInterState === false) {
    totals.isInterState = isInterState;
  }
  return totals;
}

function generateSerialNo(sku) {
  const prefix = sku.replace(/[^A-Z0-9]/gi, '').slice(0, 6).toUpperCase() || 'PRD';
  const n = Math.floor(Math.random() * 90000) + 10000;
  return `SN-${prefix}-${n}`;
}

export async function createInvoiceFromBill(bill, dealer, options = {}) {
  const { session } = options;
  const existing = await Invoice.findOne({ bill: bill._id }).session(session || null);
  if (existing) return existing;

  const [invoice] = await Invoice.create([{
    invoiceNo: nextSequence('INV'),
    bill: bill._id,
    billNo: bill.billNo,
    dealer: bill.dealer,
    customer: bill.customer,
    customerName: bill.customerName,
    customerGstin: bill.customerGstin,
    dealerName: dealer?.name,
    dealerGstin: dealer?.gstin,
    dealerAddress: dealer ? `${dealer.city}, ${dealer.state}` : '',
    lineItems: bill.lineItems,
    amount: bill.total,
    tax: bill.tax,
    total: bill.total,
    cgst: bill.cgst,
    sgst: bill.sgst,
    igst: bill.igst,
    status: bill.status === 'PAID' ? 'PAID' : 'SENT',
    issuedAt: new Date(),
    paidAt: bill.paidAt,
  }], session ? { session } : undefined);
  return invoice;
}

export async function validateDealerStock(dealerId, lineItems, options = {}) {
  const { session } = options;
  for (const line of lineItems) {
    const item = await DealerInventory.findOne({ dealer: dealerId, sku: line.sku?.toUpperCase() }).session(session || null);
    const available = item?.quantity ?? 0;
    if (available < line.quantity) {
      throw Object.assign(
        new Error(`Insufficient stock for ${line.sku} (available: ${available})`),
        { statusCode: 400 }
      );
    }
  }
}

export async function voidWarrantiesForBill(billId, options = {}) {
  const { session } = options;
  await Warranty.updateMany(
    { bill: billId, status: { $in: ['ACTIVE', 'CLAIMED'] } },
    { status: 'VOID' },
    session ? { session } : undefined
  );
}

export async function registerWarrantiesForBill(bill, options = {}) {
  const { session } = options;
  const existing = await Warranty.countDocuments({ bill: bill._id }).session(session || null);
  if (existing > 0) return Warranty.find({ bill: bill._id });

  const warranties = [];
  const startDate = new Date();
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + 12);

  for (const line of bill.lineItems) {
    for (let i = 0; i < line.quantity; i += 1) {
      warranties.push({
        serialNo: generateSerialNo(line.sku),
        product: line.product,
        sku: line.sku,
        customer: bill.customer,
        customerName: bill.customerName,
        bill: bill._id,
        billNo: bill.billNo,
        dealer: bill.dealer,
        status: 'ACTIVE',
        startDate,
        endDate,
        warrantyMonths: 12,
      });
    }
  }
  return Warranty.insertMany(warranties, session ? { session } : undefined);
}

export async function markBillPaid(billId, userId, options = {}) {
  const existingSession = options.session;
  const session = existingSession || await mongoose.startSession();
  const run = async () => {
    const bill = await Bill.findById(billId).session(session);
    if (!bill) throw Object.assign(new Error('Bill not found'), { statusCode: 404 });
    if (bill.status === 'PAID') throw Object.assign(new Error('Bill already paid'), { statusCode: 400 });
    if (bill.status === 'CANCELLED') throw Object.assign(new Error('Cannot pay cancelled bill'), { statusCode: 400 });
    if (bill.status === 'DRAFT') throw Object.assign(new Error('Send bill before marking paid'), { statusCode: 400 });

    await deductDealerStock({ dealerId: bill.dealer, lineItems: bill.lineItems, performedByUser: userId, session });

    bill.status = 'PAID';
    bill.paidAt = new Date();
    await bill.save({ session });

    const dealer = await Dealer.findById(bill.dealer).session(session).lean();
    let invoice = await Invoice.findOne({ bill: bill._id }).session(session);
    if (!invoice) {
      invoice = await createInvoiceFromBill(bill, dealer, { session });
    } else {
      invoice.status = 'PAID';
      invoice.paidAt = bill.paidAt;
      await invoice.save({ session });
    }

    if (bill.customer) {
      await Customer.findByIdAndUpdate(bill.customer, {
        $inc: { totalPurchases: bill.total },
        lastOrderAt: new Date(),
      }, { session });
    }

    return { bill, invoice };
  };
  try {
    if (existingSession) return await run();
    let payload;
    await session.withTransaction(async () => {
      payload = await run();
    });
    return payload;
  } finally {
    if (!existingSession) await session.endSession();
  }
}

export async function sendBill(billId, options = {}) {
  const existingSession = options.session;
  const session = existingSession || await mongoose.startSession();
  const run = async () => {
    const bill = await Bill.findById(billId).session(session);
    if (!bill) throw Object.assign(new Error('Bill not found'), { statusCode: 404 });
    if (bill.status !== 'DRAFT') throw Object.assign(new Error('Only draft bills can be sent'), { statusCode: 400 });

    await assertDealerCanTransact(bill.dealer);
    await validateDealerStock(bill.dealer, bill.lineItems, { session });

    bill.status = 'SENT';
    bill.sentAt = new Date();
    if (!bill.dueDate) {
      const due = new Date();
      due.setDate(due.getDate() + 15);
      bill.dueDate = due;
    }
    await bill.save({ session });

    const dealer = await Dealer.findById(bill.dealer).session(session).lean();
    const invoice = await createInvoiceFromBill(bill, dealer, { session });
    await registerWarrantiesForBill(bill, { session });
    return { bill, invoice };
  };
  try {
    if (existingSession) return await run();
    let payload;
    await session.withTransaction(async () => {
      payload = await run();
    });
    return payload;
  } finally {
    if (!existingSession) await session.endSession();
  }
}
