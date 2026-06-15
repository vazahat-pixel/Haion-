# V3 Frontend Transformation — Audit & Plan

> Generated from codebase analysis + `docs/blueprint/` (PRD proxy).  
> Status date: 2026-06-10

---

## 1. Current Frontend Audit Report

### Summary

| Classification | Count | Notes |
|----------------|-------|-------|
| **COMPLETE** | 8 | Auth, guards, layouts, shell, basic tables/forms wired |
| **PARTIAL** | 46 | List/detail pages with mock data, basic KPI + 1 chart |
| **PLACEHOLDER** | 0 | No empty PageShell-only pages (wired to modules) |
| **BROKEN** | 0 | Build passes; auth/panel guards fixed |
| **MISSING ROUTES** | 35+ | PRD modules without routes (Products, GRN dealer, Customers, etc.) |

### Per-Panel Screen Inventory

#### Admin (`/admin`) — 18 routes

| Route | Status | Gap |
|-------|--------|-----|
| `/admin/dashboard` | PARTIAL | 4 KPIs + 1 bar chart; missing activity feed, alerts, quick actions, date filters |
| `/admin/warehouses` | PARTIAL | Basic table; no filters, bulk, export |
| `/admin/warehouses/:id` | PARTIAL | Key-value detail only |
| `/admin/warehouses/:id/grn` | PARTIAL | Simple form; no line items, verification workflow |
| `/admin/dispatch` | PARTIAL | Basic table |
| `/admin/dispatch/:id` | PARTIAL | Basic detail |
| `/admin/inventory` | PARTIAL | Table + mock; no CRUD drawer |
| `/admin/inventory/:id` | PARTIAL | Basic detail |
| `/admin/dealers` | PARTIAL | Table + onboarding form |
| `/admin/dealers/:id` | PARTIAL | Basic detail |
| `/admin/dealers/onboarding` | PARTIAL | Single-step form |
| `/admin/employees` | PARTIAL | Table only |
| `/admin/employees/:id` | PARTIAL | Basic detail |
| `/admin/settings/*` | PARTIAL | 3 settings forms |
| `/admin/audit-logs` | PARTIAL | Table only |

**Missing PRD modules (no route):** Products, Categories, Brands, Product Tiers, Pricing, GRN Monitoring, Managers, Expenses, Reports, Notifications hub

#### Dealer (`/dealer`) — 13 routes

| Route | Status | Gap |
|-------|--------|-----|
| All dealer routes | PARTIAL | Mock tables/forms; billing not multi-line invoice UX |
| — | MISSING | Incoming Dispatches, GRN, Customers, Reports routes |

#### Employee (`/employee`) — 8 routes

| Route | Status | Gap |
|-------|--------|-----|
| All routes | PARTIAL | No dealer cards, red/green zones, drilldowns |
| — | MISSING | Assigned Dealers, Dealer Analytics, Performance modules per PRD |

#### Service (`/service`) — 9 routes

| Route | Status | Gap |
|-------|--------|-----|
| All routes | PARTIAL | No SLA, timelines, escalation UI |
| — | MISSING | Ticket lifecycle pages distinct from complaints |

#### Customer (`/customer`) — 8 routes

| Route | Status | Gap |
|-------|--------|-----|
| All routes | PARTIAL | Not mobile-first; no warranty lookup/download flow |
| — | MISSING | Dedicated warranty lookup, complaint tracking UX |

---

## 2. PRD Coverage Gap Report

### Missing Screens (high priority)

- Admin: Products, Categories, Brands, Tiers, Pricing, Expenses, Reports, Notifications
- Dealer: Dispatches inbox, GRN, Customers, Reports
- Employee: Assigned Dealers, Dealer Analytics, Performance
- Service: Ticket detail timeline, SLA dashboard
- Customer: Warranty lookup (public-style), PDF download

### Missing Components

- Enterprise DataTable (sort, filter, search, bulk, export, virtualization)
- Drawer / Sheet forms
- Stepper workflows (onboarding, billing, GRN)
- Activity feed, Timeline, SLA badge
- Command palette (stub exists in features/)
- Global search UI
- Custom SVG illustrations
- Date range filter
- Notification center panel

### Missing Workflows

- Invoice lifecycle (draft → sent → paid)
- GRN verification
- Dispatch tracking
- Complaint escalation + closure
- Warranty eligibility check
- Dealer onboarding multi-step

---

## 3. Transformation Plan (Phased)

### Phase 1 — Premium Foundation (NOW)
- Rebrand design tokens (remove generic blue)
- Upgrade AppShell, Sidebar, Topbar, PageShell, KPICard
- EnterpriseTable toolbar (search + filters)
- Command Center dashboards (all 5 panels)
- SVG empty/error illustrations
- Expand mock datasets

### Phase 2 — Admin Depth ✅ (2026-06-10)
- Products/Categories/Brands/Tiers/Pricing/Expenses/Reports/Notifications routes + CRUD drawers
- GRN Monitoring (`/admin/grn`) + 3-step GRN stepper with line items
- Inventory add drawer, Dispatch tracking timeline
- Admin dashboard: date filter, low-stock + pending GRN widgets
- Topbar notification panel with unread count
- Sheet, Dialog, Stepper, Timeline, DateRangeFilter, DrawerForm primitives

### Phase 3 — Dealer Production UX ✅ (2026-06-10)
- Multi-line billing stepper (Customer → Line Items → GST Review) with draft/send lifecycle
- Customer management (`/dealer/customers`) with drawer create
- Dispatch inbox (`/dealer/dispatches`) + dealer GRN (`/dealer/grn`) with confirm workflow
- Invoice tax preview with print/download mock (`/dealer/invoices/:id`)
- Dealer reports (`/dealer/reports`) + Top Products dashboard widget

### Phase 4 — Employee Panel ✅ (2026-06-10)
- Assigned dealers grid with zone badges (`/employee/dealers`, `/employee/dealers/:id`)
- Dealer analytics panel (`/employee/dealer-analytics`)
- Performance panel with KPIs (`/employee/performance`)
- Employee dashboard quick actions + dealer card preview
- Mock: `employee.js` — assigned dealers, monthly sales, performance analytics

### Phase 5 — Customer Portal ✅ (2026-06-10)
- Mobile-first `CustomerPageShell` + bottom nav (`CustomerBottomNav`)
- Warranty serial lookup (`/customer/warranty/lookup`)
- Warranty certificate print/download on detail
- Service request tracking stepper + timeline on detail

### Phase 6 — Service Panel + QA ✅ (2026-06-10)
- Complaint detail: SLA badge, activity timeline, escalate/resolve actions
- Spare parts + defective returns workflow steppers with advance actions
- Mock timelines/workflows in `service.js`
- Route fix: `complaints/:ticketId` param wired correctly
- Build verified across all 5 panels

---

## 4. Updated Screen Inventory (Post Phase 1)

| Area | Before | After Phase 1 |
|------|--------|---------------|
| Design tokens | Generic blue `#3b82f6` | Violet/graphite premium palette |
| Dashboards (5) | 4 KPIs + 1 bar chart | Command centers: quick actions, alerts, activity feed, area charts |
| Tables (all modules) | Basic DataTable | EnterpriseTable: search, sort, filter, pagination, CSV export |
| Empty/Error states | Lucide icon only | Custom SVG illustrations |
| Sidebar/Topbar | Basic admin shell | Glass topbar, refined nav, notification dot |
| PageShell | Placeholder fallback text | Clean layout only (modules supply content) |

**Still PARTIAL:** Individual module workflows (billing lifecycle, ticket SLA, customer mobile portal, missing PRD routes).

---

## 5. Missing Component Inventory

| Component | Status |
|-----------|--------|
| EnterpriseTable + TableToolbar | ✅ Phase 1 |
| ActivityFeed, AlertWidget, QuickActions | ✅ Phase 1 |
| SVG Illustrations (empty/error) | ✅ Phase 1 (partial set) |
| Drawer / Sheet forms | ❌ Phase 2 |
| Stepper workflows | ❌ Phase 2 |
| Timeline / SLA badge | ✅ Phase 4/6 |
| Command palette (functional) | ❌ Phase 6 |
| Global search | ❌ Phase 6 |
| Date range filter | ❌ Phase 2 |
| Notification center panel | ❌ Phase 2 |
| Column toggle / pinning / virtualization | ❌ Phase 2 |
| Bulk selection toolbar | ❌ Phase 2 |

---

## 6. Missing Workflow Inventory

- Invoice: draft → sent → paid (multi-line, GST) — **Phase 3**
- GRN verification with line items — **Phase 2**
- Dispatch tracking timeline — **Phase 2**
- Complaint escalation + closure — **✅ Phase 6**
- Warranty eligibility lookup — **✅ Phase 5**
- Dealer onboarding multi-step — **Phase 3**
- Employee dealer red/green drilldown — **Phase 4**

---

## 7. Premium Design Upgrade Plan

**Done (Phase 1):** CSS variables, violet brand, warm neutrals, glass surfaces, shadow glow, typography tracking, KPI accent borders, chart gradient fills.

**Next:** Dark mode polish, input/select refinement, dialog/drawer motion, table density modes, customer portal mobile tokens.

---

## 8. Dashboard Upgrade Plan

| Panel | Phase 1 | Remaining |
|-------|---------|-----------|
| Admin | Revenue area chart, alerts, activity, expense breakdown | Date filters, low-stock widget, pending dispatch list |
| Dealer | Quick billing, dispatch alerts | Top products, sales team leaderboard |
| Employee | Green/red zone KPIs | Dealer cards grid, drilldown |
| Service | SLA breach alerts | SLA timeline widget, parts delay list |
| Customer | Warranty alerts | Mobile-first card layout |

---

## 9. Animation Upgrade Plan

**Done:** KPI stagger (Framer Motion), page enter (MotionPage), chart reveal via layout.

**Next:** Drawer/dialog transitions, KPI counter animation, sidebar collapse GSAP, command palette micro-interactions.

---

## 10. SVG Upgrade Plan

**Done:** EmptyBox, Error, Inventory, Search illustrations.

**Next:** Warranty, Support, Dealers, Employees, Customer portal, Success state SVGs.

---

## 11. Component Implementation Order
1. Design tokens + globals.css
2. Illustrations (SVG)
3. EnterpriseTable + TableToolbar
4. CommandCenterDashboard
5. Enhanced PageShell + KPICard
6. Drawer, Dialog, Stepper
7. Per-module upgrades (admin → dealer → employee → service → customer)
8. New routes for PRD gaps
9. Command palette + global search
10. Motion layer

## 12. Refactoring Recommendations

1. **Keep `createListTable` / `createDetailView`** — extend via config (searchKeys, filterKey) rather than per-page duplication.
2. **Centralize dashboard config** — move panel-specific quick actions/alerts into `data/mock/dashboard.config.js` when configs grow.
3. **Add `Sheet` + `Stepper` primitives** before billing/onboarding rewrites.
4. **New PRD routes** — add under existing panel route files; do not restructure router.
5. **Backend readiness** — keep `withMockFallback`; new services follow same pattern as `warehouses.service.js`.
6. **Avoid hardcoded colors** — always use CSS variables / Tailwind `brand-*` / `surface-*` tokens.

---

## 13. Final Frontend Freeze Checklist

- [x] Every existing route renders real UI (no PageShell-only placeholders)
- [x] Generic blue admin theme removed (violet/graphite tokens)
- [x] Tables support search, sort, pagination, export (via EnterpriseTable)
- [ ] All forms use Zod + RHF with dependent fields
- [x] All 5 dashboards upgraded to command centers (Phase 1)
- [ ] Customer portal mobile-first (375px)
- [x] SVG empty/error states (base set)
- [x] Mock data expanded (activities, alerts, charts)
- [ ] Role experiences fully distinct per PRD
- [x] Production build passes
- [ ] Missing PRD modules routed (Products, Customers, Expenses, etc.)
- [ ] No dead links / broken workflows on QA pass

---

*This document is the living source for V3 transformation progress.*
