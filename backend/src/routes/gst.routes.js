import { Router } from 'express';
import * as ctrl from '../controllers/gst.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireAnyPermission } from '../middleware/requirePermission.middleware.js';

const router = Router();
router.use(authenticate);

router.get('/config', requireAnyPermission('gst.config', 'billing.read'), ctrl.getGstConfig);
router.get('/rates', requireAnyPermission('gst.config', 'billing.read'), ctrl.getGstRates);
router.get('/hsn/:code', requireAnyPermission('billing.read', 'gst.config'), ctrl.lookupHsn);
router.get('/validate/:gstin', requireAnyPermission('billing.read', 'gst.config'), ctrl.validateGstin);

export default router;
