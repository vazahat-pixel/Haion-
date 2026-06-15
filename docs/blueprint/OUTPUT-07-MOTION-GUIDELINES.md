# OUTPUT 7 — MOTION GUIDELINES

> All Framer Motion variants, GSAP use cases, timing rules, reduced-motion rules.

---

## Motion Philosophy

Animations serve **one purpose**: reducing cognitive load during state transitions. They are never decorative.

| Principle | Rule |
|-----------|------|
| Purpose-driven | Every animation communicates a state change |
| Fast by default | 120-200ms for most interactions |
| Respect hardware | Never animate more than 2 properties on low-end devices |
| Accessibility first | All animations honor `prefers-reduced-motion` |
| Consistent easing | `ease-out` entrances, `ease-in` exits, `ease-in-out` toggles |

---

## Timing Scale

| Tier | Duration | Easing | Use Cases |
|------|----------|--------|-----------|
| Micro | 120ms | `ease-out` | Button hover, color change, badge appear, checkbox toggle |
| Standard | 200ms | `ease-out` / `ease-in-out` | Card hover, tab switch, dropdown open, form field focus |
| Page | 350ms | `ease-out` | Page transitions, drawer open/close, sidebar collapse |
| Dramatic | 500ms | `ease-out` | Dashboard KPI reveal, onboarding spotlight, first-load stagger |

---

## Framer Motion Variants (`animations/motion.config.js`)

### Page Transitions

```javascript
export const pageEnter = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
  transition: { duration: 0.2, ease: 'easeOut' },
};

export const pageEnterFade = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.15, ease: 'easeOut' },
};
```

**Usage:** Wrap page content in `<MotionPage>` → applies `pageEnter` variant.
**Context:** Every route change within a panel.

### Card Grid Stagger

```javascript
export const cardGrid = {
  container: {
    animate: { transition: { staggerChildren: 0.05 } },
  },
  item: {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.2 } },
  },
};
```

**Usage:** Dashboard KPI row, stat widget grids.
**Context:** First mount only — not on refetch.

### Sidebar Collapse

```javascript
export const sidebarCollapse = {
  open: {
    width: 240,
    transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] },
  },
  closed: {
    width: 64,
    transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] },
  },
};

export const sidebarLabel = {
  visible: { opacity: 1, x: 0, transition: { duration: 0.15, delay: 0.1 } },
  hidden: { opacity: 0, x: -8, transition: { duration: 0.1 } },
};
```

**Usage:** `Sidebar` component width animation + label fade.
**Context:** Desktop sidebar toggle. Mobile uses `Sheet` slide instead.

### Modal Entrance

```javascript
export const modalEnter = {
  initial: { opacity: 0, scale: 0.97 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.15 } },
  exit: { opacity: 0, scale: 0.97, transition: { duration: 0.1 } },
};

export const modalBackdrop = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.15 } },
  exit: { opacity: 0, transition: { duration: 0.1 } },
};
```

**Usage:** `Modal` component overlay + content.
**Context:** Confirmations, quick forms, export dialog.

### Drawer Slide

```javascript
export const drawerEnter = {
  initial: { x: '100%' },
  animate: { x: 0, transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] } },
  exit: { x: '100%', transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] } },
};

export const drawerBackdrop = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};
```

**Usage:** `Drawer` component, `FilterDrawer`, notification panel.
**Context:** Detail views, create/edit forms, filter panels.

### Table Row Entrance

```javascript
export const tableRow = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.15 } },
};

export const tableRowStagger = {
  container: {
    animate: { transition: { staggerChildren: 0.02 } },
  },
  item: {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 0.15 } },
  },
};
```

**Usage:** Table body rows on initial data load.
**Rule:** Only on first load. Filter/pagination changes use `keepPreviousData` — no re-animation.

### Notification Bell

```javascript
export const notificationBell = {
  animate: {
    rotate: [0, -12, 12, -8, 8, 0],
    transition: { duration: 0.4 },
  },
};
```

**Usage:** Bell icon in Topbar when new notification arrives.
**Trigger:** `unreadCount` increases.

### Bulk Actions Toolbar

```javascript
export const bulkToolbar = {
  initial: { y: 80, opacity: 0 },
  animate: { y: 0, opacity: 1, transition: { duration: 0.2, ease: 'easeOut' } },
  exit: { y: 80, opacity: 0, transition: { duration: 0.15, ease: 'easeIn' } },
};
```

**Usage:** `DataTableBulkActions` slide-up from bottom.
**Trigger:** ≥1 row selected.

### Tab Indicator

```javascript
export const tabIndicator = {
  layoutId: 'tab-indicator',
  transition: { type: 'spring', stiffness: 500, damping: 35 },
};
```

**Usage:** Active tab underline/pill that slides between tabs.
**Context:** All `Tabs` components.

### Dropdown Menu

```javascript
export const dropdownMenu = {
  initial: { opacity: 0, scale: 0.95, y: -4 },
  animate: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.12 } },
  exit: { opacity: 0, scale: 0.95, y: -4, transition: { duration: 0.08 } },
};
```

**Usage:** Dropdown menus, context menus, action menus.

### Toast (Sonner)

Sonner handles its own animations. Configuration:

```javascript
// utils/toast.js wrapper
<Toaster
  position="bottom-right"
  toastOptions={{
    duration: 3000,        // success default
    style: { /* design tokens */ },
  }}
/>
```

| Toast Type | Duration | Animation |
|------------|----------|-----------|
| Success | 3000ms | Slide in from right |
| Error | 6000ms | Slide in from right |
| Warning | 5000ms | Slide in from right |
| Loading | Indefinite | Slide in, no auto-dismiss |

### Empty State

```javascript
export const emptyState = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
};
```

**Usage:** `EmptyState` component on list pages with no data.

### Filter Chips

```javascript
export const filterChip = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.12 } },
  exit: { opacity: 0, scale: 0.8, transition: { duration: 0.08 } },
};
```

**Usage:** `FilterChips` appear/disappear as filters are applied/removed.

### Command Palette

```javascript
export const commandPalette = {
  initial: { opacity: 0, scale: 0.98, y: -8 },
  animate: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.15 } },
  exit: { opacity: 0, scale: 0.98, y: -8, transition: { duration: 0.1 } },
};
```

**Usage:** `CommandPalette` modal entrance.

---

## GSAP Use Cases (`animations/gsap.config.js`)

GSAP is reserved for timeline-based animations that Framer Motion cannot handle cleanly.

### Configuration

```javascript
import { gsap } from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

gsap.defaults({
  ease: 'power2.out',
  duration: 0.25,
});
```

### Use Case 1: KPI Counter Animation

```javascript
// animations/gsap.config.js
export const animateCounter = (element, from, to, duration = 1.2) => {
  gsap.fromTo(element,
    { innerText: from },
    {
      innerText: to,
      duration,
      snap: { innerText: 1 },
      ease: 'power2.out',
      onUpdate: function () {
        element.innerText = Math.round(this.targets()[0].innerText).toLocaleString('en-IN');
      },
    }
  );
};
```

| Property | Value |
|----------|-------|
| Trigger | Dashboard first load (not refetch) |
| Duration | 1.2s |
| Easing | power2.out |
| Target | KPI card value elements |
| Format | Indian locale number format |

### Use Case 2: Sidebar Pin/Unpin

```javascript
export const animateSidebarPin = (element, isPinned) => {
  gsap.to(element, {
    scale: isPinned ? 1.05 : 1,
    duration: 0.2,
    ease: 'back.out(1.7)',
  });
};
```

| Property | Value |
|----------|-------|
| Trigger | User pins/unpins sidebar item |
| Duration | 0.2s |
| Easing | back.out(1.7) |

### Use Case 3: Chart Number Countup

```javascript
export const animateChartValue = (elements, values) => {
  elements.forEach((el, i) => {
    gsap.fromTo(el,
      { innerText: 0 },
      {
        innerText: values[i],
        duration: 1.0,
        delay: i * 0.1,
        snap: { innerText: 1 },
        ease: 'power2.out',
      }
    );
  });
};
```

| Property | Value |
|----------|-------|
| Trigger | Dashboard chart mount |
| Duration | 1.0s per element |
| Stagger | 0.1s between elements |

### Use Case 4: Dashboard Multi-Step Reveal

```javascript
export const animateDashboardReveal = (sections) => {
  const tl = gsap.timeline();
  sections.forEach((section, i) => {
    tl.from(section, {
      opacity: 0,
      y: 20,
      duration: 0.3,
      ease: 'power2.out',
    }, i * 0.1);
  });
  return tl;
};
```

| Property | Value |
|----------|-------|
| Trigger | Dashboard first mount |
| Sequence | KPI row → charts → table (staggered 100ms) |
| Total duration | ~0.6s |

### Use Case 5: Drag-and-Drop Reorder

```javascript
export const animateDragReorder = (container, onComplete) => {
  const items = container.querySelectorAll('[data-draggable]');
  gsap.to(items, {
    duration: 0.3,
    ease: 'power2.out',
    onComplete,
  });
};
```

| Property | Value |
|----------|-------|
| Context | Column reorder in table settings, dashboard widget reorder |
| Duration | 0.3s |

### Use Case 6: Scroll-Triggered Animations

```javascript
export const initScrollAnimations = () => {
  gsap.utils.toArray('[data-animate-on-scroll]').forEach((el) => {
    gsap.from(el, {
      opacity: 0,
      y: 30,
      duration: 0.4,
      scrollTrigger: {
        trigger: el,
        start: 'top 85%',
        toggleActions: 'play none none none',
      },
    });
  });
};
```

| Property | Value |
|----------|-------|
| Context | Long detail pages, audit log timeline |
| Trigger | Element enters viewport (85% from top) |

---

## Micro-Interactions (`animations/micro.interactions.js`)

| Interaction | Implementation | Duration |
|-------------|---------------|----------|
| Button press | `scale(0.97)` on `:active` | 120ms CSS |
| Card hover | `translateY(-1px)` + shadow upgrade | 120ms CSS |
| Input focus | Border color transition + focus ring | 120ms CSS |
| Checkbox check | Scale bounce via Framer Motion | 150ms |
| Switch toggle | Slide thumb via Framer Motion | 200ms |
| Row hover | Background color transition | 120ms CSS |
| Row select | Left border appear + bg color | 120ms CSS |
| Badge appear | Scale from 0.8 + fade | 120ms Framer |
| Skeleton pulse | CSS `@keyframes` opacity oscillation | 1.5s loop |
| Copy to clipboard | Icon swap (copy → check) | 200ms Framer |
| Sidebar item hover | Background color + icon color | 120ms CSS |
| Nav badge bounce | Scale 1 → 1.2 → 1 on count change | 200ms Framer |

---

## Reduced Motion Rules

### Detection

```javascript
// components/motion/ReducedMotionProvider.jsx
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
```

### Behavior When `prefers-reduced-motion: reduce`

| Animation Type | Normal Behavior | Reduced Motion Behavior |
|----------------|----------------|------------------------|
| Page transitions | Fade + slide (200ms) | Instant (opacity only, 0ms) |
| Card stagger | Staggered entrance | All appear instantly |
| Sidebar collapse | Width animation (250ms) | Instant width change |
| Modal/Drawer | Scale/slide entrance | Fade only (100ms) |
| KPI counter | GSAP countup (1.2s) | Show final value instantly |
| Table row stagger | Fade in staggered | All rows visible instantly |
| Notification bell | Rotate bounce | No animation |
| Chart animations | Recharts built-in | `isAnimationActive={false}` |
| Bulk toolbar | Slide up | Fade only |
| GSAP dashboard reveal | Timeline stagger | Skip timeline, show all |
| Skeleton pulse | Opacity oscillation | Static gray block |
| Hover effects | Transform + shadow | Color change only |

### Implementation Pattern

```javascript
// All motion components check reduced motion:
const shouldReduceMotion = useReducedMotion(); // from Framer Motion

<motion.div
  variants={shouldReduceMotion ? reducedVariants : fullVariants}
  transition={shouldReduceMotion ? { duration: 0 } : undefined}
/>
```

### Framer Motion Global Config

```javascript
// In MotionProvider or App.jsx
<MotionConfig reducedMotion="user">
  {children}
</MotionConfig>
```

---

## Animation Decision Matrix

| Scenario | Tool | Variant/Function | Duration |
|----------|------|----------------|----------|
| Route change | Framer Motion | `pageEnter` | 200ms |
| Modal open | Framer Motion | `modalEnter` | 150ms |
| Drawer open | Framer Motion | `drawerEnter` | 250ms |
| Sidebar toggle | Framer Motion | `sidebarCollapse` | 250ms |
| Dashboard KPI load | GSAP | `animateCounter` | 1200ms |
| Dashboard section reveal | GSAP | `animateDashboardReveal` | 600ms total |
| Table initial load | Framer Motion | `tableRowStagger` | 150ms/row |
| Table filter change | None | `keepPreviousData` | 0ms |
| Bulk action toolbar | Framer Motion | `bulkToolbar` | 200ms |
| Tab switch | Framer Motion | `tabIndicator` | spring |
| Dropdown open | Framer Motion | `dropdownMenu` | 120ms |
| Toast notification | Sonner | built-in | 3000-6000ms |
| Notification bell | Framer Motion | `notificationBell` | 400ms |
| Empty state | Framer Motion | `emptyState` | 300ms |
| Filter chip add/remove | Framer Motion | `filterChip` | 120ms |
| Command palette | Framer Motion | `commandPalette` | 150ms |
| Button/card hover | CSS transition | micro.interactions | 120ms |
| Column pin animation | GSAP | `animateSidebarPin` | 200ms |
| Chart mount | Recharts + GSAP | `animateChartValue` | 1000ms |
| Scroll reveal | GSAP ScrollTrigger | `initScrollAnimations` | 400ms |
| Drag reorder | GSAP | `animateDragReorder` | 300ms |

---

## Performance Guardrails

| Rule | Detail |
|------|--------|
| Max simultaneous animations | 2 properties per element |
| No animation on scroll (lists) | Virtualized tables skip row animations during scroll |
| GSAP cleanup | `gsap.killTweensOf()` on component unmount |
| Framer Motion `layout` prop | Only on sidebar and tab indicator (layout-heavy elements) |
| `will-change` | Never set manually — let browser decide |
| Animation on refetch | Never — only first mount |
| Low-end device detection | If `navigator.hardwareConcurrency <= 2`, skip GSAP, use CSS only |
