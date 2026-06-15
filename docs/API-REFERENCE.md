# Haion ERP — API Reference (partial)

Base URL: `http://localhost:3000/api`  
Auth: `Authorization: Bearer <access_token>`

## P1 — Billing & Revenue

| Method | Endpoint | Permission |
|--------|----------|------------|
| GET | `/customers` | `dealer.customers.read` |
| POST | `/customers` | `dealer.customers.create` |
| GET | `/billing` | `billing.read` |
| POST | `/billing` | `billing.create` |
| GET | `/billing/next-bill-number` | `billing.read` |
| POST | `/billing/:id/send` | `billing.send` |
| POST | `/billing/:id/mark-paid` | `billing.update` |
| GET | `/invoices` | `invoices.read` |
| GET | `/warranty` | `warranty.read` |
| GET | `/warranty/eligibility?serial=` | `warranty.read` |
| GET | `/dealer/billing-catalog` | `billing.create` |
| GET | `/gst/config` | `gst.config` or `billing.read` |

**Bill lifecycle:** `DRAFT` → `SENT` (creates invoice) → `PAID` (deducts dealer stock, registers warranty)

## P2 — Service & Ops

| Method | Endpoint | Permission |
|--------|----------|------------|
| GET | `/complaints` | `complaints.read` |
| POST | `/complaints/:id/escalate` | `complaints.escalate` |
| GET | `/spares` | `spares.read` |
| POST | `/spares/request` | `spares.request` |
| GET | `/returns` | `returns.read` |
| GET | `/service-requests` | `service-requests.read` |
| GET | `/analytics/dashboard/:panel` | panel-specific |
| GET | `/tasks` | `tasks.read` |

Panels: `admin`, `dealer`, `employee`, `service`, `customer`

## P3 — Admin & Ops

| Method | Endpoint | Permission |
|--------|----------|------------|
| GET | `/employees` | `employees.read` |
| POST | `/employees` | `employees.create` |
| GET | `/employee/assigned-dealers` | `employee.dealers.read` |
| GET | `/employee/performance` | `employee.performance.read` |
| GET | `/employee/dealer-analytics` | `employee.analytics.read` |
| GET | `/approvals` | `approvals.read` |
| PATCH | `/approvals/:id` | `approvals.update` |
| GET | `/notifications` | authenticated |
| GET | `/audit` | `audit.read` |
| GET/PATCH | `/settings/general` | `settings.read` / `settings.update` |
| GET/PATCH | `/settings/gst` | `settings.read` / `settings.update` |
| GET/PATCH | `/settings/notifications` | `settings.read` / `settings.update` |

## P4 — Commerce & Catalog

| Method | Endpoint | Permission |
|--------|----------|------------|
| GET | `/orders` | `orders.read` |
| GET | `/orders/:id/tracking` | `orders.read` |
| GET | `/reports` | `reports.read` |
| GET/POST | `/expenses` | `expenses.read` / `expenses.create` |
| GET | `/pricing` | `pricing.read` |
| PATCH | `/pricing/:id` | `pricing.update` |
| GET | `/dealers/:id/team` | `dealers.read` or `dealer.team.read` |
| GET | `/dealers/:id/performance` | `dealers.read` |
| GET | `/dealer/team` | `dealer.team.read` |
| GET | `/dealer/reports` | `dealer.reports.read` |
| GET | `/analytics/revenue` | `analytics.read` |

## P5 — Platform (RBAC, Search, Upload)

| Method | Endpoint | Permission |
|--------|----------|------------|
| GET | `/rbac/permissions` | `rbac.read` |
| GET | `/rbac/roles` | `rbac.read` |
| GET | `/rbac/roles/:code` | `rbac.read` |
| PATCH | `/rbac/roles/:code/permissions` | `rbac.update` |
| GET | `/search?q=` | authenticated |
| POST | `/upload` | authenticated (multipart `file`) |
| GET | `/invoices/:id/pdf` | `invoices.read` |
| GET | `/invoices/:id/pdf?download=true` | `invoices.read` (HTML attachment) |
| GET | `/invoices/:id/pdf?download=true&format=pdf` | `invoices.read` (PDF download) |

**RBAC:** Permissions are stored in `Role` collection; seed syncs from `rolePermissions.js`. Users must re-login after permission changes.

**Search:** Minimum 2 characters; returns typed results with navigation paths.

**Upload:** Returns `{ url, filename, mimetype, size }` for stored file.

## Address Lookup

| Method | Endpoint | Permission |
|--------|----------|------------|
| GET | `/address/states` | authenticated |
| GET | `/address/pincode/:pin` | authenticated |

Returns city, district, state, and state code for supported 6-digit pincodes.
