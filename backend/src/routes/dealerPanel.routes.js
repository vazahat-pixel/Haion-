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
router.get('/grn', dealerRead, ctrl.listDealerGRN);
router.get('/grn/:id', dealerRead, ctrl.getDealerGRN);
router.post('/grn/:id/confirm', dealerRead, dispatchCtrl.confirmDealerGRN);
router.get('/team', requireAnyPermission('dealer.team.read', 'dealer.dashboard'), ctrl.listDealerTeam);
router.get('/reports', requireAnyPermission('dealer.reports.read', 'dealer.dashboard'), ctrl.listDealerReports);

export default router;
