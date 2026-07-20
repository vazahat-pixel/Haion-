import { Router } from 'express';
import * as ctrl from '../controllers/manufacture.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/rbac.middleware.js';
import { requirePermission } from '../middleware/requirePermission.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { createManufactureSchema } from '../validations/manufacture.validation.js';
import { ROLES } from '../config/constants.js';

const router = Router();
const adminRoles = [ROLES.MASTER_ADMIN, ROLES.WAREHOUSE_MANAGER];

router.use(authenticate);

router.get('/', requirePermission('manufacture.read'), ctrl.listManufactures);
router.get('/materials', requirePermission('manufacture.read'), ctrl.listAvailableMaterials);
router.post(
  '/',
  requireRole(...adminRoles),
  requirePermission('manufacture.create'),
  validate(createManufactureSchema),
  ctrl.createManufacture
);
router.get('/:id', requirePermission('manufacture.read'), ctrl.getManufacture);

export default router;
