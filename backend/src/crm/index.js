/**
 * Service CRM (CANCRM V6) API — mounted at /api/service-crm.
 * Shares authentication (User + JWT) and common masters (Brand, Product, State, City, Location)
 * with DMS while keeping Service CRM workflows isolated in `crm_*` collections.
 */
import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { crmContext } from './middleware/context.js';
import mastersRoutes from './routes/masters.routes.js';
import jobsRoutes from './routes/jobs.routes.js';
import inventoryRoutes from './routes/inventory.routes.js';
import financeRoutes from './routes/finance.routes.js';
import extraRoutes from './routes/extra.routes.js';

const router = Router();
router.use(authenticate, crmContext);

router.get('/me', (req, res) => sendSuccess(res, {
  data: {
    displayName: req.crm.displayName,
    loginId: req.crm.loginId,
    isAdmin: req.crm.isAdmin,
    crmRole: req.crm.crmRole,
    userType: req.crm.userType,
    location: req.crm.location ? {
      _id: req.crm.location._id,
      name: req.crm.location.name,
      code: req.crm.location.code,
      locationType: req.crm.location.locationType,
    } : null,
    pages: req.crm.pages,
  },
}));

router.use('/', mastersRoutes);
router.use('/', jobsRoutes);
router.use('/', inventoryRoutes);
router.use('/', financeRoutes);
router.use('/', extraRoutes);

// eslint-disable-next-line no-unused-vars
router.use((err, _req, res, next) => {
  if (err?.name === 'CrmError') {
    return sendError(res, { message: err.message, statusCode: err.statusCode, errors: err.errors });
  }
  return next(err);
});

export default router;
