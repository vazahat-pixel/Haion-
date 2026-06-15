import { sendError } from '../utils/apiResponse.js';

export function validate(schema, source = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const errors = {};
      result.error.errors.forEach((e) => {
        const path = e.path.join('.');
        if (!errors[path]) errors[path] = [];
        errors[path].push(e.message);
      });
      return sendError(res, { message: 'Validation failed', statusCode: 422, errors });
    }
    req[source] = result.data;
    next();
  };
}
