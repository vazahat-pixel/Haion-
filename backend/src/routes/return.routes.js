import { Router } from 'express';
import * as ctrl from '../controllers/return.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requirePermission } from '../middleware/requirePermission.middleware.js';

const router = Router();
router.use(authenticate);

router.get('/', requirePermission('returns.read'), ctrl.listReturns);
router.post('/', requirePermission('returns.create'), ctrl.createReturn);
router.get('/:id', requirePermission('returns.read'), ctrl.getReturn);
router.post('/:id/inspect', requirePermission('returns.create'), ctrl.inspectReturn);

export default router;
