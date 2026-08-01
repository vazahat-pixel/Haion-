import { Router } from 'express';
import * as ctrl from '../controllers/purchaseReturn.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requirePermission } from '../middleware/requirePermission.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', requirePermission('purchase-returns.read'), ctrl.listPurchaseReturns);
router.post('/', requirePermission('purchase-returns.create'), ctrl.createPurchaseReturn);
router.get('/:id', requirePermission('purchase-returns.read'), ctrl.getPurchaseReturn);
router.post('/:id/ship', requirePermission('purchase-returns.create'), ctrl.shipPurchaseReturn);
router.post('/:id/receive', requirePermission('purchase-returns.manage'), ctrl.receivePurchaseReturn);
router.post('/:id/reject', requirePermission('purchase-returns.manage'), ctrl.rejectPurchaseReturn);

export default router;
