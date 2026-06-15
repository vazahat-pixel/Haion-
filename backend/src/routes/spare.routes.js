import { Router } from 'express';
import * as ctrl from '../controllers/spare.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requirePermission } from '../middleware/requirePermission.middleware.js';

const router = Router();
router.use(authenticate);

router.get('/', requirePermission('spares.read'), ctrl.listSpares);
router.post('/request', requirePermission('spares.request'), ctrl.createSpareRequest);
router.get('/:id/availability', requirePermission('spares.read'), ctrl.checkAvailability);
router.get('/:id', requirePermission('spares.read'), ctrl.getSpare);

export default router;
