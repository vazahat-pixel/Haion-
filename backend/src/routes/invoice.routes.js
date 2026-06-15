import { Router } from 'express';
import * as ctrl from '../controllers/invoice.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requirePermission } from '../middleware/requirePermission.middleware.js';

const router = Router();
router.use(authenticate);

router.get('/', requirePermission('invoices.read'), ctrl.listInvoices);
router.get('/:id/pdf', requirePermission('invoices.read'), ctrl.getInvoicePdf);
router.get('/:id', requirePermission('invoices.read'), ctrl.getInvoice);

export default router;
