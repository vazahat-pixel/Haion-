import { Router } from 'express';
import * as ctrl from '../controllers/serviceRequest.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireAnyPermission } from '../middleware/requirePermission.middleware.js';

const router = Router();
router.use(authenticate);

const canRead = requireAnyPermission('service-requests.read', 'service.dashboard', 'customer.dashboard');
const canCreate = requireAnyPermission('service-requests.create', 'service.dashboard', 'customer.dashboard');
const canManage = requireAnyPermission('service-requests.manage', 'service.dashboard');

router.get('/kpis', canManage, ctrl.getServiceDashboardKpis);
router.get('/warranty-lookup', canManage, ctrl.lookupWarrantyForService);
router.get('/', canRead, ctrl.listServiceRequests);
router.post('/', canCreate, ctrl.createServiceRequest);
router.get('/:id', canRead, ctrl.getServiceRequest);
router.put('/:id', canManage, ctrl.updateServiceRequest);
router.post('/:id/assign', canManage, ctrl.assignServiceRequest);
router.post('/:id/status', canManage, ctrl.updateServiceStatus);
router.post('/:id/notes', canManage, ctrl.addServiceNote);
router.get('/:id/timeline', canRead, ctrl.getServiceTimeline);
router.post('/:id/close', canManage, ctrl.closeServiceRequest);

export default router;
