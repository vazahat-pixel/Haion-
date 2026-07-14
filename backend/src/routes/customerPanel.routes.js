import { Router } from 'express';
import * as ctrl from '../controllers/customerPanel.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/config', ctrl.getPortalConfigPublic);
router.post('/access', ctrl.accessHub);
router.post('/refresh', ctrl.refreshHub);

router.use(authenticate);

router.get('/hub', ctrl.getMyHub);
router.patch('/profile', ctrl.updateProfile);
router.get('/notifications', ctrl.listCustomerNotifications);
router.get('/complaints/:id', ctrl.getComplaintDetail);
router.get('/bills/:billNo', ctrl.getBillForCustomer);

export default router;
