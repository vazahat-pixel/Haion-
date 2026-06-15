# Haion ERP — System Walkthrough

End-to-end guide for validating the Dealer & Inventory ERP against the PRD.

## Prerequisites

1. Install [MongoDB Community](https://www.mongodb.com/try/download/community) and start the service
2. `backend/.env` — use `mongodb://127.0.0.1:27017/haion_erp` (see `.env.example`)
3. Optional SMTP vars for password-reset emails

```bash
cd backend && npm run seed && npm run dev
cd frontend && npm run dev
```

- Frontend: http://localhost:5173
- API health: http://localhost:3000/api/health

All seed users use password: **`password`**

| Email | Role | Panel |
|-------|------|-------|
| admin@haion.com | MASTER_ADMIN | /admin |
| warehouse@haion.com | WAREHOUSE_MANAGER | /admin |
| dealer@haion.com | DEALER_ADMIN | /dealer |
| employee@haion.com | EMPLOYEE | /employee |
| service@haion.com | SERVICE_CENTER | /service |
| customer@haion.com | CUSTOMER | /customer |

---

## Flow 1 — Inventory Chain (P0)

1. Login as **warehouse@haion.com**
2. **Admin → GRN** — Create GRN via warehouse GRN stepper (warehouses + products from API)
3. Verify GRN → warehouse stock increases
4. **Dispatch** — Create dispatch to dealer, advance status to DISPATCHED → DELIVERED
5. Login as **dealer@haion.com** → **Dealer Inventory** shows received stock

## Flow 2 — Billing & Revenue (P1)

1. **Dealer → Customers** — Create customer
2. **Dealer → Billing → New** — Multi-line bill with GST catalog
3. Send bill → invoice created
4. Mark paid → warranty registered, dealer stock deducted
5. **Invoice detail** → Download PDF

## Flow 3 — Service (P2)

1. Login as **service@haion.com**
2. **Complaints** — View, escalate, resolve
3. **Spares** — Request parts
4. **Returns** — Inspect defective returns

## Flow 4 — Field Ops (P3)

1. Login as **employee@haion.com**
2. **Assigned Dealers** — View dealer cards
3. **Performance** / **Dealer Analytics** — KPIs from API
4. **Tasks** — List and complete tasks

## Flow 5 — Admin & RBAC (P5)

1. Login as **admin@haion.com**
2. **Settings → Roles & Permissions** — Edit role permissions (re-login to refresh)
3. **⌘K / Ctrl+K** — Global search across entities
4. **Audit Logs** — Login and action trail

## Flow 6 — Onboarding & Catalog

1. **Admin → Products** — Add product with image upload
2. **Admin → Dealers → Onboarding** — Pincode lookup + document upload
3. Approve dealer (set status ACTIVE in DB or via future approval UI)

---

## Automated Tests

```bash
cd backend && npm test    # unit + integration (supertest)
cd frontend && npm run build
```

CI runs both on push/PR via `.github/workflows/ci.yml`.

---

## Known Limits

- Pincode directory is a static subset (extend `backend/src/data/pincode.data.js`)
- MongoDB required locally; in-memory fallback needs VC++ on Windows
- `withMockFallback` remains in some secondary services when `VITE_USE_MOCK_API=true`
