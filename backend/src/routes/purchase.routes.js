import { Router } from 'express';
import * as ctrl from '../controllers/purchase.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/rbac.middleware.js';
import { requirePermission } from '../middleware/requirePermission.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { createPurchaseSchema } from '../validations/purchase.validation.js';
import { ROLES } from '../config/constants.js';

const router = Router();
const adminRoles = [ROLES.MASTER_ADMIN, ROLES.WAREHOUSE_MANAGER];

router.use(authenticate);

router.get('/', requirePermission('purchases.read'), ctrl.listPurchases);
router.post('/', requireRole(...adminRoles), requirePermission('purchases.create'), validate(createPurchaseSchema), ctrl.createPurchase);
router.get('/:id', requirePermission('purchases.read'), ctrl.getPurchase);
router.post('/:id/receive', requireRole(...adminRoles), requirePermission('purchases.receive'), ctrl.receivePurchase);
router.post('/:id/cancel', requireRole(...adminRoles), requirePermission('purchases.create'), ctrl.cancelPurchase);

export default router;
