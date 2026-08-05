import { Router } from 'express';
import * as ctrl from '../controllers/insurance.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { requirePermission } from '../middleware/requirePermission.middleware.js';
import { ROLES } from '../config/constants.js';

const router = Router();

router.use(authenticate);

// Insurance wallet — admin only
router.get('/wallets', requirePermission('insurance.wallet.read'), ctrl.listWallets);
router.get('/wallets/:dealerId', requirePermission('insurance.wallet.read'), ctrl.getDealerWallet);
router.post('/wallets/:dealerId/topup', requirePermission('insurance.wallet.manage'), ctrl.topUpWallet);

// Insurance claims:
// - Reading: allowed for admin, service center, support
// - Creating / reviewing / paying: SERVICE_CENTER + admin roles only (NOT dealers)
const claimWriteRoles = [ROLES.SERVICE_CENTER, ROLES.MASTER_ADMIN, ROLES.WAREHOUSE_MANAGER, ROLES.MANAGER];

router.get('/claims', requirePermission('insurance.claims.read'), ctrl.listClaims);
router.post('/claims', authorize(claimWriteRoles), requirePermission('insurance.claims.create'), ctrl.createClaim);
router.get('/claims/:id', requirePermission('insurance.claims.read'), ctrl.getClaim);
router.patch('/claims/:id/review', authorize(claimWriteRoles), requirePermission('insurance.claims.review'), ctrl.reviewClaim);
router.post('/claims/:id/pay', authorize(claimWriteRoles), requirePermission('insurance.claims.review'), ctrl.payClaim);

export default router;
