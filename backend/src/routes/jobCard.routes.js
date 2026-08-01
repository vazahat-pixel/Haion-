import { Router } from 'express';
import * as ctrl from '../controllers/jobCard.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();
router.use(authenticate);

router.get('/', ctrl.listJobCards);
router.post('/', ctrl.createJobCard);
router.get('/complaint/:complaintId', ctrl.getJobCardByComplaint);
router.get('/:id', ctrl.getJobCard);
router.patch('/:id/parts', ctrl.consumeParts);
router.patch('/:id/defective', ctrl.markDefectivePart);
router.patch('/:id/status', ctrl.updateJobCardStatus);
router.post('/:id/feedback', ctrl.submitCustomerFeedback);

export default router;
