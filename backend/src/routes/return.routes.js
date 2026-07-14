import { Router } from 'express';
import * as ctrl from '../controllers/return.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireAnyPermission } from '../middleware/requirePermission.middleware.js';

const router = Router();
router.use(authenticate);

const canRead = requireAnyPermission('returns.read', 'service.dashboard');
const canManage = requireAnyPermission('returns.manage', 'returns.create', 'service.dashboard');

router.get('/kpis', canManage, ctrl.getReturnKpis);
router.get('/', canRead, ctrl.listReturns);
router.post('/', canManage, ctrl.createReturn);
router.get('/:id', canRead, ctrl.getReturn);
router.get('/:id/timeline', canRead, ctrl.getReturnTimeline);
router.post('/:id/ship', canManage, ctrl.shipReturn);
router.post('/:id/receive', canManage, ctrl.receiveReturn);
router.post('/:id/inspect', canManage, ctrl.inspectReturn);
router.post('/:id/verify', canManage, ctrl.verifyReturn);

export default router;
