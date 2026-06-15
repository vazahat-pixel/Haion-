# OUTPUT 2 — ROUTING MAP

> Complete route table: path, component, roles, guard type, lazy/eager, parent layout.

## Guard Hierarchy

```
RouterProvider
└── AuthGuard (token validity)
    └── PanelGuard (role → correct panel)
        └── PermissionGuard (specific permission, where applicable)
            └── Page Component
```

---

## Root & Auth Routes

| Path | Component | Roles | Guard | Lazy | Layout |
|------|-----------|-------|-------|------|--------|
| `/` | `RootRedirect` | All (redirect) | AuthGuard | Eager | None |
| `/auth/login` | `LoginPage` | Public | None (inverse: redirect if authed) | Lazy | `AuthLayout` |
| `/auth/forgot-password` | `ForgotPasswordPage` | Public | None | Lazy | `AuthLayout` |
| `/auth/reset-password` | `ResetPasswordPage` | Public (token-gated) | None | Lazy | `AuthLayout` |
| `/auth/session-expired` | `SessionExpiredPage` | Public | None | Lazy | `AuthLayout` |

### Root Redirect Logic (`/`)

| Condition | Redirect Target |
|-----------|-----------------|
| Not authenticated | `/auth/login` |
| Authenticated + saved path | Saved path (from session store) |
| Authenticated + no saved path | Role-based home (see Post-Login table) |

### Post-Login Redirect Map

| Role | Constant | Redirect Path |
|------|----------|---------------|
| `MASTER_ADMIN` | `ROLES.MASTER_ADMIN` | `/admin/dashboard` |
| `WAREHOUSE_MANAGER` | `ROLES.WAREHOUSE_MANAGER` | `/admin/warehouses` |
| `DEALER_ADMIN` | `ROLES.DEALER_ADMIN` | `/dealer/dashboard` |
| `DEALER_SALES` | `ROLES.DEALER_SALES` | `/dealer/inventory` |
| `EMPLOYEE` | `ROLES.EMPLOYEE` | `/employee/dashboard` |
| `MANAGER` | `ROLES.MANAGER` | `/employee/dashboard` |
| `CUSTOMER_SUPPORT` | `ROLES.CUSTOMER_SUPPORT` | `/service/dashboard` |
| `SERVICE_CENTER` | `ROLES.SERVICE_CENTER` | `/service/complaints` |
| `CUSTOMER` | `ROLES.CUSTOMER` | `/customer/dashboard` |

---

## Admin Panel (`/admin`)

**Panel Route File:** `routes/admin/AdminRoutes.jsx`
**Panel Chunk:** Lazy (`AdminPanel`)
**Panel Roles:** `MASTER_ADMIN`, `WAREHOUSE_MANAGER`
**Panel Guard:** `PanelGuard(['MASTER_ADMIN', 'WAREHOUSE_MANAGER'])`
**Layout:** `AdminLayout`
**Suspense Fallback:** `AdminPanelSkeleton`

| Path | Component | Roles | Guard | Lazy | Permission |
|------|-----------|-------|-------|------|------------|
| `/admin` | Redirect → `/admin/dashboard` | `MASTER_ADMIN`, `WAREHOUSE_MANAGER` | PanelGuard | Eager | — |
| `/admin/dashboard` | `AdminDashboardPage` | `MASTER_ADMIN`, `WAREHOUSE_MANAGER` | PanelGuard | Lazy | `analytics.read` |
| `/admin/warehouses` | `WarehouseListPage` | `MASTER_ADMIN`, `WAREHOUSE_MANAGER` | PanelGuard | Lazy | `warehouses.read` |
| `/admin/warehouses/:id` | `WarehouseDetailPage` | `MASTER_ADMIN`, `WAREHOUSE_MANAGER` | PanelGuard | Lazy | `warehouses.read` |
| `/admin/warehouses/:id/grn` | `GRNPage` | `MASTER_ADMIN`, `WAREHOUSE_MANAGER` | PanelGuard + PermissionGuard | Lazy | `grn.read` |
| `/admin/dispatch` | `DispatchListPage` | `MASTER_ADMIN`, `WAREHOUSE_MANAGER` | PanelGuard | Lazy | `dispatch.read` |
| `/admin/dispatch/:id` | `DispatchDetailPage` | `MASTER_ADMIN`, `WAREHOUSE_MANAGER` | PanelGuard | Lazy | `dispatch.read` |
| `/admin/inventory` | `InventoryListPage` | `MASTER_ADMIN`, `WAREHOUSE_MANAGER` | PanelGuard | Lazy | `inventory.read` |
| `/admin/inventory/:id` | `InventoryDetailPage` | `MASTER_ADMIN`, `WAREHOUSE_MANAGER` | PanelGuard | Lazy | `inventory.read` |
| `/admin/dealers` | `DealerListPage` | `MASTER_ADMIN` | PanelGuard + PermissionGuard | Lazy | `dealers.read` |
| `/admin/dealers/:id` | `DealerDetailPage` | `MASTER_ADMIN` | PanelGuard + PermissionGuard | Lazy | `dealers.read` |
| `/admin/dealers/onboarding` | `DealerOnboardingPage` | `MASTER_ADMIN` | PanelGuard + PermissionGuard | Lazy | `dealers.create` |
| `/admin/employees` | `EmployeeListPage` | `MASTER_ADMIN` | PanelGuard + PermissionGuard | Lazy | `employees.read` |
| `/admin/employees/:id` | `EmployeeDetailPage` | `MASTER_ADMIN` | PanelGuard + PermissionGuard | Lazy | `employees.read` |
| `/admin/settings` | `SettingsPage` | `MASTER_ADMIN` | PanelGuard + PermissionGuard | Lazy | `settings.read` |
| `/admin/settings/general` | `GeneralSettingsPage` | `MASTER_ADMIN` | PanelGuard + PermissionGuard | Lazy | `settings.update` |
| `/admin/settings/gst` | `GstSettingsPage` | `MASTER_ADMIN` | PanelGuard + PermissionGuard | Lazy | `gst.config` |
| `/admin/settings/notifications` | `NotificationSettingsPage` | `MASTER_ADMIN` | PanelGuard + PermissionGuard | Lazy | `settings.update` |
| `/admin/audit-logs` | `AuditLogPage` | `MASTER_ADMIN` | PanelGuard + PermissionGuard | Lazy | `audit.read` |

### Warehouse Manager Scoping (Admin Panel)

`WAREHOUSE_MANAGER` can access admin panel routes but:
- Cannot access `/admin/dealers`, `/admin/employees`, `/admin/settings`, `/admin/audit-logs`
- Warehouse list/detail scoped to assigned warehouse via API (not route-level)
- Enforced by `PermissionGuard` + backend scoping

---

## Dealer Panel (`/dealer`)

**Panel Route File:** `routes/dealer/DealerRoutes.jsx`
**Panel Chunk:** Lazy (`DealerPanel`)
**Panel Roles:** `DEALER_ADMIN`, `DEALER_SALES`
**Layout:** `DealerLayout`
**Suspense Fallback:** `DealerPanelSkeleton`

| Path | Component | Roles | Guard | Lazy | Permission |
|------|-----------|-------|-------|------|------------|
| `/dealer` | Redirect → `/dealer/dashboard` | `DEALER_ADMIN`, `DEALER_SALES` | PanelGuard | Eager | — |
| `/dealer/dashboard` | `DealerDashboardPage` | `DEALER_ADMIN` | PanelGuard + PermissionGuard | Lazy | `dealer.dashboard` |
| `/dealer/inventory` | `DealerInventoryListPage` | `DEALER_ADMIN`, `DEALER_SALES` | PanelGuard | Lazy | `dealer.inventory.read` |
| `/dealer/inventory/:id` | `DealerInventoryDetailPage` | `DEALER_ADMIN`, `DEALER_SALES` | PanelGuard | Lazy | `dealer.inventory.read` |
| `/dealer/billing` | `BillingListPage` | `DEALER_ADMIN`, `DEALER_SALES` | PanelGuard | Lazy | `billing.read` |
| `/dealer/billing/new` | `BillingNewPage` | `DEALER_ADMIN`, `DEALER_SALES` | PanelGuard + PermissionGuard | Lazy | `billing.create` |
| `/dealer/billing/:billId` | `BillingDetailPage` | `DEALER_ADMIN`, `DEALER_SALES` | PanelGuard | Lazy | `billing.read` |
| `/dealer/invoices` | `InvoiceListPage` | `DEALER_ADMIN`, `DEALER_SALES` | PanelGuard | Lazy | `invoices.read` |
| `/dealer/invoices/:id` | `InvoiceDetailPage` | `DEALER_ADMIN`, `DEALER_SALES` | PanelGuard | Lazy | `invoices.read` |
| `/dealer/warranty` | `WarrantyListPage` | `DEALER_ADMIN`, `DEALER_SALES` | PanelGuard | Lazy | `warranty.read` |
| `/dealer/warranty/:id` | `WarrantyDetailPage` | `DEALER_ADMIN`, `DEALER_SALES` | PanelGuard | Lazy | `warranty.read` |
| `/dealer/team` | `TeamListPage` | `DEALER_ADMIN` | PanelGuard + PermissionGuard | Lazy | `dealer.team.read` |
| `/dealer/team/performance` | `TeamPerformancePage` | `DEALER_ADMIN` | PanelGuard + PermissionGuard | Lazy | `dealer.team.read` |

### Dealer Sales Scoping

`DEALER_SALES` redirected from `/dealer/dashboard` → `/dealer/inventory` on direct access.
- Billing/invoices scoped to own records via API
- No access to `/dealer/team`

---

## Employee Panel (`/employee`)

**Panel Route File:** `routes/employee/EmployeeRoutes.jsx`
**Panel Chunk:** Lazy (`EmployeePanel`)
**Panel Roles:** `EMPLOYEE`, `MANAGER`
**Layout:** `EmployeeLayout`
**Suspense Fallback:** `EmployeePanelSkeleton`

| Path | Component | Roles | Guard | Lazy | Permission |
|------|-----------|-------|-------|------|------------|
| `/employee` | Redirect → `/employee/dashboard` | `EMPLOYEE`, `MANAGER` | PanelGuard | Eager | — |
| `/employee/dashboard` | `EmployeeDashboardPage` | `EMPLOYEE`, `MANAGER` | PanelGuard | Lazy | — |
| `/employee/tasks` | `TaskListPage` | `EMPLOYEE`, `MANAGER` | PanelGuard | Lazy | `tasks.read` |
| `/employee/tasks/:id` | `TaskDetailPage` | `EMPLOYEE`, `MANAGER` | PanelGuard | Lazy | `tasks.read` |
| `/employee/reports` | `ReportListPage` | `EMPLOYEE`, `MANAGER` | PanelGuard | Lazy | `reports.read` |
| `/employee/reports/:id` | `ReportDetailPage` | `EMPLOYEE`, `MANAGER` | PanelGuard | Lazy | `reports.read` |
| `/employee/team` | `TeamDashboardPage` | `MANAGER` | PanelGuard + PermissionGuard | Lazy | `team.read` |
| `/employee/approvals` | `ApprovalListPage` | `MANAGER` | PanelGuard + PermissionGuard | Lazy | `approvals.read` |
| `/employee/approvals/:id` | `ApprovalDetailPage` | `MANAGER` | PanelGuard + PermissionGuard | Lazy | `approvals.read` |

---

## Service Panel (`/service`)

**Panel Route File:** `routes/service/ServiceRoutes.jsx`
**Panel Chunk:** Lazy (`ServicePanel`)
**Panel Roles:** `CUSTOMER_SUPPORT`, `SERVICE_CENTER`
**Layout:** `ServiceLayout`
**Suspense Fallback:** `ServicePanelSkeleton`

| Path | Component | Roles | Guard | Lazy | Permission |
|------|-----------|-------|-------|------|------------|
| `/service` | Redirect → role-based | `CUSTOMER_SUPPORT`, `SERVICE_CENTER` | PanelGuard | Eager | — |
| `/service/dashboard` | `ServiceDashboardPage` | `CUSTOMER_SUPPORT` | PanelGuard | Lazy | `service.dashboard` |
| `/service/complaints` | `ComplaintListPage` | `CUSTOMER_SUPPORT`, `SERVICE_CENTER` | PanelGuard | Lazy | `complaints.read` |
| `/service/complaints/new` | `ComplaintNewPage` | `CUSTOMER_SUPPORT` | PanelGuard + PermissionGuard | Lazy | `complaints.create` |
| `/service/complaints/:ticketId` | `ComplaintDetailPage` | `CUSTOMER_SUPPORT`, `SERVICE_CENTER` | PanelGuard | Lazy | `complaints.read` |
| `/service/spare-parts` | `SparePartsListPage` | `SERVICE_CENTER` | PanelGuard + PermissionGuard | Lazy | `spares.read` |
| `/service/spare-parts/:id` | `SparePartsDetailPage` | `SERVICE_CENTER` | PanelGuard + PermissionGuard | Lazy | `spares.read` |
| `/service/defective-returns` | `DefectiveReturnsListPage` | `SERVICE_CENTER` | PanelGuard + PermissionGuard | Lazy | `returns.read` |
| `/service/defective-returns/:id` | `DefectiveReturnsDetailPage` | `SERVICE_CENTER` | PanelGuard + PermissionGuard | Lazy | `returns.read` |

### Service Role Default Redirects

| Role | `/service` redirect |
|------|---------------------|
| `CUSTOMER_SUPPORT` | `/service/dashboard` |
| `SERVICE_CENTER` | `/service/complaints` |

---

## Customer Panel (`/customer`)

**Panel Route File:** `routes/customer/CustomerRoutes.jsx`
**Panel Chunk:** Lazy (`CustomerPanel`)
**Panel Roles:** `CUSTOMER`
**Layout:** `CustomerLayout`
**Suspense Fallback:** `CustomerPanelSkeleton`

| Path | Component | Roles | Guard | Lazy | Permission |
|------|-----------|-------|-------|------|------------|
| `/customer` | Redirect → `/customer/dashboard` | `CUSTOMER` | PanelGuard | Eager | — |
| `/customer/dashboard` | `CustomerDashboardPage` | `CUSTOMER` | PanelGuard | Lazy | — |
| `/customer/orders` | `OrderListPage` | `CUSTOMER` | PanelGuard | Lazy | `orders.read` |
| `/customer/orders/:id` | `OrderDetailPage` | `CUSTOMER` | PanelGuard | Lazy | `orders.read` |
| `/customer/warranty` | `CustomerWarrantyListPage` | `CUSTOMER` | PanelGuard | Lazy | `warranty.read` |
| `/customer/warranty/:id` | `CustomerWarrantyDetailPage` | `CUSTOMER` | PanelGuard | Lazy | `warranty.read` |
| `/customer/service-requests` | `ServiceRequestListPage` | `CUSTOMER` | PanelGuard | Lazy | `service-requests.read` |
| `/customer/service-requests/new` | `ServiceRequestNewPage` | `CUSTOMER` | PanelGuard + PermissionGuard | Lazy | `service-requests.create` |
| `/customer/service-requests/:id` | `ServiceRequestDetailPage` | `CUSTOMER` | PanelGuard | Lazy | `service-requests.read` |

---

## Shared / Error Routes

| Path | Component | Roles | Guard | Lazy | Layout |
|------|-----------|-------|-------|------|--------|
| `/unauthorized` | `UnauthorizedPage` | All | None | Lazy | `PublicLayout` |
| `/not-found` | `NotFoundPage` | All | None | Lazy | `PublicLayout` |
| `/maintenance` | `MaintenancePage` | All | None | Lazy | `PublicLayout` |
| `/server-error` | `ServerErrorPage` | All | None | Lazy | `PublicLayout` |
| `/*` | Redirect → `/not-found` | All | None | Eager | None |

---

## Route Meta Schema

Every route definition carries meta for breadcrumbs, titles, and permissions:

```javascript
// Example route definition in AdminRoutes.jsx
{
  path: 'warehouses/:id/grn',
  element: <GRNPage />,
  lazy: () => import('@/pages/admin/warehouses/GRNPage'),
  meta: {
    title: 'Goods Receipt',
    breadcrumb: ['Warehouses', ':warehouseName', 'GRN'],
    permission: 'grn.read',
    panel: 'admin',
    engine: 'inventory',  // which business engine
  }
}
```

---

## Code Splitting Chunks

| Chunk Name | Entry | Approx Contents |
|------------|-------|-----------------|
| `vendor-react` | Vite manual chunk | react, react-dom, react-router-dom |
| `vendor-state` | Vite manual chunk | zustand, @tanstack/react-query |
| `vendor-ui` | Vite manual chunk | framer-motion, recharts, lucide-react |
| `panel-admin` | `routes/admin/AdminRoutes` | All admin pages |
| `panel-dealer` | `routes/dealer/DealerRoutes` | All dealer pages |
| `panel-employee` | `routes/employee/EmployeeRoutes` | All employee pages |
| `panel-service` | `routes/service/ServiceRoutes` | All service pages |
| `panel-customer` | `routes/customer/CustomerRoutes` | All customer pages |
| `auth` | Auth pages | Login, forgot, reset, session-expired |
| `shared` | Error pages | 401, 404, 500, maintenance |

### Per-Page Lazy Loading Pattern

```javascript
// routes/admin/AdminRoutes.jsx
const AdminDashboardPage = lazy(() => import('@/pages/admin/AdminDashboardPage'));
const WarehouseListPage = lazy(() => import('@/pages/admin/warehouses/WarehouseListPage'));
// ... each major page is its own dynamic import
```

---

## Sidebar Navigation Mapping

| Panel | Nav Item | Route | Badge Source |
|-------|----------|-------|--------------|
| Admin | Dashboard | `/admin/dashboard` | — |
| Admin | Warehouses | `/admin/warehouses` | — |
| Admin | Dispatch | `/admin/dispatch` | `dispatch.pending` count |
| Admin | Inventory | `/admin/inventory` | `inventory.lowStock` count |
| Admin | Dealers | `/admin/dealers` | — (MASTER_ADMIN only) |
| Admin | Employees | `/admin/employees` | — (MASTER_ADMIN only) |
| Admin | Settings | `/admin/settings` | — (MASTER_ADMIN only) |
| Admin | Audit Logs | `/admin/audit-logs` | — (MASTER_ADMIN only) |
| Dealer | Dashboard | `/dealer/dashboard` | — (DEALER_ADMIN only) |
| Dealer | Inventory | `/dealer/inventory` | — |
| Dealer | Billing | `/dealer/billing` | — |
| Dealer | Invoices | `/dealer/invoices` | — |
| Dealer | Warranty | `/dealer/warranty` | — |
| Dealer | Team | `/dealer/team` | — (DEALER_ADMIN only) |
| Employee | Dashboard | `/employee/dashboard` | — |
| Employee | Tasks | `/employee/tasks` | `tasks.pending` count |
| Employee | Reports | `/employee/reports` | — |
| Employee | Team | `/employee/team` | — (MANAGER only) |
| Employee | Approvals | `/employee/approvals` | `approvals.pending` count |
| Service | Dashboard | `/service/dashboard` | — (CUSTOMER_SUPPORT only) |
| Service | Complaints | `/service/complaints` | `complaints.open` count |
| Service | Spare Parts | `/service/spare-parts` | — (SERVICE_CENTER only) |
| Service | Defective Returns | `/service/defective-returns` | — (SERVICE_CENTER only) |
| Customer | Dashboard | `/customer/dashboard` | — |
| Customer | Orders | `/customer/orders` | — |
| Customer | Warranty | `/customer/warranty` | — |
| Customer | Service Requests | `/customer/service-requests` | — |
