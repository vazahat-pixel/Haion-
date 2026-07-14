# Haion ERP — QA Assurance Plan

> End-to-end business workflow, panel-wise test matrix, and automated QA scripts.

---

## 1. System overview

Haion ERP is a **multi-panel B2B2C platform** for dealer inventory, warehouse operations, field sales, after-sales service, customer self-service, and an online store.

| Surface | URL | Roles |
|---------|-----|-------|
| **Admin** | `/admin/*` | Master Admin, Warehouse Manager |
| **Dealer** | `/dealer/*` | Dealer Admin, Dealer Sales |
| **Employee** | `/employee/*` | Employee, Manager |
| **Service** | `/service/*` | Customer Support, Service Center |
| **Customer** | `/customer/*` | Customer (logged in) |
| **Public** | `/landing`, `/customer/access`, `/support/complaint`, `/warranty/check` | Guest |

**Default test password (seed):** `password`

| Role | Email |
|------|-------|
| Master Admin | `admin@haion.com` |
| Warehouse Manager | `warehouse@haion.com` |
| Dealer Admin | `dealer@haion.com` |
| Dealer Sales | `sales@haion.com` |
| Employee | `employee@haion.com` |
| Manager | `manager@haion.com` |
| Customer Support | `support@haion.com` |
| Service Center | `service@haion.com` |
| Customer | `customer@haion.com` |

---

## 2. Complete business workflow (end-to-end)

### Flow A — Inbound supply chain (Admin)

```
Supplier shipment
    → Admin creates GRN (/admin/grn)
    → Warehouse verifies GRN
    → Warehouse stock updated (/admin/inventory)
    → Stock movement logged (/admin/stock-movements)
```

**QA checkpoints:**
- [ ] GRN line items match received quantity
- [ ] Inventory quantity increases after verification
- [ ] Low-stock alert appears when below reorder level
- [ ] Warehouse manager cannot access dealer onboarding

---

### Flow B — Outbound to dealer (Admin → Dealer)

```
Warehouse stock
    → Admin creates Dispatch (/admin/dispatch)
    → Status: CREATED → PICKED → PACKED → DISPATCHED → IN_TRANSIT
    → Dealer sees dispatch (/dealer/dispatches)
    → Dealer confirms GRN (/dealer/grn) — partial receipt supported
    → Dealer inventory increases (/dealer/inventory)
```

**QA checkpoints:**
- [ ] Dispatch deducts warehouse stock
- [ ] Dealer GRN shows qty discrepancy if partial
- [ ] Stale dispatch (>7 days) appears on admin dashboard alert
- [ ] Dealer sales user can receive GRN but not manage team

---

### Flow C — Dealer sales & warranty (Dealer)

```
Dealer stock
    → Create bill DRAFT (/dealer/billing/new)
    → Send bill → status SENT
        → Invoice auto-created
        → Warranty registered (on SEND, not on PAY)
    → Mark PAID → dealer stock deducted
    → Cancel bill → warranty voided
```

**QA checkpoints:**
- [ ] GST calculated correctly (intra/inter state)
- [ ] Stock validation blocks oversell on send
- [ ] Invoice PDF downloads
- [ ] Warranty certificate available after send
- [ ] Quick Sale (`/dealer/sales/quick`) works on mobile

---

### Flow D — After-sales service (Public/Customer → Service)

```
Customer issue
    → Public complaint (/support/complaint) OR customer service request
    → Support handles complaint (/service/complaints)
    → Service ticket lifecycle (/service/tickets)
    → Spare parts request (/service/spare-parts)
    → Defective return (/service/defective-returns)
```

**QA checkpoints:**
- [ ] Public complaint validates bill number
- [ ] Service center can dispatch spares
- [ ] Overdue spare dispatch flagged (>5 days)
- [ ] Return overdue flagged (>7 days)

---

### Flow E — Field sales (Employee → Manager)

```
HQ assigns dealers to employee
    → Employee views assigned dealers (/employee/dealers)
    → Red/green zone analytics (/employee/dealer-analytics)
    → Manager sees team rollup (/employee/team)
    → Manager approves requests (/employee/approvals)
```

**QA checkpoints:**
- [ ] Employee only sees assigned dealers
- [ ] Manager sees team hierarchy
- [ ] Performance metrics load without errors

---

### Flow F — Online store (Public → Admin → Customer)

```
Landing page (/landing)
    → Browse CMS products
    → Add to cart → Checkout
    → Payment: COD or Razorpay
    → Order appears in Admin (/admin/store-orders)
    → Customer tracks order (/customer/orders or track modal)
```

**QA checkpoints:**
- [ ] CMS draft products hidden on public API
- [ ] COD creates CONFIRMED order
- [ ] Razorpay verify updates payment status
- [ ] Admin can update fulfillment status
- [ ] Stock decrements on paid/confirmed order

---

### Flow G — Customer portal (Guest + Authenticated)

```
Guest: /customer/access (customer ID + phone OR bill number)
    → Mobile hub: products, warranty, service

Authenticated: /customer/dashboard
    → Orders, warranty, service requests, notifications
```

**QA checkpoints:**
- [ ] Guest access without JWT works
- [ ] Wrong phone/bill rejected
- [ ] Logged-in customer sees own data only

---

## 3. Panel-wise manual QA matrix

### Admin panel (`/admin`)

| Module | Route | Test actions |
|--------|-------|--------------|
| Dashboard | `/admin/dashboard` | KPIs, alerts, widgets load |
| Products | `/admin/products` | CRUD, search, filters |
| Warehouses | `/admin/warehouses` | List, create, GRN link |
| GRN | `/admin/grn` | Create, verify, reject |
| Dispatch | `/admin/dispatch` | Create, status updates |
| Inventory | `/admin/inventory` | Stock levels, filters |
| Stock movements | `/admin/stock-movements` | Transfer between warehouses |
| Dealers | `/admin/dealers` | Onboarding wizard, GST expiry |
| Employees | `/admin/employees` | CRUD, role assignment |
| Billing (view) | — | Cross-check dealer bills |
| Expenses | `/admin/expenses` | Create, approve |
| Approvals | `/admin/approvals` | Pending queue |
| Reports | `/admin/reports` | Generate, scheduled delivery |
| Website CMS | `/admin/cms` | Edit content, publish |
| Store orders | `/admin/store-orders` | Filters, detail drawer, status |
| Settings | `/admin/settings` | GST, notifications, roles |
| Audit logs | `/admin/audit-logs` | Login/actions recorded |

### Dealer panel (`/dealer`)

| Module | Route | Test actions |
|--------|-------|--------------|
| Dashboard | `/dealer/dashboard` | Revenue KPIs (admin only) |
| Quick Sale | `/dealer/sales/quick` | Fast billing |
| Dispatches | `/dealer/dispatches` | Tracking timeline |
| GRN | `/dealer/grn` | Confirm full/partial |
| Inventory | `/dealer/inventory` | Stock on hand |
| Customers | `/dealer/customers` | CRM list |
| Billing | `/dealer/billing` | Draft → Send → Pay |
| Invoices | `/dealer/invoices` | PDF export |
| Warranty | `/dealer/warranty` | Certificates |
| Team | `/dealer/team` | Targets (dealer admin) |
| Reports | `/dealer/reports` | Sales reports |

### Employee panel (`/employee`)

| Module | Route | Test actions |
|--------|-------|--------------|
| Dashboard | `/employee/dashboard` | Overview |
| Dealers | `/employee/dealers` | Assigned list, drilldown |
| Analytics | `/employee/dealer-analytics` | Red/green zones |
| Performance | `/employee/performance` | Metrics |
| Tasks | `/employee/tasks` | CRUD tasks |
| Team | `/employee/team` | Manager only |
| Approvals | `/employee/approvals` | Manager only |

### Service panel (`/service`)

| Module | Route | Test actions |
|--------|-------|--------------|
| Dashboard | `/service/dashboard` | Support KPIs |
| Tickets | `/service/tickets` | Full lifecycle |
| Complaints | `/service/complaints` | Escalation |
| Spare parts | `/service/spare-parts` | Request → dispatch |
| Returns | `/service/defective-returns` | Receive, verify |

### Customer panel (`/customer`)

| Module | Route | Test actions |
|--------|-------|--------------|
| Dashboard | `/customer/dashboard` | Summary cards |
| Products | `/customer/products` | Registered products |
| Orders | `/customer/orders` | History + tracking |
| Warranty | `/customer/warranty` | Status, lookup |
| Service | `/customer/service-requests` | Raise + track |

### Public

| Route | Test actions |
|-------|--------------|
| `/landing` | CMS content, cart, checkout |
| `/customer/access` | Guest hub access |
| `/support/complaint` | Public form |
| `/warranty/check` | Bill lookup |
| `/auth/login` | All 9 roles redirect correctly |

---

## 4. Automated test suite

### Backend API QA (`backend/tests/qa/`)

| File | Coverage |
|------|----------|
| `auth-roles.test.js` | All 9 logins, RBAC isolation |
| `admin-panel.test.js` | Admin + warehouse manager endpoints |
| `dealer-panel.test.js` | Dealer admin + sales endpoints |
| `employee-service-customer.test.js` | Employee, manager, service, customer |
| `public-workflows.test.js` | Public APIs, store checkout, supply chain reads |

**Run:**
```bash
cd backend
npm run seed          # first time — full demo data
npm run test:qa       # panel-wise API QA
npm test              # all tests including QA
```

### Frontend E2E (`frontend/e2e/`)

Playwright tests for UI smoke per panel:
- Login redirect per role
- Dashboard/page loads without console errors
- Public landing loads

**Run:**
```bash
cd frontend
npm run test:e2e        # headless
npm run test:e2e:ui     # interactive UI mode
```

**Prerequisites:** Backend on `:3000`, frontend on `:5173` (or let Playwright auto-start).

### Full QA runner (Windows)

```powershell
.\scripts\run-qa.ps1
```

---

## 5. QA sign-off checklist

Before production release, confirm:

- [ ] `npm test` passes in `backend/` (all API tests green)
- [ ] `npm run test:qa` passes (panel smoke)
- [ ] `npm run test:e2e` passes (UI smoke)
- [ ] `npm run build` passes in `frontend/`
- [ ] Seed users login manually for each panel
- [ ] Full Flow B (dispatch → dealer GRN) walkthrough
- [ ] Full Flow C (bill → invoice → warranty) walkthrough
- [ ] Store checkout COD + Razorpay (test keys)
- [ ] RBAC: wrong role gets 403 on restricted pages
- [ ] Mobile responsive check on dealer Quick Sale + customer hub
- [ ] `.env` secrets not committed; Razorpay live keys only in production

---

## 6. Test data reset

```bash
cd backend
npm run seed
```

Re-runs seed script — upserts users, demo dealers, inventory, bills, and workflows.
