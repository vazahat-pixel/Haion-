import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { logAudit } from '../services/audit.service.js';

export const uploadFile = asyncHandler(async (req, res) => {
  if (!req.file) {
    return sendError(res, { message: 'No file uploaded', statusCode: 400 });
  }

  const url = `/uploads/${req.file.filename}`;

  await logAudit({
    action: 'UPLOAD',
    user: req.user.email,
    userId: req.user._id,
    module: 'Upload',
    metadata: { filename: req.file.filename, size: req.file.size, mimetype: req.file.mimetype },
    ip: req.ip,
  });

  return sendSuccess(res, {
    data: {
      url,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
    },
    message: 'File uploaded',
  });
});
