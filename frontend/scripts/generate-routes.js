import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const routesDir = path.join(__dirname, '..', 'src', 'routes');

const panels = {
  dealer: {
    roles: ['DEALER_ADMIN', 'DEALER_SALES'],
    layout: 'DealerLayout',
    skeleton: 'DealerPanelSkeleton',
    routes: [
      ['dashboard', 'DealerDashboardPage', 'PERMISSIONS.DEALER_DASHBOARD', 'DEALER_ADMIN'],
      ['inventory', 'DealerInventoryListPage'],
      ['inventory/:id', 'DealerInventoryDetailPage'],
      ['billing', 'BillingListPage'],
      ['billing/new', 'BillingNewPage', 'PERMISSIONS.BILLING_CREATE'],
      ['billing/:billId', 'BillingDetailPage'],
      ['invoices', 'InvoiceListPage'],
      ['invoices/:id', 'InvoiceDetailPage'],
      ['warranty', 'WarrantyListPage'],
      ['warranty/:id', 'WarrantyDetailPage'],
      ['team', 'TeamListPage', 'PERMISSIONS.DEALER_TEAM_READ', 'DEALER_ADMIN'],
      ['team/performance', 'TeamPerformancePage', 'PERMISSIONS.DEALER_TEAM_READ', 'DEALER_ADMIN'],
    ],
    pageBase: 'dealer',
  },
  employee: {
    roles: ['EMPLOYEE', 'MANAGER'],
    layout: 'EmployeeLayout',
    skeleton: 'EmployeePanelSkeleton',
    routes: [
      ['dashboard', 'EmployeeDashboardPage'],
      ['tasks', 'TaskListPage'],
      ['tasks/:id', 'TaskDetailPage'],
      ['reports', 'ReportListPage'],
      ['reports/:id', 'ReportDetailPage'],
      ['team', 'TeamDashboardPage', 'PERMISSIONS.TEAM_READ', 'MANAGER'],
      ['approvals', 'ApprovalListPage', 'PERMISSIONS.APPROVALS_READ', 'MANAGER'],
      ['approvals/:id', 'ApprovalDetailPage', 'PERMISSIONS.APPROVALS_READ', 'MANAGER'],
    ],
    pageBase: 'employee',
  },
  service: {
    roles: ['CUSTOMER_SUPPORT', 'SERVICE_CENTER'],
    layout: 'ServiceLayout',
    skeleton: 'ServicePanelSkeleton',
    routes: [
      ['dashboard', 'ServiceDashboardPage', 'PERMISSIONS.SERVICE_DASHBOARD', 'CUSTOMER_SUPPORT'],
      ['complaints', 'ComplaintListPage'],
      ['complaints/new', 'ComplaintNewPage', 'PERMISSIONS.COMPLAINTS_CREATE', 'CUSTOMER_SUPPORT'],
      ['complaints/:ticketId', 'ComplaintDetailPage'],
      ['spare-parts', 'SparePartsListPage', 'PERMISSIONS.SPARES_READ', 'SERVICE_CENTER'],
      ['spare-parts/:id', 'SparePartsDetailPage', 'PERMISSIONS.SPARES_READ', 'SERVICE_CENTER'],
      ['defective-returns', 'DefectiveReturnsListPage', 'PERMISSIONS.RETURNS_READ', 'SERVICE_CENTER'],
      ['defective-returns/:id', 'DefectiveReturnsDetailPage', 'PERMISSIONS.RETURNS_READ', 'SERVICE_CENTER'],
    ],
    pageBase: 'service',
  },
  customer: {
    roles: ['CUSTOMER'],
    layout: 'CustomerLayout',
    skeleton: 'CustomerPanelSkeleton',
    routes: [
      ['dashboard', 'CustomerDashboardPage'],
      ['orders', 'OrderListPage'],
      ['orders/:id', 'OrderDetailPage'],
      ['warranty', 'CustomerWarrantyListPage'],
      ['warranty/:id', 'CustomerWarrantyDetailPage'],
      ['service-requests', 'ServiceRequestListPage'],
      ['service-requests/new', 'ServiceRequestNewPage', 'PERMISSIONS.SERVICE_REQUESTS_CREATE'],
      ['service-requests/:id', 'ServiceRequestDetailPage'],
    ],
    pageBase: 'customer',
  },
};

function findPagePath(panel, pageName) {
  const base = path.join(__dirname, '..', 'src', 'pages', panel);
  const dirs = fs.readdirSync(base, { withFileTypes: true });
  for (const d of dirs) {
    if (d.isDirectory()) {
      const subPath = path.join(base, d.name, `${pageName}.jsx`);
      if (fs.existsSync(subPath)) return `@/pages/${panel}/${d.name}/${pageName}`;
    }
  }
  return `@/pages/${panel}/${pageName}`;
}

for (const [panelId, config] of Object.entries(panels)) {
  const panelDir = path.join(routesDir, panelId);
  fs.mkdirSync(panelDir, { recursive: true });

  const skeletonName = config.skeleton;
  fs.writeFileSync(path.join(panelDir, `${skeletonName}.jsx`), `import { LoadingState } from '@/components/feedback/LoadingState';

export function ${skeletonName}() {
  return <LoadingState message="Loading ${panelId} panel..." fullPage />;
}
`);

  const lazyImports = config.routes.map(([, page]) => {
    const importPath = findPagePath(config.pageBase, page);
    return `const ${page} = lazy(() => import('${importPath}'));`;
  }).join('\n');

  const routeElements = config.routes.map(([routePath, page, permission, role]) => {
    let element = `<${page} />`;
    if (permission) {
      element = `<PermissionGuard require={${permission}} redirectTo="/unauthorized">${element}</PermissionGuard>`;
    }
    return `              <Route path="${routePath}" element={${element}} />`;
  }).join('\n');

  const rolesConst = `[${config.roles.map((r) => `ROLES.${r}`).join(', ')}]`;

  const panelName = panelId.charAt(0).toUpperCase() + panelId.slice(1);

  const content = `import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ${config.layout} from '@/layouts/${config.layout}';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { PanelGuard } from '@/components/auth/PanelGuard';
import { PermissionGuard } from '@/components/auth/PermissionGuard';
import { ROLES } from '@/constants/roles';
import { PERMISSIONS } from '@/constants/permissions';
import { ${skeletonName} } from './${skeletonName}';

${lazyImports}

const PANEL_ROLES = ${rolesConst};

export default function ${panelName}Routes() {
  return (
    <AuthGuard>
      <PanelGuard allowedRoles={PANEL_ROLES}>
        <Suspense fallback={<${skeletonName} />}>
          <Routes>
            <Route element={<${config.layout} />}>
              <Route index element={<Navigate to="dashboard" replace />} />
${routeElements}
            </Route>
          </Routes>
        </Suspense>
      </PanelGuard>
    </AuthGuard>
  );
}
`;

  fs.writeFileSync(path.join(panelDir, `${panelId.charAt(0).toUpperCase() + panelId.slice(1)}Routes.jsx`), content);
  fs.writeFileSync(path.join(panelDir, 'index.js'), `export { default } from './${panelId.charAt(0).toUpperCase() + panelId.slice(1)}Routes';\n`);
}

console.log('Generated route files for dealer, employee, service, customer');
