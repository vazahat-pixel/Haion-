# OUTPUT 10 — AI CODE GENERATION RULES

> Rules for every future AI-assisted code generation session. These ensure consistency, prevent regressions, and enforce architecture across all future prompts.

---

## Preamble

When generating code for this Dealer Inventory ERP frontend, you are bound by this specification. The Master Prompt (v2.0) and Outputs 1–9 are the source of truth. If a user request conflicts with these rules, flag the conflict and propose an architecture-compliant alternative.

**Tech stack is locked.** No exceptions without explicit user approval and blueprint update.

---

## RULE SET 1 — FILE PLACEMENT

| Rule ID | Rule |
|---------|------|
| FP-01 | Every new page goes in `pages/{panel}/` and is registered in `routes/{panel}/{Panel}Routes.jsx` |
| FP-02 | Every new business feature goes in `modules/{domain}/` following the module structure (components, hooks, queries, schemas, utils, index.js) |
| FP-03 | Every new reusable UI component goes in `components/{category}/` — never in a module unless truly module-specific |
| FP-04 | Every new Zod schema goes in `schemas/{domain}.schema.js` or `modules/{domain}/schemas/` |
| FP-05 | Every new API service function goes in `services/{domain}.service.js` |
| FP-06 | Every new TanStack Query hook goes in `modules/{domain}/queries/` |
| FP-07 | Every new Zustand store change goes in the existing store file — do not create new stores without blueprint update |
| FP-08 | Every new constant goes in the appropriate `constants/` file |
| FP-09 | Every new utility goes in `utils/` (global) or `modules/{domain}/utils/` (module-specific) |
| FP-10 | Every new route path constant goes in `constants/routes.js` |
| FP-11 | JSDoc type definitions go in `types/{domain}.types.js` |
| FP-12 | Never create files outside the folder tree defined in Output 1 |

---

## RULE SET 2 — IMPORTS

| Rule ID | Rule |
|---------|------|
| IM-01 | Pages import modules ONLY via `import { X } from '@/modules/{domain}'` (the `index.js` public API) |
| IM-02 | Modules NEVER import from other modules |
| IM-03 | Modules import from: `components/`, `hooks/`, `store/`, `services/`, `utils/`, `constants/`, `schemas/`, `validators/` |
| IM-04 | Use `@/` path alias for all imports — never relative paths crossing top-level directories |
| IM-05 | Icons: `import { IconName } from 'lucide-react'` — never `import * as` |
| IM-06 | Query keys: `import { queryKeys } from '@/services/api/queryKeys'` — never hardcode strings |
| IM-07 | Endpoints: `import { endpoints } from '@/services/api/endpoints'` — never hardcode URLs |
| IM-08 | Status values: `import { INVENTORY_STATUS } from '@/constants/status'` — never string literals |
| IM-09 | Roles: `import { ROLES } from '@/constants/roles'` — never string literals |
| IM-10 | Permissions: `import { PERMISSIONS } from '@/constants/permissions'` — never string literals |
| IM-11 | Routes: `import { ROUTES } from '@/constants/routes'` — never hardcode paths |
| IM-12 | Messages: `import { MESSAGES } from '@/constants/messages'` — never hardcode UI copy |
| IM-13 | Toast: `import { toast } from '@/utils/toast'` — never import from `sonner` directly |
| IM-14 | Class merging: `import { cn } from '@/utils/cn'` — never import `clsx` or `tailwind-merge` directly |
| IM-15 | Date formatting: `import { formatDate, formatRelative } from '@/utils/format'` — never import `date-fns` in components |

---

## RULE SET 3 — COMPONENTS

| Rule ID | Rule |
|---------|------|
| CP-01 | Every table MUST use `DataTable` — never raw `<table>` |
| CP-02 | Every form MUST use React Hook Form + Zod + `FormField` wrapper |
| CP-03 | Every list page MUST handle three states: loading (`TableSkeleton`), empty (`EmptyState`), error (`ErrorState`) |
| CP-04 | Every detail page MUST handle loading (`PageSkeleton`) and error (`ErrorState`) |
| CP-05 | Every status display MUST use `StatusBadge` with values from `constants/status.js` |
| CP-06 | Every page MUST have `PageHeader` with title and optional actions |
| CP-07 | Every dashboard MUST follow the universal layout: KPI row → charts → table/feed |
| CP-08 | Every modal MUST use `Modal` or `Drawer` — never custom overlay divs |
| CP-09 | Every confirmation MUST use `ConfirmDialog` — destructive actions use `variant="destructive"` |
| CP-10 | Every currency display MUST use `formatCurrency()` from `utils/format.js` with `en-IN` locale |
| CP-11 | Every date display MUST use `formatDate()` or `formatRelative()` from `utils/format.js` |
| CP-12 | Every numeric table column MUST have `tabular-nums` class |
| CP-13 | Every card MUST use one of three variants: `CardBase`, `CardElevated`, `CardGlass` |
| CP-14 | Every exportable table MUST include export button triggering `ExportDialog` |
| CP-15 | Every filterable table MUST sync filters with `filters.store` and URL params |
| CP-16 | Every new shadcn/ui component MUST be added to `components/ui/` following existing patterns |
| CP-17 | Every page transition MUST be wrapped in `MotionPage` |
| CP-18 | Every permission-gated UI element MUST use `PermissionGuard` or `usePermission()` hook |

---

## RULE SET 4 — DATA FETCHING

| Rule ID | Rule |
|---------|------|
| DF-01 | All server data MUST use TanStack Query — never `useEffect` + `fetch` |
| DF-02 | All query keys MUST use `queryKeys` factory from `services/api/queryKeys.js` |
| DF-03 | All API calls MUST go through domain service functions — never direct `axios` in hooks |
| DF-04 | All list queries MUST use `keepPreviousData` (placeholderData) to prevent loading flash |
| DF-05 | All list queries MUST accept pagination params: `page`, `perPage`, `sort`, `order`, `search` |
| DF-06 | All mutations MUST invalidate affected query keys in `onSettled` |
| DF-07 | All optimistic mutations MUST save previous data in `onMutate` and rollback in `onError` |
| DF-08 | All dashboard KPI queries MUST set `refetchInterval: 60_000` |
| DF-09 | All notification queries MUST set `refetchInterval: 30_000` |
| DF-10 | All detail queries MUST set `staleTime: 60_000` minimum |
| DF-11 | All list queries MUST set `staleTime: 30_000` minimum |
| DF-12 | All search queries MUST be debounced (300ms) and enabled only when `query.length >= 2` |
| DF-13 | Prefetch detail on table row hover with 200ms debounce |
| DF-14 | Cross-module invalidation MUST be explicit — list all affected keys in mutation `onSettled` |

---

## RULE SET 5 — FORMS

| Rule ID | Rule |
|---------|------|
| FM-01 | Every form MUST have a corresponding Zod schema |
| FM-02 | Every form MUST use `useForm({ resolver: zodResolver(schema) })` |
| FM-03 | Every form field MUST be wrapped in `FormField` with label, error, and description |
| FM-04 | Every form MUST use `FormLayout` → `FormSection` → `FormField` → `FormActions` hierarchy |
| FM-05 | Server validation errors (422) MUST be mapped to fields via `setError()` — never toast-only |
| FM-06 | Field validation: on blur for first interaction, on change after first error |
| FM-07 | Form-level validation: on submit attempt only |
| FM-08 | Long forms (>5 fields) MUST use `useAutoSave` with `draft.store` |
| FM-09 | Multi-step forms MUST use `Stepper` with step persisted in URL `?step=N` and `draft.store` |
| FM-10 | GSTIN fields MUST use `GSTINInput` component |
| FM-11 | Phone fields MUST use `PhoneInput` component |
| FM-12 | Currency fields MUST use `CurrencyInput` component |
| FM-13 | Address fields MUST use `AddressInput` component |
| FM-14 | File fields MUST use `FileUpload` component |
| FM-15 | Entity pickers (dealer, product, employee) MUST use `SearchSelect` with async search |
| FM-16 | Date ranges MUST use `DateRangePicker` with standard presets |
| FM-17 | Submit button MUST be disabled while mutation is pending |
| FM-18 | Cancel button MUST navigate back or close drawer/modal |

---

## RULE SET 6 — ROUTING & AUTH

| Rule ID | Rule |
|---------|------|
| RT-01 | Every new route MUST be added to the appropriate `routes/{panel}/{Panel}Routes.jsx` |
| RT-02 | Every new route MUST be lazy-loaded via `React.lazy()` |
| RT-03 | Every new route MUST specify `meta` with title, breadcrumb, permission, panel, engine |
| RT-04 | Every protected route MUST be behind `AuthGuard` → `PanelGuard` |
| RT-05 | Every role-restricted route MUST have `PermissionGuard` with explicit permission |
| RT-06 | Every new route path MUST be added to `constants/routes.js` |
| RT-07 | Every new sidebar nav item MUST be added to `config/panels.config.js` |
| RT-08 | Never add routes outside the 5 panels + auth + shared error routes |
| RT-09 | Post-login redirect for new roles MUST be added to redirect logic in `Router.jsx` |
| RT-10 | Session expiry MUST save current path to `session.store` before redirect |

---

## RULE SET 7 — STATE MANAGEMENT

| Rule ID | Rule |
|---------|------|
| ST-01 | Server data → TanStack Query. UI state → Zustand. Never mix. |
| ST-02 | Never create a new Zustand store — use existing stores |
| ST-03 | Never import one store from another — coordinate via hooks |
| ST-04 | Use selectors to read store state: `useAuthStore(selectUser)` — never `useAuthStore()` for single field |
| ST-05 | Filters MUST use `filters.store` synced with URL — never `useState` for filters |
| ST-06 | Theme MUST use `theme.store` — never local state for dark mode |
| ST-07 | Modal stack MUST use `modal.store` for global modals |
| ST-08 | Form drafts MUST use `draft.store` with 24h TTL |
| ST-09 | Permission checks MUST use `permission.store` via `usePermission()` — never check role strings |
| ST-10 | Sidebar state MUST use `sidebar.store` — never local state |

---

## RULE SET 8 — STYLING

| Rule ID | Rule |
|---------|------|
| SL-01 | Tailwind CSS only — no inline styles, no CSS modules, no styled-components |
| SL-02 | Colors via CSS variables / Tailwind tokens — never hardcoded hex values |
| SL-03 | Typography via type scale tokens — never arbitrary `text-[13px]` |
| SL-04 | Spacing via spacing scale — never arbitrary `mt-[13px]` |
| SL-05 | `cn()` for conditional classes — never template literal class concatenation |
| SL-06 | Dark mode via `[data-theme="dark"]` tokens — never separate dark classes |
| SL-07 | Responsive design via Tailwind breakpoints — never JS media query for layout (except sidebar) |
| SL-08 | `tabular-nums` on all numeric displays |
| SL-09 | `uppercase tracking-wider text-xs` on table column headers |
| SL-10 | Elevation via shadow tokens — never colored backgrounds for elevation |

---

## RULE SET 9 — ANIMATION

| Rule ID | Rule |
|---------|------|
| AN-01 | Page transitions: Framer Motion `pageEnter` variant via `MotionPage` |
| AN-02 | Simple enter/exit/fade: Framer Motion variants from `animations/motion.config.js` |
| AN-03 | Timelines, countups, scroll-triggered: GSAP from `animations/gsap.config.js` |
| AN-04 | All animations MUST respect `prefers-reduced-motion` via `ReducedMotionProvider` |
| AN-05 | Never animate on data refetch — only first mount |
| AN-06 | KPI counter animation: GSAP `animateCounter` on first load only |
| AN-07 | Duration limits: micro 120ms, standard 200ms, page 350ms, dramatic 500ms max |
| AN-08 | Never animate more than 2 CSS properties per element |
| AN-09 | Toast animations: handled by Sonner — do not customize |
| AN-10 | Skeleton animations: CSS `@keyframes` pulse only |

---

## RULE SET 10 — MODULE DEVELOPMENT

| Rule ID | Rule |
|---------|------|
| MD-01 | Every new module MUST have: `components/`, `hooks/`, `queries/`, `schemas/`, `utils/`, `index.js` |
| MD-02 | Every module MUST export its public API via `index.js` |
| MD-03 | Every module MUST have a `columns.config.js` if it has a table |
| MD-04 | Every module MUST define its query keys in the central `queryKeys.js` factory |
| MD-05 | Every module MUST have a service file in `services/{domain}.service.js` |
| MD-06 | Every module MUST have a Zod schema in `schemas/{domain}.schema.js` |
| MD-07 | Every module MUST have status values in `constants/status.js` |
| MD-08 | Every module MUST have permission constants in `constants/permissions.js` |
| MD-09 | Cross-module side effects MUST use query invalidation — never direct data access |
| MD-10 | Module components MUST NOT import from `pages/` |

---

## RULE SET 11 — ERROR HANDLING

| Rule ID | Rule |
|---------|------|
| EH-01 | App-level: `AppErrorBoundary` catches unhandled errors |
| EH-02 | Panel-level: `RouteErrorBoundary` per panel route |
| EH-03 | Section-level: `SectionErrorBoundary` per page section |
| EH-04 | Query-level: `QueryErrorBoundary` per data fetch |
| EH-05 | 401: interceptor handles refresh → session expired redirect |
| EH-06 | 403: `PermissionGuard` fallback or `ErrorState` with permission message |
| EH-07 | 404 (detail): render `EmptyState` (resource not found) — not `ErrorState` |
| EH-08 | 404 (list): render `EmptyState` — not error |
| EH-09 | 422: map to form fields — not toast |
| EH-10 | 500: `ErrorState` with retry button |
| EH-11 | Network offline: `OfflineBanner` + inline retry |
| EH-12 | Timeout: inline error with retry — not full-page error |
| EH-13 | Never show raw error messages to users — use `constants/messages.js` |

---

## RULE SET 12 — NAMING CONVENTIONS

| Rule ID | Rule |
|---------|------|
| NC-01 | Components: PascalCase — `InventoryTable.jsx` |
| NC-02 | Hooks: camelCase with `use` prefix — `useInventoryList.js` |
| NC-03 | Stores: camelCase with `.store.js` suffix — `auth.store.js` |
| NC-04 | Services: camelCase with `.service.js` suffix — `inventory.service.js` |
| NC-05 | Schemas: camelCase with `.schema.js` suffix — `inventory.schema.js` |
| NC-06 | Constants files: camelCase with `.js` suffix — `status.js` |
| NC-07 | Constant values: SCREAMING_SNAKE_CASE — `IN_STOCK`, `MASTER_ADMIN` |
| NC-08 | Query hooks: `use{Domain}{Action}` — `useInventoryList`, `useCreateBilling` |
| NC-09 | Mutation hooks: `use{Action}{Domain}` — `useCreateBilling`, `useUpdateComplaintStatus` |
| NC-10 | Pages: PascalCase with `Page` suffix — `InventoryListPage.jsx` |
| NC-11 | Layouts: PascalCase with `Layout` suffix — `AdminLayout.jsx` |
| NC-12 | CSS variables: kebab-case with category prefix — `--color-brand-500` |
| NC-13 | Query key segments: camelCase — `['inventory', 'list', filters]` |
| NC-14 | API endpoints: kebab-case — `/api/inventory/low-stock` |
| NC-15 | Form IDs for drafts: kebab-case — `billing-new`, `complaint-edit-{id}` |

---

## RULE SET 13 — PANEL-SPECIFIC RULES

| Rule ID | Rule |
|---------|------|
| PN-01 | Admin panel: MASTER_ADMIN sees all; WAREHOUSE_MANAGER scoped to warehouse |
| PN-02 | Dealer panel: DEALER_ADMIN sees dashboard + team; DEALER_SALES sees inventory + own billing |
| PN-03 | Employee panel: MANAGER sees team + approvals; EMPLOYEE sees tasks only |
| PN-04 | Service panel: CUSTOMER_SUPPORT sees dashboard + creates complaints; SERVICE_CENTER sees complaints + spares + returns |
| PN-05 | Customer panel: simplified UI, consumer-grade feel, no operational complexity |
| PN-06 | Never bleed admin features into dealer panel or vice versa |
| PN-07 | Role switching (Admin panel) via `RoleSwitcher` — instant with visual context shift |
| PN-08 | Each panel has its own layout, sidebar nav, and dashboard — never shared layout with conditional rendering |
| PN-09 | Customer portal uses `CustomerLayout` with minimal navigation |
| PN-10 | Service panel uses urgency visual signals — color, typography weight, position |

---

## RULE SET 14 — CODE QUALITY

| Rule ID | Rule |
|---------|------|
| CQ-01 | No `console.log` in committed code |
| CQ-02 | No commented-out code |
| CQ-03 | No `TODO` without issue reference: `// TODO(#123): description` |
| CQ-04 | No unused imports or variables |
| CQ-05 | No magic numbers — use named constants |
| CQ-06 | Functions do one thing — if >30 lines, consider splitting |
| CQ-07 | Components do one thing — if >150 lines, extract sub-components |
| CQ-08 | JSDoc on all exported functions, hooks, and components |
| CQ-09 | Match existing code style — read surrounding code before writing |
| CQ-10 | Minimal diff — do not refactor unrelated code in the same change |

---

## AI SESSION WORKFLOW

When asked to implement a feature, follow this sequence:

```
1. IDENTIFY the business engine (Inventory, Revenue, Service, HR/OPS, Analytics)
2. IDENTIFY the panel (Admin, Dealer, Employee, Service, Customer)
3. CHECK Output 1 for correct file placement
4. CHECK Output 2 for route registration
5. CHECK Output 4 for query key and invalidation patterns
6. CHECK Output 5 for required components
7. CHECK Output 9 for anti-patterns to avoid
8. IMPLEMENT in this order:
   a. Schema (Zod)
   b. Service function
   c. Query key (if new domain)
   d. Query/mutation hooks
   e. Module components
   f. Module index.js export
   g. Page composition
   h. Route registration
   i. Sidebar nav item (if new page)
   j. Permission constant (if new permission)
   k. Status constant (if new status)
   l. Route constant
   m. Messages constant (if new copy)
9. VERIFY against anti-patterns registry
10. VERIFY all three page states: loading, empty, error
```

---

## CONFLICT RESOLUTION

| Situation | Action |
|-----------|--------|
| User asks for TypeScript | Decline — JavaScript + JSDoc only. Explain stack is locked. |
| User asks for a new library | Propose solution with existing stack. If impossible, request explicit approval + blueprint update. |
| User asks to import across modules | Refuse — propose query invalidation or page-level composition. |
| User asks for inline styles | Refuse — use Tailwind utilities. |
| User asks for raw `<table>` | Refuse — use `DataTable`. |
| User asks to skip empty/loading states | Refuse — all three states are mandatory. |
| User asks to hardcode status/role strings | Refuse — use constants. |
| User asks to store API data in Zustand | Refuse — use TanStack Query. |
| User's request requires new store | Flag for blueprint update before proceeding. |
| User's request requires new panel | Flag — only 5 panels exist. |

---

## PROMPT TEMPLATE FOR FUTURE SESSIONS

When starting a new implementation session, include this context block:

```
Context: Dealer Inventory ERP Frontend
Blueprint: docs/blueprint/ (Outputs 1-10)
Tech: React + Vite + JS + Tailwind + shadcn/ui + Zustand + TanStack Query v5
Task: [specific feature]
Panel: [admin|dealer|employee|service|customer]
Engine: [inventory|revenue|service|hr|analytics]
Rules: Follow OUTPUT-10-AI-CODE-GENERATION-RULES.md strictly
```
