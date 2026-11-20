/**
 * Distributor Management System (DMS) API — mounted at /api/dms.
 * Isolated from the rest of Haion: own collections (dms_*), own permission model
 * (DmsProfile.pages), shares only authentication (User + JWT) and audit logging.
 */
import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { dmsContext } from './middleware/context.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { logAudit } from '../services/audit.service.js';
import User from '../models/User.model.js';
import { DmsError } from './services/core.service.js';
import mastersRoutes from './routes/masters.routes.js';
import poRoutes from './routes/po.routes.js';
import invoiceRoutes from './routes/invoice.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import reportRoutes from './routes/report.routes.js';
import entityRoutes from './routes/entities.routes.js';
import reports2Routes from './routes/reports2.routes.js';

const router = Router();
router.use(authenticate, dmsContext);

router.get('/me', (req, res) => sendSuccess(res, {
  data: {
    displayName: req.dms.displayName,
    loginId: req.dms.loginId,
    isAdmin: req.dms.isAdmin,
    userType: req.dms.profile?.userType || 'Admin',
    location: req.dms.location ? { _id: req.dms.location._id, name: req.dms.location.name, code: req.dms.location.code } : null,
    pages: req.dms.pages,
  },
}));

router.post('/change-password', asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body || {};
  if (!oldPassword || !newPassword) throw new DmsError('Old and new password are required', 422, { oldPassword: ['Required'], newPassword: ['Required'] });
  if (String(newPassword).length < 8) throw new DmsError('New password must be at least 8 characters', 422, { newPassword: ['Min 8 characters'] });
  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.comparePassword(String(oldPassword)))) throw new DmsError('Old password is incorrect', 422, { oldPassword: ['Incorrect'] });
  user.password = await User.hashPassword(String(newPassword));
  user.refreshTokens = []; // sign out other sessions
  await user.save();
  logAudit({ action: 'DMS_PASSWORD_CHANGE', user: req.dms.loginId, userId: user._id, module: 'DMS', ip: req.ip });
  sendSuccess(res, { message: 'Password changed successfully' });
}));

router.use('/', mastersRoutes);
router.use('/po', poRoutes);
router.use('/invoices', invoiceRoutes);
router.use('/payments', paymentRoutes);
router.use('/reports', reportRoutes);
router.use('/entities', entityRoutes);
router.use('/x', reports2Routes);

// DMS errors carry per-field `errors`; the global handler would drop them for custom errors.
// eslint-disable-next-line no-unused-vars
router.use((err, req, res, next) => {
  if (err?.name === 'DmsError') {
    return sendError(res, { message: err.message, statusCode: err.statusCode, errors: err.errors });
  }
  return next(err);
});

export default router;
