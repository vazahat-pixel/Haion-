import { Router } from 'express';
import * as ctrl from '../controllers/task.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requirePermission } from '../middleware/requirePermission.middleware.js';

const router = Router();
router.use(authenticate);

router.get('/pending-count', requirePermission('tasks.read'), ctrl.getPendingCount);
router.get('/', requirePermission('tasks.read'), ctrl.listTasks);
router.get('/:id', requirePermission('tasks.read'), ctrl.getTask);
router.patch('/:id', requirePermission('tasks.update'), ctrl.updateTask);

export default router;
