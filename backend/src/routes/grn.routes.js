import { Router } from 'express';
import * as ctrl from '../controllers/grn.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requirePermission } from '../middleware/requirePermission.middleware.js';

const router = Router();
router.use(authenticate);

router.get('/', requirePermission('grn.read'), ctrl.listGRN);
router.post('/', requirePermission('grn.create'), ctrl.createGRN);
router.get('/:id', requirePermission('grn.read'), ctrl.getGRN);
router.patch('/:id/verify', requirePermission('grn.verify'), ctrl.verifyGRN);
router.patch('/:id/reject', requirePermission('grn.verify'), ctrl.rejectGRN);

export default router;
