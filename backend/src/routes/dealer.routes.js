import { Router } from 'express';
import * as ctrl from '../controllers/dealer.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requirePermission, requireAnyPermission } from '../middleware/requirePermission.middleware.js';

const router = Router();
router.use(authenticate);

router.get('/', requirePermission('dealers.read'), ctrl.listDealers);
router.post('/', requirePermission('dealers.create'), ctrl.createDealer);
router.patch('/:id/status', requirePermission('dealers.update'), ctrl.updateDealerStatus);
router.get('/:id/inventory', requirePermission('dealers.read'), ctrl.getDealerInventory);
router.get('/:id/team', requireAnyPermission('dealers.read', 'dealer.team.read'), ctrl.getDealerTeam);
router.get('/:id/performance', requirePermission('dealers.read'), ctrl.getDealerPerformance);
router.get('/:id', requirePermission('dealers.read'), ctrl.getDealer);

export default router;
