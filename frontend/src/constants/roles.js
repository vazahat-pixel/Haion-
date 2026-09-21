export const ROLES = {
  MASTER_ADMIN: 'MASTER_ADMIN',
  CEO: 'CEO',
  NSM: 'NSM',
  STATE_HEAD: 'STATE_HEAD',
  ASM: 'ASM',
  STORE_MANAGER: 'STORE_MANAGER',
  WAREHOUSE_MANAGER: 'WAREHOUSE_MANAGER',
  DEALER_ADMIN: 'DEALER_ADMIN',
  DEALER_SALES: 'DEALER_SALES',
  EMPLOYEE: 'EMPLOYEE',
  MANAGER: 'MANAGER',
  CUSTOMER_SUPPORT: 'CUSTOMER_SUPPORT',
  SERVICE_CENTER: 'SERVICE_CENTER',
  CUSTOMER: 'CUSTOMER',
};

export const ROLE_PANEL_MAP = {
  [ROLES.MASTER_ADMIN]: 'admin',
  [ROLES.CEO]: 'admin',
  [ROLES.NSM]: 'admin',
  [ROLES.STATE_HEAD]: 'admin',
  [ROLES.ASM]: 'admin',
  [ROLES.STORE_MANAGER]: 'dealer',
  [ROLES.WAREHOUSE_MANAGER]: 'admin',
  [ROLES.DEALER_ADMIN]: 'dealer',
  [ROLES.DEALER_SALES]: 'dealer',
  [ROLES.EMPLOYEE]: 'employee',
  [ROLES.MANAGER]: 'employee',
  [ROLES.CUSTOMER_SUPPORT]: 'service',
  [ROLES.SERVICE_CENTER]: 'service',
  [ROLES.CUSTOMER]: 'customer',
};

export const ROLE_HOME_ROUTE = {
  [ROLES.MASTER_ADMIN]: '/admin/dashboard',
  [ROLES.CEO]: '/admin/dashboard',
  [ROLES.NSM]: '/admin/dashboard',
  [ROLES.STATE_HEAD]: '/admin/dashboard',
  [ROLES.ASM]: '/admin/dashboard',
  [ROLES.STORE_MANAGER]: '/dealer/dashboard',
  [ROLES.WAREHOUSE_MANAGER]: '/admin/warehouses',
  [ROLES.DEALER_ADMIN]: '/dealer/dashboard',
  [ROLES.DEALER_SALES]: '/dealer/sales/quick',
  [ROLES.EMPLOYEE]: '/employee/dashboard',
  [ROLES.MANAGER]: '/employee/dashboard',
  [ROLES.CUSTOMER_SUPPORT]: '/service/dashboard',
  [ROLES.SERVICE_CENTER]: '/service/walkin',
  [ROLES.CUSTOMER]: '/customer/dashboard',
};

// Organizational hierarchy verticals
export const VERTICALS = {
  SALES_PRODUCTION: 'SALES_PRODUCTION',
  FINANCE: 'FINANCE',
  PRODUCTION_MARKETING: 'PRODUCTION_MARKETING',
};

export const VERTICAL_LABELS = {
  SALES_PRODUCTION: 'Sales & Production',
  FINANCE: 'Finance',
  PRODUCTION_MARKETING: 'Production & Marketing',
};

export const SUB_VERTICALS = {
  SALES: 'SALES',
  SERVICE: 'SERVICE',
};

export const SUB_VERTICAL_LABELS = {
  SALES: 'Sales',
  SERVICE: 'Service',
};

export const HIERARCHY_LEVELS = ['CEO', 'NSM', 'STATE_HEAD', 'ASM', 'STORE_MANAGER'];

export const HIERARCHY_LEVEL_LABELS = {
  CEO: 'CEO',
  NSM: 'National Sales Manager (NSM)',
  STATE_HEAD: 'State Head',
  ASM: 'Area Sales Manager (ASM)',
  STORE_MANAGER: 'Store Manager',
};

export const ROLE_LABELS = {
  MASTER_ADMIN: 'Master Admin',
  CEO: 'CEO',
  NSM: 'National Sales Manager',
  STATE_HEAD: 'State Head',
  ASM: 'Area Sales Manager',
  STORE_MANAGER: 'Store Manager',
  WAREHOUSE_MANAGER: 'Warehouse Manager',
  DEALER_ADMIN: 'Dealer Admin',
  DEALER_SALES: 'Dealer Sales',
  EMPLOYEE: 'Field Employee',
  MANAGER: 'Sales Manager',
  CUSTOMER_SUPPORT: 'Customer Support',
  SERVICE_CENTER: 'Service Center',
  CUSTOMER: 'Customer',
};

