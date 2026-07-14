import { Router } from 'express';
import * as ctrl from '../controllers/inventory.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requirePermission } from '../middleware/requirePermission.middleware.js';

const router = Router();
router.use(authenticate);

router.get('/low-stock', requirePermission('inventory.read'), ctrl.lowStock);
router.get('/categories', requirePermission('inventory.read'), ctrl.inventoryCategories);
router.get('/movements', requirePermission('inventory.read'), ctrl.listStockMovements);
router.post('/transfer', requirePermission('inventory.update'), ctrl.transferStock);
router.get('/', requirePermission('inventory.read'), ctrl.listInventory);
router.post('/', requirePermission('inventory.create'), ctrl.createInventory);
router.get('/:id', requirePermission('inventory.read'), ctrl.getInventory);
router.patch('/:id', requirePermission('inventory.update'), ctrl.updateInventory);
router.delete('/:id', requirePermission('inventory.delete'), ctrl.deleteInventory);
router.get('/:id/movements', requirePermission('inventory.read'), ctrl.getInventoryMovements);

export default router;
