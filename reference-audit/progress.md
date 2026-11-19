# DMS Rebuild: Progress Tracker

Last updated: 19-Nov-2026.

**Status legend:**
- D: discovered
- I: inspected
- Doc: documented
- FE: frontend implemented
- BE: backend integrated
- T: automated API test passes
- UI: exercised in a browser against the local stack
- V: visual comparison done

Evidence:
- `backend/tests/dms.flow.test.js`: 12 tests, all passing, in-memory MongoDB.
- Full backend suite: 132/132 before the last 2 DMS tests were added.
- `vite build` succeeds.
- Browser run on localhost against an isolated in-memory DB.

## Core DMS (in scope of this build)

| Module | Status | Notes |
|---|---|---|
| Login (email / mobile / DMS Login ID), change password, logout | D I Doc FE BE T UI | Branch user logged in with Login ID and saw the scoped menu |
| Sidebar + layout + footer | D I Doc FE UI V | Colors and sizes measured from the live reference (see design-system.md) |
| Home dashboard (6 tiles, top-5 charts, PO/invoice status pies, 12-month chart) | D I Doc FE BE T UI | Tile semantics are inferred (see risks.md) |
| Dashboard: Inventory / Purchase / Sale | D I FE BE UI | Dashboard 1 (yearly) and Lead Dashboard are not built |
| Master: Admin/Users (page rights) | D I Doc FE BE T | |
| Master: Brand, Color, Category, Sub-category, State, City, Courier | D I Doc FE BE | Generic master engine |
| Master: Location (codes, hierarchy, doc prefix, credit limit) | D I Doc FE BE T | |
| Master: Product (HSN-validated, serialized flag) | D I Doc FE BE T | |
| Master: HSN Tax, Price, Scheme, Vendor, Customer | D I Doc FE BE T | |
| Purchase: PO (create/edit/cancel/print, credit balance) | D I Doc FE BE T UI V | |
| Purchase: PO Approval | D I Doc FE BE T UI | |
| Purchase: Vendor PO + receive | D I Doc FE BE T | |
| Purchase: Local Purchase (create → receive) | D I Doc FE BE | |
| Purchase: Opening (form + CSV upload) | D I Doc FE BE T UI | |
| Invoicing: Corporate (invoice against PO, invoice list, upload billing) | D I Doc FE BE T UI | |
| Invoicing: Retail (to location / to customer, schemes, payment) | D I Doc FE BE T | |
| Invoicing: Stock Transfer, Job Work, Stock Transfer Approval | D I Doc FE BE T | |
| Invoicing: Single / Multiple serial track | D I Doc FE BE T | |
| Logistic: Update Dispatch | D I Doc FE BE T UI | |
| Receive Stock: From Location / Jobwork (OK/Damage/Missing) | D I Doc FE BE T UI | |
| Return: Customer, Purchase (PRN) + Approval, Vendor | D I Doc FE BE T (customer return) | PRN and vendor-return flows are not yet covered by automated tests |
| Payment: Receive, Approval, Account Adjustment, receipts | D I Doc FE BE T | |
| Reports: Inventory, Aging, Party Ledger, Stock Ledger, Sale, Return, Vendor Purchase, PO, CSV export | D I Doc FE BE | |
| Print: Tax Invoice / DC / STN, PO, Receipt (amount in words) | D I FE UI | |

## Discovered but NOT built (awaiting client scope decision)

| Group | Pages |
|---|---|
| Masters | Account, Coupon, Other Tax, Parameter, Product Delivery, Product Image, Serial No. Activation, Specification |
| Reports | Beat, Collection Sheet, ISD, Party Master (mapping), Payment (payable/receivable), Price Drop, Serial Activation |
| Dashboard | Dashboard 1 (yearly), Dashboard 2 (qty/amt month-wise per product), Lead Dashboard |
| Sale Force (7) | Beat Scheduler, Deviation Approval, Lead, My Beat Plan, PJP Master, Quote, Target |
| General Query (2) | Locationwise Expense, Query Status |
| App Transaction (5) | App Feedback, App Task, Track Location, Attendance Report, TA/DA Approval (needs a mobile app) |
| HRMS HR (18) / Emp (10) / Reports (6) | Haion already has an `/api/hrms` module; mapping is pending |

## Not yet verified
- Visual comparison has only been done for the PO List page. Other pages use the same components.
- Role walkthroughs as HO, Branch and DEUSR159 on the reference site, to compare their menus.
- The reference's exact Excel template columns for the upload pages. Ours are CSV templates.
