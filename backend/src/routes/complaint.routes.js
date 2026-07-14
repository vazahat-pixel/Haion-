import { Router } from 'express';
import * as ctrl from '../controllers/complaint.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requirePermission } from '../middleware/requirePermission.middleware.js';

const router = Router();

router.post('/public', ctrl.createPublicComplaint);
router.get('/public/validate-bill', ctrl.validateBill);
router.get('/public/lookup-contact', ctrl.lookupContact);
router.use(authenticate);

router.get('/open-count', requirePermission('complaints.read'), ctrl.getOpenCount);
router.get('/validate-bill', requirePermission('complaints.read'), ctrl.validateBill);
router.post('/validate-bill', requirePermission('complaints.read'), ctrl.validateBill);
router.get('/', requirePermission('complaints.read'), ctrl.listComplaints);
router.post('/', requirePermission('complaints.create'), ctrl.createComplaint);
router.get('/:id/timeline', requirePermission('complaints.read'), ctrl.getComplaintTimeline);
router.get('/:id', requirePermission('complaints.read'), ctrl.getComplaint);
router.patch('/:id', requirePermission('complaints.update'), ctrl.updateComplaint);
router.post('/:id/escalate', requirePermission('complaints.escalate'), ctrl.escalateComplaint);
router.post('/:id/resolve', requirePermission('complaints.update'), ctrl.resolveComplaint);

export default router;
