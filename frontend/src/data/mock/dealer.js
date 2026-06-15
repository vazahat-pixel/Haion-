const now = new Date();
const daysAgo = (n) => new Date(now.getTime() - n * 86400000).toISOString();

export const MOCK_DEALER_CUSTOMERS = [
  { id: 'dc1', code: 'CUS-1042', name: 'Rajesh Singh', phone: '9876543210', email: 'rajesh@example.com', city: 'Jaipur', gstin: '08AABCR1234A1Z5', totalPurchases: 285600, status: 'ACTIVE', lastOrderAt: daysAgo(15) },
  { id: 'dc2', code: 'CUS-1043', name: 'Meera Patel', phone: '9876543211', email: 'meera@example.com', city: 'Ahmedabad', gstin: '24AABCP5678B1Z2', totalPurchases: 156200, status: 'ACTIVE', lastOrderAt: daysAgo(3) },
  { id: 'dc3', code: 'CUS-1044', name: 'Vikram Das', phone: '9876543212', email: 'vikram@example.com', city: 'Lucknow', gstin: '09AABCV9012C1Z8', totalPurchases: 89400, status: 'ACTIVE', lastOrderAt: daysAgo(30) },
  { id: 'dc4', code: 'CUS-1045', name: 'Anita Sharma', phone: '9876543213', email: 'anita@example.com', city: 'Delhi', gstin: '', totalPurchases: 42000, status: 'INACTIVE', lastOrderAt: daysAgo(90) },
];

export const MOCK_DEALER_DISPATCHES = [
  { id: 'dd1', dispatchNo: 'DSP-2024-1042', warehouse: 'WH-BLR', items: 24, status: 'IN_TRANSIT', eta: daysAgo(-1), createdAt: daysAgo(2), trackingNo: 'BD7829104' },
  { id: 'dd2', dispatchNo: 'DSP-2024-1038', warehouse: 'WH-MUM', items: 12, status: 'DELIVERED', eta: daysAgo(1), createdAt: daysAgo(6), trackingNo: 'BD7829088' },
  { id: 'dd3', dispatchNo: 'DSP-2024-1045', warehouse: 'WH-DEL', items: 8, status: 'PACKED', eta: daysAgo(-2), createdAt: daysAgo(0), trackingNo: 'BD7829112' },
];

export const MOCK_DEALER_GRN = [
  { id: 'dg1', grnNo: 'GRN-DLR-045', dispatchNo: 'DSP-2024-1038', items: 12, received: 12, status: 'VERIFIED', receivedAt: daysAgo(1) },
  { id: 'dg2', grnNo: 'GRN-DLR-046', dispatchNo: 'DSP-2024-1042', items: 24, received: 0, status: 'PENDING', receivedAt: daysAgo(0) },
];

export const MOCK_BILL_DETAILS = {
  b1: {
    lineItems: [
      { sku: 'SKU-001', product: 'Industrial Motor 5HP', hsn: '8501', quantity: 3, unitPrice: 28500, gstRate: 18, amount: 85500 },
      { sku: 'SKU-004', product: 'Conveyor Belt 10m', hsn: '4010', quantity: 5, unitPrice: 12400, gstRate: 12, amount: 62000 },
    ],
    cgst: 13104, sgst: 13104, igst: 0,
    customerGstin: '08AABCR1234A1Z5',
    notes: 'Delivery within 5 business days',
  },
  b2: {
    lineItems: [
      { sku: 'SKU-002', product: 'Control Panel XL', hsn: '8537', quantity: 2, unitPrice: 45200, gstRate: 18, amount: 90400 },
    ],
    cgst: 8136, sgst: 8136, igst: 0,
    customerGstin: '24AABCP5678B1Z2',
  },
  b3: {
    lineItems: [
      { sku: 'SKU-003', product: 'Hydraulic Pump', hsn: '8413', quantity: 2, unitPrice: 18900, gstRate: 18, amount: 37800 },
    ],
    cgst: 3402, sgst: 3402, igst: 0,
    customerGstin: '09AABCV9012C1Z8',
  },
};

export const MOCK_INVOICE_DETAILS = {
  inv1: {
    lineItems: MOCK_BILL_DETAILS.b1.lineItems,
    cgst: 13104, sgst: 13104, igst: 0,
    customerGstin: '08AABCR1234A1Z5',
    dealerGstin: '08AABCS1429B1Z5',
    dealerName: 'Sharma Motors',
    dealerAddress: '12 Industrial Area, Jaipur, Rajasthan 302001',
  },
  inv2: {
    lineItems: MOCK_BILL_DETAILS.b2.lineItems,
    cgst: 8136, sgst: 8136, igst: 0,
    customerGstin: '24AABCP5678B1Z2',
    dealerGstin: '08AABCS1429B1Z5',
    dealerName: 'Sharma Motors',
    dealerAddress: '12 Industrial Area, Jaipur, Rajasthan 302001',
  },
};

export const MOCK_DEALER_REPORTS = [
  { id: 'dr1', title: 'Monthly Sales Summary - May', type: 'Sales', period: 'May 2024', revenue: 892000, bills: 45, status: 'COMPLETED', createdAt: daysAgo(5) },
  { id: 'dr2', title: 'Customer Acquisition Report', type: 'Customers', period: 'Q2 2024', revenue: 0, bills: 8, status: 'COMPLETED', createdAt: daysAgo(12) },
  { id: 'dr3', title: 'Inventory Turnover', type: 'Inventory', period: 'May 2024', revenue: 0, bills: 0, status: 'IN_PROGRESS', createdAt: daysAgo(2) },
];

export const BILLING_PRODUCTS = [
  { sku: 'SKU-001', name: 'Industrial Motor 5HP', unitPrice: 28500, hsn: '8501', gstRate: 18 },
  { sku: 'SKU-002', name: 'Control Panel XL', unitPrice: 45200, hsn: '8537', gstRate: 18 },
  { sku: 'SKU-003', name: 'Hydraulic Pump', unitPrice: 18900, hsn: '8413', gstRate: 18 },
  { sku: 'SKU-004', name: 'Conveyor Belt 10m', unitPrice: 12400, hsn: '4010', gstRate: 12 },
];
