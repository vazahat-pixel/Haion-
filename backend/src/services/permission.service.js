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

/** Add permissions from ROLE_PERMISSIONS that are missing in DB (e.g. after catalog updates). */
export async function syncMissingRolePermissions() {
  try {
    for (const [code, staticPermissions] of Object.entries(ROLE_PERMISSIONS)) {
      const role = await Role.findOne({ code }).lean();
      if (!role) {
        await Role.create({
          code,
          name: code.replace(/_/g, ' '),
          permissions: staticPermissions,
          isSystem: true,
        });
        continue;
      }

      const missing = staticPermissions.filter((permission) => !role.permissions.includes(permission));
      if (missing.length > 0) {
        await Role.updateOne({ code }, { $addToSet: { permissions: { $each: missing } } });
      }
    }
    invalidatePermissionCache();
  } catch (err) {
    console.warn('Role permission sync skipped:', err.message);
  }
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
