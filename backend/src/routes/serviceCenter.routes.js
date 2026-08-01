import { Router } from 'express';
import * as ctrl from '../controllers/serviceCenter.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();
router.use(authenticate);

router.get('/', ctrl.listServiceCenters);
router.post('/', ctrl.createServiceCenter);
router.get('/:id', ctrl.getServiceCenter);
router.put('/:id', ctrl.updateServiceCenter);
router.get('/:serviceCenterId/inventory', ctrl.getServiceCenterInventory);
router.post('/:serviceCenterId/inventory', ctrl.upsertInventoryItem);

export default router;
