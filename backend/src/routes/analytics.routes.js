import { Router } from 'express';
import * as ctrl from '../controllers/analytics.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireAnyPermission } from '../middleware/requirePermission.middleware.js';

const router = Router();
router.use(authenticate);

router.get('/dashboard/:panel', requireAnyPermission('analytics.read', 'dealer.dashboard', 'service.dashboard', 'orders.read'), ctrl.getDashboard);
router.get('/kpis', requireAnyPermission('analytics.read', 'dealer.dashboard'), ctrl.getKpis);
router.get('/revenue', requireAnyPermission('analytics.read', 'dealer.dashboard'), ctrl.getRevenue);
router.get('/orders', requireAnyPermission('analytics.read', 'orders.read'), ctrl.getOrdersAnalytics);

export default router;
