const now = new Date();
const daysAgo = (n) => new Date(now.getTime() - n * 86400000).toISOString();

export const MOCK_CATEGORIES = [
  { id: 'cat1', code: 'CAT-MOT', name: 'Motors', description: 'Industrial motors and drives', productCount: 24, status: 'ACTIVE', updatedAt: daysAgo(2) },
  { id: 'cat2', code: 'CAT-ELC', name: 'Electronics', description: 'Control panels and electronics', productCount: 18, status: 'ACTIVE', updatedAt: daysAgo(5) },
  { id: 'cat3', code: 'CAT-PMP', name: 'Pumps', description: 'Hydraulic and water pumps', productCount: 12, status: 'ACTIVE', updatedAt: daysAgo(8) },
  { id: 'cat4', code: 'CAT-ACC', name: 'Accessories', description: 'Belts, bearings, consumables', productCount: 45, status: 'ACTIVE', updatedAt: daysAgo(1) },
];

export const MOCK_BRANDS = [
  { id: 'br1', code: 'BRD-HAI', name: 'Haion', country: 'India', productCount: 56, status: 'ACTIVE', website: 'haion.com', updatedAt: daysAgo(3) },
  { id: 'br2', code: 'BRD-BOS', name: 'Bosch', country: 'Germany', productCount: 22, status: 'ACTIVE', website: 'bosch.com', updatedAt: daysAgo(10) },
  { id: 'br3', code: 'BRD-TAT', name: 'Tata', country: 'India', productCount: 15, status: 'ACTIVE', website: 'tata.com', updatedAt: daysAgo(15) },
  { id: 'br4', code: 'BRD-ABB', name: 'ABB', country: 'Switzerland', productCount: 8, status: 'INACTIVE', website: 'abb.com', updatedAt: daysAgo(30) },
];

export const MOCK_PRODUCTS = [
  { id: 'p1', sku: 'SKU-001', name: 'Industrial Motor 5HP', category: 'Motors', brand: 'Haion', hsn: '8501', mrp: 32000, dealerPrice: 28500, status: 'ACTIVE', stockTotal: 145, updatedAt: daysAgo(1) },
  { id: 'p2', sku: 'SKU-002', name: 'Control Panel XL', category: 'Electronics', brand: 'Bosch', hsn: '8537', mrp: 52000, dealerPrice: 45200, status: 'ACTIVE', stockTotal: 12, updatedAt: daysAgo(2) },
  { id: 'p3', sku: 'SKU-003', name: 'Hydraulic Pump', category: 'Pumps', brand: 'Haion', hsn: '8413', mrp: 22000, dealerPrice: 18900, status: 'ACTIVE', stockTotal: 0, updatedAt: daysAgo(4) },
  { id: 'p4', sku: 'SKU-004', name: 'Conveyor Belt 10m', category: 'Accessories', brand: 'Tata', hsn: '4010', mrp: 15000, dealerPrice: 12400, status: 'ACTIVE', stockTotal: 67, updatedAt: daysAgo(1) },
  { id: 'p5', sku: 'SKU-005', name: 'Servo Drive 3kW', category: 'Electronics', brand: 'ABB', hsn: '8504', mrp: 68000, dealerPrice: 59500, status: 'DRAFT', stockTotal: 0, updatedAt: daysAgo(0) },
];

export const MOCK_PRODUCT_TIERS = [
  { id: 't1', productId: 'p1', productName: 'Industrial Motor 5HP', tier: 'Standard', minQty: 1, maxQty: 10, discount: 0, price: 28500, status: 'ACTIVE' },
  { id: 't2', productId: 'p1', productName: 'Industrial Motor 5HP', tier: 'Bulk', minQty: 11, maxQty: 50, discount: 8, price: 26220, status: 'ACTIVE' },
  { id: 't3', productId: 'p2', productName: 'Control Panel XL', tier: 'Standard', minQty: 1, maxQty: 5, discount: 0, price: 45200, status: 'ACTIVE' },
  { id: 't4', productId: 'p2', productName: 'Control Panel XL', tier: 'Enterprise', minQty: 6, maxQty: 100, discount: 12, price: 39776, status: 'ACTIVE' },
];

export const MOCK_PRICING = [
  { id: 'pr1', product: 'Industrial Motor 5HP', sku: 'SKU-001', region: 'North', dealerTier: 'Gold', basePrice: 28500, effectivePrice: 27175, gst: 18, validFrom: daysAgo(30), validTo: daysAgo(-335), status: 'ACTIVE' },
  { id: 'pr2', product: 'Control Panel XL', sku: 'SKU-002', region: 'West', dealerTier: 'Silver', basePrice: 45200, effectivePrice: 42940, gst: 18, validFrom: daysAgo(15), validTo: daysAgo(-350), status: 'ACTIVE' },
  { id: 'pr3', product: 'Hydraulic Pump', sku: 'SKU-003', region: 'South', dealerTier: 'Gold', basePrice: 18900, effectivePrice: 17955, gst: 18, validFrom: daysAgo(7), validTo: daysAgo(-358), status: 'ACTIVE' },
  { id: 'pr4', product: 'Conveyor Belt 10m', sku: 'SKU-004', region: 'East', dealerTier: 'Bronze', basePrice: 12400, effectivePrice: 12400, gst: 12, validFrom: daysAgo(60), validTo: daysAgo(-305), status: 'EXPIRED' },
];

export const MOCK_EXPENSES = [
  { id: 'ex1', expenseNo: 'EXP-2024-0891', category: 'Logistics', description: 'Mumbai warehouse freight charges', amount: 45600, vendor: 'BlueDart Logistics', status: 'APPROVED', submittedBy: 'Ravi Kumar', submittedAt: daysAgo(5) },
  { id: 'ex2', expenseNo: 'EXP-2024-0892', category: 'Travel', description: 'Dealer visit - Jaipur region', amount: 12800, vendor: '—', status: 'PENDING', submittedBy: 'Sneha Reddy', submittedAt: daysAgo(1) },
  { id: 'ex3', expenseNo: 'EXP-2024-0893', category: 'Marketing', description: 'Q2 trade show booth', amount: 185000, vendor: 'Expo Events Pvt Ltd', status: 'APPROVED', submittedBy: 'Amit Verma', submittedAt: daysAgo(12) },
  { id: 'ex4', expenseNo: 'EXP-2024-0894', category: 'Operations', description: 'Warehouse equipment maintenance', amount: 34200, vendor: 'TechServe India', status: 'REJECTED', submittedBy: 'Ravi Kumar', submittedAt: daysAgo(8) },
];

export const MOCK_NOTIFICATIONS = [
  { id: 'n1', title: 'Low stock alert', message: 'Control Panel XL below reorder level at WH-MUM', type: 'INVENTORY', read: false, createdAt: daysAgo(0) },
  { id: 'n2', title: 'GRN pending verification', message: 'GRN-2024-088 requires warehouse manager approval', type: 'GRN', read: false, createdAt: daysAgo(0) },
  { id: 'n3', title: 'Expense approved', message: 'EXP-2024-0891 logistics expense approved', type: 'EXPENSE', read: true, createdAt: daysAgo(1) },
  { id: 'n4', title: 'SLA breach warning', message: 'Ticket CMP-2024-1199 approaching SLA deadline', type: 'SERVICE', read: false, createdAt: daysAgo(1) },
  { id: 'n5', title: 'New dealer onboarding', message: 'Kumar Traders submitted onboarding documents', type: 'DEALER', read: true, createdAt: daysAgo(2) },
];

export const MOCK_DISPATCH_TIMELINE = {
  d1: [
    { id: 'dt1', title: 'Dispatch created', description: '24 items packed at WH-BLR', timestamp: daysAgo(2), variant: 'success' },
    { id: 'dt2', title: 'In transit', description: 'Handed to BlueDart · Tracking BD7829104', timestamp: daysAgo(1) },
    { id: 'dt3', title: 'Out for delivery', description: 'Expected at Sharma Motors, Jaipur', timestamp: daysAgo(0), variant: 'warning' },
  ],
  d2: [
    { id: 'dt4', title: 'Dispatch created', timestamp: daysAgo(5), variant: 'success' },
    { id: 'dt5', title: 'Delivered', description: 'Received by Patel Industries', timestamp: daysAgo(1), variant: 'success' },
  ],
};

export const MOCK_GRN_LINE_ITEMS = [
  { sku: 'SKU-001', name: 'Industrial Motor 5HP', ordered: 10, received: 10, unitPrice: 28500 },
  { sku: 'SKU-004', name: 'Conveyor Belt 10m', ordered: 5, received: 5, unitPrice: 12400 },
];
