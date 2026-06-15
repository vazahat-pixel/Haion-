/** Decorative SVG assets for admin module pages */

export function AdminPageMesh({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 600 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="adminMeshA" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="var(--color-brand-500)" stopOpacity="0.14" />
          <stop offset="100%" stopColor="var(--color-brand-500)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <circle cx="520" cy="20" r="80" fill="url(#adminMeshA)" />
      <circle cx="60" cy="100" r="50" fill="var(--color-brand-500)" fillOpacity="0.06" />
      <path d="M0 70 Q150 50 300 65 T600 55" stroke="var(--color-brand-500)" strokeOpacity="0.07" strokeWidth="1.2" fill="none" />
    </svg>
  );
}

function moduleIcon(viewBox, children) {
  return function ModuleIcon({ className = 'h-7 w-7' }) {
    return (
      <svg className={className} viewBox={viewBox} fill="none" aria-hidden>
        {children}
      </svg>
    );
  };
}

export const ProductsModuleIcon = moduleIcon('0 0 28 28', (
  <>
    <rect x="4" y="6" width="20" height="16" rx="3" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.4" />
    <path d="M9 12h10M9 16h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </>
));

export const CategoriesModuleIcon = moduleIcon('0 0 28 28', (
  <>
    <path d="M6 10h16M6 14h12M6 18h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    <rect x="4" y="5" width="20" height="18" rx="3" stroke="currentColor" strokeWidth="1.4" fill="currentColor" fillOpacity="0.1" />
  </>
));

export const BrandsModuleIcon = moduleIcon('0 0 28 28', (
  <>
    <circle cx="14" cy="14" r="9" fill="currentColor" fillOpacity="0.12" stroke="currentColor" strokeWidth="1.4" />
    <path d="M10 14l3 3 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </>
));

export const TiersModuleIcon = moduleIcon('0 0 28 28', (
  <>
    <rect x="5" y="16" width="18" height="5" rx="1.5" fill="currentColor" fillOpacity="0.2" />
    <rect x="7" y="11" width="14" height="5" rx="1.5" fill="currentColor" fillOpacity="0.35" />
    <rect x="9" y="6" width="10" height="5" rx="1.5" fill="currentColor" fillOpacity="0.5" />
  </>
));

export const PricingModuleIcon = moduleIcon('0 0 28 28', (
  <>
    <circle cx="14" cy="14" r="9" stroke="currentColor" strokeWidth="1.4" fill="currentColor" fillOpacity="0.1" />
    <path d="M14 9v10M11 12h4a2 2 0 110 4h-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </>
));

export const WarehouseModuleIcon = moduleIcon('0 0 28 28', (
  <>
    <path d="M4 12l10-6 10 6v10H4V12z" fill="currentColor" fillOpacity="0.12" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    <rect x="11" y="15" width="6" height="7" rx="1" fill="currentColor" fillOpacity="0.35" />
  </>
));

export const GrnModuleIcon = moduleIcon('0 0 28 28', (
  <>
    <rect x="5" y="8" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.4" fill="currentColor" fillOpacity="0.1" />
    <path d="M9 14l4 4 7-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </>
));

export const DispatchModuleIcon = moduleIcon('0 0 28 28', (
  <>
    <rect x="4" y="10" width="14" height="10" rx="2" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.3" />
    <path d="M18 13h4l2 3v4h-6V13z" fill="currentColor" fillOpacity="0.25" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    <circle cx="9" cy="22" r="2" fill="currentColor" fillOpacity="0.5" />
    <circle cx="21" cy="22" r="2" fill="currentColor" fillOpacity="0.5" />
  </>
));

export const InventoryModuleIcon = moduleIcon('0 0 28 28', (
  <>
    <rect x="6" y="6" width="16" height="16" rx="3" stroke="currentColor" strokeWidth="1.4" fill="currentColor" fillOpacity="0.1" />
    <rect x="9" y="10" width="5" height="4" rx="1" fill="currentColor" fillOpacity="0.35" />
    <rect x="16" y="10" width="5" height="4" rx="1" fill="currentColor" fillOpacity="0.35" />
    <rect x="9" y="16" width="12" height="3" rx="1" fill="currentColor" fillOpacity="0.25" />
  </>
));

export const DealersModuleIcon = moduleIcon('0 0 28 28', (
  <>
    <circle cx="11" cy="12" r="3.5" fill="currentColor" fillOpacity="0.3" />
    <circle cx="18" cy="13" r="2.5" fill="currentColor" fillOpacity="0.2" />
    <path d="M6 22c0-2.8 2.2-5 5-5s5 2.2 5 5M15 22c0-2 1.5-3.5 3.5-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </>
));

export const EmployeesModuleIcon = moduleIcon('0 0 28 28', (
  <>
    <circle cx="14" cy="10" r="4" fill="currentColor" fillOpacity="0.25" stroke="currentColor" strokeWidth="1.3" />
    <path d="M7 23c0-3.9 3.1-7 7-7s7 3.1 7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </>
));

export const ApprovalsModuleIcon = moduleIcon('0 0 28 28', (
  <>
    <rect x="6" y="5" width="16" height="18" rx="3" stroke="currentColor" strokeWidth="1.4" fill="currentColor" fillOpacity="0.1" />
    <path d="M10 13l3 3 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M10 19h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
  </>
));

export const ExpensesModuleIcon = moduleIcon('0 0 28 28', (
  <>
    <rect x="5" y="7" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.4" fill="currentColor" fillOpacity="0.1" />
    <path d="M9 12h10M9 16h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="19" cy="11" r="2" fill="currentColor" fillOpacity="0.4" />
  </>
));

export const ReportsModuleIcon = moduleIcon('0 0 28 28', (
  <>
    <rect x="5" y="5" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.4" fill="currentColor" fillOpacity="0.1" />
    <path d="M9 18V14M13 18V11M17 18V8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </>
));

export const NotificationsModuleIcon = moduleIcon('0 0 28 28', (
  <>
    <path d="M14 6c-3.3 0-6 2.5-6 5.5v3.5l-1.5 2.5h15L20 15V11.5C20 8.5 17.3 6 14 6z" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    <path d="M12 21a2 2 0 004 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </>
));

export const SettingsModuleIcon = moduleIcon('0 0 28 28', (
  <>
    <circle cx="14" cy="14" r="4" stroke="currentColor" strokeWidth="1.4" fill="currentColor" fillOpacity="0.15" />
    <path d="M14 4v3M14 21v3M4 14h3M21 14h3M7 7l2 2M19 19l2 2M7 21l2-2M19 9l2-2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
  </>
));

export const AuditModuleIcon = moduleIcon('0 0 28 28', (
  <>
    <circle cx="14" cy="14" r="9" stroke="currentColor" strokeWidth="1.4" fill="currentColor" fillOpacity="0.08" />
    <path d="M14 8v6l4 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </>
));

export const MODULE_ICONS = {
  products: ProductsModuleIcon,
  categories: CategoriesModuleIcon,
  brands: BrandsModuleIcon,
  'product-tiers': TiersModuleIcon,
  pricing: PricingModuleIcon,
  warehouses: WarehouseModuleIcon,
  grn: GrnModuleIcon,
  dispatch: DispatchModuleIcon,
  inventory: InventoryModuleIcon,
  dealers: DealersModuleIcon,
  employees: EmployeesModuleIcon,
  approvals: ApprovalsModuleIcon,
  expenses: ExpensesModuleIcon,
  reports: ReportsModuleIcon,
  notifications: NotificationsModuleIcon,
  settings: SettingsModuleIcon,
  'audit-logs': AuditModuleIcon,
};
