# OUTPUT 4 — QUERY MAP

> All TanStack Query keys, stale times, refetch strategies, invalidation triggers.

## Global Query Defaults (`providers/QueryProvider.jsx`)

```javascript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 300_000,           // 5 min garbage collection
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      retry: (failureCount, error) => {
        if (error?.response?.status >= 400 && error?.response?.status < 500) return false;
        return failureCount < 3;
      },
    },
    mutations: {
      retry: false,
    },
  },
});
```

---

## Query Key Factory (`services/api/queryKeys.js`)

```javascript
export const queryKeys = {
  // ─── AUTH ───────────────────────────────────────────
  auth: {
    all: ['auth'],
    me: () => [...queryKeys.auth.all, 'me'],
    permissions: () => [...queryKeys.auth.all, 'permissions'],
  },

  // ─── INVENTORY ──────────────────────────────────────
  inventory: {
    all: ['inventory'],
    lists: () => [...queryKeys.inventory.all, 'list'],
    list: (filters) => [...queryKeys.inventory.lists(), filters],
    details: () => [...queryKeys.inventory.all, 'detail'],
    detail: (id) => [...queryKeys.inventory.details(), id],
    lowStock: () => [...queryKeys.inventory.all, 'low-stock'],
    categories: () => [...queryKeys.inventory.all, 'categories'],
    export: (filters) => [...queryKeys.inventory.all, 'export', filters],
  },

  // ─── WAREHOUSES ─────────────────────────────────────
  warehouses: {
    all: ['warehouses'],
    lists: () => [...queryKeys.warehouses.all, 'list'],
    list: (filters) => [...queryKeys.warehouses.lists(), filters],
    details: () => [...queryKeys.warehouses.all, 'detail'],
    detail: (id) => [...queryKeys.warehouses.details(), id],
    stock: (id) => [...queryKeys.warehouses.detail(id), 'stock'],
  },

  // ─── DISPATCH ───────────────────────────────────────
  dispatch: {
    all: ['dispatch'],
    lists: () => [...queryKeys.dispatch.all, 'list'],
    list: (filters) => [...queryKeys.dispatch.lists(), filters],
    details: () => [...queryKeys.dispatch.all, 'detail'],
    detail: (id) => [...queryKeys.dispatch.details(), id],
    tracking: (id) => [...queryKeys.dispatch.detail(id), 'tracking'],
    pending: () => [...queryKeys.dispatch.all, 'pending-count'],
  },

  // ─── GRN ────────────────────────────────────────────
  grn: {
    all: ['grn'],
    lists: () => [...queryKeys.grn.all, 'list'],
    list: (filters) => [...queryKeys.grn.lists(), filters],
    details: () => [...queryKeys.grn.all, 'detail'],
    detail: (id) => [...queryKeys.grn.details(), id],
    byWarehouse: (warehouseId) => [...queryKeys.grn.lists(), { warehouseId }],
  },

  // ─── BILLING ────────────────────────────────────────
  billing: {
    all: ['billing'],
    lists: () => [...queryKeys.billing.all, 'list'],
    list: (filters) => [...queryKeys.billing.lists(), filters],
    details: () => [...queryKeys.billing.all, 'detail'],
    detail: (id) => [...queryKeys.billing.details(), id],
    nextBillNumber: () => [...queryKeys.billing.all, 'next-bill-number'],
    summary: (filters) => [...queryKeys.billing.all, 'summary', filters],
  },

  // ─── INVOICES ───────────────────────────────────────
  invoices: {
    all: ['invoices'],
    lists: () => [...queryKeys.invoices.all, 'list'],
    list: (filters) => [...queryKeys.invoices.lists(), filters],
    details: () => [...queryKeys.invoices.all, 'detail'],
    detail: (id) => [...queryKeys.invoices.details(), id],
    pdf: (id) => [...queryKeys.invoices.detail(id), 'pdf'],
  },

  // ─── GST ────────────────────────────────────────────
  gst: {
    all: ['gst'],
    config: () => [...queryKeys.gst.all, 'config'],
    rates: () => [...queryKeys.gst.all, 'rates'],
    hsn: {
      all: ['gst', 'hsn'],
      lists: () => [...queryKeys.gst.hsn.all, 'list'],
      list: (filters) => [...queryKeys.gst.hsn.lists(), filters],
      lookup: (code) => [...queryKeys.gst.hsn.all, 'lookup', code],
    },
    validate: (gstin) => [...queryKeys.gst.all, 'validate', gstin],
  },

  // ─── WARRANTY ───────────────────────────────────────
  warranty: {
    all: ['warranty'],
    lists: () => [...queryKeys.warranty.all, 'list'],
    list: (filters) => [...queryKeys.warranty.lists(), filters],
    details: () => [...queryKeys.warranty.all, 'detail'],
    detail: (id) => [...queryKeys.warranty.details(), id],
    eligibility: (productId, serialNo) => [...queryKeys.warranty.all, 'eligibility', productId, serialNo],
    claims: (warrantyId) => [...queryKeys.warranty.detail(warrantyId), 'claims'],
  },

  // ─── COMPLAINTS ─────────────────────────────────────
  complaints: {
    all: ['complaints'],
    lists: () => [...queryKeys.complaints.all, 'list'],
    list: (filters) => [...queryKeys.complaints.lists(), filters],
    details: () => [...queryKeys.complaints.all, 'detail'],
    detail: (id) => [...queryKeys.complaints.details(), id],
    timeline: (id) => [...queryKeys.complaints.detail(id), 'timeline'],
    openCount: () => [...queryKeys.complaints.all, 'open-count'],
    sla: (id) => [...queryKeys.complaints.detail(id), 'sla'],
  },

  // ─── SPARE PARTS ────────────────────────────────────
  spares: {
    all: ['spares'],
    lists: () => [...queryKeys.spares.all, 'list'],
    list: (filters) => [...queryKeys.spares.lists(), filters],
    details: () => [...queryKeys.spares.all, 'detail'],
    detail: (id) => [...queryKeys.spares.details(), id],
    availability: (partId) => [...queryKeys.spares.all, 'availability', partId],
  },

  // ─── RETURNS ────────────────────────────────────────
  returns: {
    all: ['returns'],
    lists: () => [...queryKeys.returns.all, 'list'],
    list: (filters) => [...queryKeys.returns.lists(), filters],
    details: () => [...queryKeys.returns.all, 'detail'],
    detail: (id) => [...queryKeys.returns.details(), id],
  },

  // ─── DEALERS ────────────────────────────────────────
  dealers: {
    all: ['dealers'],
    lists: () => [...queryKeys.dealers.all, 'list'],
    list: (filters) => [...queryKeys.dealers.lists(), filters],
    details: () => [...queryKeys.dealers.all, 'detail'],
    detail: (id) => [...queryKeys.dealers.details(), id],
    inventory: (dealerId) => [...queryKeys.dealers.detail(dealerId), 'inventory'],
    team: (dealerId) => [...queryKeys.dealers.detail(dealerId), 'team'],
    performance: (dealerId, filters) => [...queryKeys.dealers.detail(dealerId), 'performance', filters],
  },

  // ─── EMPLOYEES ──────────────────────────────────────
  employees: {
    all: ['employees'],
    lists: () => [...queryKeys.employees.all, 'list'],
    list: (filters) => [...queryKeys.employees.lists(), filters],
    details: () => [...queryKeys.employees.all, 'detail'],
    detail: (id) => [...queryKeys.employees.details(), id],
    team: (managerId) => [...queryKeys.employees.all, 'team', managerId],
    hierarchy: () => [...queryKeys.employees.all, 'hierarchy'],
  },

  // ─── TASKS ──────────────────────────────────────────
  tasks: {
    all: ['tasks'],
    lists: () => [...queryKeys.tasks.all, 'list'],
    list: (filters) => [...queryKeys.tasks.lists(), filters],
    details: () => [...queryKeys.tasks.all, 'detail'],
    detail: (id) => [...queryKeys.tasks.details(), id],
    pendingCount: () => [...queryKeys.tasks.all, 'pending-count'],
  },

  // ─── APPROVALS ──────────────────────────────────────
  approvals: {
    all: ['approvals'],
    lists: () => [...queryKeys.approvals.all, 'list'],
    list: (filters) => [...queryKeys.approvals.lists(), filters],
    details: () => [...queryKeys.approvals.all, 'detail'],
    detail: (id) => [...queryKeys.approvals.details(), id],
    pendingCount: () => [...queryKeys.approvals.all, 'pending-count'],
  },

  // ─── REPORTS ────────────────────────────────────────
  reports: {
    all: ['reports'],
    lists: () => [...queryKeys.reports.all, 'list'],
    list: (filters) => [...queryKeys.reports.lists(), filters],
    details: () => [...queryKeys.reports.all, 'detail'],
    detail: (id) => [...queryKeys.reports.details(), id],
  },

  // ─── ORDERS (Customer) ────────────────────────────
  orders: {
    all: ['orders'],
    lists: () => [...queryKeys.orders.all, 'list'],
    list: (filters) => [...queryKeys.orders.lists(), filters],
    details: () => [...queryKeys.orders.all, 'detail'],
    detail: (id) => [...queryKeys.orders.details(), id],
    tracking: (id) => [...queryKeys.orders.detail(id), 'tracking'],
  },

  // ─── SERVICE REQUESTS (Customer) ──────────────────
  serviceRequests: {
    all: ['service-requests'],
    lists: () => [...queryKeys.serviceRequests.all, 'list'],
    list: (filters) => [...queryKeys.serviceRequests.lists(), filters],
    details: () => [...queryKeys.serviceRequests.all, 'detail'],
    detail: (id) => [...queryKeys.serviceRequests.details(), id],
  },

  // ─── ANALYTICS ────────────────────────────────────
  analytics: {
    all: ['analytics'],
    kpis: (filters) => [...queryKeys.analytics.all, 'kpis', filters],
    revenue: (filters) => [...queryKeys.analytics.all, 'revenue', filters],
    orders: (filters) => [...queryKeys.analytics.all, 'orders', filters],
    complaints: (filters) => [...queryKeys.analytics.all, 'complaints', filters],
    inventory: (filters) => [...queryKeys.analytics.all, 'inventory', filters],
    dealers: (filters) => [...queryKeys.analytics.all, 'dealers', filters],
    dashboard: (panel, filters) => [...queryKeys.analytics.all, 'dashboard', panel, filters],
  },

  // ─── NOTIFICATIONS ────────────────────────────────
  notifications: {
    all: ['notifications'],
    lists: () => [...queryKeys.notifications.all, 'list'],
    list: (filters) => [...queryKeys.notifications.lists(), filters],
    infinite: (filters) => [...queryKeys.notifications.all, 'infinite', filters],
    unreadCount: () => [...queryKeys.notifications.all, 'unread-count'],
  },

  // ─── AUDIT LOGS ───────────────────────────────────
  audit: {
    all: ['audit'],
    lists: () => [...queryKeys.audit.all, 'list'],
    list: (filters) => [...queryKeys.audit.lists(), filters],
    detail: (id) => [...queryKeys.audit.all, 'detail', id],
  },

  // ─── SETTINGS ─────────────────────────────────────
  settings: {
    all: ['settings'],
    general: () => [...queryKeys.settings.all, 'general'],
    gst: () => [...queryKeys.settings.all, 'gst'],
    notifications: () => [...queryKeys.settings.all, 'notifications'],
  },

  // ─── GLOBAL SEARCH ────────────────────────────────
  search: {
    all: ['search'],
    global: (query) => [...queryKeys.search.all, 'global', query],
    products: (query) => [...queryKeys.search.all, 'products', query],
    dealers: (query) => [...queryKeys.search.all, 'dealers', query],
    invoices: (query) => [...queryKeys.search.all, 'invoices', query],
    employees: (query) => [...queryKeys.search.all, 'employees', query],
    complaints: (query) => [...queryKeys.search.all, 'complaints', query],
  },

  // ─── ADDRESS LOOKUP ───────────────────────────────
  address: {
    all: ['address'],
    pincode: (pin) => [...queryKeys.address.all, 'pincode', pin],
    states: () => [...queryKeys.address.all, 'states'],
  },
};
```

---

## Query Configuration Table

### Lists (Paginated)

| Domain | Hook | Key | staleTime | refetchInterval | placeholderData |
|--------|------|-----|-----------|-----------------|-----------------|
| Inventory | `useInventoryList` | `inventory.list(filters)` | 30s | — | `keepPreviousData` |
| Warehouses | `useWarehouseList` | `warehouses.list(filters)` | 60s | — | `keepPreviousData` |
| Dispatch | `useDispatchList` | `dispatch.list(filters)` | 30s | — | `keepPreviousData` |
| GRN | `useGRNList` | `grn.list(filters)` | 30s | — | `keepPreviousData` |
| Billing | `useBillingList` | `billing.list(filters)` | 30s | — | `keepPreviousData` |
| Invoices | `useInvoiceList` | `invoices.list(filters)` | 30s | — | `keepPreviousData` |
| Warranty | `useWarrantyList` | `warranty.list(filters)` | 60s | — | `keepPreviousData` |
| Complaints | `useComplaintList` | `complaints.list(filters)` | 15s | — | `keepPreviousData` |
| Spare Parts | `useSparePartsList` | `spares.list(filters)` | 30s | — | `keepPreviousData` |
| Returns | `useReturnsList` | `returns.list(filters)` | 30s | — | `keepPreviousData` |
| Dealers | `useDealerList` | `dealers.list(filters)` | 60s | — | `keepPreviousData` |
| Employees | `useEmployeeList` | `employees.list(filters)` | 60s | — | `keepPreviousData` |
| Tasks | `useTaskList` | `tasks.list(filters)` | 30s | — | `keepPreviousData` |
| Approvals | `useApprovalList` | `approvals.list(filters)` | 15s | — | `keepPreviousData` |
| Orders | `useOrderList` | `orders.list(filters)` | 30s | — | `keepPreviousData` |
| Audit Logs | `useAuditLogList` | `audit.list(filters)` | 60s | — | `keepPreviousData` |

### Details

| Domain | Hook | Key | staleTime | Prefetch On |
|--------|------|-----|-----------|-------------|
| Inventory | `useInventoryDetail` | `inventory.detail(id)` | 60s | Row hover |
| Warehouse | `useWarehouseDetail` | `warehouses.detail(id)` | 60s | Row hover |
| Dispatch | `useDispatchDetail` | `dispatch.detail(id)` | 60s | Row hover |
| GRN | `useGRNDetail` | `grn.detail(id)` | 60s | Row hover |
| Billing | `useBillingDetail` | `billing.detail(id)` | 60s | Row hover |
| Invoice | `useInvoiceDetail` | `invoices.detail(id)` | 60s | Row hover |
| Warranty | `useWarrantyDetail` | `warranty.detail(id)` | 60s | Row hover |
| Complaint | `useComplaintDetail` | `complaints.detail(id)` | 30s | Row hover |
| Dealer | `useDealerDetail` | `dealers.detail(id)` | 60s | Row hover |
| Employee | `useEmployeeDetail` | `employees.detail(id)` | 60s | Row hover |

### Dashboard / KPIs

| Domain | Hook | Key | staleTime | refetchInterval |
|--------|------|-----|-----------|-----------------|
| Admin KPIs | `useAdminDashboard` | `analytics.dashboard('admin', filters)` | 30s | 60s |
| Dealer KPIs | `useDealerDashboard` | `analytics.dashboard('dealer', filters)` | 30s | 60s |
| Employee KPIs | `useEmployeeDashboard` | `analytics.dashboard('employee', filters)` | 30s | 60s |
| Service KPIs | `useServiceDashboard` | `analytics.dashboard('service', filters)` | 30s | 60s |
| Customer KPIs | `useCustomerDashboard` | `analytics.dashboard('customer', filters)` | 30s | 60s |
| Revenue Chart | `useRevenueAnalytics` | `analytics.revenue(filters)` | 60s | 60s |
| Complaint Chart | `useComplaintAnalytics` | `analytics.complaints(filters)` | 60s | 60s |

### Real-Time / High-Frequency

| Domain | Hook | Key | staleTime | refetchInterval |
|--------|------|-----|-----------|-----------------|
| Notifications | `useNotificationInfinite` | `notifications.infinite(filters)` | 10s | 30s |
| Unread Count | `useUnreadCount` | `notifications.unreadCount()` | 10s | 30s |
| Open Complaints | `useOpenComplaintCount` | `complaints.openCount()` | 15s | 30s |
| Pending Dispatch | `usePendingDispatchCount` | `dispatch.pending()` | 30s | 60s |
| Pending Tasks | `usePendingTaskCount` | `tasks.pendingCount()` | 30s | 60s |
| Pending Approvals | `usePendingApprovalCount` | `approvals.pendingCount()` | 15s | 30s |
| Low Stock | `useLowStockCount` | `inventory.lowStock()` | 60s | 120s |

### Lookup / Reference Data

| Domain | Hook | Key | staleTime | gcTime |
|--------|------|-----|-----------|--------|
| GST Config | `useGSTConfig` | `gst.config()` | 300s | 600s |
| GST Rates | `useGSTRates` | `gst.rates()` | 300s | 600s |
| HSN Lookup | `useHSNLookup` | `gst.hsn.lookup(code)` | 300s | 600s |
| GSTIN Validate | `useGSTINValidate` | `gst.validate(gstin)` | 60s | 120s |
| Pincode Lookup | `usePincodeLookup` | `address.pincode(pin)` | 300s | 600s |
| States List | `useStatesList` | `address.states()` | Infinity | Infinity |
| Categories | `useInventoryCategories` | `inventory.categories()` | 300s | 600s |
| Next Bill Number | `useNextBillNumber` | `billing.nextBillNumber()` | 0 | 0 |
| Employee Hierarchy | `useEmployeeHierarchy` | `employees.hierarchy()` | 120s | 300s |

### Search (Debounced)

| Domain | Hook | Key | staleTime | enabled |
|--------|------|-----|-----------|---------|
| Global Search | `useGlobalSearch` | `search.global(query)` | 10s | `query.length >= 2` |
| Product Search | `useProductSearch` | `search.products(query)` | 10s | `query.length >= 2` |
| Dealer Search | `useDealerSearch` | `search.dealers(query)` | 10s | `query.length >= 2` |

---

## Mutation Map & Invalidation Triggers

### Inventory Mutations

| Mutation | Hook | Invalidates |
|----------|------|-------------|
| Create item | `useCreateInventory` | `inventory.lists()`, `inventory.categories()` |
| Update item | `useUpdateInventory` | `inventory.detail(id)`, `inventory.lists()` |
| Update status | `useUpdateInventoryStatus` | `inventory.detail(id)`, `inventory.lists()`, `inventory.lowStock()` |
| Bulk update | `useBulkUpdateInventory` | `inventory.all` |
| Delete item | `useDeleteInventory` | `inventory.lists()` |

### Billing Mutations

| Mutation | Hook | Invalidates |
|----------|------|-------------|
| Create bill | `useCreateBilling` | `billing.lists()`, `billing.nextBillNumber()`, `inventory.lists()`, `dealers.detail(dealerId).inventory`, `analytics.all`, `invoices.lists()` |
| Update bill | `useUpdateBilling` | `billing.detail(id)`, `billing.lists()` |
| Send bill | `useSendBilling` | `billing.detail(id)`, `billing.lists()`, `invoices.lists()` |
| Mark paid | `useMarkBillingPaid` | `billing.detail(id)`, `billing.lists()`, `analytics.all` |
| Cancel bill | `useCancelBilling` | `billing.detail(id)`, `billing.lists()`, `inventory.lists()` |

### Complaint Mutations

| Mutation | Hook | Invalidates |
|----------|------|-------------|
| Create complaint | `useCreateComplaint` | `complaints.lists()`, `complaints.openCount()`, `analytics.all` |
| Update status | `useUpdateComplaintStatus` | `complaints.detail(id)`, `complaints.lists()`, `complaints.openCount()`, `complaints.timeline(id)` |
| Escalate | `useEscalateComplaint` | `complaints.detail(id)`, `complaints.lists()`, `notifications.unreadCount()` |
| Assign | `useAssignComplaint` | `complaints.detail(id)`, `complaints.lists()` |
| Resolve | `useResolveComplaint` | `complaints.detail(id)`, `complaints.lists()`, `complaints.openCount()`, `analytics.all` |

### Dispatch Mutations

| Mutation | Hook | Invalidates |
|----------|------|-------------|
| Create dispatch | `useCreateDispatch` | `dispatch.lists()`, `dispatch.pending()`, `inventory.lists()` |
| Update status | `useUpdateDispatchStatus` | `dispatch.detail(id)`, `dispatch.lists()`, `dispatch.tracking(id)`, `inventory.lists()` |
| Complete dispatch | `useCompleteDispatch` | `dispatch.all`, `inventory.lists()`, `dealers.detail(dealerId).inventory` |

### GRN Mutations

| Mutation | Hook | Invalidates |
|----------|------|-------------|
| Create GRN | `useCreateGRN` | `grn.lists()`, `grn.byWarehouse(warehouseId)`, `inventory.lists()`, `warehouses.detail(warehouseId).stock` |
| Verify GRN | `useVerifyGRN` | `grn.detail(id)`, `inventory.lists()` |
| Reject GRN | `useRejectGRN` | `grn.detail(id)`, `grn.lists()` |

### Cross-Engine Invalidation Matrix

| Action | Engines Affected | Keys Invalidated |
|--------|-----------------|------------------|
| Bill created | Revenue + Inventory | `billing.*`, `inventory.lists()`, `analytics.all` |
| Dispatch completed | Inventory + Revenue | `dispatch.*`, `inventory.*`, `dealers.*.inventory` |
| GRN verified | Inventory | `grn.*`, `inventory.*`, `warehouses.*.stock` |
| Complaint escalated | Service + Notifications | `complaints.*`, `notifications.*` |
| Employee role changed | HR/OPS + Permissions | `employees.*`, `auth.permissions()` |
| Dealer onboarded | Revenue + Inventory | `dealers.*`, `employees.*` |
| Warranty claimed | Service + Revenue | `warranty.*`, `complaints.lists()` |
| Return processed | Inventory + Service | `returns.*`, `inventory.lists()`, `spares.*` |

---

## Optimistic Update Patterns

| Mutation | Optimistic Field | Rollback On Error |
|----------|-----------------|-------------------|
| Update inventory status | `status` | Restore previous status |
| Update complaint status | `status`, `priority` | Restore previous |
| Mark notification read | `read: true` | Restore `read: false` |
| Approve/reject | `status` | Restore previous status |
| Toggle task complete | `completed` | Restore previous |
| Update dispatch status | `status` | Restore previous |

---

## Infinite Query Patterns

| Hook | Key | Page Param | getNextPageParam |
|------|-----|------------|------------------|
| `useNotificationInfinite` | `notifications.infinite(filters)` | `page` | `lastPage.meta.lastPage > lastPage.meta.page ? lastPage.meta.page + 1 : undefined` |
| `useAuditLogInfinite` | `audit.list(filters)` | `page` | Same pattern |
| `useActivityFeedInfinite` | `audit.list({ resourceId, resourceType })` | `page` | Same pattern |

---

## Prefetch Strategy

| Trigger | Prefetch Target | staleTime |
|---------|----------------|-----------|
| Table row hover (200ms debounce) | `*.detail(id)` | 60s |
| Sidebar nav item hover | Panel dashboard KPIs | 30s |
| Billing form: dealer selected | `dealers.detail(id).inventory` | 30s |
| Complaint form: product selected | `warranty.eligibility(productId, serialNo)` | 60s |
| Route navigation (link hover) | Target page primary query | 30s |

---

## Query Error Handling

| Error Code | Query Behavior | UI Behavior |
|------------|---------------|-------------|
| 401 | Pause query, trigger refresh | Full-screen re-auth if refresh fails |
| 403 | Set error state | `QueryErrorBoundary` shows permission denied |
| 404 (detail) | Set `data: null` | Empty state (resource not found) |
| 404 (list) | Set `data: []` | Empty state |
| 422 | Set error with field map | Form field errors |
| 500 | Retry 3x (GET only) | `ErrorState` with retry button |
| Network | Retry 3x with backoff | Offline banner + inline retry |
| Timeout (15s) | No retry | Inline timeout error with retry |
