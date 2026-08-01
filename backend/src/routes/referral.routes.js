import { Router } from 'express';
import * as ctrl from '../controllers/referral.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requirePermission, requireAnyPermission } from '../middleware/requirePermission.middleware.js';

const router = Router();
router.use(authenticate);

// ── Customer Panel: view own referral bonus ───────────────────────────────────
router.get('/my-bonus', ctrl.getMyReferralBonus);
router.post('/request-withdrawal', ctrl.customerRequestWithdrawal);

// ── Admin: Stats, list, detail, process withdrawals ─────────────────────────
router.get('/admin/stats', requireAnyPermission('analytics.read', 'admin.referrals.read'), ctrl.adminReferralStats);
router.get('/admin', requireAnyPermission('analytics.read', 'admin.referrals.read'), ctrl.adminListReferralBonuses);
router.get('/admin/withdrawals/list', requireAnyPermission('analytics.read', 'admin.referrals.read'), ctrl.adminListWithdrawals);
router.patch('/admin/withdrawals/:id', requireAnyPermission('analytics.read', 'admin.referrals.manage'), ctrl.adminProcessWithdrawal);
router.get('/admin/:id', requireAnyPermission('analytics.read', 'admin.referrals.read'), ctrl.adminGetReferralBonus);

export default router;
