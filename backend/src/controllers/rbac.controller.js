import Role from '../models/Role.model.js';
import { ROLE_PERMISSIONS } from '../config/rolePermissions.js';
import { PERMISSION_CATALOG } from '../config/permissionCatalog.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { invalidatePermissionCache, getPermissionsForRole } from '../services/permission.service.js';
import { toPublicDoc } from '../utils/serialize.util.js';
import { logAudit } from '../services/audit.service.js';

const ROLE_LABELS = {
  MASTER_ADMIN: 'Master Admin',
  WAREHOUSE_MANAGER: 'Warehouse Manager',
  DEALER_ADMIN: 'Dealer Admin',
  DEALER_SALES: 'Dealer Sales',
  EMPLOYEE: 'Field Employee',
  MANAGER: 'Sales Manager',
  CUSTOMER_SUPPORT: 'Customer Support',
  SERVICE_CENTER: 'Service Center',
  CUSTOMER: 'Customer',
};

export const listPermissions = asyncHandler(async (_req, res) => {
  return sendSuccess(res, { data: PERMISSION_CATALOG });
});

export const listRoles = asyncHandler(async (_req, res) => {
  const dbRoles = await Role.find().sort({ code: 1 }).lean();
  const dbMap = Object.fromEntries(dbRoles.map((r) => [r.code, r]));

  const data = Object.keys(ROLE_PERMISSIONS).map((code) => {
    const db = dbMap[code];
    return {
      id: db?._id ? String(db._id) : code,
      code,
      name: db?.name || ROLE_LABELS[code] || code,
      description: db?.description || '',
      permissions: db?.permissions || ROLE_PERMISSIONS[code] || [],
      isSystem: db?.isSystem ?? true,
      permissionCount: (db?.permissions || ROLE_PERMISSIONS[code] || []).length,
    };
  });

  return sendSuccess(res, { data });
});

export const getRole = asyncHandler(async (req, res) => {
  const code = req.params.code.toUpperCase();
  const db = await Role.findOne({ code }).lean();
  const permissions = await getPermissionsForRole(code);

  if (!db && !ROLE_PERMISSIONS[code]) {
    return sendError(res, { message: 'Role not found', statusCode: 404 });
  }

  return sendSuccess(res, {
    data: {
      id: db?._id ? String(db._id) : code,
      code,
      name: db?.name || ROLE_LABELS[code] || code,
      description: db?.description || '',
      permissions,
      isSystem: db?.isSystem ?? true,
    },
  });
});

export const updateRolePermissions = asyncHandler(async (req, res) => {
  const code = req.params.code.toUpperCase();
  if (!ROLE_PERMISSIONS[code]) {
    return sendError(res, { message: 'Role not found', statusCode: 404 });
  }

  const permissions = req.body.permissions;
  if (!Array.isArray(permissions)) {
    return sendError(res, { message: 'permissions array required', statusCode: 400 });
  }

  const role = await Role.findOneAndUpdate(
    { code },
    {
      code,
      name: ROLE_LABELS[code] || code,
      permissions,
      isSystem: true,
    },
    { upsert: true, new: true }
  );

  invalidatePermissionCache();

  await logAudit({
    action: 'UPDATE',
    user: req.user.email,
    userId: req.user._id,
    module: 'RBAC',
    metadata: { role: code, permissionCount: permissions.length },
    ip: req.ip,
  });

  return sendSuccess(res, {
    data: toPublicDoc(role.toObject()),
    message: `Permissions updated for ${code}`,
  });
});
