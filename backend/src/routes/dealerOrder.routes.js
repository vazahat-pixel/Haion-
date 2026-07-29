import { Router } from 'express';
import * as ctrl from '../controllers/dealerOrder.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireAnyPermission } from '../middleware/requirePermission.middleware.js';

const router = Router();
router.use(authenticate);

// Admin and dealer can list
router.get('/', requireAnyPermission('dealer-orders.read', 'dealer.orders.read', 'dealer.dashboard'), ctrl.listDealerOrders);
// Dealer creates
router.post('/', requireAnyPermission('dealer-orders.create', 'dealer.orders.create', 'dealer.dashboard'), ctrl.createDealerOrder);
// Get auto sequence number
router.get('/next-number', requireAnyPermission('dealer-orders.create', 'dealer.orders.create', 'dealer.dashboard'), ctrl.getNextOrderNumber);
// Get one
router.get('/:id', requireAnyPermission('dealer-orders.read', 'dealer.orders.read', 'dealer.dashboard'), ctrl.getDealerOrder);
// Admin updates status
router.patch('/:id/status', requireAnyPermission('dealer-orders.manage', 'purchases.create'), ctrl.updateDealerOrderStatus);

export default router;
