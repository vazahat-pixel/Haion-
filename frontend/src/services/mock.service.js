import {
  MOCK_WAREHOUSES, MOCK_INVENTORY, MOCK_DISPATCH, MOCK_GRN, MOCK_DEALERS,
  MOCK_EMPLOYEES, MOCK_BILLING, MOCK_INVOICES, MOCK_COMPLAINTS, MOCK_WARRANTY,
  MOCK_SPARES, MOCK_RETURNS, MOCK_TASKS, MOCK_APPROVALS, MOCK_REPORTS,
  MOCK_ORDERS, MOCK_SERVICE_REQUESTS, MOCK_AUDIT, MOCK_DEALER_INVENTORY, MOCK_TEAM,
  MOCK_CATEGORIES, MOCK_BRANDS, MOCK_PRODUCTS, MOCK_PRODUCT_TIERS,
  MOCK_PRICING, MOCK_EXPENSES, MOCK_NOTIFICATIONS,
  MOCK_DEALER_CUSTOMERS, MOCK_DEALER_DISPATCHES, MOCK_DEALER_GRN,
  MOCK_BILL_DETAILS, MOCK_INVOICE_DETAILS, MOCK_DEALER_REPORTS,
  MOCK_ASSIGNED_DEALERS, MOCK_DEALER_MONTHLY_SALES, MOCK_EMPLOYEE_PERFORMANCE, MOCK_DEALER_ANALYTICS,
  MOCK_COMPLAINT_TIMELINES, MOCK_COMPLAINT_DETAILS, MOCK_SERVICE_REQUEST_TIMELINES,
  MOCK_SPARE_WORKFLOWS, MOCK_RETURN_WORKFLOWS,
  findById,
} from '@/data/mock';
import { listResponse } from '@/utils/withMockFallback';

export const mockService = {
  warehouses: {
    getList: (f) => listResponse(MOCK_WAREHOUSES, f),
    getDetail: (id) => findById(MOCK_WAREHOUSES, id),
  },
  inventory: {
    getList: (f) => listResponse(MOCK_INVENTORY, f),
    getDetail: (id) => findById(MOCK_INVENTORY, id),
  },
  dispatch: {
    getList: (f) => listResponse(MOCK_DISPATCH, f),
    getDetail: (id) => findById(MOCK_DISPATCH, id),
  },
  grn: {
    getList: (f) => listResponse(MOCK_GRN, f),
    getDetail: (id) => findById(MOCK_GRN, id),
  },
  dealers: {
    getList: (f) => listResponse(MOCK_DEALERS, f),
    getDetail: (id) => findById(MOCK_DEALERS, id),
    create: (data) => ({ id: `dl${Date.now()}`, ...data, status: 'PENDING_ONBOARDING', onboardedAt: new Date().toISOString() }),
  },
  employees: {
    getList: (f) => listResponse(MOCK_EMPLOYEES, f),
    getDetail: (id) => findById(MOCK_EMPLOYEES, id),
  },
  billing: {
    getList: (f) => listResponse(MOCK_BILLING, f),
    getDetail: (id) => {
      const bill = findById(MOCK_BILLING, id);
      if (!bill) return null;
      return { ...bill, ...(MOCK_BILL_DETAILS[id] || {}) };
    },
    create: (data) => ({ id: `b${Date.now()}`, billNo: `BILL-2024-${Math.floor(Math.random() * 9000) + 1000}`, status: data.status || 'DRAFT', createdAt: new Date().toISOString(), dueDate: new Date(Date.now() + 15 * 86400000).toISOString(), ...data }),
    getNextBillNumber: () => ({ billNo: `BILL-2024-${Math.floor(Math.random() * 9000) + 1000}` }),
    send: (id) => ({ ...findById(MOCK_BILLING, id), status: 'SENT' }),
    markPaid: (id) => ({ ...findById(MOCK_BILLING, id), status: 'PAID' }),
  },
  invoices: {
    getList: (f) => listResponse(MOCK_INVOICES, f),
    getDetail: (id) => {
      const inv = findById(MOCK_INVOICES, id);
      if (!inv) return null;
      return { ...inv, ...(MOCK_INVOICE_DETAILS[id] || {}) };
    },
  },
  customers: {
    getList: (f) => listResponse(MOCK_DEALER_CUSTOMERS, f),
    getDetail: (id) => findById(MOCK_DEALER_CUSTOMERS, id),
    create: (data) => ({ id: `dc${Date.now()}`, code: `CUS-${Math.floor(Math.random() * 9000) + 1000}`, status: 'ACTIVE', totalPurchases: 0, lastOrderAt: null, ...data }),
  },
  dealerDispatch: {
    getList: (f) => listResponse(MOCK_DEALER_DISPATCHES, f),
    getDetail: (id) => findById(MOCK_DEALER_DISPATCHES, id),
  },
  dealerGrn: {
    getList: (f) => listResponse(MOCK_DEALER_GRN, f),
    getDetail: (id) => findById(MOCK_DEALER_GRN, id),
    confirm: (id) => ({ ...findById(MOCK_DEALER_GRN, id), status: 'VERIFIED', received: findById(MOCK_DEALER_GRN, id)?.items }),
  },
  dealerReports: {
    getList: (f) => listResponse(MOCK_DEALER_REPORTS, f),
  },
  assignedDealers: {
    getList: (f) => listResponse(MOCK_ASSIGNED_DEALERS, f),
    getDetail: (id) => {
      const dealer = findById(MOCK_ASSIGNED_DEALERS, id);
      if (!dealer) return null;
      return { ...dealer, monthlySales: MOCK_DEALER_MONTHLY_SALES[id] || [] };
    },
  },
  employeePerformance: {
    get: (role) => MOCK_EMPLOYEE_PERFORMANCE[role === 'MANAGER' ? 'manager' : 'employee'] || MOCK_EMPLOYEE_PERFORMANCE.employee,
  },
  dealerAnalytics: {
    get: () => MOCK_DEALER_ANALYTICS,
  },
  complaints: {
    getList: (f) => listResponse(MOCK_COMPLAINTS, f),
    getDetail: (id) => {
      const base = findById(MOCK_COMPLAINTS, id);
      if (!base) return null;
      return { ...base, ...(MOCK_COMPLAINT_DETAILS[id] || {}) };
    },
    getTimeline: (id) => MOCK_COMPLAINT_TIMELINES[id] || [],
    escalate: (id) => {
      const item = MOCK_COMPLAINTS.find((c) => c.id === id);
      if (item) { item.status = 'ESCALATED'; }
      return { ...findById(MOCK_COMPLAINTS, id), status: 'ESCALATED' };
    },
    resolve: (id) => {
      const item = MOCK_COMPLAINTS.find((c) => c.id === id);
      if (item) { item.status = 'RESOLVED'; }
      return { ...findById(MOCK_COMPLAINTS, id), status: 'RESOLVED' };
    },
    create: (data) => ({ id: `c${Date.now()}`, ticketNo: `CMP-2024-${Math.floor(Math.random() * 9000) + 1000}`, status: 'OPEN', createdAt: new Date().toISOString(), ...data }),
  },
  warranty: {
    getList: (f) => listResponse(MOCK_WARRANTY, f),
    getDetail: (id) => findById(MOCK_WARRANTY, id),
    lookupBySerial: (serial) => MOCK_WARRANTY.find((w) => w.serialNo.toLowerCase() === serial.toLowerCase()) || null,
    downloadCertificate: (id) => findById(MOCK_WARRANTY, id),
  },
  spares: {
    getList: (f) => listResponse(MOCK_SPARES, f),
    getDetail: (id) => findById(MOCK_SPARES, id),
    getWorkflow: (id) => MOCK_SPARE_WORKFLOWS[id] || { steps: ['REQUESTED', 'APPROVED', 'DISPATCHED', 'DELIVERED'], currentStep: 0 },
    advanceWorkflow: (id) => {
      const wf = MOCK_SPARE_WORKFLOWS[id];
      if (wf && wf.currentStep < wf.steps.length - 1) wf.currentStep += 1;
      const item = MOCK_SPARES.find((s) => s.id === id);
      if (item && wf) item.status = wf.steps[wf.currentStep];
      return wf;
    },
  },
  returns: {
    getList: (f) => listResponse(MOCK_RETURNS, f),
    getDetail: (id) => findById(MOCK_RETURNS, id),
    getWorkflow: (id) => MOCK_RETURN_WORKFLOWS[id] || { steps: ['REQUESTED', 'RECEIVED', 'INSPECTED', 'RESOLVED'], currentStep: 0 },
    advanceWorkflow: (id) => {
      const wf = MOCK_RETURN_WORKFLOWS[id];
      if (wf && wf.currentStep < wf.steps.length - 1) wf.currentStep += 1;
      const item = MOCK_RETURNS.find((r) => r.id === id);
      if (item && wf) item.status = wf.steps[wf.currentStep];
      return wf;
    },
  },
  tasks: {
    getList: (f) => listResponse(MOCK_TASKS, f),
    getDetail: (id) => findById(MOCK_TASKS, id),
  },
  approvals: {
    getList: (f) => listResponse(MOCK_APPROVALS, f),
    getDetail: (id) => findById(MOCK_APPROVALS, id),
  },
  reports: {
    getList: (f) => listResponse(MOCK_REPORTS, f),
    getDetail: (id) => findById(MOCK_REPORTS, id),
  },
  orders: {
    getList: (f) => listResponse(MOCK_ORDERS, f),
    getDetail: (id) => findById(MOCK_ORDERS, id),
  },
  serviceRequests: {
    getList: (f) => listResponse(MOCK_SERVICE_REQUESTS, f),
    getDetail: (id) => findById(MOCK_SERVICE_REQUESTS, id),
    getTimeline: (id) => MOCK_SERVICE_REQUEST_TIMELINES[id] || [],
    create: (data) => ({ id: `sr${Date.now()}`, requestNo: `SR-2024-${Math.floor(Math.random() * 9000) + 1000}`, status: 'OPEN', createdAt: new Date().toISOString(), ...data }),
  },
  audit: {
    getList: (f) => listResponse(MOCK_AUDIT, f),
  },
  dealerInventory: {
    getList: (f) => listResponse(MOCK_DEALER_INVENTORY, f),
    getDetail: (id) => findById(MOCK_DEALER_INVENTORY, id),
  },
  team: {
    getList: (f) => listResponse(MOCK_TEAM, f),
  },
  settings: {
    getGeneral: () => ({ companyName: 'Haion Industries Pvt Ltd', email: 'contact@haion.com', phone: '+91 80 1234 5678', address: 'Bangalore, Karnataka' }),
    getGst: () => ({ gstin: '29AABCU9603R1ZM', stateCode: '29', defaultRate: 18 }),
    getNotifications: () => ({ emailAlerts: true, smsAlerts: false, lowStockAlert: true, complaintEscalation: true }),
  },
  products: {
    getList: (f) => listResponse(MOCK_PRODUCTS, f),
    getDetail: (id) => findById(MOCK_PRODUCTS, id),
    create: (data) => ({ id: `p${Date.now()}`, status: 'DRAFT', stockTotal: 0, updatedAt: new Date().toISOString(), ...data }),
  },
  categories: {
    getList: (f) => listResponse(MOCK_CATEGORIES, f),
    getDetail: (id) => findById(MOCK_CATEGORIES, id),
    create: (data) => ({ id: `cat${Date.now()}`, productCount: 0, status: 'ACTIVE', updatedAt: new Date().toISOString(), ...data }),
  },
  brands: {
    getList: (f) => listResponse(MOCK_BRANDS, f),
    getDetail: (id) => findById(MOCK_BRANDS, id),
    create: (data) => ({ id: `br${Date.now()}`, productCount: 0, status: 'ACTIVE', updatedAt: new Date().toISOString(), ...data }),
  },
  productTiers: {
    getList: (f) => listResponse(MOCK_PRODUCT_TIERS, f),
    getDetail: (id) => findById(MOCK_PRODUCT_TIERS, id),
  },
  pricing: {
    getList: (f) => listResponse(MOCK_PRICING, f),
    getDetail: (id) => findById(MOCK_PRICING, id),
  },
  expenses: {
    getList: (f) => listResponse(MOCK_EXPENSES, f),
    getDetail: (id) => findById(MOCK_EXPENSES, id),
    create: (data) => ({ id: `ex${Date.now()}`, expenseNo: `EXP-2024-${Math.floor(Math.random() * 9000) + 1000}`, status: 'PENDING', submittedAt: new Date().toISOString(), ...data }),
  },
  notifications: {
    getList: (f) => listResponse(MOCK_NOTIFICATIONS, f),
    getUnreadCount: () => ({ count: MOCK_NOTIFICATIONS.filter((n) => !n.read).length }),
    markAllRead: () => MOCK_NOTIFICATIONS.map((n) => ({ ...n, read: true })),
  },
};
