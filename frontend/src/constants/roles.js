export const ROLES = {
  MASTER_ADMIN: 'MASTER_ADMIN',
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
  [ROLES.WAREHOUSE_MANAGER]: '/admin/warehouses',
  [ROLES.DEALER_ADMIN]: '/dealer/dashboard',
  [ROLES.DEALER_SALES]: '/dealer/inventory',
  [ROLES.EMPLOYEE]: '/employee/dashboard',
  [ROLES.MANAGER]: '/employee/dashboard',
  [ROLES.CUSTOMER_SUPPORT]: '/service/dashboard',
  [ROLES.SERVICE_CENTER]: '/service/complaints',
  [ROLES.CUSTOMER]: '/customer/dashboard',
};
