import { Router } from 'express';
import * as ctrl from '../controllers/salesInvoice.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requirePermission, requireAnyPermission } from '../middleware/requirePermission.middleware.js';

const router = Router();
router.use(authenticate);

router.get('/next-number', requireAnyPermission('purchases.read', 'purchases.create'), ctrl.getNextInvoiceNumber);
router.get('/', requirePermission('purchases.read'), ctrl.listSalesInvoices);
router.post('/', requirePermission('purchases.create'), ctrl.createSalesInvoice);
router.get('/:id/pdf', requirePermission('purchases.read'), ctrl.getSalesInvoicePdf);
router.get('/:id', requirePermission('purchases.read'), ctrl.getSalesInvoice);
router.put('/:id', requirePermission('purchases.create'), ctrl.updateSalesInvoice);
router.post('/:id/cancel', requirePermission('purchases.create'), ctrl.cancelSalesInvoice);

export default router;
