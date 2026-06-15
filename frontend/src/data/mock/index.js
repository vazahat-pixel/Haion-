const now = new Date();
const daysAgo = (n) => new Date(now.getTime() - n * 86400000).toISOString();

export const MOCK_WAREHOUSES = [
  { id: 'wh1', code: 'WH-BLR', name: 'Bangalore Central', city: 'Bengaluru', state: 'Karnataka', capacity: 5000, stockCount: 3240, status: 'ACTIVE', manager: 'Ravi Kumar', updatedAt: daysAgo(1) },
  { id: 'wh2', code: 'WH-MUM', name: 'Mumbai Hub', city: 'Mumbai', state: 'Maharashtra', capacity: 8000, stockCount: 6100, status: 'ACTIVE', manager: 'Priya Shah', updatedAt: daysAgo(3) },
  { id: 'wh3', code: 'WH-DEL', name: 'Delhi NCR', city: 'Gurugram', state: 'Haryana', capacity: 4500, stockCount: 2890, status: 'ACTIVE', manager: 'Amit Verma', updatedAt: daysAgo(5) },
];

export const MOCK_INVENTORY = [
  { id: '1', sku: 'SKU-001', name: 'Industrial Motor 5HP', category: 'Motors', quantity: 145, unitPrice: 28500, status: 'IN_STOCK', warehouse: 'WH-BLR', hsn: '8501', updatedAt: daysAgo(1) },
  { id: '2', sku: 'SKU-002', name: 'Control Panel XL', category: 'Electronics', quantity: 12, unitPrice: 45200, status: 'LOW_STOCK', warehouse: 'WH-MUM', hsn: '8537', updatedAt: daysAgo(2) },
  { id: '3', sku: 'SKU-003', name: 'Hydraulic Pump', category: 'Pumps', quantity: 0, unitPrice: 18900, status: 'OUT_OF_STOCK', warehouse: 'WH-DEL', hsn: '8413', updatedAt: daysAgo(4) },
  { id: '4', sku: 'SKU-004', name: 'Conveyor Belt 10m', category: 'Accessories', quantity: 67, unitPrice: 12400, status: 'IN_STOCK', warehouse: 'WH-BLR', hsn: '4010', updatedAt: daysAgo(1) },
];

export const MOCK_DISPATCH = [
  { id: 'd1', dispatchNo: 'DSP-2024-1042', dealer: 'Sharma Motors', warehouse: 'WH-BLR', items: 24, status: 'IN_TRANSIT', createdAt: daysAgo(2), eta: daysAgo(-1) },
  { id: 'd2', dispatchNo: 'DSP-2024-1041', dealer: 'Patel Industries', warehouse: 'WH-MUM', items: 12, status: 'DELIVERED', createdAt: daysAgo(5), eta: daysAgo(1) },
  { id: 'd3', dispatchNo: 'DSP-2024-1040', dealer: 'Kumar Traders', warehouse: 'WH-DEL', items: 8, status: 'PACKED', createdAt: daysAgo(1), eta: daysAgo(-2) },
];

export const MOCK_GRN = [
  { id: 'g1', grnNo: 'GRN-2024-089', warehouse: 'WH-BLR', supplier: 'Tata Components', items: 15, status: 'VERIFIED', receivedAt: daysAgo(3) },
  { id: 'g2', grnNo: 'GRN-2024-088', warehouse: 'WH-MUM', supplier: 'Bosch India', items: 8, status: 'PENDING_VERIFICATION', receivedAt: daysAgo(1) },
];

export const MOCK_DEALERS = [
  { id: 'dl1', code: 'DLR-001', name: 'Sharma Motors', city: 'Jaipur', state: 'Rajasthan', gstin: '08AABCS1429B1Z5', status: 'ACTIVE', creditLimit: 500000, outstanding: 125000, teamSize: 8, onboardedAt: daysAgo(180) },
  { id: 'dl2', code: 'DLR-002', name: 'Patel Industries', city: 'Ahmedabad', state: 'Gujarat', gstin: '24AABCP1234C1Z8', status: 'ACTIVE', creditLimit: 750000, outstanding: 89000, teamSize: 12, onboardedAt: daysAgo(365) },
  { id: 'dl3', code: 'DLR-003', name: 'Kumar Traders', city: 'Lucknow', state: 'Uttar Pradesh', gstin: '09AABCK5678D1Z2', status: 'PENDING_ONBOARDING', creditLimit: 300000, outstanding: 0, teamSize: 3, onboardedAt: daysAgo(5) },
];

export const MOCK_EMPLOYEES = [
  { id: 'e1', empId: 'EMP-101', name: 'Ravi Kumar', department: 'Warehouse', role: 'WAREHOUSE_MANAGER', email: 'ravi@haion.com', phone: '9876543210', status: 'ACTIVE', joinedAt: daysAgo(400) },
  { id: 'e2', empId: 'EMP-102', name: 'Sneha Reddy', department: 'Sales', role: 'DEALER_SALES', email: 'sneha@haion.com', phone: '9876543211', status: 'ACTIVE', joinedAt: daysAgo(200) },
  { id: 'e3', empId: 'EMP-103', name: 'Arjun Mehta', department: 'Support', role: 'CUSTOMER_SUPPORT', email: 'arjun@haion.com', phone: '9876543212', status: 'ACTIVE', joinedAt: daysAgo(150) },
];

export const MOCK_BILLING = [
  { id: 'b1', billNo: 'BILL-2024-0892', customer: 'Sharma Motors', amount: 145600, tax: 26208, total: 171808, status: 'PAID', dueDate: daysAgo(10), createdAt: daysAgo(15) },
  { id: 'b2', billNo: 'BILL-2024-0893', customer: 'Patel Industries', amount: 89200, tax: 16056, total: 105256, status: 'SENT', dueDate: daysAgo(-7), createdAt: daysAgo(3) },
  { id: 'b3', billNo: 'BILL-2024-0894', customer: 'Kumar Traders', amount: 45600, tax: 8208, total: 53808, status: 'DRAFT', dueDate: daysAgo(-15), createdAt: daysAgo(1) },
];

export const MOCK_INVOICES = [
  { id: 'inv1', invoiceNo: 'INV-2024-4521', billNo: 'BILL-2024-0892', customer: 'Sharma Motors', amount: 171808, status: 'PAID', issuedAt: daysAgo(15) },
  { id: 'inv2', invoiceNo: 'INV-2024-4522', billNo: 'BILL-2024-0893', customer: 'Patel Industries', amount: 105256, status: 'SENT', issuedAt: daysAgo(3) },
];

export const MOCK_COMPLAINTS = [
  { id: 'c1', ticketNo: 'CMP-2024-1201', customer: 'Rajesh Singh', product: 'Industrial Motor 5HP', priority: 'HIGH', status: 'OPEN', assignedTo: 'Arjun Mehta', createdAt: daysAgo(1) },
  { id: 'c2', ticketNo: 'CMP-2024-1200', customer: 'Meera Patel', product: 'Control Panel XL', priority: 'MEDIUM', status: 'IN_PROGRESS', assignedTo: 'Arjun Mehta', createdAt: daysAgo(3) },
  { id: 'c3', ticketNo: 'CMP-2024-1199', customer: 'Vikram Das', product: 'Hydraulic Pump', priority: 'CRITICAL', status: 'ESCALATED', assignedTo: 'Sneha Reddy', createdAt: daysAgo(5) },
];

export const MOCK_WARRANTY = [
  { id: 'w1', serialNo: 'SN-MOT-45821', product: 'Industrial Motor 5HP', customer: 'Rajesh Singh', billNo: 'BILL-2024-0892', status: 'ACTIVE', startDate: daysAgo(60), endDate: daysAgo(-305) },
  { id: 'w2', serialNo: 'SN-CP-78234', product: 'Control Panel XL', customer: 'Meera Patel', billNo: 'BILL-2024-0893', status: 'ACTIVE', startDate: daysAgo(30), endDate: daysAgo(-335) },
  { id: 'w3', serialNo: 'SN-PMP-12987', product: 'Hydraulic Pump', customer: 'Vikram Das', billNo: 'BILL-2024-0880', status: 'EXPIRED', startDate: daysAgo(400), endDate: daysAgo(35) },
];

export const MOCK_SPARES = [
  { id: 'sp1', requestNo: 'SPR-2024-045', partName: 'Motor Bearing 6205', quantity: 4, status: 'APPROVED', requestedBy: 'Service Center BLR', createdAt: daysAgo(2) },
  { id: 'sp2', requestNo: 'SPR-2024-044', partName: 'Control Relay 24V', quantity: 10, status: 'PENDING', requestedBy: 'Service Center MUM', createdAt: daysAgo(4) },
];

export const MOCK_RETURNS = [
  { id: 'r1', returnNo: 'RET-2024-078', product: 'Hydraulic Pump', serialNo: 'SN-PMP-12987', reason: 'Manufacturing defect', status: 'INSPECTED', receivedAt: daysAgo(7) },
  { id: 'r2', returnNo: 'RET-2024-077', product: 'Control Panel XL', serialNo: 'SN-CP-78234', reason: 'Wrong specification', status: 'REQUESTED', receivedAt: daysAgo(2) },
];

export const MOCK_TASKS = [
  { id: 't1', title: 'Verify GRN-2024-088', assignee: 'Ravi Kumar', priority: 'HIGH', status: 'PENDING', dueDate: daysAgo(-1), createdAt: daysAgo(2) },
  { id: 't2', title: 'Dealer onboarding review - Kumar Traders', assignee: 'Sneha Reddy', priority: 'MEDIUM', status: 'IN_PROGRESS', dueDate: daysAgo(-3), createdAt: daysAgo(5) },
  { id: 't3', title: 'Monthly inventory audit', assignee: 'Ravi Kumar', priority: 'LOW', status: 'COMPLETED', dueDate: daysAgo(5), createdAt: daysAgo(10) },
];

export const MOCK_APPROVALS = [
  { id: 'a1', type: 'Credit Limit Increase', requester: 'Sharma Motors', amount: 200000, status: 'PENDING', submittedAt: daysAgo(1) },
  { id: 'a2', type: 'Expense Claim', requester: 'Sneha Reddy', amount: 12500, status: 'APPROVED', submittedAt: daysAgo(4) },
  { id: 'a3', type: 'Discount Override', requester: 'Patel Industries', amount: 45000, status: 'REJECTED', submittedAt: daysAgo(7) },
];

export const MOCK_REPORTS = [
  { id: 'rp1', title: 'Q4 Sales Summary', type: 'Sales', author: 'Sneha Reddy', status: 'COMPLETED', createdAt: daysAgo(10) },
  { id: 'rp2', title: 'Warehouse Utilization', type: 'Operations', author: 'Ravi Kumar', status: 'IN_PROGRESS', createdAt: daysAgo(3) },
];

export const MOCK_ORDERS = [
  { id: 'o1', orderNo: 'ORD-2024-3341', items: 3, total: 89500, status: 'IN_TRANSIT', placedAt: daysAgo(5), eta: daysAgo(-2) },
  { id: 'o2', orderNo: 'ORD-2024-3340', items: 1, total: 28500, status: 'DELIVERED', placedAt: daysAgo(15), eta: daysAgo(8) },
];

export const MOCK_SERVICE_REQUESTS = [
  { id: 'sr1', requestNo: 'SR-2024-0891', product: 'Industrial Motor 5HP', issue: 'Unusual noise during operation', status: 'IN_PROGRESS', createdAt: daysAgo(3) },
  { id: 'sr2', requestNo: 'SR-2024-0890', product: 'Control Panel XL', issue: 'Display not responding', status: 'OPEN', createdAt: daysAgo(1) },
];

export const MOCK_AUDIT = [
  { id: 'al1', action: 'LOGIN', user: 'admin@haion.com', module: 'Auth', ip: '192.168.1.10', timestamp: daysAgo(0) },
  { id: 'al2', action: 'CREATE', user: 'ravi@haion.com', module: 'GRN', ip: '192.168.1.25', timestamp: daysAgo(1) },
  { id: 'al3', action: 'UPDATE', user: 'sneha@haion.com', module: 'Billing', ip: '192.168.1.30', timestamp: daysAgo(2) },
];

export const MOCK_DEALER_INVENTORY = [
  { id: 'di1', sku: 'SKU-001', name: 'Industrial Motor 5HP', quantity: 24, reorderLevel: 10, status: 'IN_STOCK' },
  { id: 'di2', sku: 'SKU-002', name: 'Control Panel XL', quantity: 5, reorderLevel: 8, status: 'LOW_STOCK' },
];

export const MOCK_TEAM = [
  { id: 'tm1', name: 'Amit Sharma', role: 'Sales Executive', target: 500000, achieved: 425000, status: 'ACTIVE' },
  { id: 'tm2', name: 'Kavita Joshi', role: 'Sales Executive', target: 450000, achieved: 478000, status: 'ACTIVE' },
];

export const MOCK_KPIS = {
  admin: { revenue: 2450000, dealers: 128, complaints: 23, orders: 1847, lowStock: 14, pendingGrn: 6, pendingDispatch: 9 },
  dealer: { sales: 892000, bills: 45, outstanding: 125000, team: 8, pendingGrn: 2, dispatches: 3 },
  employee: { tasks: 12, approvals: 5, reports: 3, team: 6, dealers: 18, greenZone: 14, redZone: 4 },
  service: { openComplaints: 18, spareRequests: 7, returns: 4, tickets: 32, slaBreaches: 3, pendingParts: 5 },
  customer: { orders: 5, warranties: 3, serviceRequests: 2, spent: 156000 },
};

export const MOCK_ACTIVITIES = {
  admin: [
    { id: 'act1', title: 'GRN-2024-088 pending verification', description: 'WH-MUM · Bosch India', timestamp: daysAgo(0), variant: 'warning' },
    { id: 'act2', title: 'Dispatch DSP-2024-1042 in transit', description: 'Sharma Motors · 24 items', timestamp: daysAgo(0) },
    { id: 'act3', title: 'Low stock alert: Control Panel XL', description: 'WH-MUM · 12 units remaining', timestamp: daysAgo(1), variant: 'danger' },
    { id: 'act4', title: 'Dealer onboarding submitted', description: 'Kumar Traders · Lucknow', timestamp: daysAgo(1) },
    { id: 'act5', title: 'Expense claim approved', description: 'Sneha Reddy · ₹12,500', timestamp: daysAgo(2), variant: 'success' },
    { id: 'act6', title: 'Ticket CMP-2024-1201 escalated', description: 'Critical priority · Motor defect', timestamp: daysAgo(2), variant: 'danger' },
  ],
  dealer: [
    { id: 'dact1', title: 'Invoice BILL-2024-0893 sent', description: 'Patel Industries · ₹1,05,256', timestamp: daysAgo(0) },
    { id: 'dact2', title: 'Dispatch arriving tomorrow', description: 'DSP-2024-1042 · 24 items', timestamp: daysAgo(0), variant: 'success' },
    { id: 'dact3', title: 'GRN verification required', description: 'GRN-2024-088 · 8 items', timestamp: daysAgo(1), variant: 'warning' },
    { id: 'dact4', title: 'New customer registered', description: 'Vikram Das · Lucknow', timestamp: daysAgo(2) },
  ],
  employee: [
    { id: 'eact1', title: 'Task due today: Verify GRN-2024-088', description: 'Assigned to Ravi Kumar', timestamp: daysAgo(0), variant: 'warning' },
    { id: 'eact2', title: 'Sharma Motors in green zone', description: 'Target achieved 112%', timestamp: daysAgo(0), variant: 'success' },
    { id: 'eact3', title: 'Kumar Traders flagged red', description: 'Below target · 68% achieved', timestamp: daysAgo(1), variant: 'danger' },
    { id: 'eact4', title: 'Approval pending: Credit limit', description: 'Sharma Motors · ₹2,00,000', timestamp: daysAgo(1) },
  ],
  service: [
    { id: 'sact1', title: 'SLA breach: CMP-2024-1199', description: 'Hydraulic Pump · 48h overdue', timestamp: daysAgo(0), variant: 'danger' },
    { id: 'sact2', title: 'Spare request approved', description: 'Motor Bearing 6205 × 4', timestamp: daysAgo(0), variant: 'success' },
    { id: 'sact3', title: 'New complaint registered', description: 'Rajesh Singh · Motor noise', timestamp: daysAgo(1) },
    { id: 'sact4', title: 'Defective return inspected', description: 'RET-2024-078 · Hydraulic Pump', timestamp: daysAgo(2) },
  ],
  customer: [
    { id: 'cact1', title: 'Warranty active until Mar 2026', description: 'Industrial Motor 5HP · SN-MOT-45821', timestamp: daysAgo(0), variant: 'success' },
    { id: 'cact2', title: 'Service request in progress', description: 'SR-2024-0891 · Unusual noise', timestamp: daysAgo(1) },
    { id: 'cact3', title: 'Order ORD-2024-3341 in transit', description: 'ETA in 2 days', timestamp: daysAgo(2) },
  ],
};

export const MOCK_ALERTS = {
  admin: [
    { id: 'alr1', variant: 'danger', title: '3 critical tickets open', description: 'Service SLA at risk' },
    { id: 'alr2', variant: 'warning', title: '6 GRNs pending verification', description: 'Across 3 warehouses' },
    { id: 'alr3', variant: 'info', title: '14 SKUs below reorder level', description: 'Review inventory replenishment' },
  ],
  dealer: [
    { id: 'dalr1', variant: 'warning', title: '₹1,25,000 outstanding', description: '2 invoices past due date' },
    { id: 'dalr2', variant: 'info', title: '2 GRNs awaiting confirmation', description: 'Confirm receipt to update stock' },
  ],
  employee: [
    { id: 'ealr1', variant: 'danger', title: '4 dealers in red zone', description: 'Below 75% of monthly target' },
    { id: 'ealr2', variant: 'warning', title: '5 approvals pending', description: 'Requires manager action' },
  ],
  service: [
    { id: 'salr1', variant: 'danger', title: '3 SLA breaches today', description: 'Escalation required' },
    { id: 'salr2', variant: 'warning', title: '5 spare parts delayed', description: 'Avg delay 4.2 days' },
  ],
  customer: [
    { id: 'calr1', variant: 'info', title: '1 warranty expiring soon', description: 'Hydraulic Pump · 35 days left' },
  ],
};

export const MOCK_CHART_REVENUE = [
  { name: 'Jan', value: 1820000 },
  { name: 'Feb', value: 2150000 },
  { name: 'Mar', value: 2480000 },
  { name: 'Apr', value: 2310000 },
  { name: 'May', value: 2670000 },
  { name: 'Jun', value: 2890000 },
];

export const MOCK_CHART_EXPENSES = [
  { name: 'Logistics', value: 420000 },
  { name: 'Salaries', value: 890000 },
  { name: 'Marketing', value: 180000 },
  { name: 'Operations', value: 310000 },
];

export {
  MOCK_CATEGORIES, MOCK_BRANDS, MOCK_PRODUCTS, MOCK_PRODUCT_TIERS,
  MOCK_PRICING, MOCK_EXPENSES, MOCK_NOTIFICATIONS,
  MOCK_DISPATCH_TIMELINE, MOCK_GRN_LINE_ITEMS,
} from './catalog';

export {
  MOCK_DEALER_CUSTOMERS, MOCK_DEALER_DISPATCHES, MOCK_DEALER_GRN,
  MOCK_BILL_DETAILS, MOCK_INVOICE_DETAILS, MOCK_DEALER_REPORTS, BILLING_PRODUCTS,
} from './dealer';

export {
  MOCK_ASSIGNED_DEALERS, MOCK_DEALER_MONTHLY_SALES, MOCK_EMPLOYEE_PERFORMANCE, MOCK_DEALER_ANALYTICS,
} from './employee';

export {
  MOCK_COMPLAINT_TIMELINES, MOCK_COMPLAINT_DETAILS, MOCK_SERVICE_REQUEST_TIMELINES,
  MOCK_SPARE_WORKFLOWS, MOCK_RETURN_WORKFLOWS,
} from './service';

export function findById(collection, id) {
  return collection.find((item) => item.id === id) || null;
}
