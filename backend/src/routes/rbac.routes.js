import { Router } from 'express';
import * as ctrl from '../controllers/rbac.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requirePermission } from '../middleware/requirePermission.middleware.js';

const router = Router();
router.use(authenticate);

router.get('/permissions', requirePermission('rbac.read', 'settings.read'), ctrl.listPermissions);
router.get('/roles', requirePermission('rbac.read', 'settings.read'), ctrl.listRoles);
router.get('/roles/:code', requirePermission('rbac.read', 'settings.read'), ctrl.getRole);
router.patch('/roles/:code/permissions', requirePermission('rbac.update', 'settings.update'), ctrl.updateRolePermissions);

export default router;
