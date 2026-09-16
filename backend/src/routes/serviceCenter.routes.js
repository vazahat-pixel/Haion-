import { Router } from 'express';
import * as ctrl from '../controllers/serviceCenter.controller.js';
import * as billingCtrl from '../controllers/serviceCenterBilling.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();
router.use(authenticate);

// Service Center Invoices & GST Billing
router.get('/invoices', billingCtrl.listServiceCenterInvoices);
router.post('/invoices', billingCtrl.createServiceCenterInvoice);
router.get('/invoices/:id', billingCtrl.getServiceCenterInvoice);
router.post('/invoices/:id/payments', billingCtrl.recordServiceCenterPayment);

// Service Centers Master & Inventories
router.get('/', ctrl.listServiceCenters);
router.post('/', ctrl.createServiceCenter);
router.get('/:id', ctrl.getServiceCenter);
router.put('/:id', ctrl.updateServiceCenter);
router.get('/:serviceCenterId/inventory', ctrl.getServiceCenterInventory);
router.post('/:serviceCenterId/inventory', ctrl.upsertInventoryItem);

export default router;
