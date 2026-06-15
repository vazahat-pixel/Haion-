import { sendError } from '../utils/apiResponse.js';
import { userHasPermissions } from '../services/permission.service.js';

export function requirePermission(...permissions) {
  return async (req, res, next) => {
    if (!req.user) {
      return sendError(res, { message: 'Authentication required', statusCode: 401 });
    }
    const allowed = await userHasPermissions(req.user.role, permissions, 'every');
    if (!allowed) {
      return sendError(res, { message: 'Permission denied', statusCode: 403 });
    }
    next();
  };
}

export function requireAnyPermission(...permissions) {
  return async (req, res, next) => {
    if (!req.user) {
      return sendError(res, { message: 'Authentication required', statusCode: 401 });
    }
    const allowed = await userHasPermissions(req.user.role, permissions, 'some');
    if (!allowed) {
      return sendError(res, { message: 'Permission denied', statusCode: 403 });
    }
    next();
  };
}
