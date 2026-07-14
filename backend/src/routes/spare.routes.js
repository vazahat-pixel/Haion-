import { Router } from 'express';
import * as ctrl from '../controllers/spare.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requirePermission, requireAnyPermission } from '../middleware/requirePermission.middleware.js';

const router = Router();
router.use(authenticate);

const canRead = requireAnyPermission('spares.read', 'service.dashboard');
const canManage = requireAnyPermission('spares.manage', 'service.dashboard');

router.get('/kpis', canManage, ctrl.getSpareKpis);
router.get('/', canRead, ctrl.listSpares);
router.post('/request', requireAnyPermission('spares.request', 'service.dashboard'), ctrl.createSpareRequest);
router.get('/:id/availability', canRead, ctrl.checkAvailability);
router.get('/:id/timeline', canRead, ctrl.getSpareTimeline);
router.get('/:id', canRead, ctrl.getSpare);
router.post('/:id/approve', canManage, ctrl.approveSpare);
router.post('/:id/reject', canManage, ctrl.rejectSpare);
router.post('/:id/dispatch', canManage, ctrl.dispatchSpare);
router.post('/:id/receive', canManage, ctrl.receiveSpare);
router.post('/:id/complete', canManage, ctrl.completeSpare);

export default router;
