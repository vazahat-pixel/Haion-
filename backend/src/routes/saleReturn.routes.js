import { Router } from 'express';
import * as ctrl from '../controllers/saleReturn.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requirePermission } from '../middleware/requirePermission.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', requirePermission('sale-returns.read'), ctrl.listSaleReturns);
router.post('/', requirePermission('sale-returns.create'), ctrl.createSaleReturn);
router.get('/:id', requirePermission('sale-returns.read'), ctrl.getSaleReturn);
router.post('/:id/void', requirePermission('sale-returns.manage'), ctrl.voidSaleReturn);

export default router;
