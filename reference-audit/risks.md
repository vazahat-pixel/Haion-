# Risks, Assumptions & Known Limitations

Last updated: 19-Nov-2026 (final audit pass).

## A. Business rules — verified on the reference vs. assumed

| Rule | Status | Evidence / note |
|---|---|---|
| Party Ledger lives on the **seller's** account: invoice = DR, payment received = CR | **Verified** | Live Party Ledger (krishna branch 1): two RETAIL INVOICE rows DR 2240.00 / 1319.00, two "Payment Received" rows CR 1319.00 / 2240.00. Our model was the reverse and was **corrected** in this pass. |
| Ledger "Document Type" captions `RETAIL INVOICE`, `Payment Received` | **Verified** | Same screen. Other captions (CORPORATE INVOICE, PURCHASE RETURN, adjustments) follow that style but are **assumed**. |
| Ledger amounts print `0` for zero and `1234.00` for non-zero; dates `dd-mm-yyyy` | **Verified** | Same screen. Reproduced. |
| Ledger filter is by **Location Name**; "Party Name" column is blank for retail rows | **Verified** | Same screen. |
| Receipts `RECP/{FY}/{prefix}/0001` and invoices `{prefix}/{FY}/0001`, prefix lower-case in older data | **Verified** (format) | Same screen. |
| **Financial-year label** in document numbers | **Unresolved — conflict** | The reference prints `18-19` on documents dated 2019, 2021 and 2023 (it appears fixed / configured). We compute the real Indian FY (`25-26`, `26-27`). Needs a client decision: keep calendar-correct FY, or make the label a setting. |
| Stock Transfer approved by the source side; PRN approved by the receiving side | Assumed | Not observable without creating records on the live site. |
| Account Adjustment applies immediately (no approval) | Assumed | |
| PO credit balance = credit limit − what the ordering location already owes sellers | Assumed | Reference shows an "Available Credit Balance" field, not its formula. Not enforced (display only). |
| Retail bill to customer: Pending until fully paid, then Completed; each payment posts a `RECP` receipt CR to the seller | Partly verified | Receipt rows exist on the reference for retail invoices; the status naming is assumed. |
| Dashboard tiles are all-time totals filtered by location | Assumed | Matches the magnitudes shown, not proven. |
| Salary: working days = days − Sundays − active holidays; absent days without approved leave are loss-of-pay; PF = % of basic | Assumed | Reference payroll was not inspectable (no salary data visible in the test environment). |
| `Sales Executive` is required on a PO | **Not applied** | The reference marks it required (`*`); our API keeps it optional. Confirm. |
| Leave balance per type per calendar year; overlap blocked; self-approval blocked | Assumed | |

## B. What could NOT be verified (blocked)

- **HO / Branch / Dealer (DEUSR159) role views on the reference.** Doing that means typing those users' passwords into the third-party site, which the assistant is not allowed to do. The Admin session that was already signed in was used for read-only inspection only. Our per-role menus therefore follow the page-rights model, not the reference's fixed role menus. **Action for the client/you:** sign in as each role in Chrome (leave the tab open) and ask for the role comparison.
- **Mobile app.** The reference menus "App Transaction" (App Feedback / Task / Track Location / Attendance with IN/OUT images / TA-DA) imply a field app. No app, APK, mobile URL or API documentation was available, so offline sync, device binding and selfie capture could not be inspected. Back-office pages and the API are built; the app itself is a separate deliverable.
- **Excel templates.** Reference upload pages (Opening, Upload Billing, Beat Scheduler, Delivery Matrix, Serial Activation, Serial Track) were not given sample files; submitting one on the live site would modify client data. Our uploads take CSV with the columns shown by "Download template". They are **not** claimed to be reference-compatible.
- **Print/PDF layouts.** Reference invoice/PO print text was captured earlier (see `docs/CANSALE_REBUILD_PLAN.md`); pixel-level print comparison was not done.
- **Historical depth.** The reference test database holds a few years of sparse test records; no production history was available.

## C. Technical risks

- **No MongoDB multi-document transactions.** Every flow validates fully first and stock decrements are conditional and atomic, and a regression test proves a rejected upload changes nothing. A server crash *between* two writes of a multi-step flow could still leave a partial state. Move to a replica set and wrap flows in `session.withTransaction` before go-live.
- **Existing backend tests** connect to `MONGODB_URI` when it is reachable (pre-existing behaviour). DMS tests use an in-memory DB only.
- **ESLint** has no `eslint.config.js` (v9), so `npm run lint` fails (pre-existing).
- **Lookups are broad by design.** `/api/dms/lookups` returns active product, vendor and *all* location names/codes to any signed-in DMS user (needed to raise a PO to a parent). No financial data is included.
- **Rate limiter** is the global `/api` limit (1000/15 min in dev, 200 in prod). A busy branch with bulk upload could hit it; tune per environment.
- **File uploads** are CSV parsed in the browser; there is no server-side file storage for attachments (claims, expenses, notices take a URL).
- **Branding:** the wordmark/footer come from `VITE_DMS_BRAND*`; the reference shows "Powered by Candour Software". Do not reproduce third-party branding without written confirmation of ownership.

## D. Security status (after this audit)

Fixed in this pass:
- PO, invoice, payment list/detail endpoints, master lists and serial-track previously relied on location scope only; they now also require the relevant page right.
- Added `tests/dms.authz.test.js`: a user with **zero** rights is refused (403) on 65 read endpoints and 21 write endpoints; cross-location read/act attempts return 404/403; forged/expired/deactivated/non-DMS users are refused.

Still to do before production: HTTPS-only cookies/CSP review for the new `/distributor` bundle, per-IP login throttling review for Login-ID sign-in, audit-log review screen for `module: DMS` events, backup/restore drill, dependency audit.
