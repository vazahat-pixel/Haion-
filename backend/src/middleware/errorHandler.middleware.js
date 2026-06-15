import { sendError } from '../utils/apiResponse.js';
import { env } from '../config/env.js';

export function notFoundHandler(req, res) {
  return sendError(res, {
    message: `Route not found: ${req.method} ${req.originalUrl}`,
    statusCode: 404,
  });
}

export function errorHandler(err, req, res, _next) {
  console.error(`[${req.method}] ${req.originalUrl}`, err);

  if (err.name === 'ValidationError') {
    const errors = {};
    Object.keys(err.errors || {}).forEach((key) => {
      errors[key] = [err.errors[key].message];
    });
    return sendError(res, { message: 'Validation failed', statusCode: 422, errors });
  }

  if (err.name === 'ZodError') {
    const errors = {};
    err.errors.forEach((e) => {
      const path = e.path.join('.');
      if (!errors[path]) errors[path] = [];
      errors[path].push(e.message);
    });
    return sendError(res, { message: 'Validation failed', statusCode: 422, errors });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    return sendError(res, {
      message: `${field} already exists`,
      statusCode: 409,
      errors: { [field]: ['Already exists'] },
    });
  }

  if (err.name === 'JsonWebTokenError') {
    return sendError(res, { message: 'Invalid token', statusCode: 401 });
  }

  if (err.name === 'TokenExpiredError') {
    return sendError(res, { message: 'Token expired', statusCode: 401 });
  }

  const statusCode = err.statusCode || 500;
  const message = env.isDev ? err.message : statusCode === 500 ? 'Internal server error' : err.message;

  return sendError(res, { message, statusCode });
}
