# DMS Rebuild: Progress Tracker

Last updated: 19-Nov-2026 (after the final audit pass). Full detail: [final-completion-audit.md](final-completion-audit.md). Assumptions: [risks.md](risks.md). Demo script: [demo-walkthrough.md](demo-walkthrough.md).

Legend: D discovered · I inspected · FE frontend · BE backend · T automated test · UI exercised in a browser · V compared visually with the reference · Seed = populated in the demo database.

| Group (reference pages) | Status |
|---|---|
| Home dashboard + 6 dashboards | D I FE BE T UI Seed (tiles reconciled to source documents) |
| Master Management (23) | D I FE BE T Seed (Product Image/Specification sparse) |
| Report Master (15) | D I FE BE T Seed; Party Ledger also **V** (columns, ledger direction, formats); others not result-compared |
| Logistic / Invoicing / Purchase / Return / Payment / Receive Stock (29) | D I FE BE T UI V(PO list) Seed — full PO→invoice→dispatch→receive→payment cycle on 23 months of data |
| Sale Force (7), General Query (2), App Transaction (5) | D I FE BE T Seed |
| HRMS HR (18) / Emp (10) / Reports (6) | D I FE BE T Seed (attendance 1,472 days, payroll Aug–Oct 2026) |

## Evidence (this pass)
- Backend `npm test`: **146/146**. Frontend `vite build`: OK.
- `scripts/dms-demo-verify.js`: **20/20** reconciliation checks on the seeded data.
- `scripts/dms-demo-roles-check.js`: **17/17** role-visibility checks.
- `tests/dms.authz.test.js`: zero-rights user refused on 65 read + 21 write endpoints; cross-location isolation.
- Browser (Chrome extension, before it disconnected): dashboard, Inventory Aging, Party Ledger verified on seeded data; earlier 81-route smoke test.

## Changes made because the audit found problems
1. **Ledger direction corrected** to the reference's seller-side convention (invoice DR / payment received CR) — verified on the live Party Ledger.
2. **Missing server-side page-right checks** on PO / invoice / payment lists + details, master lists, serial track → fixed + tested.
3. Inventory Aging N+1 (timed out) → single query. Axis labels clipped → Indian units. Master list errors surfaced. Party Ledger/Stock Ledger columns aligned to the reference; zero prints `0`; `dd-mm-yyyy`; label-left filter rows and horizontal forms.
4. Seed bug found by the reconciliation (vendor receipts numbered with today's FY) → fixed, re-seeded, re-verified.

## Not done / not verified (see audit for the full list)
Role walkthroughs on the reference (blocked: needs the user to sign in as HO/Branch/Dealer), mobile app, .xlsx templates, per-page pixel comparison beyond the pages named above, post-CSS-change screenshots (browser disconnected), MongoDB transactions, e-invoice/e-way bill.
