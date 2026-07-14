import { Router } from 'express';
import * as ctrl from '../controllers/stockMovement.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requirePermission } from '../middleware/requirePermission.middleware.js';

const router = Router();
router.use(authenticate);

router.get('/', requirePermission('inventory.read'), ctrl.listStockMovements);
router.get('/sku/:sku', requirePermission('inventory.read'), ctrl.getSkuHistory);

export default router;
