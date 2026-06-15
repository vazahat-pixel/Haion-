# OUTPUT 9 — ANTI-PATTERNS REGISTRY

> Explicit list of patterns that must NEVER appear in this codebase.

---

## Architecture Violations

| # | Anti-Pattern | Correct Pattern | Enforcement |
|---|-------------|-----------------|-------------|
| A1 | Importing from one module into another (`modules/billing` imports `modules/inventory`) | Cross-module data via TanStack Query invalidation or shared store | ESLint `no-restricted-imports` |
| A2 | Importing module internals directly (`import X from '@/modules/inventory/components/InventoryTable'`) | Import only from module public API (`import { InventoryTable } from '@/modules/inventory'`) | ESLint rule on `pages/` and other modules |
| A3 | Business logic inside page components | Logic in module hooks, queries, utils; pages are composition only | Code review |
| A4 | Business logic inside layout components | Layouts handle shell only (sidebar, topbar, content area) | Code review |
| A5 | API calls inside component body (useEffect fetch, not TanStack Query) | All server state via TanStack Query hooks in `modules/*/queries/` | ESLint custom rule |
| A6 | Multiple sources of truth for the same data | Single TanStack Query cache per entity; Zustand for UI state only | Architecture review |
| A7 | Prop drilling more than 2 levels for global state | Zustand store or React Context | Code review |
| A8 | Creating a new Zustand store without architecture approval | Use existing stores; new stores need blueprint update | PR template checklist |
| A9 | Storing server data in Zustand | Server data lives in TanStack Query cache only | Code review |
| A10 | Cross-store imports in Zustand | Coordinate via hooks (`useAuth`, `usePermission`) | ESLint `no-restricted-imports` |

---

## API & Data Layer

| # | Anti-Pattern | Correct Pattern |
|---|-------------|-----------------|
| B1 | Hardcoded API endpoint strings in components or hooks | Use `services/api/endpoints.js` constants |
| B2 | Hardcoded TanStack Query key strings | Use `services/api/queryKeys.js` factory |
| B3 | Calling `axios` directly in components | Use domain service functions (`inventoryService.getList()`) |
| B4 | Automatic retry on POST/PUT/PATCH/DELETE | Retry only on GET; mutations never auto-retry |
| B5 | Ignoring API error responses | Map 422 to form fields; show ErrorState for 500; EmptyState for 404 |
| B6 | Storing access token in localStorage/sessionStorage | Access token in memory only (Zustand auth store) |
| B7 | Manual fetch with no error handling | TanStack Query handles loading/error/success states |
| B8 | Not normalizing API responses | All responses normalized in interceptor to `{ data, meta, pagination }` |
| B9 | Sending raw form data without Zod validation | Validate client-side with Zod before API call |
| B10 | N+1 query pattern (fetching detail in a loop) | Use list endpoint with required fields, or batch detail endpoint |

---

## UI & Component

| # | Anti-Pattern | Correct Pattern |
|---|-------------|-----------------|
| C1 | Raw `<table>` elements in pages or modules | Always use `DataTable` component |
| C2 | Raw `<input>`, `<select>`, `<button>` without shadcn/ui wrappers | Use `components/ui/` primitives |
| C3 | Inline styles (`style={{ marginTop: 10 }}`) | Tailwind utility classes only |
| C4 | CSS modules or styled-components | Tailwind CSS only (plus `globals.css` for tokens) |
| C5 | Custom modal/dialog implementation | Use `Modal`, `Drawer`, or `modal.store` |
| C6 | Custom toast implementation | Use `utils/toast.js` wrapper around Sonner |
| C7 | "No data found" as empty state | Use `EmptyState` with illustration, message, and action |
| C8 | Blank loading area (white space while fetching) | Use `TableSkeleton`, `CardSkeleton`, or `PageSkeleton` |
| C9 | Hardcoded status strings (`status === 'active'`) | Import from `constants/status.js` |
| C10 | Hardcoded role strings (`role === 'admin'`) | Import from `constants/roles.js` |
| C11 | Hardcoded permission strings scattered in components | Import from `constants/permissions.js` |
| C12 | Hardcoded route paths in components | Import from `constants/routes.js` |
| C13 | Hardcoded UI copy/error messages in components | Import from `constants/messages.js` |
| C14 | Creating a 4th card variant | Only `CardBase`, `CardElevated`, `CardGlass` exist |
| C15 | Custom status badge styling per module | Always use `StatusBadge` with `constants/status.js` config |
| C16 | Table without export button | Every table must have export via `ExportDialog` |
| C17 | Table without empty state | Every table must handle `isEmpty` with `EmptyState` |
| C18 | Table without loading skeleton | Every table must handle `isLoading` with `TableSkeleton` |
| C19 | Form without Zod schema | Every form must have a schema in `schemas/` |
| C20 | Form without `FormField` wrapper | All inputs wrapped in `FormField` for consistent layout |
| C21 | Server validation errors shown only as toast | Map to form fields via `setError()` |
| C22 | `<a href>` for internal navigation | Use React Router `<Link>` or `useNavigate()` |
| C23 | Opening external links without `rel="noopener noreferrer"` | Always set on `target="_blank"` links |

---

## State Management

| # | Anti-Pattern | Correct Pattern |
|---|-------------|-----------------|
| D1 | `useState` for data that comes from API | TanStack Query |
| D2 | `useState` for global UI state (sidebar, theme, modal) | Zustand store |
| D3 | `useContext` for frequently changing data | Zustand (contexts are for static config only) |
| D4 | Storing filters in localStorage | Filters in URL query params via `filters.store` |
| D5 | Storing form drafts without TTL | `draft.store` with 24-hour expiry |
| D6 | Mutating Zustand state directly | Use store actions (with immer middleware) |
| D7 | Reading entire store when only need one field | Use selectors: `useAuthStore(selectUser)` |
| D8 | Permission checks via role string comparison | Use `usePermission('billing.create')` or `PermissionGuard` |
| D9 | Duplicating permission logic in components | Centralize in `permission.store` + `usePermission` hook |

---

## Routing & Auth

| # | Anti-Pattern | Correct Pattern |
|---|-------------|-----------------|
| E1 | Protected page without `AuthGuard` | All non-auth routes wrapped in guard hierarchy |
| E2 | Role-restricted feature without `PermissionGuard` | Wrap with `PermissionGuard` or check `usePermission` |
| E3 | Eagerly importing panel routes | All panels lazy-loaded with Suspense |
| E4 | Eagerly importing business modules | Modules loaded only when their page is accessed |
| E5 | Redirect logic scattered in components | Centralized in `Router.jsx` and `config/panels.config.js` |
| E6 | Checking auth in every page component | Auth checked once at guard level |
| E7 | Manual token refresh logic in components | Handled by Axios interceptor + auth store |

---

## Styling & Design

| # | Anti-Pattern | Correct Pattern |
|---|-------------|-----------------|
| F1 | Hardcoded color values (`#3b82f6`, `rgb(59,130,246)`) | CSS variables (`var(--color-brand-500)`) or Tailwind tokens |
| F2 | Arbitrary font sizes not in type scale | Use typography tokens: `text-sm`, `text-base`, `text-lg`, etc. |
| F3 | Arbitrary spacing values | Use spacing scale: `p-4`, `gap-6`, `mt-8`, etc. |
| F4 | `!important` in CSS | Resolve specificity properly; never override with `!important` |
| F5 | Global CSS classes for component-specific styles | Tailwind utilities on the component |
| F6 | Missing `tabular-nums` on numeric table cells | Always apply to numbers, currency, quantities |
| F7 | Dark mode as separate stylesheet | Single token system with `[data-theme="dark"]` overrides |
| F8 | Inconsistent border radius | Use token scale: `rounded-sm`, `rounded-md`, `rounded-lg` |
| F9 | Box shadow as border replacement on cards | Cards use border + shadow-sm (CardBase) or shadow-md only (CardElevated) |

---

## Performance

| # | Anti-Pattern | Correct Pattern |
|---|-------------|-----------------|
| G1 | `import * as Icons from 'lucide-react'` | Individual imports: `import { Package } from 'lucide-react'` |
| G2 | Rendering 50+ table rows without virtualization | Use `DataTableVirtualBody` with `@tanstack/react-virtual` |
| G3 | `React.memo` on every component | Memoize only where profiling shows benefit; document WHY |
| G4 | `useCallback`/`useMemo` everywhere | Only where referential equality matters (deps of other hooks, memo children) |
| G5 | Re-fetching on every render | TanStack Query with appropriate `staleTime` |
| G6 | Loading all panel code on initial page load | Panel-level code splitting |
| G7 | Animating table rows on filter/pagination change | Animate only on first data load; use `keepPreviousData` |
| G8 | GSAP animations without cleanup | `gsap.killTweensOf()` on unmount |
| G9 | Blocking search input on every keystroke | `useDeferredValue` or debounce (300ms) |
| G10 | Large bundle from importing entire lodash | Import specific functions or use native JS |

---

## Animation

| # | Anti-Pattern | Correct Pattern |
|---|-------------|-----------------|
| H1 | Decorative animations with no UX purpose | Every animation reduces cognitive load during state change |
| H2 | Animations longer than 500ms (except KPI counter) | Micro: 120ms, Standard: 200ms, Page: 350ms, Dramatic: 500ms max |
| H3 | Ignoring `prefers-reduced-motion` | All animations check via `ReducedMotionProvider` |
| H4 | Animating more than 2 properties simultaneously | Limit to opacity + one transform property |
| H5 | Using GSAP for simple fade/slide | Use Framer Motion for declarative animations |
| H6 | Using Framer Motion for timelines/countups | Use GSAP for timeline-based animations |
| H7 | CSS `@keyframes` for component mount/unmount | Use Framer Motion variants (CSS keyframes only for skeleton pulse) |
| H8 | Re-animating KPI counters on data refetch | GSAP counter only on first mount |

---

## Forms & Validation

| # | Anti-Pattern | Correct Pattern |
|---|-------------|-----------------|
| I1 | Uncontrolled inputs without React Hook Form | All forms use `useForm()` from React Hook Form |
| I2 | Validation logic in component | Zod schema in `schemas/` directory |
| I3 | Different validation for form vs API | Same Zod schema for client validation and API payload |
| I4 | Submitting without `form.handleSubmit()` | Always wrap submit handler |
| I5 | Long forms without auto-save | Use `useAutoSave` hook with `draft.store` |
| I6 | Multi-step forms without step persistence | Persist to `draft.store`, step in URL `?step=2` |
| I7 | Custom GSTIN/phone/pincode validation inline | Use `validators/common.validators.js` fragments |
| I8 | Allowing form submission while mutation is pending | Disable submit button, show loading state |

---

## TypeScript / Language

| # | Anti-Pattern | Correct Pattern |
|---|-------------|-----------------|
| J1 | Using TypeScript | JavaScript only; use JSDoc in `types/` for shape documentation |
| J2 | `any` type annotations | JSDoc `@type` or `@param` annotations where needed |
| J3 | PropTypes package | JSDoc comments for component props documentation |

---

## Testing & Quality (when tests are added)

| # | Anti-Pattern | Correct Pattern |
|---|-------------|-----------------|
| K1 | Testing implementation details | Test user-visible behavior |
| K2 | Snapshot testing entire pages | Test specific component interactions |
| K3 | Mocking TanStack Query globally | Mock at service layer |
| K4 | Tests that don't clean up stores | Reset Zustand stores between tests |

---

## Git & Code Organization

| # | Anti-Pattern | Correct Pattern |
|---|-------------|-----------------|
| L1 | Committing `.env` files | Only `.env.example` in repo |
| L2 | Committing `node_modules` or `dist` | Proper `.gitignore` |
| L3 | Mixing panel code in shared components | Panel-specific logic in panel pages/modules |
| L4 | Utility function duplicated across modules | Shared utils in `utils/`; module-specific in `modules/*/utils/` |
| L5 | Commented-out code left in production | Delete dead code; git history preserves it |
| L6 | `console.log` left in production code | Use proper error tracking; remove all console statements |
| L7 | TODO comments without issue reference | `// TODO(#123): description` or remove |

---

## Library Restrictions

| # | Anti-Pattern | Correct Pattern |
|---|-------------|-----------------|
| M1 | Adding libraries not in the tech stack | Solve with existing stack; justify any new library in PR |
| M2 | Using `moment.js` | Use `date-fns` |
| M3 | Using `redux` or `mobx` | Use `zustand` |
| M4 | Using `axios` alternatives (fetch wrapper libs) | Use configured `axios` instance in `services/api/client.js` |
| M5 | Using CSS-in-JS (emotion, styled-components) | Tailwind CSS |
| M6 | Using Material UI, Ant Design, Chakra | shadcn/ui only |
| M7 | Using `react-toastify` or custom toast | Sonner via `utils/toast.js` |
| M8 | Using `react-select` | `SearchSelect` component (built on shadcn/ui) |
| M9 | Using `formik` | React Hook Form |
| M10 | Using `yup` | Zod |

---

## Enforcement Strategy

| Method | Scope |
|--------|-------|
| ESLint `no-restricted-imports` | Module boundary violations (A1, A2, A10) |
| ESLint custom rules | No raw `<table>`, no direct axios, no hardcoded query keys |
| PR template checklist | Anti-patterns A3-A9, C1-C23 checked on every PR |
| Code review guidelines | All patterns reviewed by reviewer |
| AI code generation rules (Output 10) | Prevented at generation time |
| Pre-commit hooks | ESLint + Prettier on staged files |
