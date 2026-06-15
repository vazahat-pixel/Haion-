# OUTPUT 8 — INTEGRATION READINESS CHECKLIST

> Line-by-line checklist of what must be confirmed with the backend team before frontend modules are built.

---

## Authentication & Session

- [ ] **Access token format confirmed** — JWT structure, claims (role, permissions, dealerId, warehouseId), expiry (15 min)
- [ ] **Refresh token mechanism confirmed** — `httpOnly` cookie name, path, `SameSite`, `Secure` flags, expiry duration
- [ ] **`POST /auth/login`** — Request/response shape: `{ email, password }` → `{ user, accessToken }` + refresh cookie
- [ ] **`POST /auth/refresh`** — Cookie-based, returns new `{ accessToken, user }` or 401
- [ ] **`POST /auth/logout`** — Clears refresh cookie server-side
- [ ] **`POST /auth/forgot-password`** — Accepts `{ email }`, always returns 200 (security)
- [ ] **`POST /auth/reset-password`** — Accepts `{ token, password }`, one-time use token
- [ ] **`GET /auth/me`** — Returns current user with permissions array
- [ ] **Token refresh on 401** — Backend supports retry with new token (idempotent GETs)
- [ ] **Concurrent refresh handling** — Backend deduplicates simultaneous refresh requests
- [ ] **Role enum values** — Exact string values match `constants/roles.js`: `MASTER_ADMIN`, `WAREHOUSE_MANAGER`, `DEALER_ADMIN`, `DEALER_SALES`, `EMPLOYEE`, `MANAGER`, `CUSTOMER_SUPPORT`, `SERVICE_CENTER`, `CUSTOMER`
- [ ] **Permissions array format** — Dot-notation strings: `billing.create`, `inventory.read`, etc.
- [ ] **Permission source of truth** — Backend sends permissions in login/refresh response (not separate endpoint)

---

## API Response Contract

- [ ] **Standard response envelope confirmed:**
  ```json
  {
    "data": {},
    "meta": { "total": 0, "page": 1, "perPage": 20, "lastPage": 1 },
    "message": "Success",
    "errors": {}
  }
  ```
- [ ] **Pagination query params** — `?page=1&perPage=20&sort=createdAt&order=desc&search=query`
- [ ] **Pagination defaults** — `page=1`, `perPage=20` if not provided
- [ ] **Sort param format** — Field name string, `order=asc|desc`
- [ ] **Search param** — Single `search` query param, backend handles multi-field search
- [ ] **Filter params** — Module-specific filters as query params (e.g., `?status=active&category=electronics`)
- [ ] **422 validation errors** — Field-keyed: `{ "errors": { "email": ["Invalid email"], "gstin": ["Invalid GSTIN"] } }`
- [ ] **403 response shape** — `{ "message": "Permission denied" }` with no data leak
- [ ] **404 on detail endpoints** — Returns 404 (not empty object) for missing resources
- [ ] **5xx error shape** — `{ "message": "Internal server error", "requestId": "uuid" }`
- [ ] **`X-Request-ID` header** — Backend accepts and echoes for tracing
- [ ] **`X-Panel` header** — Backend logs for audit (values: `admin`, `dealer`, `employee`, `service`, `customer`)
- [ ] **CORS configuration** — Allows frontend origin, credentials (cookies), required headers
- [ ] **Rate limiting headers** — `X-RateLimit-Remaining`, `X-RateLimit-Reset` (if applicable)

---

## Inventory Engine

- [ ] **`GET /inventory`** — Paginated list with filters: status, category, warehouseId, search
- [ ] **`GET /inventory/:id`** — Detail with stock levels, warehouse breakdown
- [ ] **`POST /inventory`** — Create item (MASTER_ADMIN, WAREHOUSE_MANAGER)
- [ ] **`PATCH /inventory/:id`** — Update item fields
- [ ] **`PATCH /inventory/:id/status`** — Status transition with validation
- [ ] **`DELETE /inventory/:id`** — Soft delete
- [ ] **`GET /inventory/low-stock`** — Items below minimum threshold (for badge count)
- [ ] **`GET /inventory/categories`** — Category list for filters
- [ ] **Inventory status enum** — `IN_STOCK`, `LOW_STOCK`, `OUT_OF_STOCK`, `DISCONTINUED`
- [ ] **SKU format** — Alphanumeric pattern, max length
- [ ] **Stock quantity** — Integer, non-negative, per-warehouse breakdown available
- [ ] **Bulk update endpoint** — `PATCH /inventory/bulk` with `{ ids[], status }` or similar
- [ ] **Export endpoint** — `GET /inventory/export?format=csv|xlsx&...filters`

---

## Warehouse & GRN

- [ ] **`GET /warehouses`** — List with filters
- [ ] **`GET /warehouses/:id`** — Detail with stock summary
- [ ] **`GET /warehouses/:id/stock`** — Stock levels per SKU in warehouse
- [ ] **`GET /grn`** — GRN list with warehouseId filter
- [ ] **`GET /grn/:id`** — GRN detail with line items
- [ ] **`POST /grn`** — Create GRN with line items array
- [ ] **`PATCH /grn/:id/verify`** — Verify GRN (updates inventory)
- [ ] **`PATCH /grn/:id/reject`** — Reject GRN with reason
- [ ] **GRN status enum** — `DRAFT`, `PENDING_VERIFICATION`, `VERIFIED`, `REJECTED`
- [ ] **Warehouse scoping** — WAREHOUSE_MANAGER only sees assigned warehouse
- [ ] **GRN line item shape** — `{ sku, expectedQty, receivedQty, variance, notes }`

---

## Dispatch Engine

- [ ] **`GET /dispatch`** — Paginated list with status, warehouse, dealer filters
- [ ] **`GET /dispatch/:id`** — Detail with tracking timeline
- [ ] **`GET /dispatch/:id/tracking`** — Status history array
- [ ] **`POST /dispatch`** — Create dispatch order
- [ ] **`PATCH /dispatch/:id/status`** — Status transition
- [ ] **`GET /dispatch/pending-count`** — Count for sidebar badge
- [ ] **Dispatch status enum** — `CREATED`, `PICKED`, `PACKED`, `DISPATCHED`, `IN_TRANSIT`, `DELIVERED`, `CANCELLED`
- [ ] **Status transition rules** — Which transitions are valid (state machine documented)
- [ ] **Dispatch → inventory impact** — Stock decremented on which status transition

---

## Billing & Revenue Engine

- [ ] **`GET /billing`** — Paginated list with dealer, status, date range filters
- [ ] **`GET /billing/:id`** — Bill detail with line items, GST breakdown
- [ ] **`POST /billing`** — Create bill (decrements dealer inventory)
- [ ] **`PATCH /billing/:id`** — Update draft bill
- [ ] **`PATCH /billing/:id/send`** — Send bill (generates invoice)
- [ ] **`PATCH /billing/:id/mark-paid`** — Mark as paid
- [ ] **`PATCH /billing/:id/cancel`** — Cancel bill (restores inventory)
- [ ] **`GET /billing/next-bill-number`** — Returns next sequential bill number
- [ ] **Bill number format** — Pattern confirmed (e.g., `INV-2024-XXXX`)
- [ ] **Billing status enum** — `DRAFT`, `SENT`, `PAID`, `OVERDUE`, `CANCELLED`
- [ ] **Line item shape** — `{ productId, sku, name, qty, unitPrice, discount, gstRate, hsnCode, amount }`
- [ ] **GST calculation** — CGST+SGST (intra-state) or IGST (inter-state) — backend calculates or frontend?
- [ ] **Bill total fields** — `subtotal`, `discountTotal`, `cgst`, `sgst`, `igst`, `total`, `roundOff`
- [ ] **Dealer sales scoping** — DEALER_SALES only sees own bills
- [ ] **`GET /invoices`** — Invoice list (post-send bills)
- [ ] **`GET /invoices/:id`** — Invoice detail
- [ ] **`GET /invoices/:id/pdf`** — PDF download endpoint

---

## GST Compliance

- [ ] **`GET /gst/config`** — Company GSTIN, state code, registration type
- [ ] **`GET /gst/rates`** — All GST rate slabs
- [ ] **`GET /gst/hsn`** — HSN code list with descriptions and rates
- [ ] **`GET /gst/hsn/:code`** — HSN lookup by code
- [ ] **`GET /gst/validate/:gstin`** — GSTIN validation (format + active status)
- [ ] **GSTIN format** — 15-character pattern validation rules
- [ ] **State code mapping** — GSTIN chars 1-2 → state name
- [ ] **Interstate detection** — Company state vs dealer/customer state
- [ ] **HSN code format** — 4/6/8 digit codes
- [ ] **GST rate slabs** — 0%, 5%, 12%, 18%, 28% confirmed

---

## Warranty

- [ ] **`GET /warranty`** — List with product, dealer, status filters
- [ ] **`GET /warranty/:id`** — Detail with claim history
- [ ] **`POST /warranty`** — Register warranty
- [ ] **`POST /warranty/:id/claim`** — File warranty claim
- [ ] **`GET /warranty/eligibility`** — `?productId=&serialNo=` → eligible boolean + details
- [ ] **Warranty status enum** — `ACTIVE`, `EXPIRED`, `CLAIMED`, `VOID`
- [ ] **Warranty period** — Duration calculation from purchase date
- [ ] **Serial number tracking** — Required for warranty registration

---

## Complaints & Service Engine

- [ ] **`GET /complaints`** — Paginated with status, priority, assignee filters
- [ ] **`GET /complaints/:id`** — Detail with timeline
- [ ] **`GET /complaints/:id/timeline`** — Status change history
- [ ] **`GET /complaints/:id/sla`** — SLA status (time remaining, breached)
- [ ] **`POST /complaints`** — Create complaint/ticket
- [ ] **`PATCH /complaints/:id/status`** — Status transition
- [ ] **`PATCH /complaints/:id/assign`** — Assign to service center/employee
- [ ] **`PATCH /complaints/:id/escalate`** — Escalate with reason
- [ ] **`PATCH /complaints/:id/resolve`** — Resolve with resolution notes
- [ ] **`GET /complaints/open-count`** — Count for sidebar badge
- [ ] **Complaint status enum** — `OPEN`, `IN_PROGRESS`, `ESCALATED`, `RESOLVED`, `CLOSED`
- [ ] **Priority enum** — `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`
- [ ] **SLA rules** — Response time and resolution time per priority level
- [ ] **Ticket number format** — Pattern (e.g., `TKT-2024-XXXX`)
- [ ] **Customer can create** — `POST /complaints` or `POST /service-requests` from customer panel

---

## Spare Parts & Returns

- [ ] **`GET /spares`** — Spare parts inventory list
- [ ] **`GET /spares/:id`** — Detail
- [ ] **`GET /spares/:id/availability`** — Stock availability for specific part
- [ ] **`POST /spares/request`** — Request spare parts for complaint
- [ ] **`GET /returns`** — Defective returns list
- [ ] **`GET /returns/:id`** — Return detail with inspection notes
- [ ] **`POST /returns`** — Create return request
- [ ] **`PATCH /returns/:id/inspect`** — Inspection result
- [ ] **Return status enum** — `REQUESTED`, `APPROVED`, `RECEIVED`, `INSPECTED`, `CREDITED`, `REJECTED`

---

## Dealers

- [ ] **`GET /dealers`** — Paginated list (MASTER_ADMIN only)
- [ ] **`GET /dealers/:id`** — Dealer profile detail
- [ ] **`POST /dealers`** — Onboard new dealer
- [ ] **`PATCH /dealers/:id`** — Update dealer
- [ ] **`GET /dealers/:id/inventory`** — Dealer's stock levels
- [ ] **`GET /dealers/:id/team`** — Dealer's sales team
- [ ] **`GET /dealers/:id/performance`** — Sales metrics with date range filter
- [ ] **Dealer fields** — name, gstin, pan, address, contact, creditLimit, paymentTerms
- [ ] **Dealer status enum** — `ACTIVE`, `INACTIVE`, `SUSPENDED`, `PENDING_ONBOARDING`

---

## Employees & HR

- [ ] **`GET /employees`** — Paginated list
- [ ] **`GET /employees/:id`** — Employee detail
- [ ] **`POST /employees`** — Create employee
- [ ] **`PATCH /employees/:id`** — Update employee
- [ ] **`PATCH /employees/:id/role`** — Role assignment
- [ ] **`GET /employees/team/:managerId`** — Manager's direct reports
- [ ] **`GET /employees/hierarchy`** — Org chart data
- [ ] **`GET /tasks`** — Task list (scoped by assignee)
- [ ] **`GET /tasks/:id`** — Task detail
- [ ] **`PATCH /tasks/:id`** — Update task status
- [ ] **`GET /tasks/pending-count`** — Badge count
- [ ] **`GET /approvals`** — Approval queue (MANAGER only)
- [ ] **`PATCH /approvals/:id`** — Approve/reject
- [ ] **`GET /approvals/pending-count`** — Badge count
- [ ] **`GET /reports`** — Report list
- [ ] **`GET /reports/:id`** — Report detail/download

---

## Customer Portal

- [ ] **`GET /orders`** — Customer's orders (scoped to customer ID from token)
- [ ] **`GET /orders/:id`** — Order detail with tracking
- [ ] **`GET /orders/:id/tracking`** — Shipment tracking events
- [ ] **`GET /service-requests`** — Customer's service requests
- [ ] **`POST /service-requests`** — Create service request
- [ ] **`GET /service-requests/:id`** — Request detail
- [ ] **Customer data scoping** — All endpoints auto-scope to authenticated customer (no ID in URL)

---

## Analytics & Dashboard

- [ ] **`GET /analytics/dashboard/:panel`** — Panel-specific KPIs with `?from=&to=` date range
- [ ] **`GET /analytics/revenue`** — Revenue time series data for charts
- [ ] **`GET /analytics/orders`** — Order volume time series
- [ ] **`GET /analytics/complaints`** — Complaint metrics time series
- [ ] **`GET /analytics/inventory`** — Stock level analytics
- [ ] **`GET /analytics/dealers`** — Dealer performance metrics
- [ ] **KPI response shape** — `{ label, value, previousValue, trend, trendPercent }`
- [ ] **Chart data shape** — `{ labels: [], datasets: [{ name, data: [] }] }`
- [ ] **Date range filter** — ISO date strings, backend handles timezone (IST assumed)
- [ ] **Real-time KPIs** — Polling interval support (60s), or WebSocket planned?

---

## Notifications

- [ ] **`GET /notifications`** — Paginated, with `?read=true|false` filter
- [ ] **`GET /notifications/unread-count`** — Integer count
- [ ] **`PATCH /notifications/:id/read`** — Mark single as read
- [ ] **`PATCH /notifications/read-all`** — Mark all as read
- [ ] **`DELETE /notifications/:id`** — Dismiss notification
- [ ] **Notification shape** — `{ id, type, title, description, read, priority, link, module, createdAt }`
- [ ] **Real-time delivery** — WebSocket, SSE, or polling only?
- [ ] **Push notification plan** — Browser push API support planned?

---

## Audit Logs

- [ ] **`GET /audit`** — Paginated with userId, action, module, date range filters
- [ ] **`GET /audit/:id`** — Single audit entry detail
- [ ] **Audit entry shape** — `{ id, userId, userName, action, module, resourceType, resourceId, changes, ip, createdAt }`
- [ ] **Retention policy** — How far back can frontend query?

---

## Settings

- [ ] **`GET /settings/general`** — Company name, logo, address, contact
- [ ] **`PATCH /settings/general`** — Update general settings
- [ ] **`GET /settings/gst`** — GST configuration
- [ ] **`PATCH /settings/gst`** — Update GST settings
- [ ] **`GET /settings/notifications`** — Notification preferences
- [ ] **`PATCH /settings/notifications`** — Update notification preferences

---

## Search

- [ ] **`GET /search`** — Global search: `?q=query&type=all|products|dealers|invoices|employees|complaints`
- [ ] **Search response shape** — `{ results: [{ type, id, title, subtitle, link }] }`
- [ ] **Minimum query length** — Backend enforces or frontend? (frontend: 2 chars)
- [ ] **Search debounce** — Frontend handles (300ms), backend response time target < 200ms

---

## Address & Lookup

- [ ] **`GET /address/pincode/:pin`** — Returns `{ city, state, district }` from 6-digit pincode
- [ ] **`GET /address/states`** — Indian states list for dropdown
- [ ] **Pincode API** — Third-party or internal? Rate limits?

---

## File Upload

- [ ] **Upload endpoint** — `POST /upload` with multipart/form-data
- [ ] **Max file size** — Confirmed limit (frontend enforces same)
- [ ] **Allowed MIME types** — Per context (images: jpg/png, documents: pdf/xlsx)
- [ ] **Response shape** — `{ url, filename, size, mimeType }`
- [ ] **Progress support** — Chunked upload needed for large files?
- [ ] **Storage** — S3/CDN URL pattern for displaying uploaded files

---

## Export & Import

- [ ] **Export endpoints** — Per module: `GET /{module}/export?format=csv|xlsx&...filters`
- [ ] **Export scope** — Current page, all filtered, selected IDs (`?ids=1,2,3`)
- [ ] **Export async** — Large exports return job ID + polling endpoint?
- [ ] **Import endpoint** — `POST /{module}/import` with file upload
- [ ] **Import response** — `{ imported: N, failed: N, errors: [{ row, field, message }] }`
- [ ] **Import template** — `GET /{module}/import/template` returns sample file

---

## WebSocket / Real-Time (if planned)

- [ ] **WebSocket URL** — `wss://api.example.com/ws`
- [ ] **Authentication** — Token in connection handshake or first message
- [ ] **Event types** — `notification`, `inventory-update`, `complaint-escalated`, etc.
- [ ] **Reconnection strategy** — Auto-reconnect with exponential backoff
- [ ] **Fallback** — Polling intervals if WebSocket unavailable

---

## Environment & Deployment

- [ ] **`VITE_API_BASE_URL`** — Staging and production URLs confirmed
- [ ] **API versioning** — `/api/v1/` prefix or unversioned?
- [ ] **Staging environment** — Available for frontend development
- [ ] **Seed data** — Test accounts for each role available
- [ ] **API documentation** — OpenAPI/Swagger spec shared
- [ ] **Postman/Insomnia collection** — Shared with frontend team
- [ ] **Error tracking** — Sentry DSN or equivalent for frontend error reporting
- [ ] **CDN for assets** — Logo, favicon URLs if hosted externally

---

## Data Formats & Conventions

- [ ] **Date format** — ISO 8601 (`2024-01-15T10:30:00Z`) in all API responses
- [ ] **Currency** — Integer (paise) or decimal (rupees)? Frontend displays INR with `en-IN` locale
- [ ] **Phone numbers** — E.164 format (`+919876543210`) or separate country code + number
- [ ] **IDs** — UUID v4 or auto-increment integers?
- [ ] **Soft delete** — Deleted records return 404 or appear with `deletedAt`?
- [ ] **Timezone** — All dates in UTC, display in IST (UTC+5:30)?
- [ ] **Boolean fields** — `true`/`false` (not `1`/`0` or `"yes"`/`"no"`)

---

## Security Confirmations

- [ ] **HTTPS only** — All API communication over TLS
- [ ] **Cookie security** — `httpOnly`, `Secure`, `SameSite=Strict` on refresh token
- [ ] **CSRF protection** — Required for cookie-based auth? Token strategy?
- [ ] **Input sanitization** — Backend sanitizes all inputs (frontend also validates via Zod)
- [ ] **File upload scanning** — Malware scan on uploaded files
- [ ] **Rate limiting** — Per-endpoint limits documented
- [ ] **Sensitive data in responses** — Passwords, tokens never in API responses
- [ ] **Audit logging** — All write operations logged with user + timestamp
