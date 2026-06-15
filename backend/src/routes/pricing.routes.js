import { Router } from 'express';
import * as ctrl from '../controllers/pricing.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requirePermission } from '../middleware/requirePermission.middleware.js';

const router = Router();
router.use(authenticate);

router.get('/', requirePermission('pricing.read'), ctrl.listPricing);
router.post('/', requirePermission('pricing.update'), ctrl.createPricing);
router.get('/:id', requirePermission('pricing.read'), ctrl.getPricing);
router.patch('/:id', requirePermission('pricing.update'), ctrl.updatePricing);

export default router;
