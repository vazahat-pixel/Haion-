# CANSALE DMS Rebuild: Analysis & Plan

Source: read-only exploration of the reference site (Admin login), 18-Nov-2026, plus the Branch manual PDF
(`DMS_SALE_BRANCH_manual-converted.pdf`). Nothing was created, approved, cancelled or deleted on the reference site.

Target stack: the existing Haion code (`backend/` Express + MongoDB, `frontend/` React + Vite + Tailwind + Recharts).

---

## 1. What the reference system is

A **Distributor Management System (DMS)** with one web panel. What each user sees in the sidebar depends on their role and permissions (the URL params `pid`/`hid` are page and menu IDs used for permission mapping).
It has 16 sidebar groups and **117 menu pages**, plus about 60 sub-pages (add/edit/view/print).

### Location hierarchy (parties)
`Head Office → Branch → Super Stockist → Distributor → Dealer → Retailer`, plus **Vendors** (suppliers, Indian or foreign) and **Retail Customers**.

Location code format: `{Country}{Type}{State}{seq}`
- `INHOUP001` = India, Head Office, UP, 001
- `INBRUP001` = Branch
- `INRTUP001` = Retailer
- `DEDLME001` = Dealer
- `DERTME001` = Retailer

Vendor codes: `VNDR1..n`.
User login IDs: `INUSRHOUP002`, `INUSRBRUP141`, `DEUSR159`, …

### User types (12)
Admin, Sales Head (SLH), Regional Sales Head (RSH), State Head (STH), Area Sales Manager (ASM), Territory Sales Manager (TSM), Sales Executive, … (plus location logins: HO, Branch, Dealer).

### Document numbering
| Document | Format | Example |
|---|---|---|
| Purchase Order | `{LocCode}PO{seq}` | INBRUP001PO34 |
| Sales Order | `{LocCode}SO{seq}` | INBRUP001SO33 |
| Invoice / Retail bill | `{LocShort}/{FY}/{seq4}` | AGR/18-19/0007, SKD/18-19/0048 |
| Stock Transfer Note | `STN/{FY}/{LocShort}/{seq4}` | STN/18-19/AGR/0003 |
| Purchase Return | `PRN/{FY}/{LocShort}/{seq4}` | PRN/18-19/AGR/0009 |
| Payment Receipt | `RECP/{FY}/{LocShort}/{seq4}` | RECP/18-19/AGR/0006 |
| Scheme | `SCH/{YYYY}/{seq}` | SCH/2020/10 |

`LocShort` comes from the location's "Unique Document Code" field (asked for in Add Location).

---

## 2. Core business flows (state machines)

### 2.1 PO → Invoice → Dispatch → Receive
```
PO created (Branch/Dealer → HO/parent)   status: PFA (Pending For Approval)
  └─ PO Approval (Approved | Rejected + mandatory remark, action log kept)
       └─ Corporate Invoicing against PO   → PO status: Processed
            - Document Type: Invoice | Delivery Challan
            - Bill Qty ≤ Req Qty, per-line discount, SGST/CGST or IGST, Scheme per line, Margin amount
            └─ Invoice status: Pending
                 └─ Update Dispatch (logistic name, docket no, dispatch date, logistic person,
                    transport mode [By Road/Air/Transport/Hand Held], contact, carrier no, e-way bill, address, remark)
                      → status: Dispatched
                      └─ Receive Stock (receiver): per line Ok / Damage / Missing qty, receive remark
                         (or "Receive by Scanning" serials) → status: Received, stock in
```
- Edit and Cancel are allowed only while the PO is PFA.
- The PO form shows the **Available Credit Balance** of the ordering party, plus Sales Executive, Payment Terms, Warranty Days and Delivery Date per line.

### 2.2 Retail billing
- **To Location** (`directBilling`): Billing From/To, Tax Type (None / Productwise / Total), Discount Type (None / Productwise / Total), qty-based lines → **Process**.
- **To Customer** (`customerbilling_withscheme`): serial/IMEI-based lines, scheme, round-off, "Add New Customer" inline → **Next** → **Process**.
- List actions: Print invoice, IMEI attach (upload or scan), Print IMEI sheet, View, Cancel, **Receive Payment** (from the detail page).

### 2.3 Stock movements
- **Stock Transfer** (and Stock Transfer for Job Work): From → To, Invoice or Delivery Challan, lines with tax and Avl Stock → **Stock Transfer Approval** → Receive.
- **STN Distribution**: one source location, many destinations, products → Apply.
- **Opening Stock**: per location, lines with Ok/Damage/Missing qty plus price, or an Excel upload; serial scan/upload; challan print.
- **Local Purchase** (Vendor → HO, with INR/USD currency, vendor invoice no/date): Save → Receive (serial scan/upload) → Print.
- **Vendor PO** (HO → Vendor): currency, tax type (Import/Export…), delivery schedule → Receive.
- **Receive Stock**: "From Location" and "Received from Jobwork".

### 2.4 Returns
- **Customer Return** (retail): Return To / From, by invoice + serial → Process → print.
- **Purchase Return** (Branch → HO, PRN): serial upload/scan → **Return Approval** → receiver receives it.
- **Vendor Return**: HO → Vendor.

### 2.5 Payments & ledger
- **Payment Receive**: From/To location, mode (BANK/CASH/PAYTM/CHEQUE/OTHER), bank, IFSC, DD/cheque no + date, receipt no, txn id, amount, remark → status PFA.
- **Payment Approval**: Received Amount + Approve/Reject + remark (records approver, date, time and IP).
- **Account Adjustment**: CR/DR between two locations, same payment fields plus payment date → print.
- **Party Ledger** report: Document No, Type, Txn Date, Entry Date, Payment/Approval remark, CR, DR.
- **Outstanding** = invoices − approved payments ± adjustments (shown on dashboard tiles).

### 2.6 Inventory
- Stock buckets per location and product: **OK / Damage (DM) / Missing (MS)**.
- Two inventory types: **IMEI (serial) inventory** and **QTY inventory**.
- The **Stock Ledger** records date-time, item, opening, in, out, closing, system ref no and transfer type for every movement.
- **Serial No. Activation**: Excel upload per product, with an activation report.
- **Single / Multiple Serial Track**: full history of one serial number.

---

## 3. Complete module & page map (Admin view)

### Home dashboard
- Tiles (₹ and Pcs): Sale, Purchase, PO, Collection, Inventory, Outstanding.
- Filters: Invoice + STN / Invoice / STN, and Location.
- Charts: Top 5 Model Sale of the Month, Top 5 Seller of the Month, Current Month PO Status, Current Month Invoice Status, and chart style toggles (Plain/Inverted/Polar).

### Dashboard (6)
| Page | Contents |
|---|---|
| Dashboard 1 (Yearly) | Year, Customer/Location |
| Dashboard 2 | Sale Qty/Amt month-wise by year, month, location and product |
| Inventory | Ok/Damage/Missing qty by location and product |
| Lead Dashboard | Lead conversion by area, upcoming tasks, top 10 users |
| Purchase (PO) Dashboard | PO To/From, date range, status |
| Sale Dashboard | Year/Month, location, product |

### Master Management (23)
- **Account**: name, number, type, status, mapping.
- **Admin/Users**: login, name, type, phone, email, status, history, profile image.
- **Brand**
- **City** (≈590 cities)
- **Color**
- **Coupon**: code, valid from/to, amount, mapping, Excel export.
- **Courier**: name, contact person, code, email, phone, address, city, state.
- **Customer**: id, name, phone, email, country, state, city, location, type RETAIL, GSTIN, address. Also history, Send Mail/SMS and an Excel report.
- **Location**:
  - Region (E/N/S/W), state, city, type, name, contact, phone, email, landline, landmark, pincode
  - ST/CST/PAN/GST numbers, proprietor type, TDS %
  - Bank account holder, account number, bank, city, IFSC
  - Billing and dispatch addresses
  - Unique doc code prefix, parent location
  - Mapping and history
- **Other Tax**: name, %.
- **Parameter**: per sub-category.
- **Price**: state × location type × product → MRP and price.
- **Product Category**
- **Product Delivery**: from city → to city × category → delivery days, with a matrix upload.
- **Product Image**
- **Product**: category, sub-category, code, HSN, name, brand, color, description, warranty days, EOL, warranty T&C, reward points and dates.
- **Product Sub Category**
- **Scheme**: name, period, category/sub-category/brand/product, status.
- **Serial No. Activation** (upload)
- **Specification**
- **State**: zone, code, state code.
- **HSN Tax Master**: chapter, HSN, description, CGST/SGST/IGST %.
- **Vendor**: domestic and foreign; name, city, state, country, contact, email, address.

### Report Master (15)
Beat, Collection Sheet, Inventory (IMEI/QTY), Inventory Aging (0–15 / 16–30 / >30 days × OK/DM/MS), ISD/ISP, Party Ledger, Party Master (mapping), Payment (Payable/Receivable), Price Drop, Purchase Order, Return (Purchase/Vendor), Sale/Invoice (doc type, scheme filters), Serial Activation, Stock Ledger, Vendor Purchase. Most reports have an Excel export.

### Transaction menus
| Group | Pages |
|---|---|
| Logistic | Update Dispatch |
| Invoicing | Corporate (PO list → Invoice against PO, Invoice List, Upload Billing), Multiple Serial Track, Retail, Single Serial Track, STN Distribution, Stock Transfer, Stock Transfer Approval, Stock Transfer for Job Work |
| Purchase | Local Purchase, Opening (+ upload), PO, PO Approval, Vendor PO |
| Return | Customer Return, Purchase Return, Return Approval, Vendor Return |
| Payment | Account Adjustment, Payment Approval, Payment Receive |
| Receive Stock | From Location, Received from Jobwork |

### Sales Force Automation (7)
Beat Scheduler (Excel upload), Deviation Approval, Lead (22 statuses, approval, share quote, attachments), My Beat Plan (calendar, tasks: Collection / Dealer Visit / Feedback / Sale Order), PJP Master, Quote (approval, attachments), Target (per employee, month, type).

### General Query (2)
Locationwise Expense (attachment, payment mode), Query/Feedback (module, problem type, due date, reply).

### App Transaction (5): mobile app back-office
App Feedback (with location and image), App Task (Pending/Open/In-Progress/Done), App Track Location (GPS trail, distance covered), Attendance Report (in/out time, address, selfie image), TA/DA Approval.

### HRMS HR (18) + HRMS Employee (10) + HRMS Reports (6)
- **HR**: Activities, Application approve (Loan / Visiting Card / ID Card), Attendance login/logout, Claims + approvals (travel/lodging), Department, Designation, Employee Master, Holidays, Leave Master + approvals, My Teams, Notice, Policies, Projects/Clients, Resign Request, Salary Generate, Salary Sheet (+ payslip upload).
- **Employee self-service**: the same pages scoped to the logged-in employee.
- **Reports**: Attendance, Employee Details, Leave, Other Request, Salary, Salary Slip.

### Change Password, Logout

---

## 4. Common UI pattern (to replicate)

- Left dark sidebar with collapsible groups. The top shows the logged-in name (role) and date.
- **List page**: title, an "Add New …" button at top right, a filter row (selects/dates + GO), and a DataTable (show N entries, search, pagination) with blue header columns. Row actions are icon columns: Print, View, Edit, Cancel.
- **Form page**: header fields, a dynamic line-item grid (product select, qty, price, discount, GST split, total, "add row"), a totals block, address/remark, and Save/Process + Back buttons.
- **Detail page**: Party Information → Items Information → Amount Information → Logistic Information → Receiving Information → Approval Action log → Back.
- **Print**: GST tax invoice layout (seller/receiver/consignee, transporter, HSN, UOM, taxable value, tax split, amount in words, T&C, signatory), PO print, serial (IMEI) sheet, receipts.
- Excel template download/upload for opening stock, billing, serials, beat plan, delivery matrix and activation.

---

## 5. Reuse from the existing Haion codebase

The existing backend models that can be adapted are: Invoice, SalesInvoice, Dispatch, Purchase, PurchaseReturn, SaleReturn, Payment, Approval, Inventory, StockMovement, GRN, Customer, Dealer, Warehouse, LedgerEntry, Role, AuditLog, Product, Brand, Category, Employee, Attendance, LeaveRequest, Payroll, Expense, Task, Notification, Settings.

Existing infrastructure that carries over: JWT auth, rate-limit/helmet, multer (uploads), pdfkit (print), node-cron, React Query, Recharts, the Radix UI kit and the nginx deploy.

Estimated reuse: **~50–60% of the backend foundation**.

**New work:**
- Location hierarchy + mapping
- Page-level permission matrix
- Document numbering service (per location + FY)
- PO/Invoice/Dispatch/Receive state machine
- OK/DM/MS stock buckets + serial (IMEI) ledger
- GST engine (intra/inter-state, HSN)
- Schemes, credit limit, Excel import/export
- SFA, App APIs, HRMS gaps

---

## 6. Phased build plan

| Phase | Scope | Exit criteria |
|---|---|---|
| 0. Freeze | Tag current code `v1-haion-original`. Confirm scope (see §7). Explore HO, Branch and Dealer logins read-only | Scope signed off |
| 1. Foundation | Location hierarchy, users + 12 user types, page-permission matrix, login/change password, sidebar layout shell, DataTable/Form/Detail/Print components, numbering service, FY handling | Login per role shows the correct menu |
| 2. Masters | All 23 masters incl. HSN tax, price, scheme, vendor, courier, location mapping, Excel export | CRUD + filters pass tests |
| 3. Purchase | PO (+ credit balance), PO Approval, Vendor PO, Local Purchase, Opening Stock (+ upload), serial upload/scan | PO → Approved/Rejected flow works |
| 4. Invoicing | Invoice against PO, Upload Billing, Retail (Location/Customer, schemes), Stock Transfer (+ approval, job work), STN Distribution, GST print formats | Invoice + print match the reference |
| 5. Logistics & Receive | Update Dispatch, Receive (Ok/DM/MS, scanning), Serial track single/multiple, Serial activation, Stock Ledger | End-to-end PO→Received with stock correct |
| 6. Returns & Payments | Customer/Purchase/Vendor return + approval, Payment receive/approval, A/C adjustment, receipts, party ledger, outstanding | Ledger balances reconcile |
| 7. Dashboards & Reports | Home tiles + charts, 6 dashboards, 15 reports + Excel | Numbers match the transactions |
| 8. SFA + App + HRMS | Lead/Quote/Target/Beat/PJP/Deviation, App APIs (attendance with selfie + GPS, tasks, TA/DA, feedback), HRMS HR/Emp/Reports, payroll | Only if in scope |
| 9. Hardening & Deploy | E2E tests per flow, data migration (if needed), production deploy | Go-live |

---

## 7. Open questions for client sign-off

1. **Scope**: DMS core only (Phases 1–7) or everything incl. Sales Force, mobile-app back office and HRMS (Phase 8)?
2. **Mobile app**: "App Transaction" implies a field app (attendance selfie, GPS tracking). Is building the app itself part of the job?
3. **Data migration**: should the existing data (locations, products, open stock, ledgers) move to the new system?
4. **Branding & ownership**: the reference site footer says "Powered by Candour Software". Get written confirmation that the client owns this software and the rights to rebuild its UI.
5. **Integrations**: e-way bill / e-invoice (GST portal), SMS/email gateway, payment gateway?
6. Remaining role walkthroughs: HO (`INUSRHOUP002`), Branch (`INUSRBRUP141`), Dealer (`DEUSR159`), to confirm per-role menus.
