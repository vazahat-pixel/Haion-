import { Router } from 'express';
import * as ctrl from '../controllers/insurance.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requirePermission } from '../middleware/requirePermission.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/wallets', requirePermission('insurance.wallet.read'), ctrl.listWallets);
router.get('/wallets/:dealerId', requirePermission('insurance.wallet.read'), ctrl.getDealerWallet);
router.post('/wallets/:dealerId/topup', requirePermission('insurance.wallet.manage'), ctrl.topUpWallet);

router.get('/claims', requirePermission('insurance.claims.read'), ctrl.listClaims);
router.post('/claims', requirePermission('insurance.claims.create'), ctrl.createClaim);
router.get('/claims/:id', requirePermission('insurance.claims.read'), ctrl.getClaim);
router.patch('/claims/:id/review', requirePermission('insurance.claims.review'), ctrl.reviewClaim);
router.post('/claims/:id/pay', requirePermission('insurance.claims.review'), ctrl.payClaim);

export default router;
