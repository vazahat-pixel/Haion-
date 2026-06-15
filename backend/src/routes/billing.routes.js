import { Router } from 'express';
import * as ctrl from '../controllers/billing.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requirePermission } from '../middleware/requirePermission.middleware.js';

const router = Router();
router.use(authenticate);

router.get('/next-bill-number', requirePermission('billing.read'), ctrl.getNextBillNumber);
router.get('/', requirePermission('billing.read'), ctrl.listBills);
router.post('/', requirePermission('billing.create'), ctrl.createBill);
router.get('/:id', requirePermission('billing.read'), ctrl.getBill);
router.patch('/:id', requirePermission('billing.update'), ctrl.updateBill);
router.post('/:id/send', requirePermission('billing.send'), ctrl.sendBill);
router.post('/:id/mark-paid', requirePermission('billing.update'), ctrl.markPaid);
router.post('/:id/cancel', requirePermission('billing.update'), ctrl.cancelBill);

export default router;
