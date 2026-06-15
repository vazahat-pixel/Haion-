# OUTPUT 5 — COMPONENT INVENTORY

> Every component: name, location, props summary, variants, usage context.

---

## Auth Components

| Component | Location | Props | Variants | Usage |
|-----------|----------|-------|----------|-------|
| `AuthGuard` | `components/auth/AuthGuard.jsx` | `children, fallback?` | — | Wraps all protected routes; checks `isAuthenticated` + `isInitializing` |
| `PanelGuard` | `components/auth/PanelGuard.jsx` | `children, allowedRoles[], redirectTo?` | — | Ensures user role matches panel |
| `PermissionGuard` | `components/auth/PermissionGuard.jsx` | `children, require?, requireAll?, requireAny?, fallback?, redirectTo?` | inline-fallback, redirect | Feature-level permission gating |
| `RoleSwitcher` | `components/auth/RoleSwitcher.jsx` | `availableRoles[]` | dropdown, compact | Admin panel role switching (Master Admin ↔ Warehouse Manager) |

---

## Layout Components

| Component | Location | Props | Variants | Usage |
|-----------|----------|-------|----------|-------|
| `AppShell` | `components/layout/AppShell.jsx` | `children, panel` | — | Root shell: Sidebar + Topbar + main content area |
| `Sidebar` | `components/layout/Sidebar.jsx` | `items[], panel, collapsed?` | expanded (240px), collapsed (64px), mobile-drawer | Left navigation for all panels |
| `SidebarItem` | `components/layout/SidebarItem.jsx` | `item, isActive, isCollapsed, badge?, nested?` | default, pinned, nested-child | Individual nav item with icon + label |
| `SidebarGroup` | `components/layout/SidebarGroup.jsx` | `label, children, collapsible?` | — | Grouped nav section with optional header |
| `Topbar` | `components/layout/Topbar.jsx` | `panel, user` | — | Sticky top bar: breadcrumb, search, notifications, avatar |
| `PageHeader` | `components/layout/PageHeader.jsx` | `title, subtitle?, actions?, breadcrumbs?` | — | Consistent page title area on every page |
| `MobileNav` | `components/layout/MobileNav.jsx` | `items[], isOpen, onClose` | — | Mobile bottom/slide navigation |
| `OfflineBanner` | `components/layout/OfflineBanner.jsx` | — | — | Persistent banner when `navigator.onLine === false` |

---

## Data Display Components

| Component | Location | Props | Variants | Usage |
|-----------|----------|-------|----------|-------|
| `DataTable` | `components/data-display/DataTable.jsx` | `columns, data, pagination?, sorting?, filters?, rowActions?, bulkActions?, expandable?, selectable?, onExport?, isLoading?, isEmpty?, emptyState?, virtualized?, compact?` | default, compact | **Primary table component** — all ERP tables |
| `DataTableColumnHeader` | `components/data-display/DataTableColumnHeader.jsx` | `column, onSort?, sortDirection?` | sortable, static | Column header with sort indicator |
| `DataTablePagination` | `components/data-display/DataTablePagination.jsx` | `page, perPage, total, onPageChange, onPerPageChange?` | — | "Showing X-Y of Z" pagination |
| `DataTableToolbar` | `components/data-display/DataTableToolbar.jsx` | `onSearch?, filters?, onFilterOpen?, actions?, selectedCount?` | — | Table top toolbar: search, filters, actions |
| `DataTableBulkActions` | `components/data-display/DataTableBulkActions.jsx` | `selectedCount, actions[], onDeselectAll` | — | Bottom slide-up toolbar when rows selected |
| `DataTableRowActions` | `components/data-display/DataTableRowActions.jsx` | `actions[], row` | dropdown, inline | Per-row action menu (edit, delete, view) |
| `DataTableVirtualBody` | `components/data-display/DataTableVirtualBody.jsx` | `rows, rowHeight, renderRow, overscan?` | — | Virtualized tbody for 50+ rows |
| `KPICard` | `components/data-display/KPICard.jsx` | `label, value, trend?, trendLabel?, icon?, onClick?, sparkline?, isLoading?` | default, clickable | Dashboard metric cards |
| `StatWidget` | `components/data-display/StatWidget.jsx` | `title, metrics[], chart?, size?` | sm, md, lg | Multi-metric stat card with optional chart |
| `ActivityFeed` | `components/data-display/ActivityFeed.jsx` | `items[], onLoadMore?, hasMore?, isLoading?` | — | Timeline of actions (audit logs, detail pages) |
| `ActivityFeedItem` | `components/data-display/ActivityFeedItem.jsx` | `item` | — | Single activity entry with icon, text, timestamp |
| `StatusTimeline` | `components/data-display/StatusTimeline.jsx` | `steps[], currentStep` | horizontal, vertical | Visual status progression (complaints, dispatch, billing) |
| `StatusBadge` | `components/data-display/StatusBadge.jsx` | `status, size?` | sm, md | Unified status badge from `constants/status.js` |
| `AvatarGroup` | `components/data-display/AvatarGroup.jsx` | `users[], max?, size?` | sm, md, lg | Stacked avatars with overflow count |
| `ChartContainer` | `components/data-display/ChartContainer.jsx` | `children, title?, height?, isLoading?` | — | Responsive Recharts wrapper with loading state |
| `ChartTooltip` | `components/data-display/ChartTooltip.jsx` | `active?, payload?, label?` | — | Custom styled Recharts tooltip |
| `TrendIndicator` | `components/data-display/TrendIndicator.jsx` | `value, direction, label?` | up (success), down (danger), neutral | Arrow + percentage trend display |

---

## Data Entry Components

| Component | Location | Props | Variants | Usage |
|-----------|----------|-------|----------|-------|
| `FormField` | `components/data-entry/FormField.jsx` | `name, label, description?, required?, children, className?` | horizontal, vertical | RHF wrapper: label + control + error + description |
| `FormLayout` | `components/data-entry/FormLayout.jsx` | `children, columns?` | 1-col, 2-col, 3-col | Form grid layout with consistent spacing |
| `FormSection` | `components/data-entry/FormSection.jsx` | `title, description?, children, collapsible?` | — | Labeled group of form fields |
| `FormActions` | `components/data-entry/FormActions.jsx` | `onSubmit?, onCancel?, submitLabel?, cancelLabel?, isLoading?, secondaryActions?` | sticky-footer, inline | Submit/cancel/secondary action bar |
| `SearchSelect` | `components/data-entry/SearchSelect.jsx` | `value, onChange, onSearch, options?, placeholder?, isLoading?, renderOption?` | single, multi | Async searchable select (dealer, product, employee pickers) |
| `DateRangePicker` | `components/data-entry/DateRangePicker.jsx` | `value, onChange, presets?, minDate?, maxDate?` | — | Calendar range with presets (Today, This Week, etc.) |
| `DatePicker` | `components/data-entry/DatePicker.jsx` | `value, onChange, minDate?, maxDate?, disabled?` | — | Single date picker |
| `CurrencyInput` | `components/data-entry/CurrencyInput.jsx` | `value, onChange, currency?, locale?, disabled?` | — | INR auto-format with paise handling |
| `GSTINInput` | `components/data-entry/GSTINInput.jsx` | `value, onChange, onValid?, disabled?` | — | GSTIN format validation + state code extraction |
| `PhoneInput` | `components/data-entry/PhoneInput.jsx` | `value, onChange, countryCode?, disabled?` | — | Country code + Indian mobile validation |
| `PINInput` | `components/data-entry/PINInput.jsx` | `length?, value, onChange, onComplete?` | — | 6-digit OTP input |
| `FileUpload` | `components/data-entry/FileUpload.jsx` | `accept?, maxSize?, multiple?, onUpload, value?, preview?` | drag-drop, button | File upload with preview and progress |
| `AddressInput` | `components/data-entry/AddressInput.jsx` | `value, onChange, disabled?` | — | Structured address: line1, line2, city, state, pincode |
| `Stepper` | `components/data-entry/Stepper.jsx` | `steps[], currentStep, onStepClick?, orientation?` | horizontal, vertical | Multi-step form wizard indicator |
| `AutoSaveIndicator` | `components/data-entry/AutoSaveIndicator.jsx` | `status` | saving, saved, error | "Auto-saved" / "Saving..." footer indicator |

---

## Navigation Components

| Component | Location | Props | Variants | Usage |
|-----------|----------|-------|----------|-------|
| `Breadcrumb` | `components/navigation/Breadcrumb.jsx` | `items[], separator?` | — | Auto-generated from route meta, animates on change |
| `Tabs` | `components/navigation/Tabs.jsx` | `items[], value, onChange, variant?` | underline (default), pill | Consistent tab component with animated indicator |
| `TabList` | `components/navigation/TabList.jsx` | `children` | — | Tab button container |
| `TabPanel` | `components/navigation/TabPanel.jsx` | `value, activeValue, children` | — | Tab content panel |
| `Pagination` | `components/navigation/Pagination.jsx` | `page, totalPages, onPageChange, showGoTo?` | — | Page numbers + prev/next + "Go to page" |
| `FilterDrawer` | `components/navigation/FilterDrawer.jsx` | `isOpen, onClose, filters, values, onChange, onApply, onClear` | — | Slide-in complex filter panel |
| `FilterChips` | `components/navigation/FilterChips.jsx` | `filters, onRemove, onClearAll` | — | Active filter summary chips |
| `NavLink` | `components/navigation/NavLink.jsx` | `to, children, end?, className?` | — | Styled React Router NavLink |

---

## Feedback Components

| Component | Location | Props | Variants | Usage |
|-----------|----------|-------|----------|-------|
| `LoadingState` | `components/feedback/LoadingState.jsx` | `message?, size?` | full-page, inline, section | Centered spinner with contextual message |
| `TableSkeleton` | `components/feedback/TableSkeleton.jsx` | `columns, rows?, compact?` | — | Animated skeleton matching table structure |
| `CardSkeleton` | `components/feedback/CardSkeleton.jsx` | `count?, hasChart?` | kpi, stat | Animated skeleton for KPI/stat cards |
| `PageSkeleton` | `components/feedback/PageSkeleton.jsx` | `hasKPIs?, hasChart?, hasTable?` | — | Full page loading skeleton |
| `ErrorState` | `components/feedback/ErrorState.jsx` | `title?, message?, onRetry?, onReport?, icon?` | network, server, permission | Error display with retry/report actions |
| `EmptyState` | `components/feedback/EmptyState.jsx` | `illustration?, title, description?, primaryAction?, secondaryAction?` | — | Illustration + message + action (never just "No data") |
| `ConfirmDialog` | `components/feedback/ConfirmDialog.jsx` | `isOpen, title, message, onConfirm, onCancel, variant?, isLoading?` | default, destructive | Accessible confirmation dialog |
| `QueryErrorBoundary` | `components/feedback/QueryErrorBoundary.jsx` | `children, fallback?` | — | Per-query error catch with retry UI |

---

## Overlay Components

| Component | Location | Props | Variants | Usage |
|-----------|----------|-------|----------|-------|
| `Drawer` | `components/overlays/Drawer.jsx` | `isOpen, onClose, title?, children, size?, side?` | sm (420px), md (480px), lg (640px), full | Slide-in from right for detail views and forms |
| `Modal` | `components/overlays/Modal.jsx` | `isOpen, onClose, title?, children, size?, closable?` | sm, md, lg, xl, full | Center-screen dialog |
| `ModalStack` | `components/overlays/ModalStack.jsx` | — | — | Renders modal.store stack |
| `Popover` | `components/overlays/Popover.jsx` | `trigger, children, align?, side?` | — | Inline menus, user cards, quick-action panels |
| `Tooltip` | `components/overlays/Tooltip.jsx` | `content, children, side?, delay?` | — | Accessible tooltips |

---

## Motion Components

| Component | Location | Props | Variants | Usage |
|-----------|----------|-------|----------|-------|
| `MotionPage` | `components/motion/MotionPage.jsx` | `children, className?` | — | Page-level enter/exit transitions |
| `MotionCard` | `components/motion/MotionCard.jsx` | `children, delay?, className?` | — | Card grid stagger entrance |
| `MotionList` | `components/motion/MotionList.jsx` | `children, stagger?` | — | List item stagger animation |
| `MotionFade` | `components/motion/MotionFade.jsx` | `children, show?, duration?` | — | Simple fade in/out |
| `MotionSlide` | `components/motion/MotionSlide.jsx` | `children, direction?, show?` | left, right, up, down | Directional slide |
| `ReducedMotionProvider` | `components/motion/ReducedMotionProvider.jsx` | `children` | — | Respects `prefers-reduced-motion` |

---

## Error Boundary Components

| Component | Location | Props | Variants | Usage |
|-----------|----------|-------|----------|-------|
| `AppErrorBoundary` | `components/error-boundaries/AppErrorBoundary.jsx` | `children` | — | Top-level crash catcher, full-page error |
| `RouteErrorBoundary` | `components/error-boundaries/RouteErrorBoundary.jsx` | `children, panel?` | — | Per-panel error boundary |
| `SectionErrorBoundary` | `components/error-boundaries/SectionErrorBoundary.jsx` | `children, fallback?` | — | Per-page-section inline error |

---

## shadcn/ui Base Components (`components/ui/`)

| Component | File | shadcn Source | Customizations |
|-----------|------|---------------|----------------|
| `Button` | `button.jsx` | button | ERP size variants: xs, sm, default, lg. Loading state prop |
| `Input` | `input.jsx` | input | Error state styling, tabular-nums variant |
| `Label` | `label.jsx` | label | Required asterisk support |
| `Select` | `select.jsx` | select | — |
| `Checkbox` | `checkbox.jsx` | checkbox | — |
| `RadioGroup` | `radio-group.jsx` | radio-group | — |
| `Switch` | `switch.jsx` | switch | — |
| `Textarea` | `textarea.jsx` | textarea | — |
| `Badge` | `badge.jsx` | badge | Status color variants mapped to design tokens |
| `Card` | `card.jsx` | card | CardBase, CardElevated, CardGlass variants |
| `Dialog` | `dialog.jsx` | dialog | — |
| `DropdownMenu` | `dropdown-menu.jsx` | dropdown-menu | — |
| `Popover` | `popover.jsx` | popover | — |
| `Tooltip` | `tooltip.jsx` | tooltip | — |
| `Separator` | `separator.jsx` | separator | — |
| `Skeleton` | `skeleton.jsx` | skeleton | — |
| `Avatar` | `avatar.jsx` | avatar | — |
| `ScrollArea` | `scroll-area.jsx` | scroll-area | — |
| `Sheet` | `sheet.jsx` | sheet | Used by Drawer and mobile sidebar |
| `Tabs` | `tabs.jsx` | tabs | — |
| `Table` | `table.jsx` | table | Base primitives for DataTable |
| `Calendar` | `calendar.jsx` | calendar | — |
| `Command` | `command.jsx` | command | Used by CommandPalette |
| `Sonner` | `sonner.jsx` | sonner | Toast provider, bottom-right position |

---

## Feature Components

### Command Palette (`features/command-palette/`)

| Component | Props | Usage |
|-----------|-------|-------|
| `CommandPalette` | — | Main palette modal (Cmd+K) |
| `CommandPaletteTrigger` | `className?` | Search button for Topbar |
| `CommandPaletteResults` | `query, onSelect` | Filtered results with keyboard nav |
| `commandRegistry.js` | — | Static + dynamic command definitions |

### Global Search (`features/global-search/`)

| Component | Props | Usage |
|-----------|-------|-------|
| `GlobalSearch` | `panel, onResultClick?` | Inline Topbar search bar |
| `GlobalSearchResults` | `query, results, isLoading` | Dropdown results panel |
| `useGlobalSearch` | `query, enabled?` | Debounced multi-entity search hook |

### Export Engine (`features/export-engine/`)

| Component | Props | Usage |
|-----------|-------|-------|
| `ExportDialog` | `isOpen, onClose, columns, data, module` | Export format/scope/column selection dialog |
| `useExport` | `module, filters?` | Export mutation hook |
| `exportFormats.js` | — | CSV, XLSX format handlers |

### Import Engine (`features/import-engine/`)

| Component | Props | Usage |
|-----------|-------|-------|
| `ImportDialog` | `isOpen, onClose, module, template?` | Import file upload + preview |
| `ImportPreview` | `data, columns, errors` | Preview imported rows with validation |
| `useImport` | `module` | Import mutation hook |

### Theme Switcher (`features/theme-switcher/`)

| Component | Props | Usage |
|-----------|-------|-------|
| `ThemeSwitcher` | — | Light/dark/system dropdown |
| `ThemeToggle` | — | Simple toggle button |

### Onboarding (`features/onboarding/`)

| Component | Props | Usage |
|-----------|-------|-------|
| `OnboardingTour` | `steps[], panel` | First-time user guided tour |
| `OnboardingStep` | `target, title, content, position?` | Single tour step spotlight |

### Audit Log (`features/audit-log/`)

| Component | Props | Usage |
|-----------|-------|-------|
| `AuditLogViewer` | `resourceType?, resourceId?, filters?` | Full audit log table with filters |
| `AuditLogFilters` | `values, onChange` | User, action, date range filters |
| `useAuditLog` | `filters` | Paginated audit log query |

### Notification Center (`features/notifications/`)

| Component | Props | Usage |
|-----------|-------|-------|
| `NotificationCenter` | — | Slide-in panel from bell icon |
| `NotificationToastBridge` | — | Bridges server push → Sonner toasts |

---

## Card Variants (Design System)

| Variant | Component | Props | Visual |
|---------|-----------|-------|--------|
| `CardBase` | `Card` variant="base" | `children, className?, padding?` | surface-1 bg, border, shadow-sm |
| `CardElevated` | `Card` variant="elevated" | `children, className?, onClick?` | white bg, shadow-md, no border |
| `CardGlass` | `Card` variant="glass" | `children, className?` | backdrop-blur, semi-transparent |

---

## Component Composition Rules

| Rule | Detail |
|------|--------|
| Pages compose modules + global components | Pages never contain business logic |
| Modules expose via `index.js` | Pages import `{ InventoryTable, useInventoryList }` from `@/modules/inventory` |
| DataTable is mandatory for all tables | Never raw `<table>` in pages or modules |
| FormField wraps all form inputs | Consistent label/error/description layout |
| StatusBadge reads from `constants/status.js` | Never hardcoded status strings |
| EmptyState required on all lists | Never show blank area or "No data found" |
| All overlays via modal.store or local state | Global modals use modal.store; page-level use local `useState` |
| Charts wrapped in ChartContainer | Responsive, themed, loading-aware |
