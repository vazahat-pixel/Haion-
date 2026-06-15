import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..', 'src', 'pages');

const pages = [
  ['admin', 'AdminDashboardPage', 'Dashboard', 'Overview of system performance and KPIs'],
  ['admin/warehouses', 'WarehouseListPage', 'Warehouses', 'Manage warehouse locations'],
  ['admin/warehouses', 'WarehouseDetailPage', 'Warehouse Detail', 'Warehouse stock and details'],
  ['admin/warehouses', 'GRNPage', 'Goods Receipt', 'Record goods received'],
  ['admin/dispatch', 'DispatchListPage', 'Dispatch', 'Manage dispatch orders'],
  ['admin/dispatch', 'DispatchDetailPage', 'Dispatch Detail', 'Track dispatch status'],
  ['admin/inventory', 'InventoryListPage', 'Inventory', 'Manage product catalog and stock'],
  ['admin/inventory', 'InventoryDetailPage', 'Product Detail', 'Product information and stock levels'],
  ['admin/dealers', 'DealerListPage', 'Dealers', 'Manage dealer network'],
  ['admin/dealers', 'DealerDetailPage', 'Dealer Detail', 'Dealer profile and performance'],
  ['admin/dealers', 'DealerOnboardingPage', 'Dealer Onboarding', 'Onboard a new dealer'],
  ['admin/employees', 'EmployeeListPage', 'Employees', 'Manage company employees'],
  ['admin/employees', 'EmployeeDetailPage', 'Employee Detail', 'Employee profile and roles'],
  ['admin/settings', 'SettingsPage', 'Settings', 'System configuration'],
  ['admin/settings', 'GeneralSettingsPage', 'General Settings', 'Company information'],
  ['admin/settings', 'GstSettingsPage', 'GST Settings', 'GST configuration'],
  ['admin/settings', 'NotificationSettingsPage', 'Notification Settings', 'Notification preferences'],
  ['admin/audit-logs', 'AuditLogPage', 'Audit Logs', 'System activity history'],
  ['dealer', 'DealerDashboardPage', 'Dashboard', 'Dealer performance overview'],
  ['dealer/inventory', 'DealerInventoryListPage', 'Inventory', 'Your stock levels'],
  ['dealer/inventory', 'DealerInventoryDetailPage', 'Product Detail', 'Product stock information'],
  ['dealer/billing', 'BillingListPage', 'Billing', 'Manage bills and invoices'],
  ['dealer/billing', 'BillingNewPage', 'New Bill', 'Create a new bill'],
  ['dealer/billing', 'BillingDetailPage', 'Bill Detail', 'View bill details'],
  ['dealer/invoices', 'InvoiceListPage', 'Invoices', 'View sent invoices'],
  ['dealer/invoices', 'InvoiceDetailPage', 'Invoice Detail', 'Invoice details and PDF'],
  ['dealer/warranty', 'WarrantyListPage', 'Warranty', 'Warranty registrations'],
  ['dealer/warranty', 'WarrantyDetailPage', 'Warranty Detail', 'Warranty claim history'],
  ['dealer/team', 'TeamListPage', 'Team', 'Sales team members'],
  ['dealer/team', 'TeamPerformancePage', 'Team Performance', 'Sales performance metrics'],
  ['employee', 'EmployeeDashboardPage', 'Dashboard', 'Your tasks and updates'],
  ['employee/tasks', 'TaskListPage', 'Tasks', 'Your assigned tasks'],
  ['employee/tasks', 'TaskDetailPage', 'Task Detail', 'Task information'],
  ['employee/reports', 'ReportListPage', 'Reports', 'View and submit reports'],
  ['employee/reports', 'ReportDetailPage', 'Report Detail', 'Report details'],
  ['employee/team', 'TeamDashboardPage', 'Team', 'Team overview and metrics'],
  ['employee/approvals', 'ApprovalListPage', 'Approvals', 'Pending approval requests'],
  ['employee/approvals', 'ApprovalDetailPage', 'Approval Detail', 'Review approval request'],
  ['service', 'ServiceDashboardPage', 'Dashboard', 'Service metrics and alerts'],
  ['service/complaints', 'ComplaintListPage', 'Complaints', 'Manage customer complaints'],
  ['service/complaints', 'ComplaintNewPage', 'New Complaint', 'File a new complaint'],
  ['service/complaints', 'ComplaintDetailPage', 'Complaint Detail', 'Complaint timeline and resolution'],
  ['service/spare-parts', 'SparePartsListPage', 'Spare Parts', 'Spare parts inventory'],
  ['service/spare-parts', 'SparePartsDetailPage', 'Spare Part Detail', 'Part availability'],
  ['service/defective-returns', 'DefectiveReturnsListPage', 'Defective Returns', 'Manage returns'],
  ['service/defective-returns', 'DefectiveReturnsDetailPage', 'Return Detail', 'Return inspection'],
  ['customer', 'CustomerDashboardPage', 'Dashboard', 'Your orders and warranties'],
  ['customer/orders', 'OrderListPage', 'Orders', 'Track your orders'],
  ['customer/orders', 'OrderDetailPage', 'Order Detail', 'Order tracking'],
  ['customer/warranty', 'CustomerWarrantyListPage', 'Warranty', 'Your warranties'],
  ['customer/warranty', 'CustomerWarrantyDetailPage', 'Warranty Detail', 'Warranty information'],
  ['customer/service-requests', 'ServiceRequestListPage', 'Service Requests', 'Your service requests'],
  ['customer/service-requests', 'ServiceRequestNewPage', 'New Request', 'Submit a service request'],
  ['customer/service-requests', 'ServiceRequestDetailPage', 'Request Detail', 'Request status'],
];

const pageTemplate = (name, title, subtitle) => `import { PageShell } from '@/components/layout/PageShell';

export default function ${name}() {
  return <PageShell title="${title}" subtitle="${subtitle}" />;
}
`;

for (const [dir, name, title, subtitle] of pages) {
  const dirPath = path.join(root, dir);
  fs.mkdirSync(dirPath, { recursive: true });
  fs.writeFileSync(path.join(dirPath, `${name}.jsx`), pageTemplate(name, title, subtitle));
}

// Auth pages
const authPages = [
  ['LoginPage', 'login'],
  ['ForgotPasswordPage', 'forgot'],
  ['ResetPasswordPage', 'reset'],
  ['SessionExpiredPage', 'session-expired'],
];

const authDir = path.join(root, 'auth');
fs.mkdirSync(authDir, { recursive: true });

for (const [name] of authPages) {
  if (name === 'LoginPage') {
    fs.writeFileSync(path.join(authDir, `${name}.jsx`), `import { LoginForm } from '@/components/auth/LoginForm';

export default function LoginPage() {
  return <LoginForm />;
}
`);
  } else if (name === 'SessionExpiredPage') {
    fs.writeFileSync(path.join(authDir, `${name}.jsx`), `import { Link } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import { MESSAGES } from '@/constants/messages';
import { Button } from '@/components/ui/button';

export default function SessionExpiredPage() {
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <h1 className="text-2xl font-semibold">Session Expired</h1>
      <p className="text-[var(--color-text-secondary)]">{MESSAGES.SESSION_EXPIRED}</p>
      <Button asChild><Link to={ROUTES.AUTH_LOGIN}>Log back in</Link></Button>
    </div>
  );
}
`);
  } else {
    fs.writeFileSync(path.join(authDir, `${name}.jsx`), `export default function ${name}() {
  return <div className="text-center"><h1 className="text-xl font-semibold">${name.replace('Page', '')}</h1></div>;
}
`);
  }
}

// Shared error pages
const sharedPages = path.join(__dirname, '..', 'src', 'pages', 'shared');
fs.mkdirSync(sharedPages, { recursive: true });

['UnauthorizedPage', 'NotFoundPage', 'MaintenancePage', 'ServerErrorPage'].forEach((name) => {
  const title = name.replace('Page', '').replace(/([A-Z])/g, ' $1').trim();
  fs.writeFileSync(path.join(sharedPages, `${name}.jsx`), `import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function ${name}() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <h1 className="text-2xl font-semibold">${title}</h1>
      <Button asChild><Link to="/">Go Home</Link></Button>
    </div>
  );
}
`);
});

console.log(`Generated ${pages.length + authPages.length + 4} pages`);
