import { Router } from 'express';
import * as ctrl from '../controllers/approval.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requirePermission } from '../middleware/requirePermission.middleware.js';

const router = Router();
router.use(authenticate);

router.get('/pending-count', requirePermission('approvals.read'), ctrl.getPendingCount);
router.get('/', requirePermission('approvals.read'), ctrl.listApprovals);
router.get('/:id', requirePermission('approvals.read'), ctrl.getApproval);
router.patch('/:id', requirePermission('approvals.update'), ctrl.updateApproval);

export default router;
