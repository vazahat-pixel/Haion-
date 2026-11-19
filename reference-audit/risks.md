# Risks, Assumptions & Known Limitations

## Business-logic assumptions (could not be observed without making changes on the live reference)

1. **Ledger direction.** An invoice posts a DR to the buyer and a CR to its counterparty. An approved payment posts a CR to the payer. A PRN receipt posts a CR to the returning location. Outstanding = DR − CR.
2. **Approvals:**
   - STN and Job-work transfers are approved by the source side, and stock leaves only on approval.
   - PRNs are approved by the receiving side.
   - Account adjustments take effect immediately, with no approval.
   - Vendor POs need no approval.
3. **Retail-to-customer bills** stay `Pending` until fully paid through "Receive Payment", then become `Completed`.
4. **Dashboard tiles** are all-time totals filtered by location. This matches the reference showing large cumulative numbers.
5. **Location code country prefix:** `IN` for HO/Branch, `DE` for other types. The reference has `INRTUP001` for a retailer, so this rule may be incomplete. The code can be overridden on create.
6. **Number series not visible in the reference:** `LPR` (local purchase), `VRN`, `CRN`, `OPN`, `ADJ` and `{loc}VPO{n}`.
7. **Receiving a serialized product** with damaged or missing qty still moves every serial to the receiver.

## Technical
- **No MongoDB multi-document transactions.** Flows validate first, and stock decrements are conditional and atomic. A crash in the middle of a flow can still leave a partial state. Enable transactions once production runs on a replica set (Atlas does).
- **Existing backend tests** connect to `MONGODB_URI` when it is reachable. This is pre-existing behaviour. The DMS tests always use an in-memory DB.
- **ESLint** has no `eslint.config.js` (v9), so `npm run lint` fails. This is pre-existing.
- **Fixed during this work:** concurrent refresh-token calls (React StrictMode) could log users out. `authService.refresh` is now single-flight.
- **Branding:** the wordmark and footer come from `VITE_DMS_BRAND`, `VITE_DMS_BRAND_ACCENT` and `VITE_DMS_FOOTER`, defaulting to "HAION DMS". The reference shows "Powered by Candour Software". Get written confirmation of the client's ownership before reproducing their branding.

## Security
- Every `/api/dms` route requires a JWT plus DMS access (MASTER_ADMIN or an active `DmsProfile`).
- Every write checks page rights (`requirePage`) and location scope (`assertCanSee`).
- Lists are filtered to the caller's location subtree.
- Client-sent totals and tax are ignored; the server recomputes them from the HSN master.
- Credentials and reference screenshots are git-ignored.
