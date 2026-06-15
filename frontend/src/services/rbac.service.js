import client from './api/client';

export const rbacService = {
  getPermissions: async () => (await client.get('/rbac/permissions')).normalized.data,
  getRoles: async () => (await client.get('/rbac/roles')).normalized.data,
  getRole: async (code) => (await client.get(`/rbac/roles/${code}`)).normalized.data,
  updateRolePermissions: async (code, permissions) =>
    (await client.patch(`/rbac/roles/${code}/permissions`, { permissions })).normalized.data,
};
