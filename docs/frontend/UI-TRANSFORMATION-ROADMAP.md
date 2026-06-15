# UI Transformation Roadmap (FINAL UI.pdf)

Presentation-layer only. **No business logic changes.**

## Phase 1 — Design system ✅ (started)
- [x] Extract tokens from FINAL UI.pdf (gold primary, light grey bg)
- [x] `globals.css` — brand, surfaces, shadows, radius
- [x] `animations.css` — shimmer skeletons
- [x] `typography.css` — uppercase page titles
- [x] `docs/frontend/DESIGN-SYSTEM.md`

## Phase 2 — Core shell ✅ (started)
- [x] Sidebar — gold active state, user card, logout footer
- [x] PageHeader — uppercase titles + breadcrumb style
- [x] Button, Card, Input, Select, Badge
- [x] KPICard — tinted icon squares
- [x] EmptyState — premium layout
- [ ] Topbar polish (notification badge, profile dropdown)
- [ ] Login page redesign

## Phase 3 — Data display
- [ ] EnterpriseTable — sticky header, pill badges, row hover
- [ ] StatusBadge alignment with PDF pills
- [ ] Chart theming (gold line, soft grid)
- [ ] Dashboard widgets (all panels)

## Phase 4 — Forms & drawers
- [ ] DrawerForm / FormCard — floating labels, focus rings
- [ ] FileUploadField — drag-drop polish
- [ ] Date picker styling
- [ ] Checkbox / switch custom styling

## Phase 5 — SVG illustrations
- [ ] Empty inventory, no data, no search, error, maintenance
- [ ] Match gold + grey palette from PDF

## Phase 6 — Motion & performance
- [x] Page transitions (MotionPage)
- [ ] Route prefetch
- [ ] Table virtualization audit
- [ ] Memoize heavy dashboard charts

## Phase 7 — Panel migration
- [ ] Admin — all list/detail pages
- [ ] Dealer — `DEALER-UX-ROADMAP.md` + UI pass
- [ ] Employee, Service, Customer panels

## Reference
- PDF: `FINAL UI.pdf` (48 pages, wapixo gold theme)
- Rendered pages: `.pdf-pages/page-*.png`
