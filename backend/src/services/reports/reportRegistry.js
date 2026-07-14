export const REPORT_CATEGORIES = {
  FAVOURITE: 'Favourite',
  GST: 'GST',
  TRANSACTION: 'Transaction',
  INVENTORY: 'Inventory',
};

/** Reports dealers may generate (scoped to their bills). */
export const DEALER_REPORT_CODES = new Set([
  'sales-summary',
  'gstr-1',
  'gst-sales-hsn',
  'hsn-sales-summary',
  'bill-wise-profit',
  'cash-bank',
  'balance-sheet',
]);

export const REPORT_REGISTRY = [
  { code: 'balance-sheet', title: 'Balance Sheet', category: REPORT_CATEGORIES.FAVOURITE, favourite: true, scope: 'both' },
  { code: 'gstr-1', title: 'GSTR-1 (Sales)', category: REPORT_CATEGORIES.FAVOURITE, favourite: true, scope: 'both' },
  { code: 'profit-loss', title: 'Profit And Loss Report', category: REPORT_CATEGORIES.FAVOURITE, favourite: true, scope: 'admin' },
  { code: 'sales-summary', title: 'Sales Summary', category: REPORT_CATEGORIES.FAVOURITE, favourite: true, scope: 'both' },
  { code: 'gstr-2', title: 'GSTR-2 (Purchase)', category: REPORT_CATEGORIES.GST, scope: 'admin' },
  { code: 'gstr-3b', title: 'GSTR-3B', category: REPORT_CATEGORIES.GST, scope: 'admin' },
  { code: 'gst-purchase-hsn', title: 'GST Purchase (With HSN)', category: REPORT_CATEGORIES.GST, scope: 'admin' },
  { code: 'gst-sales-hsn', title: 'GST Sales (With HSN)', category: REPORT_CATEGORIES.GST, scope: 'both' },
  { code: 'hsn-sales-summary', title: 'HSN Wise Sales Summary', category: REPORT_CATEGORIES.GST, scope: 'both' },
  { code: 'tds-payable', title: 'TDS Payable', category: REPORT_CATEGORIES.GST, scope: 'admin' },
  { code: 'tds-receivable', title: 'TDS Receivable', category: REPORT_CATEGORIES.GST, scope: 'admin' },
  { code: 'tcs-payable', title: 'TCS Payable', category: REPORT_CATEGORIES.GST, scope: 'admin' },
  { code: 'tcs-receivable', title: 'TCS Receivable', category: REPORT_CATEGORIES.GST, scope: 'admin' },
  { code: 'audit-trail', title: 'Audit Trail', category: REPORT_CATEGORIES.TRANSACTION, scope: 'admin' },
  { code: 'bill-wise-profit', title: 'Bill Wise Profit', category: REPORT_CATEGORIES.TRANSACTION, scope: 'both' },
  { code: 'cash-bank', title: 'Cash and Bank Report (All Payments)', category: REPORT_CATEGORIES.TRANSACTION, scope: 'both' },
  { code: 'daybook', title: 'Daybook', category: REPORT_CATEGORIES.TRANSACTION, scope: 'admin' },
  { code: 'expense-category', title: 'Expense Category Report', category: REPORT_CATEGORIES.TRANSACTION, scope: 'admin' },
  { code: 'expense-transactions', title: 'Expense Transaction Report', category: REPORT_CATEGORIES.TRANSACTION, scope: 'admin' },
  { code: 'purchase-summary', title: 'Purchase Summary', category: REPORT_CATEGORIES.TRANSACTION, scope: 'admin' },
  { code: 'stock-valuation', title: 'Stock Valuation Report', category: REPORT_CATEGORIES.INVENTORY, scope: 'admin' },
];

export function getReportDefinition(code) {
  return REPORT_REGISTRY.find((r) => r.code === code) || null;
}

export function getCatalogForUser({ dealerId } = {}) {
  if (dealerId) {
    return REPORT_REGISTRY.filter((r) => DEALER_REPORT_CODES.has(r.code));
  }
  return REPORT_REGISTRY;
}

export function getCatalogCategories(reports) {
  return [...new Set(reports.map((r) => r.category))];
}
