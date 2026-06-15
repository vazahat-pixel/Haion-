import { Router } from 'express';
import * as ctrl from '../controllers/audit.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requirePermission } from '../middleware/requirePermission.middleware.js';

const router = Router();
router.use(authenticate);

router.get('/', requirePermission('audit.read'), ctrl.listAuditLogs);
router.get('/:id', requirePermission('audit.read'), ctrl.getAuditLog);

export default router;
