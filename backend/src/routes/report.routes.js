import { Router } from 'express';
import * as ctrl from '../controllers/report.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requirePermission } from '../middleware/requirePermission.middleware.js';

const router = Router();
router.use(authenticate);

router.get('/', requirePermission('reports.read'), ctrl.listReports);
router.post('/', requirePermission('reports.read'), ctrl.createReport);
router.get('/:id', requirePermission('reports.read'), ctrl.getReport);

export default router;
