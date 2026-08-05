import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { sendError } from '../utils/apiResponse.js';
import User from '../models/User.model.js';

export async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      return sendError(res, { message: 'Authentication required', statusCode: 401 });
    }

    const decoded = jwt.verify(token, env.jwtAccessSecret);
    const user = await User.findById(decoded.userId).select('-password');

    if (!user || !user.isActive) {
      return sendError(res, { message: 'User not found or inactive', statusCode: 401 });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return sendError(res, { message: 'Token expired', statusCode: 401 });
    }
    return sendError(res, { message: 'Invalid token', statusCode: 401 });
  }
}

export function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) return next();

  jwt.verify(token, env.jwtAccessSecret, async (err, decoded) => {
    if (!err && decoded?.userId) {
      const user = await User.findById(decoded.userId).select('-password');
      if (user?.isActive) req.user = user;
    }
    next();
  });
}

/**
 * Middleware: only allow requests from users with one of the specified roles.
 * Usage: router.post('/path', authorize([ROLES.SERVICE_CENTER, ROLES.MASTER_ADMIN]), handler)
 */
export function authorize(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user) return sendError(res, { message: 'Authentication required', statusCode: 401 });
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    if (!roles.includes(req.user.role)) {
      return sendError(res, { message: 'You do not have permission for this action', statusCode: 403 });
    }
    next();
  };
}
