import { Router } from 'express';
import * as ctrl from '../controllers/settings.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requirePermission } from '../middleware/requirePermission.middleware.js';

const router = Router();
router.use(authenticate);

router.get('/general', requirePermission('settings.read'), ctrl.getGeneral);
router.patch('/general', requirePermission('settings.update'), ctrl.updateGeneral);
router.get('/gst', requirePermission('settings.read'), ctrl.getGstSettings);
router.patch('/gst', requirePermission('settings.update'), ctrl.updateGstSettings);
router.get('/notifications', requirePermission('settings.read'), ctrl.getNotificationSettings);
router.patch('/notifications', requirePermission('settings.update'), ctrl.updateNotificationSettings);
router.get('/customer-portal', requirePermission('settings.read'), ctrl.getCustomerPortalSettings);
router.patch('/customer-portal', requirePermission('settings.update'), ctrl.updateCustomerPortalSettings);
router.get('/ca-reports', requirePermission('settings.read'), ctrl.getCaReportsSettings);
router.patch('/ca-reports', requirePermission('settings.update'), ctrl.updateCaReportsSettings);
router.get('/business', requirePermission('settings.read'), ctrl.getBusinessSettings);
router.patch('/business', requirePermission('settings.update'), ctrl.updateBusinessSettings);
router.get('/business/profile-bundle', requirePermission('settings.read'), ctrl.getBusinessProfileBundle);
router.get('/invoice', requirePermission('settings.read'), ctrl.getInvoiceSettings);
router.patch('/invoice', requirePermission('settings.update'), ctrl.updateInvoiceSettings);
router.get('/print', requirePermission('settings.read'), ctrl.getPrintSettings);
router.patch('/print', requirePermission('settings.update'), ctrl.updatePrintSettings);

export default router;
