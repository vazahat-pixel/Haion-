import { writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pagesDir = join(__dirname, '../src/pages');

const pages = [
  // Admin
  { path: 'admin/AdminDashboardPage.jsx', title: 'Dashboard', subtitle: 'System overview and key metrics', import: "import { AdminDashboard } from '@/modules/dashboards';", body: '<AdminDashboard />' },
  { path: 'admin/warehouses/WarehouseListPage.jsx', title: 'Warehouses', subtitle: 'Manage warehouse locations and capacity', import: "import { WarehouseTable } from '@/modules/warehouses';", body: '<WarehouseTable />' },
  { path: 'admin/warehouses/WarehouseDetailPage.jsx', title: 'Warehouse Details', subtitle: 'Warehouse information', import: "import { useParams } from 'react-router-dom';\nimport { WarehouseDetail } from '@/modules/warehouses';", body: '<WarehouseDetail id={id} />', extra: "const { id } = useParams();" },
  { path: 'admin/warehouses/GRNPage.jsx', title: 'Goods Receipt', subtitle: 'Record incoming stock', import: "import { GRNForm } from '@/modules/grn';", body: '<GRNForm />' },
  { path: 'admin/dispatch/DispatchListPage.jsx', title: 'Dispatch', subtitle: 'Track outbound shipments', import: "import { DispatchTable } from '@/modules/dispatch';", body: '<DispatchTable />' },
  { path: 'admin/dispatch/DispatchDetailPage.jsx', title: 'Dispatch Details', subtitle: 'Shipment information', import: "import { useParams } from 'react-router-dom';\nimport { DispatchDetail } from '@/modules/dispatch';", body: '<DispatchDetail id={id} />', extra: "const { id } = useParams();" },
  { path: 'admin/inventory/InventoryDetailPage.jsx', title: 'Product Details', subtitle: 'Inventory item information', import: "import { useParams } from 'react-router-dom';\nimport { InventoryDetail } from '@/modules/inventory';", body: '<InventoryDetail id={id} />', extra: "const { id } = useParams();" },
  { path: 'admin/dealers/DealerListPage.jsx', title: 'Dealers', subtitle: 'Manage dealer network', import: "import { Link } from 'react-router-dom';\nimport { Button } from '@/components/ui/button';\nimport { Plus } from 'lucide-react';\nimport { DealerTable } from '@/modules/dealers';", body: '<DealerTable />', actions: '<Button size="sm" asChild><Link to="/admin/dealers/onboarding"><Plus className="h-4 w-4" /> Onboard Dealer</Link></Button>' },
  { path: 'admin/dealers/DealerDetailPage.jsx', title: 'Dealer Details', subtitle: 'Dealer profile', import: "import { useParams } from 'react-router-dom';\nimport { DealerDetail } from '@/modules/dealers';", body: '<DealerDetail id={id} />', extra: "const { id } = useParams();" },
  { path: 'admin/dealers/DealerOnboardingPage.jsx', title: 'Dealer Onboarding', subtitle: 'Register a new dealer', import: "import { DealerOnboardingForm } from '@/modules/dealers';", body: '<DealerOnboardingForm />' },
  { path: 'admin/employees/EmployeeListPage.jsx', title: 'Employees', subtitle: 'Manage staff and roles', import: "import { EmployeeTable } from '@/modules/employees';", body: '<EmployeeTable />' },
  { path: 'admin/employees/EmployeeDetailPage.jsx', title: 'Employee Details', subtitle: 'Employee profile', import: "import { useParams } from 'react-router-dom';\nimport { EmployeeDetail } from '@/modules/employees';", body: '<EmployeeDetail id={id} />', extra: "const { id } = useParams();" },
  { path: 'admin/settings/SettingsPage.jsx', title: 'Settings', subtitle: 'System configuration', import: "import { SettingsHub } from '@/modules/settings';", body: '<SettingsHub />' },
  { path: 'admin/settings/GeneralSettingsPage.jsx', title: 'General Settings', subtitle: 'Company profile', import: "import { GeneralSettingsForm } from '@/modules/settings';", body: '<GeneralSettingsForm />' },
  { path: 'admin/settings/GstSettingsPage.jsx', title: 'GST Settings', subtitle: 'Tax configuration', import: "import { GstSettingsForm } from '@/modules/settings';", body: '<GstSettingsForm />' },
  { path: 'admin/settings/NotificationSettingsPage.jsx', title: 'Notifications', subtitle: 'Alert preferences', import: "import { NotificationSettingsForm } from '@/modules/settings';", body: '<NotificationSettingsForm />' },
  { path: 'admin/audit-logs/AuditLogPage.jsx', title: 'Audit Logs', subtitle: 'System activity trail', import: "import { AuditLogTable } from '@/modules/audit';", body: '<AuditLogTable />' },
  // Dealer
  { path: 'dealer/DealerDashboardPage.jsx', title: 'Dashboard', subtitle: 'Sales overview', import: "import { DealerDashboard } from '@/modules/dashboards';", body: '<DealerDashboard />' },
  { path: 'dealer/billing/BillingListPage.jsx', title: 'Billing', subtitle: 'Manage bills and invoices', import: "import { Link } from 'react-router-dom';\nimport { Button } from '@/components/ui/button';\nimport { Plus } from 'lucide-react';\nimport { BillingTable } from '@/modules/billing';", body: '<BillingTable />', actions: '<Button size="sm" asChild><Link to="/dealer/billing/new"><Plus className="h-4 w-4" /> New Bill</Link></Button>' },
  { path: 'dealer/billing/BillingNewPage.jsx', title: 'New Bill', subtitle: 'Create a new bill', import: "import { BillingCreateForm } from '@/modules/billing';", body: '<BillingCreateForm />' },
  { path: 'dealer/billing/BillingDetailPage.jsx', title: 'Bill Details', subtitle: 'Bill information', import: "import { useParams } from 'react-router-dom';\nimport { BillingDetail } from '@/modules/billing';", body: '<BillingDetail id={id} />', extra: "const { id } = useParams();" },
  { path: 'dealer/inventory/DealerInventoryListPage.jsx', title: 'My Inventory', subtitle: 'Stock at your location', import: "import { DealerInventoryTable } from '@/modules/dealer-inventory';", body: '<DealerInventoryTable />' },
  { path: 'dealer/inventory/DealerInventoryDetailPage.jsx', title: 'Product Details', subtitle: 'Inventory item', import: "import { useParams } from 'react-router-dom';\nimport { DealerInventoryDetail } from '@/modules/dealer-inventory';", body: '<DealerInventoryDetail id={id} />', extra: "const { id } = useParams();" },
  { path: 'dealer/invoices/InvoiceListPage.jsx', title: 'Invoices', subtitle: 'View issued invoices', import: "import { InvoiceTable } from '@/modules/billing';", body: '<InvoiceTable />' },
  { path: 'dealer/invoices/InvoiceDetailPage.jsx', title: 'Invoice Details', subtitle: 'Invoice information', import: "import { useParams } from 'react-router-dom';\nimport { InvoiceDetail } from '@/modules/billing';", body: '<InvoiceDetail id={id} />', extra: "const { id } = useParams();" },
  { path: 'dealer/team/TeamListPage.jsx', title: 'Team', subtitle: 'Your sales team', import: "import { TeamTable } from '@/modules/team';", body: '<TeamTable />' },
  { path: 'dealer/team/TeamPerformancePage.jsx', title: 'Team Performance', subtitle: 'Sales metrics and targets', import: "import { TeamPerformanceDashboard } from '@/modules/team';", body: '<TeamPerformanceDashboard />' },
  { path: 'dealer/warranty/WarrantyListPage.jsx', title: 'Warranty', subtitle: 'Registered warranties', import: "import { WarrantyTable } from '@/modules/warranty';", body: '<WarrantyTable />' },
  { path: 'dealer/warranty/WarrantyDetailPage.jsx', title: 'Warranty Details', subtitle: 'Warranty information', import: "import { useParams } from 'react-router-dom';\nimport { WarrantyDetail } from '@/modules/warranty';", body: '<WarrantyDetail id={id} />', extra: "const { id } = useParams();" },
  // Employee
  { path: 'employee/EmployeeDashboardPage.jsx', title: 'Dashboard', subtitle: 'Your work overview', import: "import { EmployeeDashboard } from '@/modules/dashboards';", body: '<EmployeeDashboard />' },
  { path: 'employee/tasks/TaskListPage.jsx', title: 'Tasks', subtitle: 'Assigned work items', import: "import { TaskTable } from '@/modules/tasks';", body: '<TaskTable />' },
  { path: 'employee/tasks/TaskDetailPage.jsx', title: 'Task Details', subtitle: 'Task information', import: "import { useParams } from 'react-router-dom';\nimport { TaskDetail } from '@/modules/tasks';", body: '<TaskDetail id={id} />', extra: "const { id } = useParams();" },
  { path: 'employee/approvals/ApprovalListPage.jsx', title: 'Approvals', subtitle: 'Pending approval requests', import: "import { ApprovalTable } from '@/modules/approvals';", body: '<ApprovalTable />' },
  { path: 'employee/approvals/ApprovalDetailPage.jsx', title: 'Approval Details', subtitle: 'Request information', import: "import { useParams } from 'react-router-dom';\nimport { ApprovalDetail } from '@/modules/approvals';", body: '<ApprovalDetail id={id} />', extra: "const { id } = useParams();" },
  { path: 'employee/reports/ReportListPage.jsx', title: 'Reports', subtitle: 'Generated reports', import: "import { ReportTable } from '@/modules/reports';", body: '<ReportTable />' },
  { path: 'employee/reports/ReportDetailPage.jsx', title: 'Report Details', subtitle: 'Report information', import: "import { useParams } from 'react-router-dom';\nimport { ReportDetail } from '@/modules/reports';", body: '<ReportDetail id={id} />', extra: "const { id } = useParams();" },
  { path: 'employee/team/TeamDashboardPage.jsx', title: 'Team Dashboard', subtitle: 'Team activity overview', import: "import { TeamDashboard } from '@/modules/dashboards';", body: '<TeamDashboard />' },
  // Service
  { path: 'service/ServiceDashboardPage.jsx', title: 'Dashboard', subtitle: 'Service center overview', import: "import { ServiceDashboard } from '@/modules/dashboards';", body: '<ServiceDashboard />' },
  { path: 'service/complaints/ComplaintListPage.jsx', title: 'Complaints', subtitle: 'Customer complaints', import: "import { Link } from 'react-router-dom';\nimport { Button } from '@/components/ui/button';\nimport { Plus } from 'lucide-react';\nimport { ComplaintTable } from '@/modules/complaints';", body: '<ComplaintTable />', actions: '<Button size="sm" asChild><Link to="/service/complaints/new"><Plus className="h-4 w-4" /> New Complaint</Link></Button>' },
  { path: 'service/complaints/ComplaintNewPage.jsx', title: 'New Complaint', subtitle: 'Register a complaint', import: "import { ComplaintCreateForm } from '@/modules/complaints';", body: '<ComplaintCreateForm />' },
  { path: 'service/complaints/ComplaintDetailPage.jsx', title: 'Complaint Details', subtitle: 'Complaint information', import: "import { useParams } from 'react-router-dom';\nimport { ComplaintDetail } from '@/modules/complaints';", body: '<ComplaintDetail id={id} />', extra: "const { id } = useParams();" },
  { path: 'service/spare-parts/SparePartsListPage.jsx', title: 'Spare Parts', subtitle: 'Parts requests', import: "import { SparesTable } from '@/modules/spares';", body: '<SparesTable />' },
  { path: 'service/spare-parts/SparePartsDetailPage.jsx', title: 'Request Details', subtitle: 'Spare parts request', import: "import { useParams } from 'react-router-dom';\nimport { SparesDetail } from '@/modules/spares';", body: '<SparesDetail id={id} />', extra: "const { id } = useParams();" },
  { path: 'service/defective-returns/DefectiveReturnsListPage.jsx', title: 'Defective Returns', subtitle: 'Returned defective items', import: "import { ReturnsTable } from '@/modules/returns';", body: '<ReturnsTable />' },
  { path: 'service/defective-returns/DefectiveReturnsDetailPage.jsx', title: 'Return Details', subtitle: 'Return information', import: "import { useParams } from 'react-router-dom';\nimport { ReturnsDetail } from '@/modules/returns';", body: '<ReturnsDetail id={id} />', extra: "const { id } = useParams();" },
  // Customer
  { path: 'customer/CustomerDashboardPage.jsx', title: 'Dashboard', subtitle: 'Your account overview', import: "import { CustomerDashboard } from '@/modules/dashboards';", body: '<CustomerDashboard />' },
  { path: 'customer/orders/OrderListPage.jsx', title: 'Orders', subtitle: 'Your order history', import: "import { OrderTable } from '@/modules/orders';", body: '<OrderTable />' },
  { path: 'customer/orders/OrderDetailPage.jsx', title: 'Order Details', subtitle: 'Order information', import: "import { useParams } from 'react-router-dom';\nimport { OrderDetail } from '@/modules/orders';", body: '<OrderDetail id={id} />', extra: "const { id } = useParams();" },
  { path: 'customer/service-requests/ServiceRequestListPage.jsx', title: 'Service Requests', subtitle: 'Your service requests', import: "import { Link } from 'react-router-dom';\nimport { Button } from '@/components/ui/button';\nimport { Plus } from 'lucide-react';\nimport { ServiceRequestTable } from '@/modules/service-requests';", body: '<ServiceRequestTable />', actions: '<Button size="sm" asChild><Link to="/customer/service-requests/new"><Plus className="h-4 w-4" /> New Request</Link></Button>' },
  { path: 'customer/service-requests/ServiceRequestNewPage.jsx', title: 'New Service Request', subtitle: 'Request a service visit', import: "import { ServiceRequestCreateForm } from '@/modules/service-requests';", body: '<ServiceRequestCreateForm />' },
  { path: 'customer/service-requests/ServiceRequestDetailPage.jsx', title: 'Request Details', subtitle: 'Service request information', import: "import { useParams } from 'react-router-dom';\nimport { ServiceRequestDetail } from '@/modules/service-requests';", body: '<ServiceRequestDetail id={id} />', extra: "const { id } = useParams();" },
  { path: 'customer/warranty/CustomerWarrantyListPage.jsx', title: 'My Warranties', subtitle: 'Registered product warranties', import: "import { CustomerWarrantyTable } from '@/modules/warranty';", body: '<CustomerWarrantyTable />' },
  { path: 'customer/warranty/CustomerWarrantyDetailPage.jsx', title: 'Warranty Details', subtitle: 'Warranty information', import: "import { useParams } from 'react-router-dom';\nimport { CustomerWarrantyDetail } from '@/modules/warranty';", body: '<CustomerWarrantyDetail id={id} />', extra: "const { id } = useParams();" },
];

for (const p of pages) {
  const filePath = join(pagesDir, p.path);
  mkdirSync(dirname(filePath), { recursive: true });
  const fnName = p.path.split('/').pop().replace('.jsx', '');
  const extra = p.extra ? `\n  ${p.extra}` : '';
  const actions = p.actions ? `\n      actions={${p.actions}}` : '';
  const content = `import { PageShell } from '@/components/layout/PageShell';
${p.import}

export default function ${fnName}() {${extra}
  return (
    <PageShell title="${p.title}" subtitle="${p.subtitle}"${actions}>
      ${p.body}
    </PageShell>
  );
}
`;
  writeFileSync(filePath, content);
  console.log('Wrote', p.path);
}

console.log(`Done: ${pages.length} pages`);
