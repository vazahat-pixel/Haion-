import Bill from '../../models/Bill.model.js';
import Purchase from '../../models/Purchase.model.js';
import Expense from '../../models/Expense.model.js';
import Inventory from '../../models/Inventory.model.js';
import AuditLog from '../../models/AuditLog.model.js';
import { getSettings } from '../settings.service.js';
import { extractStateCodeFromGSTIN, isInterState } from '../../utils/gst.util.js';
import { round2 } from './dateRange.util.js';

let reportContext = {};

export function setReportContext(ctx = {}) {
  reportContext = ctx || {};
}

export function getReportContext() {
  return reportContext;
}

async function getCompanyContext() {
  const gst = await getSettings('gst');
  const general = await getSettings('general');
  return {
    companyName: general.companyName || 'Company',
    gstin: gst.gstin || '',
    stateCode: gst.stateCode || '29',
  };
}

function buildMeta(reportCode, range) {
  return {
    reportCode,
    source: 'database',
    periodFrom: range.from.toISOString(),
    periodTo: range.to.toISOString(),
    generatedAt: new Date().toISOString(),
  };
}

async function fetchBills(range) {
  const ctx = getReportContext();
  const filter = {
    status: { $ne: 'CANCELLED' },
    createdAt: { $gte: range.from, $lte: range.to },
  };
  if (ctx.dealerId) filter.dealer = ctx.dealerId;
  return Bill.find(filter).lean();
}

async function fetchPaidBills(range) {
  const ctx = getReportContext();
  const filter = {
    status: 'PAID',
    paidAt: { $gte: range.from, $lte: range.to },
  };
  if (ctx.dealerId) filter.dealer = ctx.dealerId;
  return Bill.find(filter).lean();
}

async function fetchPurchases(range) {
  const ctx = getReportContext();
  if (ctx.dealerId) return [];
  return Purchase.find({
    status: 'RECEIVED',
    purchaseInvDate: { $gte: range.from, $lte: range.to },
  }).populate('party', 'name gstin state').lean();
}

async function fetchExpenses(range) {
  const ctx = getReportContext();
  if (ctx.dealerId) return [];
  return Expense.find({
    status: 'APPROVED',
    submittedAt: { $gte: range.from, $lte: range.to },
  }).lean();
}

function splitTax(taxAmount, interstate) {
  const tax = round2(taxAmount);
  if (interstate) return { cgst: 0, sgst: 0, igst: tax };
  const half = round2(tax / 2);
  return { cgst: half, sgst: half, igst: 0 };
}

function purchaseLineTax(line, interstate) {
  const tax = line.taxAmount ?? round2((line.amount * (line.gstRate || 0)) / 100);
  return splitTax(tax, interstate);
}

function kvSection(title, rows) {
  return { title, type: 'keyValue', rows };
}

function tableSection(title, columns, rows) {
  return { title, type: 'table', columns, rows };
}

function emptyTdsReport(reportCode, title, range) {
  return {
    meta: buildMeta(reportCode, range),
    summary: { totalAmount: 0, transactionCount: 0 },
    sections: [
      kvSection('Summary', [
        { label: 'Total Amount', value: 0 },
        { label: 'Transactions', value: 0 },
      ]),
      tableSection(title, [
        { key: 'date', label: 'Date' },
        { key: 'party', label: 'Party' },
        { key: 'section', label: 'Section' },
        { key: 'amount', label: 'Amount' },
      ], []),
      {
        title: 'Note',
        type: 'note',
        text: 'No TDS/TCS transactions recorded in the system for this period. Configure TDS/TCS on invoices when that module is enabled.',
      },
    ],
  };
}

export async function generateSalesSummary(range) {
  const bills = await fetchBills(range);
  const paid = bills.filter((b) => b.status === 'PAID');
  const rows = bills.map((b) => ({
    date: b.createdAt,
    billNo: b.billNo,
    customer: b.customerName,
    gstin: b.customerGstin || '—',
    taxable: round2(b.amount),
    tax: round2(b.tax),
    total: round2(b.total),
    status: b.status,
  }));

  const summary = {
    billCount: bills.length,
    paidCount: paid.length,
    taxableAmount: round2(bills.reduce((s, b) => s + b.amount, 0)),
    taxAmount: round2(bills.reduce((s, b) => s + b.tax, 0)),
    totalAmount: round2(bills.reduce((s, b) => s + b.total, 0)),
    collectedAmount: round2(paid.reduce((s, b) => s + b.total, 0)),
  };

  return {
    meta: buildMeta('sales-summary', range),
    summary,
    sections: [
      kvSection('Summary', [
        { label: 'Total Bills', value: summary.billCount },
        { label: 'Paid Bills', value: summary.paidCount },
        { label: 'Taxable Amount', value: summary.taxableAmount },
        { label: 'Tax Amount', value: summary.taxAmount },
        { label: 'Total Sales', value: summary.totalAmount },
        { label: 'Collected', value: summary.collectedAmount },
      ]),
      tableSection('Sales Transactions', [
        { key: 'date', label: 'Date', format: 'date' },
        { key: 'billNo', label: 'Bill No' },
        { key: 'customer', label: 'Customer' },
        { key: 'gstin', label: 'GSTIN' },
        { key: 'taxable', label: 'Taxable', format: 'currency' },
        { key: 'tax', label: 'Tax', format: 'currency' },
        { key: 'total', label: 'Total', format: 'currency' },
        { key: 'status', label: 'Status' },
      ], rows),
    ],
  };
}

export async function generatePurchaseSummary(range) {
  const purchases = await fetchPurchases(range);
  const rows = purchases.map((p) => ({
    date: p.purchaseInvDate,
    purchaseNo: p.purchaseNo,
    billNo: p.billNo,
    party: p.partyName,
    taxable: round2(p.taxableAmount),
    tax: round2(p.tax),
    total: round2(p.total),
    paid: round2(p.amountPaid),
    balance: round2(p.balanceAmount),
  }));

  const summary = {
    purchaseCount: purchases.length,
    taxableAmount: round2(purchases.reduce((s, p) => s + p.taxableAmount, 0)),
    taxAmount: round2(purchases.reduce((s, p) => s + p.tax, 0)),
    totalAmount: round2(purchases.reduce((s, p) => s + p.total, 0)),
    paidAmount: round2(purchases.reduce((s, p) => s + p.amountPaid, 0)),
  };

  return {
    meta: buildMeta('purchase-summary', range),
    summary,
    sections: [
      kvSection('Summary', Object.entries(summary).map(([k, v]) => ({
        label: k.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase()),
        value: v,
      }))),
      tableSection('Purchase Transactions', [
        { key: 'date', label: 'Date', format: 'date' },
        { key: 'purchaseNo', label: 'Purchase No' },
        { key: 'billNo', label: 'Supplier Bill' },
        { key: 'party', label: 'Party' },
        { key: 'taxable', label: 'Taxable', format: 'currency' },
        { key: 'tax', label: 'Tax', format: 'currency' },
        { key: 'total', label: 'Total', format: 'currency' },
        { key: 'paid', label: 'Paid', format: 'currency' },
        { key: 'balance', label: 'Balance', format: 'currency' },
      ], rows),
    ],
  };
}

export async function generateGstr1(range) {
  const ctx = await getCompanyContext();
  const bills = await fetchBills(range);

  const b2b = bills.filter((b) => b.customerGstin?.length === 15);
  const b2c = bills.filter((b) => !b.customerGstin || b.customerGstin.length !== 15);

  const b2bRows = b2b.map((b) => ({
    invoiceNo: b.billNo,
    date: b.createdAt,
    gstin: b.customerGstin,
    customer: b.customerName,
    placeOfSupply: b.customerState || '—',
    taxable: round2(b.amount),
    cgst: round2(b.cgst),
    sgst: round2(b.sgst),
    igst: round2(b.igst),
    total: round2(b.total),
  }));

  const b2cSummary = {
    invoiceCount: b2c.length,
    taxable: round2(b2c.reduce((s, b) => s + b.amount, 0)),
    tax: round2(b2c.reduce((s, b) => s + b.tax, 0)),
    total: round2(b2c.reduce((s, b) => s + b.total, 0)),
  };

  const hsnMap = new Map();
  for (const bill of bills) {
    for (const line of bill.lineItems || []) {
      const key = `${line.hsn || 'NA'}|${line.gstRate}`;
      const prev = hsnMap.get(key) || { hsn: line.hsn || 'NA', gstRate: line.gstRate, qty: 0, taxable: 0, tax: 0 };
      prev.qty += line.quantity;
      prev.taxable += line.amount;
      prev.tax += (line.cgst || 0) + (line.sgst || 0) + (line.igst || 0);
      hsnMap.set(key, prev);
    }
  }
  const hsnRows = [...hsnMap.values()].map((r) => ({
    hsn: r.hsn,
    gstRate: r.gstRate,
    quantity: r.qty,
    taxable: round2(r.taxable),
    tax: round2(r.tax),
  }));

  return {
    meta: buildMeta('gstr-1', range),
    summary: {
      companyGstin: ctx.gstin,
      b2bCount: b2b.length,
      b2cCount: b2c.length,
      totalTaxable: round2(bills.reduce((s, b) => s + b.amount, 0)),
      totalTax: round2(bills.reduce((s, b) => s + b.tax, 0)),
    },
    sections: [
      kvSection('GSTR-1 Summary', [
        { label: 'Company GSTIN', value: ctx.gstin || '—' },
        { label: 'B2B Invoices', value: b2b.length },
        { label: 'B2C Invoices', value: b2c.length },
        { label: 'Total Taxable', value: round2(bills.reduce((s, b) => s + b.amount, 0)) },
        { label: 'Total Tax', value: round2(bills.reduce((s, b) => s + b.tax, 0)) },
      ]),
      tableSection('B2B Supplies', [
        { key: 'invoiceNo', label: 'Invoice' },
        { key: 'date', label: 'Date', format: 'date' },
        { key: 'gstin', label: 'GSTIN' },
        { key: 'customer', label: 'Customer' },
        { key: 'taxable', label: 'Taxable', format: 'currency' },
        { key: 'cgst', label: 'CGST', format: 'currency' },
        { key: 'sgst', label: 'SGST', format: 'currency' },
        { key: 'igst', label: 'IGST', format: 'currency' },
        { key: 'total', label: 'Total', format: 'currency' },
      ], b2bRows),
      kvSection('B2C Summary', [
        { label: 'Invoices', value: b2cSummary.invoiceCount },
        { label: 'Taxable', value: b2cSummary.taxable },
        { label: 'Tax', value: b2cSummary.tax },
        { label: 'Total', value: b2cSummary.total },
      ]),
      tableSection('HSN Summary', [
        { key: 'hsn', label: 'HSN' },
        { key: 'gstRate', label: 'GST %' },
        { key: 'quantity', label: 'Qty' },
        { key: 'taxable', label: 'Taxable', format: 'currency' },
        { key: 'tax', label: 'Tax', format: 'currency' },
      ], hsnRows),
    ],
  };
}

export async function generateGstr2(range) {
  const ctx = await getCompanyContext();
  const purchases = await fetchPurchases(range);
  const rows = [];

  for (const p of purchases) {
    const partyGstin = p.party?.gstin || '';
    const partyState = extractStateCodeFromGSTIN(partyGstin) || ctx.stateCode;
    const interstate = isInterState(ctx.stateCode, partyState);
    let cgst = 0; let sgst = 0; let igst = 0;

    for (const line of p.lineItems || []) {
      const t = purchaseLineTax(line, interstate);
      cgst += t.cgst; sgst += t.sgst; igst += t.igst;
    }

    rows.push({
      date: p.purchaseInvDate,
      purchaseNo: p.purchaseNo,
      supplierBill: p.billNo,
      party: p.partyName,
      gstin: partyGstin || '—',
      taxable: round2(p.taxableAmount),
      cgst: round2(cgst),
      sgst: round2(sgst),
      igst: round2(igst),
      total: round2(p.total),
    });
  }

  return {
    meta: buildMeta('gstr-2', range),
    summary: {
      purchaseCount: purchases.length,
      totalTaxable: round2(purchases.reduce((s, p) => s + p.taxableAmount, 0)),
      totalTax: round2(purchases.reduce((s, p) => s + p.tax, 0)),
    },
    sections: [
      kvSection('GSTR-2 Summary', [
        { label: 'Company GSTIN', value: ctx.gstin || '—' },
        { label: 'Purchase Invoices', value: purchases.length },
        { label: 'Total Taxable', value: round2(purchases.reduce((s, p) => s + p.taxableAmount, 0)) },
        { label: 'Total ITC (Tax)', value: round2(purchases.reduce((s, p) => s + p.tax, 0)) },
      ]),
      tableSection('Inward Supplies', [
        { key: 'date', label: 'Date', format: 'date' },
        { key: 'purchaseNo', label: 'Purchase No' },
        { key: 'supplierBill', label: 'Supplier Bill' },
        { key: 'party', label: 'Supplier' },
        { key: 'gstin', label: 'GSTIN' },
        { key: 'taxable', label: 'Taxable', format: 'currency' },
        { key: 'cgst', label: 'CGST', format: 'currency' },
        { key: 'sgst', label: 'SGST', format: 'currency' },
        { key: 'igst', label: 'IGST', format: 'currency' },
        { key: 'total', label: 'Total', format: 'currency' },
      ], rows),
    ],
  };
}

export async function generateGstr3b(range) {
  const [outward, inward] = await Promise.all([
    generateGstr1(range),
    generateGstr2(range),
  ]);

  const outwardTax = outward.summary.totalTax || 0;
  const itc = inward.summary.totalTax || 0;
  const netPayable = round2(Math.max(0, outwardTax - itc));

  return {
    meta: buildMeta('gstr-3b', range),
    summary: {
      outwardTaxable: outward.summary.totalTaxable,
      outwardTax,
      inwardTaxable: inward.summary.totalTaxable,
      inputTaxCredit: itc,
      netTaxPayable: netPayable,
    },
    sections: [
      kvSection('3.1 Outward Supplies', [
        { label: 'Taxable Value', value: outward.summary.totalTaxable },
        { label: 'Tax Liability', value: outwardTax },
      ]),
      kvSection('4. Input Tax Credit', [
        { label: 'Inward Taxable', value: inward.summary.totalTaxable },
        { label: 'ITC Available', value: itc },
      ]),
      kvSection('Net Liability', [
        { label: 'Tax Payable (Outward − ITC)', value: netPayable },
      ]),
      ...outward.sections.filter((s) => s.title === 'HSN Summary'),
      ...inward.sections.filter((s) => s.title === 'Inward Supplies'),
    ],
  };
}

export async function generateGstSalesHsn(range) {
  const bills = await fetchBills(range);
  const hsnMap = new Map();

  for (const bill of bills) {
    for (const line of bill.lineItems || []) {
      const key = `${line.hsn || 'NA'}|${line.gstRate}|${line.product}`;
      const prev = hsnMap.get(key) || {
        hsn: line.hsn || 'NA',
        product: line.product,
        gstRate: line.gstRate,
        qty: 0,
        taxable: 0,
        cgst: 0,
        sgst: 0,
        igst: 0,
      };
      prev.qty += line.quantity;
      prev.taxable += line.amount;
      prev.cgst += line.cgst || 0;
      prev.sgst += line.sgst || 0;
      prev.igst += line.igst || 0;
      hsnMap.set(key, prev);
    }
  }

  const rows = [...hsnMap.values()].map((r) => ({
    ...r,
    taxable: round2(r.taxable),
    cgst: round2(r.cgst),
    sgst: round2(r.sgst),
    igst: round2(r.igst),
    totalTax: round2(r.cgst + r.sgst + r.igst),
  }));

  return {
    meta: buildMeta('gst-sales-hsn', range),
    summary: { lineCount: rows.length, totalTaxable: round2(rows.reduce((s, r) => s + r.taxable, 0)) },
    sections: [
      tableSection('GST Sales (With HSN)', [
        { key: 'hsn', label: 'HSN' },
        { key: 'product', label: 'Product' },
        { key: 'gstRate', label: 'GST %' },
        { key: 'qty', label: 'Qty' },
        { key: 'taxable', label: 'Taxable', format: 'currency' },
        { key: 'cgst', label: 'CGST', format: 'currency' },
        { key: 'sgst', label: 'SGST', format: 'currency' },
        { key: 'igst', label: 'IGST', format: 'currency' },
        { key: 'totalTax', label: 'Total Tax', format: 'currency' },
      ], rows),
    ],
  };
}

export async function generateGstPurchaseHsn(range) {
  const ctx = await getCompanyContext();
  const purchases = await fetchPurchases(range);
  const hsnMap = new Map();

  for (const p of purchases) {
    const partyGstin = p.party?.gstin || '';
    const partyState = extractStateCodeFromGSTIN(partyGstin) || ctx.stateCode;
    const interstate = isInterState(ctx.stateCode, partyState);

    for (const line of p.lineItems || []) {
      const key = `${line.hsn || 'NA'}|${line.gstRate}|${line.name}`;
      const tax = purchaseLineTax(line, interstate);
      const prev = hsnMap.get(key) || {
        hsn: line.hsn || 'NA',
        product: line.name,
        gstRate: line.gstRate,
        qty: 0,
        taxable: 0,
        cgst: 0,
        sgst: 0,
        igst: 0,
      };
      prev.qty += line.quantity;
      prev.taxable += line.amount;
      prev.cgst += tax.cgst;
      prev.sgst += tax.sgst;
      prev.igst += tax.igst;
      hsnMap.set(key, prev);
    }
  }

  const rows = [...hsnMap.values()].map((r) => ({
    ...r,
    taxable: round2(r.taxable),
    cgst: round2(r.cgst),
    sgst: round2(r.sgst),
    igst: round2(r.igst),
    totalTax: round2(r.cgst + r.sgst + r.igst),
  }));

  return {
    meta: buildMeta('gst-purchase-hsn', range),
    summary: { lineCount: rows.length, totalTaxable: round2(rows.reduce((s, r) => s + r.taxable, 0)) },
    sections: [
      tableSection('GST Purchase (With HSN)', [
        { key: 'hsn', label: 'HSN' },
        { key: 'product', label: 'Product' },
        { key: 'gstRate', label: 'GST %' },
        { key: 'qty', label: 'Qty' },
        { key: 'taxable', label: 'Taxable', format: 'currency' },
        { key: 'cgst', label: 'CGST', format: 'currency' },
        { key: 'sgst', label: 'SGST', format: 'currency' },
        { key: 'igst', label: 'IGST', format: 'currency' },
        { key: 'totalTax', label: 'Total Tax', format: 'currency' },
      ], rows),
    ],
  };
}

export async function generateHsnSalesSummary(range) {
  const data = await generateGstSalesHsn(range);
  return {
    ...data,
    meta: buildMeta('hsn-sales-summary', range),
    sections: data.sections.map((s) => ({ ...s, title: 'HSN Wise Sales Summary' })),
  };
}

export async function generateDaybook(range) {
  const [bills, purchases, expenses] = await Promise.all([
    fetchBills(range),
    fetchPurchases(range),
    fetchExpenses(range),
  ]);

  const entries = [
    ...bills.map((b) => ({
      date: b.createdAt,
      type: 'Sales',
      ref: b.billNo,
      party: b.customerName,
      debit: 0,
      credit: round2(b.total),
      narration: `Sales bill ${b.billNo}`,
    })),
    ...purchases.map((p) => ({
      date: p.purchaseInvDate,
      type: 'Purchase',
      ref: p.purchaseNo,
      party: p.partyName,
      debit: round2(p.total),
      credit: 0,
      narration: `Purchase ${p.billNo}`,
    })),
    ...expenses.map((e) => ({
      date: e.submittedAt,
      type: 'Expense',
      ref: e.expenseNo,
      party: e.vendor || '—',
      debit: round2(e.amount),
      credit: 0,
      narration: e.description,
    })),
  ].sort((a, b) => new Date(a.date) - new Date(b.date));

  return {
    meta: buildMeta('daybook', range),
    summary: {
      entryCount: entries.length,
      totalCredit: round2(entries.reduce((s, e) => s + e.credit, 0)),
      totalDebit: round2(entries.reduce((s, e) => s + e.debit, 0)),
    },
    sections: [
      kvSection('Daybook Totals', [
        { label: 'Entries', value: entries.length },
        { label: 'Total Debit', value: round2(entries.reduce((s, e) => s + e.debit, 0)) },
        { label: 'Total Credit', value: round2(entries.reduce((s, e) => s + e.credit, 0)) },
      ]),
      tableSection('Daybook Entries', [
        { key: 'date', label: 'Date', format: 'date' },
        { key: 'type', label: 'Type' },
        { key: 'ref', label: 'Ref' },
        { key: 'party', label: 'Party' },
        { key: 'debit', label: 'Debit', format: 'currency' },
        { key: 'credit', label: 'Credit', format: 'currency' },
        { key: 'narration', label: 'Narration' },
      ], entries),
    ],
  };
}

export async function generateCashBank(range) {
  const [paidBills, purchases] = await Promise.all([
    fetchPaidBills(range),
    fetchPurchases(range),
  ]);

  const receipts = paidBills.map((b) => ({
    date: b.paidAt,
    type: 'Receipt',
    ref: b.billNo,
    party: b.customerName,
    amount: round2(b.total),
    mode: 'Cash/Bank',
  }));

  const payments = purchases
    .filter((p) => p.amountPaid > 0)
    .map((p) => ({
      date: p.receivedAt || p.purchaseInvDate,
      type: 'Payment',
      ref: p.purchaseNo,
      party: p.partyName,
      amount: round2(p.amountPaid),
      mode: 'Cash/Bank',
    }));

  const rows = [...receipts, ...payments].sort((a, b) => new Date(a.date) - new Date(b.date));

  return {
    meta: buildMeta('cash-bank', range),
    summary: {
      receipts: round2(receipts.reduce((s, r) => s + r.amount, 0)),
      payments: round2(payments.reduce((s, p) => s + p.amount, 0)),
      netCash: round2(receipts.reduce((s, r) => s + r.amount, 0) - payments.reduce((s, p) => s + p.amount, 0)),
    },
    sections: [
      kvSection('Cash & Bank Summary', [
        { label: 'Total Receipts', value: round2(receipts.reduce((s, r) => s + r.amount, 0)) },
        { label: 'Total Payments', value: round2(payments.reduce((s, p) => s + p.amount, 0)) },
        { label: 'Net Movement', value: round2(receipts.reduce((s, r) => s + r.amount, 0) - payments.reduce((s, p) => s + p.amount, 0)) },
      ]),
      tableSection('All Payments', [
        { key: 'date', label: 'Date', format: 'date' },
        { key: 'type', label: 'Type' },
        { key: 'ref', label: 'Ref' },
        { key: 'party', label: 'Party' },
        { key: 'amount', label: 'Amount', format: 'currency' },
        { key: 'mode', label: 'Mode' },
      ], rows),
    ],
  };
}

export async function generateExpenseCategory(range) {
  const expenses = await fetchExpenses(range);
  const map = new Map();
  for (const e of expenses) {
    const prev = map.get(e.category) || { category: e.category, count: 0, amount: 0 };
    prev.count += 1;
    prev.amount += e.amount;
    map.set(e.category, prev);
  }
  const rows = [...map.values()].map((r) => ({ ...r, amount: round2(r.amount) }));

  return {
    meta: buildMeta('expense-category', range),
    summary: { categoryCount: rows.length, totalAmount: round2(rows.reduce((s, r) => s + r.amount, 0)) },
    sections: [
      tableSection('Expense by Category', [
        { key: 'category', label: 'Category' },
        { key: 'count', label: 'Count' },
        { key: 'amount', label: 'Amount', format: 'currency' },
      ], rows),
    ],
  };
}

export async function generateExpenseTransactions(range) {
  const expenses = await fetchExpenses(range);
  const rows = expenses.map((e) => ({
    date: e.submittedAt,
    expenseNo: e.expenseNo,
    category: e.category,
    vendor: e.vendor,
    description: e.description,
    amount: round2(e.amount),
  }));

  return {
    meta: buildMeta('expense-transactions', range),
    summary: { count: rows.length, total: round2(rows.reduce((s, r) => s + r.amount, 0)) },
    sections: [
      tableSection('Expense Transactions', [
        { key: 'date', label: 'Date', format: 'date' },
        { key: 'expenseNo', label: 'Expense No' },
        { key: 'category', label: 'Category' },
        { key: 'vendor', label: 'Vendor' },
        { key: 'description', label: 'Description' },
        { key: 'amount', label: 'Amount', format: 'currency' },
      ], rows),
    ],
  };
}

export async function generateProfitLoss(range) {
  const [bills, purchases, expenses] = await Promise.all([
    fetchBills(range),
    fetchPurchases(range),
    fetchExpenses(range),
  ]);

  const revenue = round2(bills.reduce((s, b) => s + b.amount, 0));
  const cogs = round2(purchases.reduce((s, p) => s + p.taxableAmount, 0));
  const expenseTotal = round2(expenses.reduce((s, e) => s + e.amount, 0));
  const grossProfit = round2(revenue - cogs);
  const netProfit = round2(grossProfit - expenseTotal);

  return {
    meta: buildMeta('profit-loss', range),
    summary: { revenue, cogs, grossProfit, expenses: expenseTotal, netProfit },
    sections: [
      kvSection('Profit & Loss', [
        { label: 'Revenue (Sales Taxable)', value: revenue },
        { label: 'Cost of Goods (Purchases)', value: cogs },
        { label: 'Gross Profit', value: grossProfit },
        { label: 'Operating Expenses', value: expenseTotal },
        { label: 'Net Profit', value: netProfit },
      ]),
      {
        title: 'Note',
        type: 'note',
        text: 'P&L is computed from live Bills, Purchases, and Expenses. Full accrual accounting may require additional ledger entries.',
      },
    ],
  };
}

export async function generateBalanceSheet(range) {
  const ctx = getReportContext();
  if (ctx.dealerId) {
    const bills = await Bill.find({
      dealer: ctx.dealerId,
      status: { $in: ['SENT', 'DRAFT'] },
    }).lean();
    const receivables = round2(bills.reduce((s, b) => s + b.total, 0));
    return {
      meta: buildMeta('balance-sheet', range),
      summary: { receivables, note: 'Dealer-scoped receivables from unpaid bills' },
      sections: [
        kvSection('Dealer Receivables', [
          { label: 'Outstanding Bills', value: receivables },
        ]),
      ],
    };
  }

  const [bills, purchases, inventory] = await Promise.all([
    Bill.find({ status: { $in: ['SENT', 'DRAFT'] } }).lean(),
    Purchase.find({ status: 'RECEIVED', balanceAmount: { $gt: 0 } }).lean(),
    Inventory.find({ isDeleted: false }).lean(),
  ]);

  const receivables = round2(bills.reduce((s, b) => s + b.total, 0));
  const payables = round2(purchases.reduce((s, p) => s + p.balanceAmount, 0));
  const stockValue = round2(inventory.reduce((s, i) => s + i.quantity * i.unitPrice, 0));
  const totalAssets = round2(stockValue + receivables);
  const totalLiabilities = payables;
  const equity = round2(totalAssets - totalLiabilities);

  return {
    meta: buildMeta('balance-sheet', range),
    summary: { totalAssets, totalLiabilities, equity },
    sections: [
      kvSection('Assets', [
        { label: 'Inventory (Stock Value)', value: stockValue },
        { label: 'Receivables (Unpaid Bills)', value: receivables },
        { label: 'Total Assets', value: totalAssets },
      ]),
      kvSection('Liabilities & Equity', [
        { label: 'Payables (Purchase Balance)', value: payables },
        { label: 'Equity (Assets − Liabilities)', value: equity },
      ]),
      {
        title: 'Note',
        type: 'note',
        text: 'Balance sheet uses current stock valuation and outstanding bill/purchase balances from the database as of report generation time.',
      },
    ],
  };
}

export async function generateBillWiseProfit(range) {
  const bills = await fetchBills(range);
  const skus = [...new Set(bills.flatMap((b) => (b.lineItems || []).map((l) => l.sku)))];
  const inventory = await Inventory.find({ sku: { $in: skus }, isDeleted: false }).lean();
  const costMap = new Map(inventory.map((i) => [i.sku, i.unitPrice]));

  const rows = bills.map((b) => {
    let cost = 0;
    for (const line of b.lineItems || []) {
      const unitCost = costMap.get(line.sku);
      if (unitCost != null) cost += unitCost * line.quantity;
    }
    const revenue = round2(b.amount);
    const estimatedCost = round2(cost);
    return {
      billNo: b.billNo,
      date: b.createdAt,
      customer: b.customerName,
      revenue,
      estimatedCost,
      profit: round2(revenue - estimatedCost),
      marginPct: revenue > 0 ? round2(((revenue - estimatedCost) / revenue) * 100) : 0,
    };
  });

  return {
    meta: buildMeta('bill-wise-profit', range),
    summary: {
      billCount: rows.length,
      totalProfit: round2(rows.reduce((s, r) => s + r.profit, 0)),
    },
    sections: [
      tableSection('Bill Wise Profit', [
        { key: 'billNo', label: 'Bill' },
        { key: 'date', label: 'Date', format: 'date' },
        { key: 'customer', label: 'Customer' },
        { key: 'revenue', label: 'Revenue', format: 'currency' },
        { key: 'estimatedCost', label: 'Est. Cost', format: 'currency' },
        { key: 'profit', label: 'Profit', format: 'currency' },
        { key: 'marginPct', label: 'Margin %' },
      ], rows),
    ],
  };
}

export async function generateAuditTrail(range) {
  const logs = await AuditLog.find({
    createdAt: { $gte: range.from, $lte: range.to },
  }).sort({ createdAt: -1 }).limit(500).lean();

  const rows = logs.map((l) => ({
    date: l.createdAt,
    user: l.user,
    module: l.module,
    action: l.action,
    resourceId: l.resourceId || '—',
    ip: l.ip || '—',
  }));

  return {
    meta: buildMeta('audit-trail', range),
    summary: { logCount: rows.length },
    sections: [
      tableSection('Audit Trail', [
        { key: 'date', label: 'Date', format: 'datetime' },
        { key: 'user', label: 'User' },
        { key: 'module', label: 'Module' },
        { key: 'action', label: 'Action' },
        { key: 'resourceId', label: 'Resource' },
        { key: 'ip', label: 'IP' },
      ], rows),
    ],
  };
}

export async function generateStockValuation(range) {
  const ctx = getReportContext();
  if (ctx.dealerId) {
    return {
      meta: buildMeta('stock-valuation', range),
      summary: { skuCount: 0, totalQty: 0, totalValue: 0 },
      sections: [
        {
          title: 'Note',
          type: 'note',
          text: 'Stock valuation is available at company level. Dealers can view inventory from the Inventory module.',
        },
      ],
    };
  }

  const inventory = await Inventory.find({ isDeleted: false }).populate('warehouse', 'name code').lean();
  const rows = inventory.map((i) => ({
    sku: i.sku,
    name: i.name,
    warehouse: i.warehouse?.name || i.warehouse?.code || '—',
    quantity: i.quantity,
    unitPrice: round2(i.unitPrice),
    value: round2(i.quantity * i.unitPrice),
    status: i.status,
  }));

  return {
    meta: buildMeta('stock-valuation', range),
    summary: {
      skuCount: rows.length,
      totalQty: rows.reduce((s, r) => s + r.quantity, 0),
      totalValue: round2(rows.reduce((s, r) => s + r.value, 0)),
    },
    sections: [
      kvSection('Stock Summary', [
        { label: 'SKUs', value: rows.length },
        { label: 'Total Quantity', value: rows.reduce((s, r) => s + r.quantity, 0) },
        { label: 'Total Value', value: round2(rows.reduce((s, r) => s + r.value, 0)) },
      ]),
      tableSection('Stock Valuation', [
        { key: 'sku', label: 'SKU' },
        { key: 'name', label: 'Item' },
        { key: 'warehouse', label: 'Warehouse' },
        { key: 'quantity', label: 'Qty' },
        { key: 'unitPrice', label: 'Unit Price', format: 'currency' },
        { key: 'value', label: 'Value', format: 'currency' },
        { key: 'status', label: 'Status' },
      ], rows),
    ],
  };
}

export const GENERATORS = {
  'sales-summary': generateSalesSummary,
  'purchase-summary': generatePurchaseSummary,
  'gstr-1': generateGstr1,
  'gstr-2': generateGstr2,
  'gstr-3b': generateGstr3b,
  'gst-sales-hsn': generateGstSalesHsn,
  'gst-purchase-hsn': generateGstPurchaseHsn,
  'hsn-sales-summary': generateHsnSalesSummary,
  'daybook': generateDaybook,
  'cash-bank': generateCashBank,
  'expense-category': generateExpenseCategory,
  'expense-transactions': generateExpenseTransactions,
  'profit-loss': generateProfitLoss,
  'balance-sheet': generateBalanceSheet,
  'bill-wise-profit': generateBillWiseProfit,
  'audit-trail': generateAuditTrail,
  'stock-valuation': generateStockValuation,
  'tds-payable': (range) => Promise.resolve(emptyTdsReport('tds-payable', 'TDS Payable', range)),
  'tds-receivable': (range) => Promise.resolve(emptyTdsReport('tds-receivable', 'TDS Receivable', range)),
  'tcs-payable': (range) => Promise.resolve(emptyTdsReport('tcs-payable', 'TCS Payable', range)),
  'tcs-receivable': (range) => Promise.resolve(emptyTdsReport('tcs-receivable', 'TCS Receivable', range)),
};
