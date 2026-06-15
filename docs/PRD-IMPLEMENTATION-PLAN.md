# PRD Implementation Plan — Haion Dealer & Inventory ERP

> Source of truth: `PRD_Dealer_Inventory_.pdf` + `docs/blueprint/OUTPUT-08-INTEGRATION-CHECKLIST.md`  
> Status: **In progress** (Phase P0 backend started)

---

## Current State Summary

| Layer | Completion | Notes |
|-------|------------|-------|
| Frontend UI | ~75% | 5 panels, 89 pages, mock-first |
| Backend API | ~75% | P0–P5 platform (RBAC, search, upload, invoice HTML) |
| Integration | ~90% | Core services direct API, upload, PDF, charts |
| Tests | ~85% | `node:test` + supertest + CI pipeline |
| PRD compliance | ~92% | See `docs/PRD-COMPLIANCE-MATRIX.md` |

---

## Phase 1 — PRD Analysis ✅

### Roles (9)
`MASTER_ADMIN`, `WAREHOUSE_MANAGER`, `DEALER_ADMIN`, `DEALER_SALES`, `EMPLOYEE`, `MANAGER`, `CUSTOMER_SUPPORT`, `SERVICE_CENTER`, `CUSTOMER`

### Core Business Flows (PRD)
1. **Inbound:** Supplier → GRN → Warehouse stock
2. **Outbound:** Warehouse → Dispatch → Dealer GRN confirm → Dealer inventory
3. **Sales:** Dealer inventory → Billing (multi-line GST) → Invoice → Warranty
4. **Service:** Complaints → Spares → Returns
5. **Field:** Employee assigned dealers → Analytics → Performance
6. **Customer:** Orders → Warranty lookup → Service requests

---

## Phase 2 — Audit ✅

See `docs/transformation/V3-AUDIT-AND-PLAN.md` and agent audits (backend ~11% → ~25% after P0).

---

## Phase 3 — Backend (in progress)

### Completed
- [x] Auth (JWT + refresh cookie)
- [x] Products + tiers
- [x] Permission middleware (`requirePermission`)
- [x] Warehouses API
- [x] Dealers API
- [x] Inventory API (CRUD, low-stock, categories)
- [x] GRN API (create, verify, reject)
- [x] Dispatch API (status machine, tracking)
- [x] Categories / Brands API
- [x] Dealer panel: `/api/dealer/inventory`, `/dispatches`, `/grn`
- [x] Seed script (users, warehouses, dealers, stock, sample GRN/dispatch)
- [x] MongoDB URI fixed with database name `haion_erp`

### P1 — Billing & Revenue ✅
- [x] Bill, Invoice, Customer, Warranty models
- [x] Billing lifecycle (draft → sent → paid)
- [x] GST util wired to billing + `/api/gst/*`
- [x] Warranty registration on paid bills
- [x] `/api/customers`, `/api/billing`, `/api/invoices`, `/api/warranty`
- [x] `/api/dealer/billing-catalog` for invoice builder

### P2 — Service & Ops ✅
- [x] Complaints, spares, returns, service-requests
- [x] Tasks API
- [x] Analytics dashboard endpoints

### P3 — Admin & Ops ✅
- [x] Employees API + hierarchy/team
- [x] Employee panel: assigned dealers, performance, dealer analytics
- [x] Approvals (list, detail, approve/reject)
- [x] Notifications (list, unread count, mark read)
- [x] Audit logs + login audit trail
- [x] Settings (general, GST, notifications prefs)

### P4 — Commerce & Catalog ✅
- [x] Orders API (customer-scoped, tracking timeline)
- [x] Reports API
- [x] Expenses API (+ auto approval request)
- [x] Pricing rules API
- [x] Dealer team + dealer reports + performance
- [x] Analytics revenue/orders endpoints
- [x] Frontend dealer team wired to API

### P5 — Platform ✅
- [x] Dynamic RBAC (`Role` model, permission service, `/api/rbac/*`)
- [x] Global search API + Topbar search palette (⌘K)
- [x] File upload API (`POST /api/upload`)
- [x] Invoice HTML export (`/invoices/:id/pdf`)
- [x] Frontend: Roles & Permissions admin page
- [x] Frontend: Invoice download wired in `InvoicePreview`
- [x] Backend unit tests (`npm test`)
- [x] PRD compliance matrix (`docs/PRD-COMPLIANCE-MATRIX.md`)

---

## Phase 4 — Frontend Completion

### Completed integration
- [x] Auth → real API
- [x] `VITE_USE_MOCK_API=false` + Vite proxy
- [x] Dealer inventory → `/api/dealer/inventory`
- [x] Mock fallback only when `useMockApi=true` (no silent dev fallback)

### Remaining
- [x] Wire dashboards to `/api/analytics/dashboard/:panel` (KPIs + charts)
- [x] GRN stepper → warehouses + products from API
- [x] Dispatch timeline from `/dispatch/:id/tracking`
- [x] Remove direct `@/data/mock` imports from modules (only `mock.service.js` remains)
- [x] Billing builder → real customers + billing catalog API
- [x] Wire upload into product/dealer forms
- [x] Employee/service/customer dashboard charts from API
- [x] True PDF invoice export (pdfkit)
- [x] CI pipeline (`.github/workflows/ci.yml`)
- [x] System walkthrough (`docs/SYSTEM-WALKTHROUGH.md`)
- [ ] Install MongoDB locally and run full E2E walkthrough

---

## Phase 5–7 — Integration, Testing, PRD Matrix

Tracked in `docs/blueprint/OUTPUT-08-INTEGRATION-CHECKLIST.md` — check off as APIs ship.

---

## Run Instructions

```bash
# Backend
cd backend
npm run seed    # once
npm run dev     # http://localhost:3000/api/health

# Frontend
cd frontend
npm run dev     # http://localhost:5173
```

Login: `admin@haion.com` / `password` (or `dealer@haion.com` for dealer panel)

---

## API Documentation

See `docs/API-REFERENCE.md` (to be generated as modules complete).
