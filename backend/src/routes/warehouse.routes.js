import { Router } from 'express';
import * as ctrl from '../controllers/warehouse.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requirePermission } from '../middleware/requirePermission.middleware.js';

const router = Router();
router.use(authenticate);

router.get('/', requirePermission('warehouses.read'), ctrl.listWarehouses);
router.post('/', requirePermission('warehouses.create'), ctrl.createWarehouse);
router.get('/:id/stock', requirePermission('inventory.read'), ctrl.getWarehouseStock);
router.get('/:id', requirePermission('warehouses.read'), ctrl.getWarehouse);
router.patch('/:id', requirePermission('warehouses.update'), ctrl.updateWarehouse);

export default router;
