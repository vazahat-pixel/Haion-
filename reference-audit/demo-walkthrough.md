# Distributor DMS — 15–20 minute demo walkthrough

**Data:** synthetic demo database `dms_demo` (Dec-2024 → 19-Nov-2026) created by `backend/scripts/dms-demo-seed.js`.
**Never run this against production.** Reset any time with `--reset` (see "Prepare" below).
**Password for every demo account:** `DmsDemo@123`

## Prepare (2 minutes, before the client joins)

```bash
# 1. isolated demo database + data (first time, or to reset)
cd backend
node scripts/dms-dev-db.mjs                                          # throw-away local MongoDB on :27999
MONGODB_URI=mongodb://127.0.0.1:27999/ node scripts/dms-demo-seed.js --reset      # ~9 min
MONGODB_URI=mongodb://127.0.0.1:27999/ node scripts/dms-demo-verify.js            # reconciliation, should end "All 20 checks passed"
# 2. run the app against it
MONGODB_URI=mongodb://127.0.0.1:27999/ MONGODB_DB_NAME=dms_demo node src/server.js
cd ../frontend && npm run dev                                        # http://localhost:5173
```

Accounts (sign in at `/auth/login`; the Login ID goes in the first box):

| Role | Sign in with | What they see |
|---|---|---|
| Admin (all pages) | `dms.admin@demo.haion.local` | everything |
| Head Office — Rohit Malhotra | `INUSRHOUP1` | all locations, approvals, HR, reports |
| Branch Agra — Anil Kapoor | `INUSRBRUP2` | Agra + its dealers only |
| Dealer staff — Vikas Gupta (Krishna Mobiles, Agra) | `DEUSRDLUP6` | own location only; sales, receive, leads, own HR |

(E-mail form also works, e.g. `kma@demo.haion.local`, `agra@demo.haion.local`, `ho@demo.haion.local`.)

## The story

*"Haion Distribution HQ buys from vendors, supplies four branches (Agra, Jaipur, Lucknow, Mumbai), each branch supplies dealers, dealers sell serial-tracked phones/TVs/ACs and accessories to customers. Money flows back up as payments that the receiving side approves. Sales, HR and field teams run on the same panel."*

## Walkthrough

| # | Role / route | Do this | Expected result | Talking point |
|---|---|---|---|---|
| 1 | Admin → `/distributor/home` | Open the dashboard. Switch the location filter to *Haion Branch Agra*, then back to all. | Six tiles (Sale, Purchase, PO, Collection, Inventory, Outstanding), top-5 charts, PO and invoice status pies, 12-month trend — all derived from transactions. | Every figure is computed from records; the verify script proves tile = sum of source documents. |
| 2 | Admin → *Master Management → Location Master* | Open *Haion Branch Agra*; click **Mapping**. | Hierarchy HQ → Branch → Dealer/Distributor/Retailer, document prefix `AGR`, credit limit, bank, location codes like `INBRUP001`. | Same code scheme and master structure as the existing DMS. |
| 3 | Admin → *Product Master*, *Tax Master*, *Price Master*, *Scheme Master* | Show a serialized phone (PH-X1) and an accessory; HSN 18% GST; the Diwali scheme. | 14 products, HSN-driven tax, price by state × location type, schemes. | Tax is calculated server-side from the HSN master. |
| 4 | Dealer `DEUSRDLUP6` → *Sale Force → Lead* | Add a lead (e.g. "Demo Telecom"), save. | Lead id `LD000xx`, status **Open**. | Lead lifecycle with 22 statuses. |
| 5 | Branch `INUSRBRUP2` → *Sale Force → Lead* | Open the lead → Action: *Lead Approval — Approve* with a remark. | Status **Approve**, action log shows who/when/why. | Approvals require a remark and cannot be self-approved. |
| 6 | Dealer → open the lead → **Share Quote** | Add 2 phones + 10 chargers, save. | Quote `QT000xx`, lead moves to **Quote Shared**. | Quote is linked to the lead; totals computed server-side. |
| 7 | Dealer → *Purchase → PO* → **Add New PO** | From Krishna Mobiles to Haion Branch Agra; add items; note *Available Credit Balance*. Save. | PO `DEDLUP001PO…`, status **PFA** (red). | PO number format `{LocationCode}PO{n}`. |
| 8 | Branch → *Purchase → PO Approval* | Open the PO → Approved + remark. | Status **Approved**; it appears in *Invoicing → Corporate*. | Supplier side approves; only that side can. |
| 9 | Branch → *Invoicing → Corporate* → **Process** | Bill all lines (use serial numbers for phones — paste from *Single Serial No. Track*), **Process**. | Invoice `AGR/26-27/00nn`, status Pending, GST split CGST+SGST (same state) or IGST. Open **Print**. | GST tax-invoice print with amount in words. Stock leaves the branch now. |
| 10 | Branch → *Logistic → Update Dispatch* | Update with a courier + docket. | Status **Dispatched**. | |
| 11 | Dealer → *Receive Stock → From Location* | Receive with 1 damaged unit on an accessory. | Status **Received**; OK / Damage / Missing buckets updated. | Three stock buckets, like the reference. |
| 12 | Dealer → *Invoicing → Retail* → **Add Retail Billing To Customer** | Sell one phone (serial) + a charger to a customer; then **Receive Payment**. | Retail bill; serial becomes **SOLD**; receipt `RECP/26-27/KMA/…`. | Serial-level traceability. |
| 13 | Any → *Invoicing → Single Serial No. Track* | Search that serial. | Full movement history vendor → HQ → Agra → dealer → customer. | |
| 14 | Dealer → *Return → Customer Return* | Return that phone against its bill. | Serial back to **IN_STOCK**; stock restored. | |
| 15 | Dealer → *Payment → Payment Receive* | Pay Agra ₹50,000 by BANK with a UTR. | Status **PFA**. | |
| 16 | Branch → *Payment → Payment Approval* | Approve, received amount, remark. | Status **Approve**; credited to Agra's party ledger. | Receiver approves; payer cannot. |
| 17 | Branch → *Report Master → Party Ledger* | Location *Haion Branch Agra*, From 01-10-2026. | Rows `AGR/26-27/…` CORPORATE INVOICE (DR), `RECP/…` Payment Received (CR), dd-mm-yyyy, totals and closing. | Layout and ledger direction match the reference screen. |
| 18 | Admin → *Report Master → Inventory Aging / Stock Ledger / Sale Report / Collection / Payment / ISD* | Open each with default filters; use **Export (CSV)**. | Populated historical reports; aging buckets 0–15 / 16–30 / >30 for OK / DM / MS. | 23 months of data; FY numbers `24-25`, `25-26`, `26-27`. |
| 19 | Admin → *Dashboard → Dashboard 1* | Year 2026, Location. | Month-wise sale by location. | Historical trend. |
| 20 | Branch → *Sale Force → Target* | Open any target. | Target vs **achieved** computed from that executive's invoices. | Achievement is derived, not typed. |
| 21 | Dealer → *HRMS Emp → Attendance*, *Leave apply* | Log in/out; apply 1 day casual leave. | Attendance row; leave Pending. | |
| 22 | Branch → *HRMS HR → Leave Approve* | Approve with remark. | Status Approved; balance enforced per leave type. | |
| 23 | HQ `INUSRHOUP1` → *HRMS HR → Salary Generate*; *Salary Sheet* → **Print** (pay slip) | Generate Oct-2026 for an employee (already exists → shows duplicate protection). Print an existing slip. | Working days (minus Sundays/holidays), LOP, PF, net. | Payroll is computed from attendance + leave. |
| 24 | Dealer → try to open *Master Management* by URL (`/distributor/masters/brand`) | — | Access denied / empty menu. Server returns 403 even if the URL is typed. | Page rights are enforced on the server. |

## Records to point at (all seeded)

- **Branches:** Agra, Jaipur, Lucknow, Mumbai. **Dealers:** Krishna Mobiles, Sharma Distributors (Agra); Pink City Telecom, Rajputana Retail (Jaipur); Nawab Electronics, Gomti Communications (Lucknow); Bandra Mobile Hub, Andheri Digital Point (Mumbai).
- **Open work queues to show:** 2 POs pending approval, 1 approved-not-yet-invoiced (current month), pending payment approvals, unpaid retail bills, rejected PO, rejected payment, cancelled retail bill, a customer return, a purchase return (approval + receive), a stock transfer.
- **Sale Force / HR / App:** ~25 leads at different stages, quotes, monthly targets, PJPs, beat plans with a deviation request, expenses, queries with replies, app feedback/tasks/track points, TA/DA and claims (some rejected), leave requests, notices, policies, projects, a resignation, 1,472 attendance days, payroll for Aug–Oct 2026.

## Things not to claim in the demo

- The mobile field app (selfie attendance, live GPS) is a separate deliverable; the pages and API behind it are shown.
- Uploads accept CSV (templates provided), not the reference's Excel templates.
- HO/Branch/Dealer menus follow page rights, not a copy of the reference's fixed role menus (not yet compared).
- Financial-year label in numbers is calendar-correct (`26-27`); the reference shows a fixed `18-19`. Ask the client which they want.
