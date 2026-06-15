import { Router } from 'express';
import * as ctrl from '../controllers/dispatch.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requirePermission } from '../middleware/requirePermission.middleware.js';

const router = Router();
router.use(authenticate);

router.get('/pending-count', requirePermission('dispatch.read'), ctrl.pendingDispatchCount);
router.get('/', requirePermission('dispatch.read'), ctrl.listDispatch);
router.post('/', requirePermission('dispatch.create'), ctrl.createDispatch);
router.get('/:id/tracking', requirePermission('dispatch.read'), ctrl.getDispatchTracking);
router.get('/:id', requirePermission('dispatch.read'), ctrl.getDispatch);
router.patch('/:id/status', requirePermission('dispatch.update'), ctrl.updateDispatchStatus);

export default router;
