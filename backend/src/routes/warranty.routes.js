import { Router } from 'express';
import * as ctrl from '../controllers/warranty.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requirePermission } from '../middleware/requirePermission.middleware.js';

const router = Router();

router.get('/lookup', ctrl.publicLookup);
router.use(authenticate);

router.get('/eligibility', requirePermission('warranty.read'), ctrl.checkEligibility);
router.get('/', requirePermission('warranty.read'), ctrl.listWarranties);
router.get('/:id/certificate/pdf', requirePermission('warranty.read'), ctrl.downloadCertificatePdf);
router.get('/:id/certificate', requirePermission('warranty.read'), ctrl.getCertificate);
router.get('/:id', requirePermission('warranty.read'), ctrl.getWarranty);
router.post('/:id/claim', requirePermission('warranty.create'), ctrl.claimWarranty);

export default router;
