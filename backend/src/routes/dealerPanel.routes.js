import { Router } from 'express';
import * as ctrl from '../controllers/dealerPanel.controller.js';
import * as dispatchCtrl from '../controllers/dispatch.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireAnyPermission } from '../middleware/requirePermission.middleware.js';

const router = Router();
router.use(authenticate);

const dealerRead = requireAnyPermission('dealer.inventory.read', 'dealer.dispatch.read', 'dealer.grn.read');

router.get('/billing-catalog', requireAnyPermission('billing.create', 'billing.read'), ctrl.getBillingCatalog);
router.get('/inventory', dealerRead, ctrl.listDealerInventory);
router.get('/inventory/:id', dealerRead, ctrl.getDealerInventoryItem);
router.get('/dispatches', dealerRead, ctrl.listDealerDispatches);
router.get('/dispatches/:id', dealerRead, ctrl.getDealerDispatch);
router.get('/dispatches/:id/tracking', dealerRead, ctrl.getDealerDispatchTracking);
router.get('/grn', dealerRead, ctrl.listDealerGRN);
router.get('/grn/:id', dealerRead, ctrl.getDealerGRN);
router.post('/grn/:id/confirm', dealerRead, dispatchCtrl.confirmDealerGRN);
router.get('/team', requireAnyPermission('dealer.team.read', 'dealer.dashboard'), ctrl.listDealerTeam);
router.post('/team', requireAnyPermission('dealer.team.manage', 'dealer.dashboard'), ctrl.createTeamMember);
router.get('/team/:id', requireAnyPermission('dealer.team.read', 'dealer.dashboard'), ctrl.getDealerTeamMember);
router.put('/team/:id', requireAnyPermission('dealer.team.manage', 'dealer.dashboard'), ctrl.updateTeamMember);
router.delete('/team/:id', requireAnyPermission('dealer.team.manage', 'dealer.dashboard'), ctrl.deactivateTeamMember);
router.get('/team-performance', requireAnyPermission('dealer.team.read', 'dealer.dashboard'), ctrl.getTeamPerformance);
router.get('/team-leaderboard', requireAnyPermission('dealer.team.read', 'dealer.dashboard'), ctrl.getTeamLeaderboard);
router.get('/reports/catalog', requireAnyPermission('dealer.reports.read', 'dealer.dashboard'), ctrl.getDealerReportCatalog);
router.post('/reports/run', requireAnyPermission('dealer.reports.read', 'dealer.dashboard'), ctrl.runDealerReport);
router.get('/reports/:id', requireAnyPermission('dealer.reports.read', 'dealer.dashboard'), ctrl.getDealerReport);
router.get('/reports', requireAnyPermission('dealer.reports.read', 'dealer.dashboard'), ctrl.listDealerReports);

export default router;
