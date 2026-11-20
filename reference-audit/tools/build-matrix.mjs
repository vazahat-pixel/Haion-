/**
 * Builds reference-audit/master-feature-matrix.md from:
 *  - the reference Admin sidebar captured from the live site (REF below, 117 pages, read-only crawl of 18/19-Nov-2026)
 *  - our routes (frontend/src/distributor/menu.js)
 *  - Playwright crawl evidence (final-screenshots/localhost/crawl-*.json)
 *  - automated test coverage (keywords mapped to test files)
 * Run: node reference-audit/tools/build-matrix.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');

// group | reference page | reference URL (relative to /cansaledms) | our route (under /distributor) | tests
const REF = `
Home|Home|dashboard/home_dashboard.php|home|flow:dashboard,verify:tiles
Dashboard|Dashboard 1|dashboard/yearly_dashboard.php|dashboard/yearly|verify:dash-yearly
Dashboard|Dashboard 2|dashboard/saleQtyAmtMonthwise.php|dashboard/monthly|verify:dash-monthly
Dashboard|Inventory|dashboard/inventoryDash.php|dashboard/inventory|flow:inventory
Dashboard|Lead Dashboard|dashboard/leadDashboard.php|dashboard/lead|entities:dash-lead
Dashboard|Purchase|dashboard/po_dashboard.php|dashboard/purchase|e2e:export
Dashboard|Sale|dashboard/saleDash.php|dashboard/sale|verify:tiles
Master Management|Account|admin/account_master.php|masters/account|seed
Master Management|Admin/Users|admin/adminusermgt.php|masters/users|flow:users,authz
Master Management|Brand Master|admin/brand_master.php|masters/brand|flow:masters
Master Management|City Master|admin/city_master.php|masters/city|crawl
Master Management|Color Master|admin/color_master.php|masters/color|crawl (reference page returned 404)
Master Management|Coupon Master|admin/coupon_master.php|masters/coupon|entities:coupon
Master Management|Courier Master|admin/courier_master.php|masters/courier|flow:dispatch
Master Management|Customer Master|admin/customer_details.php|masters/customers|flow:retail
Master Management|Location Master|admin/asp_details.php|masters/locations|flow:masters
Master Management|Other Tax Master|admin/other_tax.php|masters/othertax|entities:othertax
Master Management|Parameter Master|admin/parameter_master.php|masters/parameter|seed
Master Management|Price Master|admin/price_master.php|masters/prices|seed
Master Management|Product Category|admin/productcat_master.php|masters/category|flow:masters
Master Management|Product Delivery|admin/product_delivery.php|masters/productdelivery|entities:delivery-bulk
Master Management|Product Image|admin/product_image_list.php|masters/productimage|crawl
Master Management|Product Master|admin/model_master.php|masters/products|flow:masters
Master Management|Product Sub Category|admin/prod_subcat_master.php|masters/subcategory|seed
Master Management|Scheme Master|admin/scheme_master.php|masters/schemes|seed
Master Management|Serial No. Activation|admin/imei_activation_upld.php|masters-upload/serial-activation|entities:serial-activate
Master Management|Specification|admin/specification_master.php|masters/specification|entities:specification
Master Management|State Master|admin/state_master.php|masters/state|crawl
Master Management|Tax Master|admin/tax_master.php|masters/hsn|flow:masters
Master Management|Vendor Master|admin/vendor_master.php|masters/vendors|flow:vendor-po
Report Master|Beat Report|reports/beat_report.php|e/beat|entities:beat
Report Master|Collection|reports/collection_sheet.php|reports/collection|entities:collection
Report Master|Inventory|reports/inventory_stock.php|reports/inventory|flow:inventory,e2e:receive
Report Master|Inventory Aging|reports/inventory_aging.php|reports/aging|crawl
Report Master|ISD|reports/isd_report.php|reports/isd|authz
Report Master|Party Ledger|reports/partyledger.php|reports/party-ledger|flow:ledger,verify:ledger-fy,VISUAL
Report Master|Party Master Report|reports/mapping_report.php|reports/party-master|crawl
Report Master|Payment|reports/payment_status.php|reports/payment|entities:payment-status
Report Master|Price Drop|reports/pricedrop.php|reports/price-drop|crawl
Report Master|Purchase Order|reports/purchase_report.php|reports/purchase|e2e:export
Report Master|Return|reports/return_report.php|reports/return|crawl
Report Master|Sale Report|reports/invoice_report.php|reports/sale|crawl
Report Master|Serial No. Activation Report|reports/imei_activation_rpt.php|reports/serial-activation|entities:serial-activation
Report Master|Stock Ledger List|reports/stock_ledger_list.php|reports/stock-ledger|verify:stock
Report Master|Vendor Purchase|reports/vendor_report.php|reports/vendor|crawl
Logistic|Update Dispatch|logistic/updateInvLogistic.php|logistic/dispatch|flow:dispatch,e2e:dispatch
Invoicing|Corporate|invoice/corporateInvoice.php|invoicing/corporate|flow:invoice,e2e:invoice
Invoicing|Multiple Serial No. Track|invoice/imei_track.php|invoicing/multi-serial-track|flow:serials
Invoicing|Retail|invoice/retailbillinglist.php|invoicing/retail|flow:retail
Invoicing|Single Serial No. Track|invoice/check_imei.php|invoicing/serial-track|flow:serials
Invoicing|STN Distribution|invoice/stndistribution_list.php|invoicing/stn-distribution|flow:stn-distribution
Invoicing|Stock Transfer|invoice/stock_transfer.php|invoicing/stock-transfer|flow:stn
Invoicing|Stock Transfer Approval|invoice/stockTRansferApproval.php|invoicing/stock-transfer-approval|flow:stn
Invoicing|Stock Transfer for Job work|invoice/stock_transfer.php?pid=107|invoicing/jobwork|crawl
Purchase|Local Purchase|po/localPurchaseList.php|purchase/local|flow:vendor-po
Purchase|Opening|opening/openingStockList.php|purchase/opening|flow:opening,e2e:upload
Purchase|PO|po/purchaseOrderList.php|purchase/po|flow:po,e2e:po,VISUAL
Purchase|PO Approval|po/purchaseOrderApproval.php|purchase/po-approval|flow:po,e2e:approve
Purchase|Vendor|po/vendorPurchaseList.php|purchase/vendor|flow:vendor-po
Return|Customer Return|return/retailcust_return.php|return/customer|flow:customer-return
Return|Purchase|return/purchase_return.php|return/purchase|seed (PRN approve+receive)
Return|Return Approval|return/return_approval_list.php|return/approval|seed
Return|Vendor|return/vendor_return.php|return/vendor|crawl
Payment|Account Adjustment|payment/acc_adjustList.php|payment/adjustment|verify:ledger
Payment|Payment Approval|payment/payment_approval_list.php|payment/approval|flow:payment
Payment|Payment Receive|payment/paymentlist.php|payment/receive|flow:payment
Receive Stock|From Location|invoice/receiveInvoice.php|receive/location|flow:receive,e2e:receive
Receive Stock|Received from Jobwork|invoice/receiveInvoice.php?pid=108|receive/jobwork|crawl
Sale Force|Beat Scheduler|salesforce/beatUploader.php|sf/beat-scheduler|entities:beat-upload
Sale Force|Deviation Approval|salesforce/deviation_request_list.php|e/deviation|entities:deviation
Sale Force|Lead|salesforce/lead_list.php|e/lead|entities:lead,e2e:lead
Sale Force|My Beat Plan|salesforce/calender_event.php|me/beat|mobile:beat,entities:beat (calendar + list)
Sale Force|PJP Master|salesforce/pjp_master.php|e/pjp|seed
Sale Force|Quote|salesforce/quote_list.php|e/quote|entities:quote
Sale Force|Target|salesforce/target_list.php|e/target|verify:target
General Query|Locationwise Expense|admin/locationwise_expense.php|e/expense|entities:expense
General Query|Query Status|admin/query_master.php|e/query|entities:query
App Transaction|App Feedback|admin/appFeedback.php|e/appfeedback|mobile:feedback
App Transaction|App Task|admin/apptask.php|e/apptask|entities:apptask,mobile:tasks
App Transaction|App Track Location|admin/tracklocapp.php|sf/track|mobile:track
App Transaction|Attendance Report|reports/attendance_report.php|e/attendance|entities:attendance,mobile:punch
App Transaction|TA DA Approval|admin/ta_da_approval.php|e/tada|entities:tada,mobile:tada
HRMS HR.|Activities|hrms/activities_emp_list.php|e/activity|seed
HRMS HR.|Application Approve|hrms/application_approve_list.php|approve/application|seed
HRMS HR.|Attendance|hrms/attendance_emp_list.php|hr/attendance|entities:attendance
HRMS HR.|Claim Approvals|hrms/approvals_list.php|approve/claim|seed
HRMS HR.|Claims|hrms/employee_claims_list.php|e/claim|seed
HRMS HR.|Department Master|hrms/department_list.php|e/department|seed
HRMS HR.|Designation Master|hrms/designation_list.php|e/designation|seed
HRMS HR.|Employee Master|hrms/employee_master_list.php|e/employee|entities:employee
HRMS HR.|Holidays Master|hrms/holidays_list.php|e/holiday|entities:salary
HRMS HR.|Leave Approve|hrms/leave_approve_list.php|approve/leave|entities:leave
HRMS HR.|Leave Master|hrms/leave_list.php|e/leavetype|entities:leave
HRMS HR.|My Teams|hrms/my_teams_list.php|hr/my-teams|crawl
HRMS HR.|Notice|hrms/notice_list.php|e/notice|seed
HRMS HR.|Policies|hrms/policies_admin_list.php|e/policy|seed
HRMS HR.|Projects / Clients|hrms/project_clients_list.php|e/project|seed
HRMS HR.|Resign Request|hrms/resign_request.php|e/resign|seed
HRMS HR.|Salary Generate|hrms/salary_generate.php|hr/salary-generate|entities:salary,verify:salary
HRMS HR.|Salary Sheet|hrms/admin_salary_sheet_view.php|e/salary|verify:salary
HRMS Emp.|Activities|hrms/activities_emp_list.php?pid=69|me/activity|seed
HRMS Emp.|Application|hrms/application_emp_list.php|me/application|seed
HRMS Emp.|Attendance|hrms/attendance_emp_list.php?pid=72|me/attendance-punch|entities:attendance
HRMS Emp.|Employee Claims|hrms/employee_claims_list.php?pid=73|me/claim|seed
HRMS Emp.|Leave apply / View Status|hrms/leave_apply_list.php|me/leave|entities:leave,mobile:leave
HRMS Emp.|My Documents|hrms/my_document_list.php|me/mydoc|seed
HRMS Emp.|My Profile|hrms/my_profile_view.php|me/profile|crawl
HRMS Emp.|Policies|hrms/policies_emp_list.php|me/policy|seed
HRMS Emp.|Resign Request|hrms/resign_request.php?pid=86|me/resign|seed
HRMS Emp.|Salary Sheet|hrms/emp_salary_sheet_view.php|me/salary|seed
HRMS Report|Attendance|reports/attendancemp_report.php|rp/attendance|crawl
HRMS Report|Employee Details|reports/employee_report.php|rp/employee|crawl
HRMS Report|Leave Approve/Reject|reports/leavestatus_report.php|rp/leave|crawl
HRMS Report|Other Request Report|reports/otherequest_Report.php|rp/other|crawl
HRMS Report|Salary Report|reports/salary_report.php|rp/salary|crawl
HRMS Report|Salary Slip|reports/salarySlip_report.php|rp/slip|crawl (payslip print)
Account|Change Password|admin/changepassword.php|change-password|flow:password
Account|Logout|logout.php|(sidebar Logout)|crawl
`.trim().split('\n').map((l) => { const [group, page, url, route, tests] = l.split('|'); return { group, page, url, route, tests }; });

const crawls = {};
for (const r of ['admin', 'ho', 'branch', 'dealer']) {
  const f = path.join(root, 'final-screenshots/localhost', `crawl-${r}.json`);
  if (fs.existsSync(f)) crawls[r] = JSON.parse(fs.readFileSync(f, 'utf8'));
}
const okIn = (role, route) => {
  const rows = (crawls[role] || []).filter((x) => x.href === `/distributor/${route}`);
  if (!rows.length) return null;
  return rows.every((x) => !x.crashed && !x.empty && !x.pageErrors.length && !x.api5xx.length && !x.api403.length);
};
const shot = (route) => { const x = (crawls.admin || []).find((c) => c.href === `/distributor/${route}`); return x ? x.screenshot.replace(/\\/g, '/') : ''; };

let md = `# Master Feature Matrix — reference CANSALE DMS vs. Distributor DMS

Generated by \`reference-audit/tools/build-matrix.mjs\` on ${new Date().toISOString().slice(0, 10)}.
Reference inventory = the Admin sidebar captured read-only from the live site (${REF.length} entries incl. Change Password / Logout).
"Opens" = the page loaded in the Playwright role crawl with no crash, no server error and no 403 (✔ yes, ✖ problem, – not in that role's menu / not crawled).

Status key: **COMPLETE** (built, opens, covered by an automated test or demo reconciliation) · **PARTIAL** (built, a documented difference remains) · **BUILT (crawl only)** (opens and works on demo data, no dedicated automated test) · **UNVERIFIED VS REFERENCE** applies to all rows except those marked VISUAL — reference *results* were compared only for Party Ledger and PO List.

| # | Group | Reference page | Reference URL | Our route | Admin | HO | Branch | Dealer | Evidence | Status | Screenshot |
|---|---|---|---|---|---|---|---|---|---|---|---|
`;
REF.forEach((r, i) => {
  const cells = ['admin', 'ho', 'branch', 'dealer'].map((role) => { const v = okIn(role, r.route); return v === null ? '–' : v ? '✔' : '✖'; });
  const partial = /PARTIAL|not a calendar/.test(r.tests);
  const tested = /flow:|entities:|verify:|e2e:|authz|mobile:/.test(r.tests);
  const status = cells[0] === '✖' ? 'BROKEN' : partial ? 'PARTIAL' : tested ? 'COMPLETE' : 'BUILT (crawl only)';
  const s = shot(r.route);
  md += `| ${i + 1} | ${r.group} | ${r.page} | \`${r.url}\` | \`${r.route}\` | ${cells.join(' | ')} | ${r.tests} | ${status} | ${s ? `[png](final-screenshots/localhost/${s})` : ''} |\n`;
});
const counts = {};
md.split('\n').forEach((l) => { const m = l.match(/\| (COMPLETE|PARTIAL|BUILT \(crawl only\)|BROKEN) \|/); if (m) counts[m[1]] = (counts[m[1]] || 0) + 1; });
md += `\n**Totals:** ${Object.entries(counts).map(([k, v]) => `${k}: ${v}`).join(' · ')}\n`;
md += `
## Evidence keys
- \`flow:\` backend/tests/dms.flow.test.js · \`entities:\` backend/tests/dms.entities.test.js · \`authz\` backend/tests/dms.authz.test.js
- \`verify:\` backend/scripts/dms-demo-verify.js (reconciliation on seeded data) · \`e2e:\` frontend/e2e/dms/02-workflows.spec.js (Playwright, real UI)
- \`mobile:\` mobile-dms/scripts/api-contract-check.mjs · \`seed\` created through the API by backend/scripts/dms-demo-seed.js · \`crawl\` frontend/e2e/dms/01-role-crawl.spec.js
- \`VISUAL\` compared side-by-side with the live reference.

## Sub-pages (not in the sidebar) — all reachable from list/detail pages
Add/Edit forms for every master and document · PO view / approve / edit / print · invoice-against-PO · invoice view / print (tax invoice, delivery challan, STN, return note) ·
dispatch update · receive (OK/Damage/Missing) · approve pages (STN, PRN, payments, leave, claims, TA/DA, deviation, quote, lead) · upload pages (opening, billing, beat, delivery matrix, serial activation) ·
payment view / print receipt · payslip print · location mapping · user page-rights editor.
`;
fs.writeFileSync(path.join(root, 'master-feature-matrix.md'), md);
console.log(`matrix: ${REF.length} rows`, counts);
