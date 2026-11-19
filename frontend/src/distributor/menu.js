import {
  Home, Gauge, Database, FileBarChart, Truck, Monitor, ShoppingCart, Undo2, Briefcase, PackageCheck, KeyRound,
  Target, HelpCircle, Smartphone, Users, UserCircle, ClipboardList,
} from 'lucide-react';

/**
 * Sidebar, in the reference's group order. `page` = server page-right key (must match the key the API checks).
 */
const D = '/distributor';
export const MENU = [
  { label: 'Home', icon: Home, color: '#f0ad4e', to: `${D}/home`, page: 'home' },
  {
    label: 'Dashboard', icon: Gauge, color: '#5bc0de', items: [
      { label: 'Dashboard 1', to: `${D}/dashboard/yearly`, page: 'dash_yearly' },
      { label: 'Dashboard 2', to: `${D}/dashboard/monthly`, page: 'dash_monthly' },
      { label: 'Inventory', to: `${D}/dashboard/inventory`, page: 'dash_inventory' },
      { label: 'Lead Dashboard', to: `${D}/dashboard/lead`, page: 'dash_lead' },
      { label: 'Purchase', to: `${D}/dashboard/purchase`, page: 'dash_po' },
      { label: 'Sale', to: `${D}/dashboard/sale`, page: 'dash_sale' },
    ],
  },
  {
    label: 'Master Management', icon: Database, color: '#5bc0de', items: [
      { label: 'Account', to: `${D}/masters/account`, page: 'm_account' },
      { label: 'Admin/Users', to: `${D}/masters/users`, page: 'm_users' },
      { label: 'Brand Master', to: `${D}/masters/brand`, page: 'm_brand' },
      { label: 'City Master', to: `${D}/masters/city`, page: 'm_city' },
      { label: 'Color Master', to: `${D}/masters/color`, page: 'm_color' },
      { label: 'Coupon Master', to: `${D}/masters/coupon`, page: 'm_coupon' },
      { label: 'Courier Master', to: `${D}/masters/courier`, page: 'm_courier' },
      { label: 'Customer Master', to: `${D}/masters/customers`, page: 'm_customer' },
      { label: 'Location Master', to: `${D}/masters/locations`, page: 'm_location' },
      { label: 'Other Tax Master', to: `${D}/masters/othertax`, page: 'm_othertax' },
      { label: 'Parameter Master', to: `${D}/masters/parameter`, page: 'm_parameter' },
      { label: 'Price Master', to: `${D}/masters/prices`, page: 'm_price' },
      { label: 'Product Category', to: `${D}/masters/category`, page: 'm_category' },
      { label: 'Product Delivery', to: `${D}/masters/productdelivery`, page: 'm_delivery' },
      { label: 'Product Image', to: `${D}/masters/productimage`, page: 'm_product' },
      { label: 'Product Master', to: `${D}/masters/products`, page: 'm_product' },
      { label: 'Product Sub Category', to: `${D}/masters/subcategory`, page: 'm_subcategory' },
      { label: 'Scheme Master', to: `${D}/masters/schemes`, page: 'm_scheme' },
      { label: 'Serial No. Activation', to: `${D}/masters-upload/serial-activation`, page: 'm_serial_activation' },
      { label: 'Specification', to: `${D}/masters/specification`, page: 'm_specification' },
      { label: 'State Master', to: `${D}/masters/state`, page: 'm_state' },
      { label: 'Tax Master', to: `${D}/masters/hsn`, page: 'm_tax' },
      { label: 'Vendor Master', to: `${D}/masters/vendors`, page: 'm_vendor' },
    ],
  },
  {
    label: 'Report Master', icon: FileBarChart, color: '#5bc0de', items: [
      { label: 'Beat Report', to: `${D}/e/beat`, page: 'beat_sched' },
      { label: 'Collection', to: `${D}/reports/collection`, page: 'r_collection' },
      { label: 'Inventory', to: `${D}/reports/inventory`, page: 'r_inventory' },
      { label: 'Inventory Aging', to: `${D}/reports/aging`, page: 'r_aging' },
      { label: 'ISD', to: `${D}/reports/isd`, page: 'r_isd' },
      { label: 'Party Ledger', to: `${D}/reports/party-ledger`, page: 'r_ledger' },
      { label: 'Party Master Report', to: `${D}/reports/party-master`, page: 'r_party_master' },
      { label: 'Payment', to: `${D}/reports/payment`, page: 'r_payment' },
      { label: 'Price Drop', to: `${D}/reports/price-drop`, page: 'r_price_drop' },
      { label: 'Purchase Order', to: `${D}/reports/purchase`, page: 'r_po' },
      { label: 'Return', to: `${D}/reports/return`, page: 'r_return' },
      { label: 'Sale Report', to: `${D}/reports/sale`, page: 'r_sale' },
      { label: 'Serial No. Activation Report', to: `${D}/reports/serial-activation`, page: 'r_serial_activation' },
      { label: 'Stock Ledger List', to: `${D}/reports/stock-ledger`, page: 'r_stock_ledger' },
      { label: 'Vendor Purchase', to: `${D}/reports/vendor`, page: 'r_vendor' },
    ],
  },
  { label: 'Logistic', icon: Truck, color: '#5bc0de', items: [{ label: 'Update Dispatch', to: `${D}/logistic/dispatch`, page: 'dispatch' }] },
  {
    label: 'Invoicing', icon: Monitor, color: '#5bc0de', items: [
      { label: 'Corporate', to: `${D}/invoicing/corporate`, page: 'corporate' },
      { label: 'Multiple Serial No. Track', to: `${D}/invoicing/multi-serial-track`, page: 'serial_track_multi' },
      { label: 'Retail', to: `${D}/invoicing/retail`, page: 'retail' },
      { label: 'Single Serial No. Track', to: `${D}/invoicing/serial-track`, page: 'serial_track' },
      { label: 'Stock Transfer', to: `${D}/invoicing/stock-transfer`, page: 'stock_transfer' },
      { label: 'Stock Transfer Approval', to: `${D}/invoicing/stock-transfer-approval`, page: 'stock_transfer_approval' },
      { label: 'Stock Transfer for Job work', to: `${D}/invoicing/jobwork`, page: 'jobwork' },
    ],
  },
  {
    label: 'Purchase', icon: ShoppingCart, color: '#5bc0de', items: [
      { label: 'Local Purchase', to: `${D}/purchase/local`, page: 'local_purchase' },
      { label: 'Opening', to: `${D}/purchase/opening`, page: 'opening' },
      { label: 'PO', to: `${D}/purchase/po`, page: 'po' },
      { label: 'PO Approval', to: `${D}/purchase/po-approval`, page: 'po_approval' },
      { label: 'Vendor', to: `${D}/purchase/vendor`, page: 'vendor_po' },
    ],
  },
  {
    label: 'Return', icon: Undo2, color: '#5bc0de', items: [
      { label: 'Customer Return', to: `${D}/return/customer`, page: 'customer_return' },
      { label: 'Purchase', to: `${D}/return/purchase`, page: 'purchase_return' },
      { label: 'Return Approval', to: `${D}/return/approval`, page: 'return_approval' },
      { label: 'Vendor', to: `${D}/return/vendor`, page: 'vendor_return' },
    ],
  },
  {
    label: 'Payment', icon: Briefcase, color: '#5bc0de', items: [
      { label: 'Account Adjustment', to: `${D}/payment/adjustment`, page: 'acc_adjust' },
      { label: 'Payment Approval', to: `${D}/payment/approval`, page: 'payment_approval' },
      { label: 'Payment Receive', to: `${D}/payment/receive`, page: 'payment_receive' },
    ],
  },
  {
    label: 'Receive Stock', icon: PackageCheck, color: '#5bc0de', items: [
      { label: 'From Location', to: `${D}/receive/location`, page: 'receive' },
      { label: 'Received from Jobwork', to: `${D}/receive/jobwork`, page: 'receive_jobwork' },
    ],
  },
  {
    label: 'Sale Force', icon: Target, color: '#5bc0de', items: [
      { label: 'Beat Scheduler', to: `${D}/sf/beat-scheduler`, page: 'beat_sched' },
      { label: 'Deviation Approval', to: `${D}/e/deviation`, page: 'deviation' },
      { label: 'Lead', to: `${D}/e/lead`, page: 'lead' },
      { label: 'My Beat Plan', to: `${D}/me/beat`, page: 'my_beat' },
      { label: 'PJP Master', to: `${D}/e/pjp`, page: 'pjp' },
      { label: 'Quote', to: `${D}/e/quote`, page: 'quote' },
      { label: 'Target', to: `${D}/e/target`, page: 'target' },
    ],
  },
  {
    label: 'General Query', icon: HelpCircle, color: '#5bc0de', items: [
      { label: 'Locationwise Expense', to: `${D}/e/expense`, page: 'expense' },
      { label: 'Query Status', to: `${D}/e/query`, page: 'query' },
    ],
  },
  {
    label: 'App Transaction', icon: Smartphone, color: '#5bc0de', items: [
      { label: 'App Feedback', to: `${D}/e/appfeedback`, page: 'app_feedback' },
      { label: 'App Task', to: `${D}/e/apptask`, page: 'app_task' },
      { label: 'App Track Location', to: `${D}/sf/track`, page: 'app_track' },
      { label: 'Attendance Report', to: `${D}/e/attendance`, page: 'attendance_report' },
      { label: 'TA DA Approval', to: `${D}/e/tada`, page: 'tada_approval' },
    ],
  },
  {
    label: 'HRMS HR.', icon: Users, color: '#5bc0de', items: [
      { label: 'Activities', to: `${D}/e/activity`, page: 'hr_activities' },
      { label: 'Application Approve', to: `${D}/approve/application`, page: 'hr_application_approve' },
      { label: 'Attendance', to: `${D}/hr/attendance`, page: 'hr_attendance' },
      { label: 'Claim Approvals', to: `${D}/approve/claim`, page: 'hr_claim_approve' },
      { label: 'Claims', to: `${D}/e/claim`, page: 'hr_claims' },
      { label: 'Department Master', to: `${D}/e/department`, page: 'hr_department' },
      { label: 'Designation Master', to: `${D}/e/designation`, page: 'hr_designation' },
      { label: 'Employee Master', to: `${D}/e/employee`, page: 'hr_employee' },
      { label: 'Holidays Master', to: `${D}/e/holiday`, page: 'hr_holiday' },
      { label: 'Leave Approve', to: `${D}/approve/leave`, page: 'hr_leave_approve' },
      { label: 'Leave Master', to: `${D}/e/leavetype`, page: 'hr_leave_master' },
      { label: 'My Teams', to: `${D}/hr/my-teams`, page: 'hr_myteams' },
      { label: 'Notice', to: `${D}/e/notice`, page: 'hr_notice' },
      { label: 'Policies', to: `${D}/e/policy`, page: 'hr_policies' },
      { label: 'Projects / Clients', to: `${D}/e/project`, page: 'hr_projects' },
      { label: 'Resign Request', to: `${D}/e/resign`, page: 'hr_resign' },
      { label: 'Salary Generate', to: `${D}/hr/salary-generate`, page: 'hr_salary_gen' },
      { label: 'Salary Sheet', to: `${D}/e/salary`, page: 'hr_salary_sheet' },
    ],
  },
  {
    label: 'HRMS Emp.', icon: UserCircle, color: '#5bc0de', items: [
      { label: 'Activities', to: `${D}/me/activity`, page: 'e_activities' },
      { label: 'Application', to: `${D}/me/application`, page: 'e_application' },
      { label: 'Attendance', to: `${D}/me/attendance-punch`, page: 'e_attendance' },
      { label: 'Employee Claims', to: `${D}/me/claim`, page: 'e_claims' },
      { label: 'Leave apply / View Status', to: `${D}/me/leave`, page: 'e_leave' },
      { label: 'My Documents', to: `${D}/me/mydoc`, page: 'e_documents' },
      { label: 'My Profile', to: `${D}/me/profile`, page: 'e_profile' },
      { label: 'Policies', to: `${D}/me/policy`, page: 'e_policies' },
      { label: 'Resign Request', to: `${D}/me/resign`, page: 'e_resign' },
      { label: 'Salary Sheet', to: `${D}/me/salary`, page: 'e_salary' },
    ],
  },
  {
    label: 'HRMS Report', icon: ClipboardList, color: '#5bc0de', items: [
      { label: 'Attendance', to: `${D}/rp/attendance`, page: 'attendance_report' },
      { label: 'Employee Details', to: `${D}/rp/employee`, page: 'hr_employee' },
      { label: 'Leave Approve/Reject', to: `${D}/rp/leave`, page: 'hr_leave_approve' },
      { label: 'Other Request Report', to: `${D}/rp/other`, page: 'rp_other' },
      { label: 'Salary Report', to: `${D}/rp/salary`, page: 'hr_salary_sheet' },
      { label: 'Salary Slip', to: `${D}/rp/slip`, page: 'hr_salary_sheet' },
    ],
  },
  { label: 'Change Password', icon: KeyRound, color: '#5bc0de', to: `${D}/change-password`, page: null },
];

export function filterMenu(pages = [], isAdmin = false) {
  const can = (p) => isAdmin || p === null || pages.includes(p);
  return MENU.map((g) => (g.items ? { ...g, items: g.items.filter((i) => can(i.page)) } : g))
    .filter((g) => (g.items ? g.items.length > 0 : can(g.page)));
}
