import { sendError } from '../utils/apiResponse.js';
import { logAudit } from '../services/audit.service.js';

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, { message: 'Authentication required', statusCode: 401 });
    }
    if (!roles.includes(req.user.role)) {
      logAudit({
        action: 'RBAC_DENY_ROLE',
        user: req.user.email,
        userId: req.user._id,
        module: 'RBAC',
        ip: req.ip,
        metadata: { requiredRoles: roles, actualRole: req.user.role, path: req.originalUrl },
      });
      return sendError(res, {
        message: 'You do not have permission to perform this action',
        statusCode: 403,
      });
    }
    next();
  };
}

export function requireScope(scopeFn) {
  return async (req, res, next) => {
    try {
      const hasScope = await scopeFn(req.user, req.params, req.body, req.query);
      if (!hasScope) {
        logAudit({
          action: 'RBAC_DENY_SCOPE',
          user: req.user?.email,
          userId: req.user?._id,
          module: 'RBAC',
          ip: req.ip,
          metadata: { path: req.originalUrl, params: req.params },
        });
        return sendError(res, { message: 'Access denied to this resource', statusCode: 403 });
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}

export function dealerScope(user, params) {
  if (['MASTER_ADMIN', 'WAREHOUSE_MANAGER', 'EMPLOYEE', 'MANAGER'].includes(user.role)) return true;
  if (user.role === 'DEALER_ADMIN' || user.role === 'DEALER_SALES') {
    return user.dealerId?.toString() === params.id || user.dealerId?.toString() === params.dealerId;
  }
  return false;
}
