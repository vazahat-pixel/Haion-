# Reference vs local — page structure diff

Generated 2026-11-20 09:26 by tools/compare-structure.mjs.
Reference pages read: **114** (sidebar of the logged-in reference account + each page's Add form). Local pages read: **117**.
Pages with no structural difference: **87**. Pages with differences: **27**.

Compared: page title, main table columns (set and order), form labels, buttons, tabs, and the same for the Add page. Ignored: DataTables paging/search chrome.

| # | Group | Page | Reference | Local | Differences |
|---|---|---|---|---|---|
| 1 |  | Home | dashboard/home_dashboard.php | /distributor/home | title: 1151031.36, ; missingColumns: current month po status, po status, count; missingButtons: plain, inverted, polar |
| 2 | Dashboard | Dashboard 1 | dashboard/yearly_dashboard.php | /distributor/dashboard/yearly | missingLabels: month |
| 3 | Dashboard | Dashboard 2 | dashboard/saleQtyAmtMonthwise.php | /distributor/dashboard/monthly | none |
| 4 | Dashboard | Inventory | dashboard/inventoryDash.php | /distributor/dashboard/inventory | none |
| 5 | Dashboard | Lead Dashboard | dashboard/leadDashboard.php | /distributor/dashboard/lead | none |
| 6 | Dashboard | Purchase | dashboard/po_dashboard.php | /distributor/dashboard/purchase | none |
| 7 | Dashboard | Sale | dashboard/saleDash.php | /distributor/dashboard/sale | none |
| 8 | Master Management | Account | admin/account_master.php | /distributor/masters/account | none |
| 9 | Master Management | Admin/Users | admin/adminusermgt.php | /distributor/masters/users | **add page:** missingLabels: user id; missingButtons: update, update rights |
| 10 | Master Management | Brand Master | admin/brand_master.php | /distributor/masters/brand | none |
| 11 | Master Management | City Master | admin/city_master.php | /distributor/masters/city | none |
| 12 | Master Management | Color Master | po/color_master.php | /distributor/masters/color | none |
| 13 | Master Management | Coupon Master | admin/coupon_master.php | /distributor/masters/coupon | missingButtons: coupon mapping; **add page:** missingButtons: update |
| 14 | Master Management | Courier Master | admin/courier_master.php | /distributor/masters/courier | none |
| 15 | Master Management | Customer Master | admin/customer_details.php | /distributor/masters/customers | none |
| 16 | Master Management | Location Master | admin/asp_details.php | /distributor/masters/locations | none |
| 17 | Master Management | Other Tax Master | admin/other_tax.php | /distributor/masters/othertax | none |
| 18 | Master Management | Parameter Master | admin/parameter_master.php | /distributor/masters/parameter | none |
| 19 | Master Management | Price Master | admin/price_master.php | /distributor/masters/prices | **add page:** missingColumns: state |
| 20 | Master Management | Product Category | admin/productcat_master.php | /distributor/masters/category | **add page:** missingButtons: update |
| 21 | Master Management | Product Delivery | admin/product_delivery.php | /distributor/masters/productdelivery | none |
| 22 | Master Management | Product Image | admin/product_image_list.php | /distributor/masters/productimage | none |
| 23 | Master Management | Product Master | admin/model_master.php | /distributor/masters/products | none |
| 24 | Master Management | Product Sub Category | admin/prod_subcat_master.php | /distributor/masters/subcategory | **add page:** missingButtons: update |
| 25 | Master Management | Scheme Master | admin/scheme_master.php | /distributor/masters/schemes | none |
| 26 | Master Management | Serial No. Activation | admin/imei_activation_upld.php | /distributor/masters-upload/serial-activation | none |
| 27 | Master Management | Specification | admin/specification_master.php | /distributor/masters/specification | none |
| 28 | Master Management | State Master | admin/state_master.php | /distributor/masters/state | none |
| 29 | Master Management | Tax Master | admin/tax_master.php | /distributor/masters/hsn | none |
| 30 | Master Management | Vendor Master | admin/vendor_master.php | /distributor/masters/vendors | none |
| 31 | Report Master | Beat Report | reports/beat_report.php | /distributor/reports/beat | none |
| 32 | Report Master | Collection | reports/collection_sheet.php | /distributor/reports/collection | none |
| 33 | Report Master | Inventory | reports/inventory_stock.php | /distributor/reports/inventory | none |
| 34 | Report Master | Inventory Aging | reports/inventory_aging.php | /distributor/reports/aging | title: Inventory Aging, ; missingColumns: s.no, location name, location type, product code, product name, product nature, 0 - 15 days, 16 - 30 days, above 30 days, ok, dm, ms; missingLabels: product category, product sub category, brand, product, location; missingButtons: go |
| 35 | Report Master | ISD | reports/isd_report.php | /distributor/reports/isd | none |
| 36 | Report Master | Party Ledger | reports/partyledger.php | /distributor/reports/party-ledger | none |
| 37 | Report Master | Party Master Report | reports/mapping_report.php | /distributor/reports/party-master | none |
| 38 | Report Master | Payment | reports/payment_status.php | /distributor/reports/payment | none |
| 39 | Report Master | Price Drop | reports/pricedrop.php | /distributor/reports/price-drop | none |
| 40 | Report Master | Purchase Order | reports/purchase_report.php | /distributor/reports/purchase | none |
| 41 | Report Master | Return | reports/return_report.php | /distributor/reports/return | none |
| 42 | Report Master | Sale Report | reports/invoice_report.php | /distributor/reports/sale | none |
| 43 | Report Master | Serial No. Activation Report | reports/imei_activation_rpt.php | /distributor/reports/serial-activation | none |
| 44 | Report Master | Stock Ledger List | reports/stock_ledger_list.php | /distributor/reports/stock-ledger | none |
| 45 | Report Master | Vendor Purchase | reports/vendor_report.php | /distributor/reports/vendor | none |
| 46 | Logistic | Update Dispatch | logistic/updateInvLogistic.php | /distributor/logistic/dispatch | none |
| 47 | Invoicing | Corporate | invoice/corporateInvoice.php | /distributor/invoicing/corporate | none |
| 48 | Invoicing | Multiple Serial No. Track | invoice/imei_track.php | /distributor/invoicing/multi-serial-track | none |
| 49 | Invoicing | Retail | invoice/retailbillinglist.php | /distributor/invoicing/retail | **add page:** extraColumns: value, avl stock, serial / imei no.; missingLabels: total qty, sub total, discount, tax amount, grand total |
| 50 | Invoicing | Single Serial No. Track | invoice/check_imei.php | /distributor/invoicing/serial-track | none |
| 51 | Invoicing | STN Distribution | invoice/stndistribution_list.php | /distributor/invoicing/stn-distribution | none |
| 52 | Invoicing | Stock Transfer | invoice/stock_transfer.php | /distributor/new/STN | missingColumns: discount, sgst(%), sgst amt, cgst(%), cgst amt, igst(%), igst amt; extraColumns: discount/unit, serial / imei no.; missingLabels: sub total, total qty, total discount, grand total |
| 53 | Invoicing | Stock Transfer Approval | invoice/stockTRansferApproval.php | /distributor/invoicing/stock-transfer-approval | none |
| 54 | Purchase | Local Purchase | po/localPurchaseList.php | /distributor/purchase/local | **add page:** extraColumns: serial / imei no.; missingLabels: total qty, sub total, total sgst amt, round off, total cgst amt, grand total, total igst amt, invoice no. |
| 55 | Purchase | Opening | opening/openingStockList.php | /distributor/purchase/opening | **add page:** extraColumns: total, serial / imei no.; missingLabels: total qty, total |
| 56 | Purchase | PO | po/purchaseOrderList.php | /distributor/purchase/po | **add page:** extraColumns: after discount value; missingLabels: sub total, total qty, total discount, grand total |
| 57 | Purchase | PO Approval | po/purchaseOrderApproval.php | /distributor/purchase/po-approval | none |
| 58 | Purchase | Vendor | po/vendorPurchaseList.php | /distributor/purchase/vendor | **add page:** extraColumns: total; missingLabels: available credit balance, total qty, sub total |
| 59 | Return | Customer Return | return/retailcust_return.php | /distributor/return/customer | **add page:** extraColumns: product, qty, price, value, discount/unit, after discount value, sgst(%), sgst amt, cgst(%), cgst amt, igst(%), igst amt, total, serial / imei no.; missingLabels: total qty, sub total, discount applied as, total discount, grand total |
| 60 | Return | Purchase | return/purchase_return.php | /distributor/return/purchase | **add page:** extraColumns: product, qty, price, value, discount/unit, after discount value, sgst(%), sgst amt, cgst(%), cgst amt, igst(%), igst amt, total, avl stock, serial / imei no.; missingLabels: total qty, sub total, discount applied as, total discount, grand total |
| 61 | Return | Return Approval | return/return_approval_list.php | /distributor/return/approval | none |
| 62 | Return | Vendor | return/vendor_return.php | /distributor/return/vendor | **add page:** extraColumns: product, qty, price, value, sgst(%), sgst amt, cgst(%), cgst amt, igst(%), igst amt, total, avl stock, serial / imei no.; missingLabels: total qty, sub total, tax, tax amount, grand total; missingButtons: process |
| 63 | Payment | Account Adjustment | payment/acc_adjustList.php | /distributor/payment/adjustment | none |
| 64 | Payment | Payment Approval | payment/payment_approval_list.php | /distributor/payment/approval | none |
| 65 | Payment | Payment Receive | payment/paymentlist.php | /distributor/payment/receive | none |
| 66 | Receive Stock | From Location | invoice/receiveInvoice.php | /distributor/receive/location | none |
| 67 | Sale Force | Beat Scheduler | salesforce/beatUploader.php | /distributor/sf/beat-scheduler | missingLabels: browse… |
| 68 | Sale Force | Lead | salesforce/lead_list.php | /distributor/e/lead | none |
| 69 | Sale Force | My Beat Plan | salesforce/calender_event.php | /distributor/me/beat | missingLabels: task name, area to visit; missingButtons: add |
| 70 | Sale Force | PJP Master | salesforce/pjp_master.php | /distributor/e/pjp | none |
| 71 | Sale Force | Quote | salesforce/quote_list.php | /distributor/e/quote | **add page:** missingLabels: sub total, total qty, total tax, grand total |
| 72 | Sale Force | Target | salesforce/target_list.php | /distributor/e/target | none |
| 73 | General Query | Locationwise Expense | admin/locationwise_expense.php | /distributor/e/expense | none |
| 74 | General Query | Query Status | admin/query_master.php | /distributor/e/query | none |
| 75 | App Transaction | App Feedback | admin/appFeedback.php | /distributor/e/appfeedback | none |
| 76 | App Transaction | App Task | admin/apptask.php | /distributor/e/apptask | none |
| 77 | App Transaction | App Track Location | admin/tracklocapp.php | /distributor/sf/track | none |
| 78 | App Transaction | Attendance Report | reports/attendance_report.php | /distributor/e/attendance | none |
| 79 | App Transaction | TA DA Approval | admin/ta_da_approval.php | /distributor/e/tada | none |
| 80 | HRMS HR. | Activities | hrms/activities_emp_list.php | /distributor/e/activity | none |
| 81 | HRMS HR. | Application Approve | hrms/application_approve_list.php | /distributor/approve/application | none |
| 82 | HRMS HR. | Attendance | hrms/attendance_emp_list.php | /distributor/hr/attendance | none |
| 83 | HRMS HR. | Claim Approvals | hrms/approvals_list.php | /distributor/approve/claim | none |
| 84 | HRMS HR. | Claims | hrms/employee_claims_list.php | /distributor/e/claim | none |
| 85 | HRMS HR. | Department Master | hrms/department_list.php | /distributor/e/department | none |
| 86 | HRMS HR. | Designation Master | hrms/designation_list.php | /distributor/e/designation | none |
| 87 | HRMS HR. | Employee Master | hrms/employee_master_list.php | /distributor/e/employee | none |
| 88 | HRMS HR. | Holidays Master | hrms/holidays_list.php | /distributor/e/holiday | none |
| 89 | HRMS HR. | Leave Approve | hrms/leave_approve_list.php | /distributor/approve/leave | none |
| 90 | HRMS HR. | Leave Master | hrms/leave_list.php | /distributor/e/leavetype | none |
| 91 | HRMS HR. | My Teams | hrms/my_teams_list.php | /distributor/hr/my-teams | none |
| 92 | HRMS HR. | Notice | hrms/notice_list.php | /distributor/e/notice | none |
| 93 | HRMS HR. | Policies | hrms/policies_admin_list.php | /distributor/e/policy | none |
| 94 | HRMS HR. | Projects / Clients | hrms/project_clients_list.php | /distributor/e/project | none |
| 95 | HRMS HR. | Resign Request | hrms/resign_request.php | /distributor/e/resign | none |
| 96 | HRMS HR. | Salary Generate | hrms/salary_generate.php | /distributor/hr/salary-generate | none |
| 97 | HRMS HR. | Salary Sheet | hrms/admin_salary_sheet_view.php | /distributor/e/salary | missingButtons: pay slip details upload |
| 98 | HRMS Emp. | Activities | hrms/activities_emp_list.php | /distributor/me/activity | none |
| 99 | HRMS Emp. | Application | hrms/application_emp_list.php | /distributor/me/application | none |
| 100 | HRMS Emp. | Attendance | hrms/attendance_emp_list.php | /distributor/me/attendance-punch | none |
| 101 | HRMS Emp. | Employee Claims | hrms/employee_claims_list.php | /distributor/me/claim | none |
| 102 | HRMS Emp. | Leave apply / View Status | hrms/leave_apply_list.php | /distributor/me/leave | missingAddPage: Leave Apply |
| 103 | HRMS Emp. | My Documents | hrms/my_document_list.php | /distributor/me/mydoc | none |
| 104 | HRMS Emp. | My Profile | hrms/my_profile_view.php | /distributor/me/profile | missingLabels: employee name, email, company name, reporting manager, date of birth, anniversary date, contact no., address, date of joining, emp code, alternate email, alternate number, password |
| 105 | HRMS Emp. | Policies | hrms/policies_emp_list.php | /distributor/me/policy | none |
| 106 | HRMS Emp. | Resign Request | hrms/resign_request.php | /distributor/me/resign | title: Resign Request, ; missingLabels: reason, reason details, offer last working date, resign document; missingButtons: request |
| 107 | HRMS Emp. | Salary Sheet | hrms/emp_salary_sheet_view.php | /distributor/me/salary | none |
| 108 | HRMS Report | Attendance | reports/attendancemp_report.php | /distributor/rp/attendance | none |
| 109 | HRMS Report | Employee Details | reports/employee_report.php | /distributor/rp/employee | none |
| 110 | HRMS Report | Leave Approve/Reject | reports/leavestatus_report.php | /distributor/rp/leave | none |
| 111 | HRMS Report | Other Request Report | reports/otherequest_Report.php | /distributor/rp/other | none |
| 112 | HRMS Report | Salary Report | reports/salary_report.php | /distributor/rp/salary | missingButtons: go |
| 113 | HRMS Report | Salary Slip | reports/salarySlip_report.php | /distributor/rp/slip | missingButtons: go |
| 114 | HRMS Report | Change Password | admin/changepassword.php | — | missingPage: true |

## Local pages not in this reference account's sidebar

- Invoicing > Stock Transfer for Job work
- Receive Stock > Received from Jobwork
- Sale Force > Deviation Approval
-  > Change Password
