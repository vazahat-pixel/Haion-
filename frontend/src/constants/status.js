export const INVENTORY_STATUS = {
  IN_STOCK: 'IN_STOCK',
  LOW_STOCK: 'LOW_STOCK',
  OUT_OF_STOCK: 'OUT_OF_STOCK',
  DISCONTINUED: 'DISCONTINUED',
};

export const DISPATCH_STATUS = {
  CREATED: 'CREATED',
  PICKED: 'PICKED',
  PACKED: 'PACKED',
  DISPATCHED: 'DISPATCHED',
  IN_TRANSIT: 'IN_TRANSIT',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
};

export const GRN_STATUS = {
  DRAFT: 'DRAFT',
  PENDING_VERIFICATION: 'PENDING_VERIFICATION',
  VERIFIED: 'VERIFIED',
  REJECTED: 'REJECTED',
};

export const BILLING_STATUS = {
  DRAFT: 'DRAFT',
  SENT: 'SENT',
  PAID: 'PAID',
  OVERDUE: 'OVERDUE',
  CANCELLED: 'CANCELLED',
};

export const COMPLAINT_STATUS = {
  OPEN: 'OPEN',
  IN_PROGRESS: 'IN_PROGRESS',
  ESCALATED: 'ESCALATED',
  RESOLVED: 'RESOLVED',
  CLOSED: 'CLOSED',
};

export const COMPLAINT_PRIORITY = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL',
};

export const WARRANTY_STATUS = {
  ACTIVE: 'ACTIVE',
  EXPIRED: 'EXPIRED',
  CLAIMED: 'CLAIMED',
  VOID: 'VOID',
};

export const RETURN_STATUS = {
  EXPECTED: 'EXPECTED',
  SHIPPED: 'SHIPPED',
  RECEIVED: 'RECEIVED',
  VERIFIED: 'VERIFIED',
  REJECTED: 'REJECTED',
  OVERDUE: 'OVERDUE',
  REQUESTED: 'REQUESTED',
  APPROVED: 'APPROVED',
  INSPECTED: 'INSPECTED',
  CREDITED: 'CREDITED',
};

export const SERVICE_REQUEST_STATUS = {
  NEW: 'NEW',
  ASSIGNED: 'ASSIGNED',
  IN_PROGRESS: 'IN_PROGRESS',
  WAITING_PARTS: 'WAITING_PARTS',
  PARTS_RECEIVED: 'PARTS_RECEIVED',
  RESOLVED: 'RESOLVED',
  CLOSED: 'CLOSED',
  CANCELLED: 'CANCELLED',
};

export const SPARE_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  DISPATCHED: 'DISPATCHED',
  RECEIVED: 'RECEIVED',
  COMPLETED: 'COMPLETED',
  REJECTED: 'REJECTED',
};

export const DEALER_STATUS = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  SUSPENDED: 'SUSPENDED',
  PENDING_ONBOARDING: 'PENDING_ONBOARDING',
};

export const TASK_STATUS = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
};

export const APPROVAL_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
};

/** Unified status config for StatusBadge component */
export const STATUS_CONFIG = {
  // Inventory
  [INVENTORY_STATUS.IN_STOCK]: { label: 'In Stock', color: 'success' },
  [INVENTORY_STATUS.LOW_STOCK]: { label: 'Low Stock', color: 'warning' },
  [INVENTORY_STATUS.OUT_OF_STOCK]: { label: 'Out of Stock', color: 'danger' },
  [INVENTORY_STATUS.DISCONTINUED]: { label: 'Discontinued', color: 'neutral' },

  // Complaints
  [COMPLAINT_STATUS.OPEN]: { label: 'Open', color: 'info' },
  [COMPLAINT_STATUS.IN_PROGRESS]: { label: 'In Progress', color: 'warning' },
  [COMPLAINT_STATUS.ESCALATED]: { label: 'Escalated', color: 'danger' },
  [COMPLAINT_STATUS.RESOLVED]: { label: 'Resolved', color: 'success' },
  [COMPLAINT_STATUS.CLOSED]: { label: 'Closed', color: 'neutral' },

  // Billing
  [BILLING_STATUS.DRAFT]: { label: 'Draft', color: 'neutral' },
  [BILLING_STATUS.SENT]: { label: 'Sent', color: 'info' },
  [BILLING_STATUS.PAID]: { label: 'Paid', color: 'success' },
  [BILLING_STATUS.OVERDUE]: { label: 'Overdue', color: 'danger' },
  [BILLING_STATUS.CANCELLED]: { label: 'Cancelled', color: 'neutral' },

  // Dispatch
  [DISPATCH_STATUS.CREATED]: { label: 'Created', color: 'neutral' },
  [DISPATCH_STATUS.PICKED]: { label: 'Picked', color: 'info' },
  [DISPATCH_STATUS.PACKED]: { label: 'Packed', color: 'info' },
  [DISPATCH_STATUS.DISPATCHED]: { label: 'Dispatched', color: 'warning' },
  [DISPATCH_STATUS.IN_TRANSIT]: { label: 'In Transit', color: 'warning' },
  [DISPATCH_STATUS.DELIVERED]: { label: 'Delivered', color: 'success' },
  [DISPATCH_STATUS.CANCELLED]: { label: 'Cancelled', color: 'neutral' },

  // GRN
  [GRN_STATUS.DRAFT]: { label: 'Draft', color: 'neutral' },
  [GRN_STATUS.PENDING_VERIFICATION]: { label: 'Pending', color: 'warning' },
  [GRN_STATUS.VERIFIED]: { label: 'Verified', color: 'success' },
  [GRN_STATUS.REJECTED]: { label: 'Rejected', color: 'danger' },

  // Warranty
  [WARRANTY_STATUS.ACTIVE]: { label: 'Active', color: 'success' },
  [WARRANTY_STATUS.EXPIRED]: { label: 'Expired', color: 'neutral' },
  [WARRANTY_STATUS.CLAIMED]: { label: 'Claimed', color: 'info' },
  [WARRANTY_STATUS.VOID]: { label: 'Void', color: 'danger' },

  // Returns
  [RETURN_STATUS.EXPECTED]: { label: 'Expected', color: 'info' },
  [RETURN_STATUS.SHIPPED]: { label: 'Shipped', color: 'warning' },
  [RETURN_STATUS.RECEIVED]: { label: 'Received', color: 'warning' },
  [RETURN_STATUS.VERIFIED]: { label: 'Verified', color: 'success' },
  [RETURN_STATUS.OVERDUE]: { label: 'Overdue', color: 'danger' },
  [RETURN_STATUS.REQUESTED]: { label: 'Requested', color: 'info' },
  [RETURN_STATUS.APPROVED]: { label: 'Approved', color: 'info' },
  [RETURN_STATUS.INSPECTED]: { label: 'Inspected', color: 'warning' },
  [RETURN_STATUS.CREDITED]: { label: 'Credited', color: 'success' },
  [RETURN_STATUS.REJECTED]: { label: 'Rejected', color: 'danger' },

  // Service requests
  [SERVICE_REQUEST_STATUS.NEW]: { label: 'New', color: 'info' },
  [SERVICE_REQUEST_STATUS.ASSIGNED]: { label: 'Assigned', color: 'info' },
  [SERVICE_REQUEST_STATUS.IN_PROGRESS]: { label: 'In Progress', color: 'warning' },
  [SERVICE_REQUEST_STATUS.WAITING_PARTS]: { label: 'Waiting Parts', color: 'warning' },
  [SERVICE_REQUEST_STATUS.PARTS_RECEIVED]: { label: 'Parts Received', color: 'success' },
  [SERVICE_REQUEST_STATUS.RESOLVED]: { label: 'Resolved', color: 'success' },
  [SERVICE_REQUEST_STATUS.CLOSED]: { label: 'Closed', color: 'neutral' },
  [SERVICE_REQUEST_STATUS.CANCELLED]: { label: 'Cancelled', color: 'neutral' },

  // Spares
  [SPARE_STATUS.PENDING]: { label: 'Pending', color: 'warning' },
  [SPARE_STATUS.APPROVED]: { label: 'Approved', color: 'info' },
  [SPARE_STATUS.DISPATCHED]: { label: 'Dispatched', color: 'warning' },
  [SPARE_STATUS.RECEIVED]: { label: 'Received', color: 'success' },
  [SPARE_STATUS.COMPLETED]: { label: 'Completed', color: 'success' },
  [SPARE_STATUS.REJECTED]: { label: 'Rejected', color: 'danger' },

  // Dealer
  [DEALER_STATUS.ACTIVE]: { label: 'Active', color: 'success' },
  [DEALER_STATUS.INACTIVE]: { label: 'Inactive', color: 'neutral' },
  [DEALER_STATUS.SUSPENDED]: { label: 'Suspended', color: 'danger' },
  [DEALER_STATUS.PENDING_ONBOARDING]: { label: 'Pending', color: 'warning' },

  // Tasks & Approvals
  [TASK_STATUS.PENDING]: { label: 'Pending', color: 'warning' },
  [TASK_STATUS.IN_PROGRESS]: { label: 'In Progress', color: 'info' },
  [TASK_STATUS.COMPLETED]: { label: 'Completed', color: 'success' },
  [TASK_STATUS.CANCELLED]: { label: 'Cancelled', color: 'neutral' },
  [APPROVAL_STATUS.PENDING]: { label: 'Pending', color: 'warning' },
  [APPROVAL_STATUS.APPROVED]: { label: 'Approved', color: 'success' },
  [APPROVAL_STATUS.REJECTED]: { label: 'Rejected', color: 'danger' },

  // Website store orders
  CONFIRMED: { label: 'Confirmed', color: 'info' },
  PROCESSING: { label: 'Processing', color: 'warning' },

  // Priority
  [COMPLAINT_PRIORITY.LOW]: { label: 'Low', color: 'neutral' },
  [COMPLAINT_PRIORITY.MEDIUM]: { label: 'Medium', color: 'info' },
  [COMPLAINT_PRIORITY.HIGH]: { label: 'High', color: 'warning' },
  [COMPLAINT_PRIORITY.CRITICAL]: { label: 'Critical', color: 'danger' },
};
