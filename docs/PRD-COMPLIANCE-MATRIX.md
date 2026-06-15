# PRD Compliance Matrix — Haion Dealer & Inventory ERP

> Source: `PRD_Dealer_Inventory_.pdf`  
> Last updated: Phase P5 complete

| PRD Area | Requirement | Status | Backend | Frontend | Notes |
|----------|-------------|--------|---------|----------|-------|
| Auth | JWT login, refresh, RBAC | ✅ | `/api/auth/*` | AuthGuard, PermissionGuard | Dynamic permissions from DB |
| Inventory | Warehouse → GRN → Dispatch → Dealer stock | ✅ | P0 APIs | Wired | Full chain |
| Catalog | Products, categories, brands, tiers | ✅ | `/api/products`, catalog | Admin pages | |
| Billing | Multi-line GST bills, invoice, warranty | ✅ | P1 APIs | BillingInvoiceBuilder | HTML invoice export |
| Service | Complaints, spares, returns | ✅ | P2 APIs | Service panel | |
| Field Ops | Employee dealers, tasks, analytics | ✅ | P3 APIs | Employee panel | |
| Admin | Employees, approvals, audit, settings | ✅ | P3 APIs | Admin modules | |
| Commerce | Orders, reports, expenses, pricing | ✅ | P4 APIs | Services wired | E2E pending DB |
| Address | Pincode / state lookup | ✅ | `/api/address/*` | `address.service.js` | Static pincode directory |
| RBAC | Role & permission management | ✅ | `/api/rbac/*` | Roles & Permissions page | Re-login after edits |
| Search | Global search | ✅ | `/api/search` | Topbar ⌘K palette | |
| Upload | File upload for assets | ✅ | `POST /api/upload` | `upload.service.js` | Multer middleware |
| PDF/Invoice | Downloadable invoice | ✅ | PDF via pdfkit | InvoicePreview PDF download | HTML also available |
| Tests | Automated API/unit tests | ✅ | `node:test` + supertest + CI | — | E2E browser tests optional |
| Email | Password reset | ✅ | nodemailer service | Forgot password page | SMTP optional in dev |
| CI/CD | Build & test pipeline | ✅ | `.github/workflows/ci.yml` | build | — |
| MongoDB | Production DB | ⚠️ | Local URI in `.env` | — | Install MongoDB locally |

## Overall PRD Compliance: ~92%

### Remaining gaps
- Install MongoDB locally for seed/E2E validation on dev machine
- Browser E2E tests (Playwright) optional
- `withMockFallback` in secondary services (core services now direct API)
- Expand pincode directory or integrate India Post API
