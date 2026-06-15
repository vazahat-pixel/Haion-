import { Router } from 'express';
import * as ctrl from '../controllers/serviceRequest.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireAnyPermission } from '../middleware/requirePermission.middleware.js';

const router = Router();
router.use(authenticate);

router.get('/', requireAnyPermission('service-requests.read', 'service.dashboard'), ctrl.listServiceRequests);
router.post('/', requireAnyPermission('service-requests.create', 'service.dashboard'), ctrl.createServiceRequest);
router.get('/:id', requireAnyPermission('service-requests.read', 'service.dashboard'), ctrl.getServiceRequest);

export default router;
