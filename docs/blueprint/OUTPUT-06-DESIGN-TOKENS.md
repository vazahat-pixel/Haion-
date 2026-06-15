# OUTPUT 6 — DESIGN TOKEN INVENTORY

> Complete token list: color, typography, spacing, radius, shadow, transition, z-index.

---

## Color Tokens

### Brand Colors

| Token | CSS Variable | Light Value | Dark Value | Usage |
|-------|-------------|-------------|------------|-------|
| `brand-50` | `--color-brand-50` | `#eff6ff` | `#172554` | Selected row bg, hover accents |
| `brand-100` | `--color-brand-100` | `#dbeafe` | `#1e3a8a` | Light accent backgrounds |
| `brand-200` | `--color-brand-200` | `#bfdbfe` | `#1e40af` | Focus ring |
| `brand-500` | `--color-brand-500` | `#3b82f6` | `#3b82f6` | Primary action, links |
| `brand-600` | `--color-brand-600` | `#2563eb` | `#2563eb` | Primary hover |
| `brand-700` | `--color-brand-700` | `#1d4ed8` | `#1d4ed8` | Primary active/pressed |
| `brand-900` | `--color-brand-900` | `#1e3a8a` | `#dbeafe` | Dark accent text |

### Surface Colors

| Token | CSS Variable | Light Value | Dark Value | Usage |
|-------|-------------|-------------|------------|-------|
| `surface-0` | `--color-surface-0` | `#ffffff` | `#0a0a0f` | Page background |
| `surface-1` | `--color-surface-1` | `#f8fafc` | `#111118` | Card background |
| `surface-2` | `--color-surface-2` | `#f1f5f9` | `#1a1a24` | Subtle container, table header |
| `surface-3` | `--color-surface-3` | `#e2e8f0` | `#252533` | Dividers, borders |
| `surface-overlay` | `--color-surface-overlay` | `rgba(0,0,0,0.5)` | `rgba(0,0,0,0.7)` | Modal backdrop |

### Text Colors

| Token | CSS Variable | Light Value | Dark Value | Usage |
|-------|-------------|-------------|------------|-------|
| `text-primary` | `--color-text-primary` | `#0f172a` | `#f1f5f9` | Headings, primary body |
| `text-secondary` | `--color-text-secondary` | `#475569` | `#94a3b8` | Secondary body, labels |
| `text-tertiary` | `--color-text-tertiary` | `#94a3b8` | `#64748b` | Captions, placeholders |
| `text-disabled` | `--color-text-disabled` | `#cbd5e1` | `#475569` | Disabled inputs, inactive |
| `text-inverse` | `--color-text-inverse` | `#ffffff` | `#0f172a` | Text on dark/colored bg |
| `text-link` | `--color-text-link` | `#2563eb` | `#60a5fa` | Clickable links |
| `text-link-hover` | `--color-text-link-hover` | `#1d4ed8` | `#93bbfd` | Link hover state |

### Status Colors

| Token | CSS Variable | Value (same both themes) | Usage |
|-------|-------------|--------------------------|-------|
| `success` | `--color-success` | `#16a34a` | Success text, positive trends |
| `success-bg` | `--color-success-bg` | `#f0fdf4` / `#052e16` | Success badge/bg |
| `warning` | `--color-warning` | `#d97706` | Warning text, caution |
| `warning-bg` | `--color-warning-bg` | `#fffbeb` / `#451a03` | Warning badge/bg |
| `danger` | `--color-danger` | `#dc2626` | Error text, negative trends, destructive |
| `danger-bg` | `--color-danger-bg` | `#fef2f2` / `#450a0a` | Danger badge/bg |
| `info` | `--color-info` | `#0284c7` | Info text, neutral status |
| `info-bg` | `--color-info-bg` | `#f0f9ff` / `#0c4a6e` | Info badge/bg |
| `neutral` | `--color-neutral` | `#64748b` | Draft, inactive status |
| `neutral-bg` | `--color-neutral-bg` | `#f8fafc` / `#1e293b` | Neutral badge/bg |

### Chart Colors

| Token | Value | Usage |
|-------|-------|-------|
| `chart-1` | `#3b82f6` | Primary series |
| `chart-2` | `#8b5cf6` | Secondary series |
| `chart-3` | `#06b6d4` | Tertiary series |
| `chart-4` | `#f59e0b` | Quaternary series |
| `chart-5` | `#ef4444` | Quinary series |
| `chart-6` | `#10b981` | Senary series |
| `chart-grid` | `--color-surface-3` | Chart grid lines |
| `chart-axis` | `--color-text-tertiary` | Axis labels |

---

## Typography Tokens (`theme/typography.js`)

### Font Families

| Token | Value | Usage |
|-------|-------|-------|
| `font-sans` | `'Inter', system-ui, -apple-system, sans-serif` | All UI text |
| `font-mono` | `'JetBrains Mono', 'Fira Code', monospace` | Code, bill numbers, SKUs |

### Type Scale (Base: 14px, Ratio: 1.25 Major Third)

| Token | Size | Line Height | Weight | Letter Spacing | Usage |
|-------|------|-------------|--------|----------------|-------|
| `text-xs` | 11px | 16px | 400 | 0.02em | Labels, captions, table headers |
| `text-sm` | 13px | 20px | 400 | 0 | Secondary body, descriptions |
| `text-base` | 14px | 22px | 400 | 0 | Primary body text |
| `text-md` | 15px | 24px | 500 | 0 | Emphasized body |
| `text-lg` | 17px | 28px | 500 | -0.01em | Small headings, card titles |
| `text-xl` | 20px | 32px | 600 | -0.01em | Section headings |
| `text-2xl` | 24px | 36px | 600 | -0.02em | Page headings |
| `text-3xl` | 30px | 40px | 700 | -0.02em | Dashboard KPI values |
| `text-4xl` | 36px | 48px | 700 | -0.02em | Hero numbers |

### Font Weights

| Token | Value | Usage |
|-------|-------|-------|
| `font-normal` | 400 | Body text |
| `font-medium` | 500 | Emphasized text, buttons |
| `font-semibold` | 600 | Headings, labels |
| `font-bold` | 700 | KPI numbers, hero text |

### Special Typography Rules

| Rule | CSS | Context |
|------|-----|---------|
| Tabular numbers | `font-variant-numeric: tabular-nums` | All table numbers, KPIs, currency |
| Uppercase labels | `text-transform: uppercase; letter-spacing: 0.05em` | Table column headers |
| Truncate | `overflow: hidden; text-overflow: ellipsis; white-space: nowrap` | Table cells, sidebar labels |

---

## Spacing Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `space-0` | 0px | — |
| `space-0.5` | 2px | Micro gaps |
| `space-1` | 4px | Tight inline spacing |
| `space-1.5` | 6px | Icon-to-text gap |
| `space-2` | 8px | Compact padding |
| `space-3` | 12px | Default inline gap |
| `space-4` | 16px | Standard padding |
| `space-5` | 20px | Medium padding |
| `space-6` | 24px | Section padding |
| `space-8` | 32px | Large section gap |
| `space-10` | 40px | Page section separation |
| `space-12` | 48px | Major section separation |
| `space-16` | 64px | Page-level margins |
| `space-20` | 80px | Hero spacing |

### Layout Spacing

| Context | Value | Token |
|---------|-------|-------|
| Sidebar width (expanded) | 240px | `--sidebar-width` |
| Sidebar width (collapsed) | 64px | `--sidebar-width-collapsed` |
| Topbar height | 56px | `--topbar-height` |
| Page padding (desktop) | 24px | `space-6` |
| Page padding (mobile) | 16px | `space-4` |
| Card padding | 20px | `space-5` |
| Form field gap | 16px | `space-4` |
| Table row height (desktop) | 48px | — |
| Table row height (compact) | 44px | — |
| Drawer width (lg) | 480px | `--drawer-width-lg` |
| Drawer width (md) | 420px | `--drawer-width-md` |

---

## Border Radius Tokens

| Token | CSS Variable | Value | Usage |
|-------|-------------|-------|-------|
| `radius-sm` | `--radius-sm` | 6px | Buttons (sm), badges, chips |
| `radius-md` | `--radius-md` | 8px | Inputs, buttons (default), cards |
| `radius-lg` | `--radius-lg` | 12px | Cards, modals, drawers |
| `radius-xl` | `--radius-xl` | 16px | Large cards, panels |
| `radius-full` | `--radius-full` | 9999px | Avatars, pills, circular buttons |

---

## Shadow Tokens (`theme/shadows.js`)

| Token | CSS Variable | Value | Usage |
|-------|-------------|-------|-------|
| `shadow-sm` | `--shadow-sm` | `0 1px 2px 0 rgb(0 0 0 / 0.05)` | CardBase, subtle elevation |
| `shadow-md` | `--shadow-md` | `0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.05)` | CardElevated, dropdowns |
| `shadow-lg` | `--shadow-lg` | `0 10px 15px -3px rgb(0 0 0 / 0.07), 0 4px 6px -4px rgb(0 0 0 / 0.05)` | Modals, drawers |
| `shadow-xl` | `--shadow-xl` | `0 20px 25px -5px rgb(0 0 0 / 0.08), 0 8px 10px -6px rgb(0 0 0 / 0.04)` | Command palette, popovers |
| `shadow-inner` | `--shadow-inner` | `inset 0 2px 4px 0 rgb(0 0 0 / 0.05)` | Pressed inputs |
| `shadow-none` | — | `none` | Flat surfaces |

### Dark Mode Shadow Adjustment

Dark mode shadows use higher opacity: `rgb(0 0 0 / 0.3)` base instead of `0.05-0.08`.

---

## Transition Tokens

| Token | CSS Variable | Value | Usage |
|-------|-------------|-------|-------|
| `transition-fast` | `--transition-fast` | `120ms ease` | Hover states, color changes, micro-interactions |
| `transition-base` | `--transition-base` | `200ms ease` | Standard state changes, sidebar toggle |
| `transition-slow` | `--transition-slow` | `350ms ease` | Page transitions, drawer open/close |
| `transition-dramatic` | `--transition-dramatic` | `500ms ease` | Onboarding reveals, dashboard load |

### Easing Functions

| Name | Value | Usage |
|------|-------|-------|
| `ease-out` | `cubic-bezier(0, 0, 0.2, 1)` | Entrances |
| `ease-in` | `cubic-bezier(0.4, 0, 1, 1)` | Exits |
| `ease-in-out` | `cubic-bezier(0.4, 0, 0.2, 1)` | State changes |
| `spring` | `[0.4, 0, 0.2, 1]` | Sidebar, drawer (Framer Motion) |

---

## Z-Index Scale

| Token | Value | Usage |
|-------|-------|-------|
| `z-base` | 0 | Default content |
| `z-dropdown` | 10 | Dropdown menus |
| `z-sticky` | 20 | Sticky table headers, topbar |
| `z-sidebar` | 30 | Sidebar overlay on mobile |
| `z-drawer` | 40 | Drawer panels |
| `z-modal` | 50 | Modal dialogs |
| `z-popover` | 60 | Popovers, tooltips |
| `z-toast` | 70 | Sonner toast notifications |
| `z-command` | 80 | Command palette |
| `z-max` | 9999 | Full-screen overlays, onboarding spotlight |

---

## Breakpoint Tokens (`tailwind.config.js`)

| Token | Value | Usage |
|-------|-------|-------|
| `sm` | 640px | Mobile landscape |
| `md` | 768px | Tablet |
| `lg` | 1024px | Small desktop (sidebar collapses) |
| `xl` | 1280px | Standard desktop |
| `2xl` | 1440px | Large desktop |
| `3xl` | 1920px | Warehouse monitors |

---

## Component-Specific Tokens

### Button Sizes

| Size | Height | Padding X | Font Size | Icon Size |
|------|--------|-----------|-----------|-----------|
| `xs` | 28px | 8px | 11px | 14px |
| `sm` | 32px | 12px | 13px | 16px |
| `default` | 36px | 16px | 14px | 16px |
| `lg` | 40px | 20px | 15px | 18px |

### Input Sizes

| Size | Height | Padding X | Font Size |
|------|--------|-----------|-----------|
| `sm` | 32px | 10px | 13px |
| `default` | 36px | 12px | 14px |
| `lg` | 40px | 14px | 15px |

### Badge Sizes

| Size | Height | Padding X | Font Size |
|------|--------|-----------|-----------|
| `sm` | 20px | 6px | 11px |
| `md` | 24px | 8px | 12px |

### Avatar Sizes

| Size | Dimension | Font Size |
|------|-----------|-----------|
| `xs` | 24px | 10px |
| `sm` | 32px | 12px |
| `md` | 40px | 14px |
| `lg` | 48px | 16px |
| `xl` | 64px | 20px |

---

## Token Application in Tailwind (`tailwind.config.js`)

```javascript
// Maps CSS variables to Tailwind utilities
theme: {
  extend: {
    colors: {
      brand: {
        50: 'var(--color-brand-50)',
        100: 'var(--color-brand-100)',
        // ... etc
        500: 'var(--color-brand-500)',
        600: 'var(--color-brand-600)',
        700: 'var(--color-brand-700)',
        900: 'var(--color-brand-900)',
      },
      surface: {
        0: 'var(--color-surface-0)',
        1: 'var(--color-surface-1)',
        2: 'var(--color-surface-2)',
        3: 'var(--color-surface-3)',
      },
      // status colors, chart colors...
    },
    borderRadius: {
      sm: 'var(--radius-sm)',
      md: 'var(--radius-md)',
      lg: 'var(--radius-lg)',
      xl: 'var(--radius-xl)',
    },
    boxShadow: {
      sm: 'var(--shadow-sm)',
      md: 'var(--shadow-md)',
      lg: 'var(--shadow-lg)',
      xl: 'var(--shadow-xl)',
    },
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      mono: ['JetBrains Mono', 'monospace'],
    },
    transitionDuration: {
      fast: '120ms',
      base: '200ms',
      slow: '350ms',
      dramatic: '500ms',
    },
    zIndex: {
      dropdown: '10',
      sticky: '20',
      sidebar: '30',
      drawer: '40',
      modal: '50',
      popover: '60',
      toast: '70',
      command: '80',
    },
  },
}
```

---

## `theme/tokens.js` Export Structure

```javascript
export const colors = { brand: {...}, surface: {...}, text: {...}, status: {...}, chart: {...} };
export const typography = { families: {...}, scale: {...}, weights: {...} };
export const spacing = { ... };
export const radii = { sm: '6px', md: '8px', lg: '12px', xl: '16px', full: '9999px' };
export const shadows = { sm: '...', md: '...', lg: '...', xl: '...' };
export const transitions = { fast: '120ms ease', base: '200ms ease', slow: '350ms ease', dramatic: '500ms ease' };
export const zIndex = { base: 0, dropdown: 10, sticky: 20, sidebar: 30, drawer: 40, modal: 50, popover: 60, toast: 70, command: 80, max: 9999 };
export const breakpoints = { sm: '640px', md: '768px', lg: '1024px', xl: '1280px', '2xl': '1440px', '3xl': '1920px' };
```
