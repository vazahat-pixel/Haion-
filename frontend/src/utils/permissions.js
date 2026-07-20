/** Permission evaluation helpers (used by permission.store + guards). */

function asSet(permissions) {
  if (!permissions) return new Set();
  if (permissions instanceof Set) return permissions;
  if (Array.isArray(permissions)) return new Set(permissions);
  return new Set();
}

export function evaluatePermission(permissions, key) {
  return asSet(permissions).has(key);
}

export function evaluateAnyPermission(permissions, keys) {
  const set = asSet(permissions);
  return keys.some((key) => set.has(key));
}

export function evaluateAllPermissions(permissions, keys) {
  const set = asSet(permissions);
  return keys.every((key) => set.has(key));
}
