# Reuse Matrix: Reference DMS → Haion codebase

| Client requirement | Existing Haion implementation | Reuse | Modify | Create | Risk / reason |
|---|---|---|---|---|---|
| Login, sessions, JWT refresh | `auth.controller.js`, `auth.middleware.js`, `User` model, frontend auth store/interceptors | ✅ | Login also accepts DMS Login ID (`DmsProfile.loginId`). Login input accepts email / mobile / user ID. Refresh is single-flight. | — | Additive. Existing email/phone login is unchanged. |
| 12 DMS user types + page rights per user | `Role` / `ROLE_PERMISSIONS` (role-based only) | Partly (new `DMS_USER` role) | `ROLES`, `ROLE_PERMISSIONS`, frontend role maps | `DmsProfile` (userType, location, pages[]), `dmsContext`, `requirePage` | Role-level permissions can't express per-user page rights. |
| Location hierarchy HO → Branch → SS → Distributor → Dealer → Retailer | `Dealer`, `Warehouse` (flat, unique `code`, required GSTIN) | ❌ | — | `DmsLocation` (parent, mappedLocations, docPrefix, creditLimit) | Closed enums and required fields in `Dealer`. |
| Product / brand / category / sub-category / color / HSN | `Product` (EV-specific, `gstRate` enum, no subcategory), `Brand`, `Category` | ❌ | — | `DmsProduct`, `DmsMaster` (typed lookups), `DmsHsn` | `Product.gstRate` enum and EV warranty fields don't fit. |
| Price master (state × location type × product) | `PricingRule` (sku × region × dealerTier) | ❌ | — | `DmsPrice` | Different keys. |
| Vendors, customers, couriers, schemes | `Party`, `Customer` (dealer-bound) | ❌ | — | `DmsVendor`, `DmsCustomer`, `DmsMaster(courier)`, `DmsScheme` | `Customer.dealer` is required. `Party.code` collides. |
| PO → approval | `DealerOrder` (dealer-bound) | Pattern only | — | `DmsPurchaseOrder` | — |
| Invoice / STN / PRN / returns / opening / local purchase | `SalesInvoice`, `Invoice`, `Dispatch`, `GRN`, `SaleReturn`, `PurchaseReturn` | Pattern only | — | `DmsInvoice` (one model, `kind` drives behaviour) | Existing models need `dealer`/`warehouse`/`bill`, and their controllers post to `CompanyLedger`, which would double-post. |
| Stock OK/Damage/Missing per location | `Inventory`, `DealerInventory` (min 0, pre-save hooks, warehouse/dealer keyed) | ❌ | — | `DmsStock`, `DmsStockLedger` | — |
| Serial / IMEI tracking | `Warranty.serialNo` (globally unique, needs bill) | ❌ | — | `DmsSerial` (status + history) | Unique index clash. |
| Document numbering per location + FY | `sequence.util.js` (random suffix), find-max+1 (racy) | ❌ | — | `DmsCounter` (atomic `$inc`), `fyLabel` | Existing generators can collide. |
| GST CGST/SGST vs IGST | `gst.util.js` | Logic mirrored | — | `computeDocument` (rates come from the HSN master) | — |
| Payments + approval, adjustments, party ledger | `Payment`, `LedgerEntry` (closed enums, no approval) | ❌ | — | `DmsPayment`, `DmsLedger` | — |
| Audit trail | `logAudit` / `AuditLog` | ✅ | — | — | — |
| API envelope, error handling, pagination | `apiResponse.js`, `asyncHandler`, `parsePagination`, global error handler | ✅ | — | DMS error middleware (passes field `errors`) | — |
| Frontend shell: router, auth guard, React Query, axios, toast | `Router.jsx`, `AuthGuard`, `client.js`, `QueryProvider`, `utils/toast` | ✅ | `Router.jsx` (+1 lazy route) | `src/distributor/*` (own layout + scoped CSS) | The global theme (dark mode, fonts, radius) is isolated via the `.dms` scope. |
| Charts | recharts | ✅ | — | — | — |
| Tests | node:test + supertest, Playwright config | ✅ | — | `tests/dms.flow.test.js` (in-memory Mongo only) | The existing suite connects to `MONGODB_URI` when it is reachable. That is pre-existing behaviour. |
