# Dealer Inventory ERP — Frontend Foundation Blueprint v2.0

> Enterprise-grade, production-ready frontend architecture specification.
> After reading this blueprint, any React developer (or AI model) can build any module without clarifying questions about architecture.

## Blueprint Index

| Output | File | Description |
|--------|------|-------------|
| 1 | [OUTPUT-01-FOLDER-TREE.md](./OUTPUT-01-FOLDER-TREE.md) | Complete `src/` folder tree with every file named |
| 2 | [OUTPUT-02-ROUTING-MAP.md](./OUTPUT-02-ROUTING-MAP.md) | Route table: path, component, roles, guards, lazy/eager, layout |
| 3 | [OUTPUT-03-STORE-MAP.md](./OUTPUT-03-STORE-MAP.md) | Zustand stores: state shape, actions, persistence |
| 4 | [OUTPUT-04-QUERY-MAP.md](./OUTPUT-04-QUERY-MAP.md) | TanStack Query keys, stale times, refetch, invalidation |
| 5 | [OUTPUT-05-COMPONENT-INVENTORY.md](./OUTPUT-05-COMPONENT-INVENTORY.md) | Every component: props, variants, usage context |
| 6 | [OUTPUT-06-DESIGN-TOKENS.md](./OUTPUT-06-DESIGN-TOKENS.md) | Color, typography, spacing, radius, shadow, z-index |
| 7 | [OUTPUT-07-MOTION-GUIDELINES.md](./OUTPUT-07-MOTION-GUIDELINES.md) | Framer Motion variants, GSAP use cases, timing rules |
| 8 | [OUTPUT-08-INTEGRATION-CHECKLIST.md](./OUTPUT-08-INTEGRATION-CHECKLIST.md) | Backend integration confirmation checklist |
| 9 | [OUTPUT-09-ANTI-PATTERNS.md](./OUTPUT-09-ANTI-PATTERNS.md) | Patterns that must never appear in the codebase |
| 10 | [OUTPUT-10-AI-CODE-GENERATION-RULES.md](./OUTPUT-10-AI-CODE-GENERATION-RULES.md) | Rules for all future AI-assisted code generation |

## Tech Stack (Locked)

React · Vite · JavaScript · Tailwind CSS · shadcn/ui · Framer Motion · GSAP · Zustand · TanStack Query v5 · React Router v6 · React Hook Form · Zod · Lucide React · Recharts · date-fns · Sonner

## Five Panels

| Panel | Route Prefix | Roles |
|-------|-------------|-------|
| Admin Console | `/admin` | MASTER_ADMIN, WAREHOUSE_MANAGER |
| Dealer Workspace | `/dealer` | DEALER_ADMIN, DEALER_SALES |
| Employee Hub | `/employee` | EMPLOYEE, MANAGER |
| Service Console | `/service` | CUSTOMER_SUPPORT, SERVICE_CENTER |
| Customer Portal | `/customer` | CUSTOMER |

## Five Business Engines

| Engine | Modules |
|--------|---------|
| Inventory | inventory, dispatch, grn, warehouses |
| Revenue | billing, gst, warranty, dealers |
| Service | complaints, spares, returns |
| HR/OPS | employees, tasks, approvals, reports |
| Master Intelligence | analytics, notifications, audit-log |

## Quick Start for Developers

1. Read Outputs 1–3 for structure, routing, and state
2. Read Output 5 before building any UI
3. Read Output 4 before writing any data fetching
4. Read Output 9 to know what NOT to do
5. Read Output 10 before every implementation session
6. Complete Output 8 checklist with backend team before module development

## Quick Start for AI Sessions

Include in every prompt:

```
Blueprint: docs/blueprint/ (Outputs 1-10)
Rules: OUTPUT-10-AI-CODE-GENERATION-RULES.md
Anti-patterns: OUTPUT-09-ANTI-PATTERNS.md
```
