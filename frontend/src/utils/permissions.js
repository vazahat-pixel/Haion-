/** Permission evaluation helpers (used by permission.store + guards). */

export function evaluatePermission(permissions, key) {
  return permissions.has(key);
}

export function evaluateAnyPermission(permissions, keys) {
  return keys.some((key) => permissions.has(key));
}

export function evaluateAllPermissions(permissions, keys) {
  return keys.every((key) => permissions.has(key));
}
