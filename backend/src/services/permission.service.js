import Role from '../models/Role.model.js';
import { ROLE_PERMISSIONS } from '../config/rolePermissions.js';

let cache = null;
let cacheAt = 0;
const TTL_MS = 30_000;

export async function loadPermissionCache() {
  if (cache && Date.now() - cacheAt < TTL_MS) return cache;

  const merged = { ...ROLE_PERMISSIONS };
  try {
    const roles = await Role.find().lean();
    for (const role of roles) {
      merged[role.code] = role.permissions;
    }
  } catch {
    // DB unavailable — static fallback only
  }

  cache = merged;
  cacheAt = Date.now();
  return cache;
}

export function invalidatePermissionCache() {
  cache = null;
  cacheAt = 0;
}

export async function getPermissionsForRole(roleCode) {
  const map = await loadPermissionCache();
  return map[roleCode] || ROLE_PERMISSIONS[roleCode] || [];
}

export async function userHasPermissions(roleCode, permissions, mode = 'every') {
  const userPerms = await getPermissionsForRole(roleCode);
  if (mode === 'some') {
    return permissions.some((p) => userPerms.includes(p));
  }
  return permissions.every((p) => userPerms.includes(p));
}
