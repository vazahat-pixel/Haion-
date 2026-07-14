export function sendSuccess(res, { data = null, message = 'Success', statusCode = 200, pagination = null }) {
  const body = { success: true, data, message };
  if (pagination) body.pagination = pagination;
  return res.status(statusCode).json(body);
}

export function sendError(res, { message = 'An error occurred', statusCode = 500, errors = null, data = null }) {
  const body = { success: false, data, message };
  if (errors) body.errors = errors;
  return res.status(statusCode).json(body);
}

export function sendCreated(res, { data, message = 'Created successfully' }) {
  return sendSuccess(res, { data, message, statusCode: 201 });
}

export function sendPaginated(res, { data, total, page, perPage, message = 'Success' }) {
  const totalPages = Math.ceil(total / perPage) || 1;
  return sendSuccess(res, {
    data,
    message,
    pagination: { total, page, perPage, totalPages },
  });
}
