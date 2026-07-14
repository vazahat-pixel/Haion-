import {
  LayoutDashboard,
  Warehouse,
  Truck,
  Package,
  ArrowLeftRight,
  Users,
  UserCog,
  Settings,
  ScrollText,
  Receipt,
  FileText,
  Shield,
  ClipboardList,
  BarChart3,
  CheckSquare,
  Headphones,
  Wrench,
  RotateCcw,
  ShoppingBag,
  Boxes,
  Tags,
  Award,
  Layers,
  IndianRupee,
  Wallet,
  Bell,
  ClipboardCheck,
  Target,
  Globe,
  Contact,
  ShoppingCart,
} from 'lucide-react';
import { PERMISSIONS } from '@/constants/permissions';
import { ROLES } from '@/constants/roles';
import { ROUTES } from '@/constants/routes';
import { env } from '@/config/env';

export const PANELS = {
  admin: {
    id: 'admin',
    label: 'Admin Console',
    roles: [ROLES.MASTER_ADMIN, ROLES.WAREHOUSE_MANAGER],
    baseRoute: '/admin',
    nav: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: ROUTES.ADMIN_DASHBOARD, permission: PERMISSIONS.ANALYTICS_READ },
      { id: 'items', label: 'Items', icon: Boxes, path: ROUTES.ADMIN_PRODUCTS, permission: PERMISSIONS.PRODUCTS_READ, roles: [ROLES.MASTER_ADMIN] },
      { id: 'parties', label: 'Parties', icon: Contact, path: ROUTES.ADMIN_PARTIES, permission: PERMISSIONS.PARTIES_READ },
      { id: 'purchases', label: 'Purchases', icon: ShoppingCart, path: ROUTES.ADMIN_PURCHASES, permission: PERMISSIONS.PURCHASES_READ },
      { id: 'categories', label: 'Categories', icon: Tags, path: ROUTES.ADMIN_CATEGORIES, permission: PERMISSIONS.CATEGORIES_READ, roles: [ROLES.MASTER_ADMIN] },
      { id: 'brands', label: 'Brands', icon: Award, path: ROUTES.ADMIN_BRANDS, permission: PERMISSIONS.BRANDS_READ, roles: [ROLES.MASTER_ADMIN] },
      { id: 'tiers', label: 'Product Tiers', icon: Layers, path: ROUTES.ADMIN_PRODUCT_TIERS, permission: PERMISSIONS.PRICING_READ, roles: [ROLES.MASTER_ADMIN] },
      { id: 'pricing', label: 'Pricing', icon: IndianRupee, path: ROUTES.ADMIN_PRICING, permission: PERMISSIONS.PRICING_READ, roles: [ROLES.MASTER_ADMIN] },
      { id: 'warehouses', label: 'Warehouses', icon: Warehouse, path: ROUTES.ADMIN_WAREHOUSES, permission: PERMISSIONS.WAREHOUSES_READ },
      { id: 'grn', label: 'GRN Monitoring', icon: ClipboardCheck, path: ROUTES.ADMIN_GRN, permission: PERMISSIONS.GRN_READ, badgeKey: 'grn.pending' },
      { id: 'dispatch', label: 'Dispatch', icon: Truck, path: ROUTES.ADMIN_DISPATCH, permission: PERMISSIONS.DISPATCH_READ, badgeKey: 'dispatch.pending' },
      { id: 'inventory', label: 'Inventory', icon: Package, path: ROUTES.ADMIN_INVENTORY, permission: PERMISSIONS.INVENTORY_READ, badgeKey: 'inventory.lowStock' },
      { id: 'stock-movements', label: 'Stock Movements', icon: ArrowLeftRight, path: ROUTES.ADMIN_STOCK_MOVEMENTS, permission: PERMISSIONS.INVENTORY_READ },
      { id: 'dealers', label: 'Dealers', icon: Users, path: ROUTES.ADMIN_DEALERS, permission: PERMISSIONS.DEALERS_READ, roles: [ROLES.MASTER_ADMIN] },
      { id: 'employees', label: 'Employees', icon: UserCog, path: ROUTES.ADMIN_EMPLOYEES, permission: PERMISSIONS.EMPLOYEES_READ, roles: [ROLES.MASTER_ADMIN] },
      { id: 'approvals', label: 'Approvals', icon: ClipboardList, path: ROUTES.ADMIN_APPROVALS, permission: PERMISSIONS.APPROVALS_READ, roles: [ROLES.MASTER_ADMIN], badgeKey: 'approvals.pending' },
      { id: 'expenses', label: 'Expenses', icon: Wallet, path: ROUTES.ADMIN_EXPENSES, permission: PERMISSIONS.EXPENSES_READ, roles: [ROLES.MASTER_ADMIN] },
      { id: 'reports', label: 'Reports', icon: BarChart3, path: ROUTES.ADMIN_REPORTS, permission: PERMISSIONS.REPORTS_READ, roles: [ROLES.MASTER_ADMIN] },
      { id: 'notifications', label: 'Notifications', icon: Bell, path: ROUTES.ADMIN_NOTIFICATIONS, permission: PERMISSIONS.NOTIFICATIONS_READ, roles: [ROLES.MASTER_ADMIN] },
      { id: 'settings', label: 'Settings', icon: Settings, path: ROUTES.ADMIN_SETTINGS, permission: PERMISSIONS.SETTINGS_READ, roles: [ROLES.MASTER_ADMIN] },
      { id: 'audit', label: 'Audit Logs', icon: ScrollText, path: ROUTES.ADMIN_AUDIT_LOGS, permission: PERMISSIONS.AUDIT_READ, roles: [ROLES.MASTER_ADMIN] },
      { id: 'cms', label: 'Website CMS', icon: Globe, path: ROUTES.ADMIN_CMS, permission: PERMISSIONS.CMS_READ, roles: [ROLES.MASTER_ADMIN] },
      { id: 'store-orders', label: 'Website Orders', icon: ShoppingBag, path: ROUTES.ADMIN_STORE_ORDERS, permission: PERMISSIONS.STORE_ORDERS_READ, roles: [ROLES.MASTER_ADMIN] },
    ],
  },
  dealer: {
    id: 'dealer',
    label: 'Dealer Workspace',
    roles: [ROLES.DEALER_ADMIN, ROLES.DEALER_SALES],
    baseRoute: '/dealer',
    nav: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: ROUTES.DEALER_DASHBOARD, permission: PERMISSIONS.DEALER_DASHBOARD, roles: [ROLES.DEALER_ADMIN] },
      { id: 'quick-sale', label: 'Quick Sale', icon: Receipt, path: ROUTES.DEALER_SALES_QUICK, permission: PERMISSIONS.BILLING_CREATE },
      { id: 'dispatches', label: 'Dispatches', icon: Truck, path: ROUTES.DEALER_DISPATCHES, permission: PERMISSIONS.DEALER_DISPATCH_READ, badgeKey: 'dispatch.pending' },
      { id: 'grn', label: 'GRN', icon: ClipboardCheck, path: ROUTES.DEALER_GRN, permission: PERMISSIONS.DEALER_GRN_READ, badgeKey: 'grn.pending' },
      { id: 'inventory', label: 'Inventory', icon: Package, path: ROUTES.DEALER_INVENTORY, permission: PERMISSIONS.DEALER_INVENTORY_READ },
      { id: 'customers', label: 'Customers', icon: Users, path: ROUTES.DEALER_CUSTOMERS, permission: PERMISSIONS.DEALER_CUSTOMERS_READ },
      { id: 'billing', label: 'Billing', icon: Receipt, path: ROUTES.DEALER_BILLING, permission: PERMISSIONS.BILLING_READ },
      { id: 'invoices', label: 'Invoices', icon: FileText, path: ROUTES.DEALER_INVOICES, permission: PERMISSIONS.INVOICES_READ },
      { id: 'warranty', label: 'Warranty', icon: Shield, path: ROUTES.DEALER_WARRANTY, permission: PERMISSIONS.WARRANTY_READ },
      { id: 'reports', label: 'Reports', icon: BarChart3, path: ROUTES.DEALER_REPORTS, permission: PERMISSIONS.DEALER_REPORTS_READ },
      { id: 'team', label: 'Team', icon: UserCog, path: ROUTES.DEALER_TEAM, permission: PERMISSIONS.DEALER_TEAM_READ, roles: [ROLES.DEALER_ADMIN] },
    ],
  },
  employee: {
    id: 'employee',
    label: 'Employee Hub',
    roles: [ROLES.EMPLOYEE, ROLES.MANAGER],
    baseRoute: '/employee',
    nav: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: ROUTES.EMPLOYEE_DASHBOARD },
      { id: 'dealers', label: 'Assigned Dealers', icon: Users, path: ROUTES.EMPLOYEE_DEALERS, permission: PERMISSIONS.EMPLOYEE_DEALERS_READ },
      { id: 'analytics', label: 'Dealer Analytics', icon: BarChart3, path: ROUTES.EMPLOYEE_DEALER_ANALYTICS, permission: PERMISSIONS.EMPLOYEE_ANALYTICS_READ },
      { id: 'performance', label: 'Performance', icon: Target, path: ROUTES.EMPLOYEE_PERFORMANCE, permission: PERMISSIONS.EMPLOYEE_PERFORMANCE_READ },
      { id: 'tasks', label: 'Tasks', icon: CheckSquare, path: ROUTES.EMPLOYEE_TASKS, permission: PERMISSIONS.TASKS_READ, badgeKey: 'tasks.pending' },
      { id: 'reports', label: 'Reports', icon: FileText, path: ROUTES.EMPLOYEE_REPORTS, permission: PERMISSIONS.REPORTS_READ },
      { id: 'team', label: 'Team', icon: UserCog, path: ROUTES.EMPLOYEE_TEAM, permission: PERMISSIONS.TEAM_READ, roles: [ROLES.MANAGER] },
      { id: 'approvals', label: 'Approvals', icon: ClipboardList, path: ROUTES.EMPLOYEE_APPROVALS, permission: PERMISSIONS.APPROVALS_READ, roles: [ROLES.MANAGER], badgeKey: 'approvals.pending' },
    ],
  },
  service: {
    id: 'service',
    label: 'Service Console',
    roles: [ROLES.CUSTOMER_SUPPORT, ROLES.SERVICE_CENTER],
    baseRoute: '/service',
    nav: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: ROUTES.SERVICE_DASHBOARD, permission: PERMISSIONS.SERVICE_DASHBOARD },
      { id: 'tickets', label: 'Service Tickets', icon: Headphones, path: ROUTES.SERVICE_TICKETS, permission: PERMISSIONS.SERVICE_REQUESTS_READ },
      { id: 'complaints', label: 'Complaints', icon: Headphones, path: ROUTES.SERVICE_COMPLAINTS, permission: PERMISSIONS.COMPLAINTS_READ, badgeKey: 'complaints.open', roles: [ROLES.CUSTOMER_SUPPORT] },
      { id: 'spares', label: 'Spare Parts', icon: Wrench, path: ROUTES.SERVICE_SPARE_PARTS, permission: PERMISSIONS.SPARES_READ, roles: [ROLES.SERVICE_CENTER] },
      { id: 'returns', label: 'Defective Returns', icon: RotateCcw, path: ROUTES.SERVICE_DEFECTIVE_RETURNS, permission: PERMISSIONS.RETURNS_READ, roles: [ROLES.SERVICE_CENTER] },
    ],
  },
  customer: {
    id: 'customer',
    label: 'Customer Portal',
    roles: [ROLES.CUSTOMER],
    baseRoute: '/customer',
    nav: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: ROUTES.CUSTOMER_DASHBOARD },
      { id: 'products', label: 'My Products', icon: Package, path: ROUTES.CUSTOMER_PRODUCTS },
      { id: 'warranty', label: 'Warranty', icon: Shield, path: ROUTES.CUSTOMER_WARRANTY, permission: PERMISSIONS.WARRANTY_READ },
      { id: 'service', label: 'Service Requests', icon: Headphones, path: ROUTES.CUSTOMER_SERVICE_REQUESTS, permission: PERMISSIONS.SERVICE_REQUESTS_READ },
      { id: 'orders', label: 'Orders', icon: ShoppingBag, path: ROUTES.CUSTOMER_ORDERS, permission: PERMISSIONS.ORDERS_READ },
    ],
  },
};

export function getPanelForRole(role) {
  return Object.values(PANELS).find((p) => p.roles.includes(role)) || null;
}

export function getNavForPanel(panelId, role, hasPermission) {
  const panel = PANELS[panelId];
  if (!panel) return [];

  const bypass = role === ROLES.MASTER_ADMIN || (env.useMockApi && env.isDev);

  return panel.nav.filter((item) => {
    if (!bypass) {
      if (item.roles && !item.roles.includes(role)) return false;
      if (item.permission && !hasPermission(item.permission)) return false;
    }
    return true;
  });
}
