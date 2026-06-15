import client from './api/client';
import { endpoints } from './api/endpoints';
import { ROLE_PERMISSIONS } from '@/config/permissions.config';
import { env } from '@/config/env';

const DEV_USERS = {
  'admin@haion.com': {
    id: '1', name: 'Master Admin', email: 'admin@haion.com', avatar: null,
    role: 'MASTER_ADMIN', permissions: ROLE_PERMISSIONS.MASTER_ADMIN, dealerId: null, warehouseId: null,
  },
  'warehouse@haion.com': {
    id: '2', name: 'Ravi Kumar', email: 'warehouse@haion.com', avatar: null,
    role: 'WAREHOUSE_MANAGER', permissions: ROLE_PERMISSIONS.WAREHOUSE_MANAGER, dealerId: null, warehouseId: 'wh1',
  },
  'dealer@haion.com': {
    id: '3', name: 'Dealer Admin', email: 'dealer@haion.com', avatar: null,
    role: 'DEALER_ADMIN', permissions: ROLE_PERMISSIONS.DEALER_ADMIN, dealerId: 'd1', warehouseId: null,
  },
  'sales@haion.com': {
    id: '4', name: 'Dealer Sales', email: 'sales@haion.com', avatar: null,
    role: 'DEALER_SALES', permissions: ROLE_PERMISSIONS.DEALER_SALES, dealerId: 'd1', warehouseId: null,
  },
  'employee@haion.com': {
    id: '5', name: 'Sneha Reddy', email: 'employee@haion.com', avatar: null,
    role: 'EMPLOYEE', permissions: ROLE_PERMISSIONS.EMPLOYEE, dealerId: null, warehouseId: null,
  },
  'manager@haion.com': {
    id: '6', name: 'Arjun Mehta', email: 'manager@haion.com', avatar: null,
    role: 'MANAGER', permissions: ROLE_PERMISSIONS.MANAGER, dealerId: null, warehouseId: null,
  },
  'support@haion.com': {
    id: '7', name: 'Support Agent', email: 'support@haion.com', avatar: null,
    role: 'CUSTOMER_SUPPORT', permissions: ROLE_PERMISSIONS.CUSTOMER_SUPPORT, dealerId: null, warehouseId: null,
  },
  'service@haion.com': {
    id: '8', name: 'Service Center', email: 'service@haion.com', avatar: null,
    role: 'SERVICE_CENTER', permissions: ROLE_PERMISSIONS.SERVICE_CENTER, dealerId: null, warehouseId: null,
  },
  'customer@haion.com': {
    id: '9', name: 'Rajesh Singh', email: 'customer@haion.com', avatar: null,
    role: 'CUSTOMER', permissions: ROLE_PERMISSIONS.CUSTOMER, dealerId: null, warehouseId: null,
  },
};

function devLogin(credentials) {
  const user = DEV_USERS[credentials.email];
  if (!user || credentials.password !== 'password') {
    const err = new Error('Invalid credentials');
    err.response = { data: { message: 'Invalid email or password.' } };
    throw err;
  }
  return { user, accessToken: `dev-token-${user.id}` };
}

export const authService = {
  async login(credentials) {
    if (env.useMockApi) return devLogin(credentials);
    const res = await client.post(endpoints.auth.login, credentials);
    return res.normalized.data;
  },

  async logout() {
    if (env.useMockApi) return;
    try {
      await client.post(endpoints.auth.logout);
    } catch {
      // Ignore logout errors
    }
  },

  async refresh() {
    if (env.useMockApi) return null;
    try {
      const res = await client.post(endpoints.auth.refresh);
      return res.normalized.data;
    } catch {
      return null;
    }
  },

  async forgotPassword(email) {
    if (env.useMockApi) return { message: 'Reset link sent (mock)' };
    const res = await client.post(endpoints.auth.forgotPassword, { email });
    return res.normalized.data;
  },

  async resetPassword(data) {
    if (env.useMockApi) return { message: 'Password reset (mock)' };
    const res = await client.post(endpoints.auth.resetPassword, data);
    return res.normalized.data;
  },

  async getMe() {
    if (env.useMockApi) return null;
    const res = await client.get(endpoints.auth.me);
    return res.normalized.data;
  },
};
