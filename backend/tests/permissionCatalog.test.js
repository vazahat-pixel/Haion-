import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PERMISSION_CATALOG } from '../src/config/permissionCatalog.js';
import { ROLE_PERMISSIONS } from '../src/config/rolePermissions.js';

test('permission catalog has unique keys', () => {
  const keys = PERMISSION_CATALOG.map((p) => p.key);
  assert.equal(keys.length, new Set(keys).size);
});

test('MASTER_ADMIN has rbac permissions', () => {
  const admin = ROLE_PERMISSIONS.MASTER_ADMIN || [];
  assert.ok(admin.includes('rbac.read'));
  assert.ok(admin.includes('rbac.update'));
});

test('every role permission exists in catalog', () => {
  const catalogKeys = new Set(PERMISSION_CATALOG.map((p) => p.key));
  for (const [role, perms] of Object.entries(ROLE_PERMISSIONS)) {
    for (const p of perms) {
      assert.ok(catalogKeys.has(p), `${role} references unknown permission: ${p}`);
    }
  }
});
