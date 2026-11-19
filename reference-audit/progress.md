# DMS Rebuild: Progress Tracker

Last updated: 19-Nov-2026.

**Status legend:** D discovered · I inspected · Doc documented · FE frontend · BE backend · T automated API test passes · UI exercised in a browser against the local stack · V visual comparison done.

Evidence:
- `backend/tests/dms.flow.test.js` (12 tests) and `backend/tests/dms.entities.test.js` (7 tests), in-memory MongoDB only.
- `vite build` succeeds.
- Browser runs on localhost against an isolated in-memory DB (route smoke tests + the full PO → receive flow).

## All 117 reference pages

| Group | Pages | Status |
|---|---|---|
| Home dashboard | tiles, top-5 charts, PO/invoice pies, 12-month chart | D I Doc FE BE T UI |
| Dashboard (6) | Dashboard 1 (yearly), Dashboard 2 (day-wise qty/amt), Inventory, Lead, Purchase, Sale | D I FE BE T (UI smoke) |
| Master Management (23) | Account, Admin/Users, Brand, City, Color, Coupon, Courier, Customer, Location (+mapping), Other Tax, Parameter, Price, Product Category, Product Delivery (+matrix upload), Product Image, Product, Sub Category, Scheme, Serial No. Activation (upload), Specification, State, HSN Tax, Vendor | D I Doc FE BE T |
| Report Master (15) | Beat, Collection, Inventory, Aging, ISD, Party Ledger, Party Master, Payment, Price Drop, Purchase Order, Return, Sale, Serial Activation, Stock Ledger, Vendor Purchase | D I FE BE T/UI smoke |
| Logistic / Invoicing / Purchase / Return / Payment / Receive Stock (29) | full PO → invoice → dispatch → receive, retail, STN, job work, returns, payments | D I Doc FE BE T UI V |
| Sale Force (7) | Beat Scheduler (CSV upload), Deviation Approval, Lead, My Beat Plan, PJP Master, Quote, Target | D I FE BE T |
| General Query (2) | Locationwise Expense, Query Status | D I FE BE T |
| App Transaction (5) | App Feedback, App Task, App Track Location (+distance), Attendance Report, TA DA Approval | D I FE BE T |
| HRMS HR (18) | Activities, Application Approve, Attendance, Claim Approvals, Claims, Department, Designation, Employee, Holidays, Leave Approve, Leave Master, My Teams, Notice, Policies, Projects, Resign, Salary Generate, Salary Sheet | D I FE BE T |
| HRMS Emp (10) | Activities, Application, Attendance, Claims, Leave, My Documents, My Profile, Policies, Resign, Salary Sheet | D I FE BE T |
| HRMS Report (6) | Attendance, Employee, Leave, Other Request, Salary, Salary Slip (print) | D I FE BE |

## Known limits (be honest about these)
- Visual comparison against the live reference was done only for the sidebar/layout and the PO List page. Other pages share the same components but were not individually compared.
- The reference's exact Excel templates were not available. Uploads accept CSV with the columns shown by each page's "Download template" button.
- The reference's mobile **app** (selfie attendance, GPS tracking, app tasks) is not built. The back-office pages and the API they use are built; the Attendance page accepts a typed address, not a camera/GPS capture.
- HO / Branch / Dealer role walkthroughs on the reference site were not done, so per-role menus follow the page-rights model rather than the reference's fixed role menus.
- No MongoDB multi-document transactions (see risks.md).
