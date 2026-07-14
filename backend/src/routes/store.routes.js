import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as ctrl from '../controllers/store.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requirePermission } from '../middleware/requirePermission.middleware.js';

const router = Router();

const checkoutLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many checkout attempts. Please try again later.' },
});

/** Public — no auth */
router.get('/config', ctrl.getPaymentConfig);
router.post('/checkout', checkoutLimiter, ctrl.createCheckout);
router.post('/payments/verify', checkoutLimiter, ctrl.verifyPayment);
router.get('/orders/track/:orderNo', ctrl.trackOrder);

/** Admin — authenticated */
router.get('/orders', authenticate, requirePermission('store.orders.read'), ctrl.listStoreOrders);
router.get('/orders/:id', authenticate, requirePermission('store.orders.read'), ctrl.getStoreOrder);
router.patch('/orders/:id/status', authenticate, requirePermission('store.orders.update'), ctrl.patchStoreOrderStatus);
router.get('/analytics/summary', authenticate, requirePermission('store.analytics.read'), ctrl.getStoreAnalyticsSummary);
router.get('/analytics/chart', authenticate, requirePermission('store.analytics.read'), ctrl.getStoreAnalyticsChart);
router.get('/analytics/top-products', authenticate, requirePermission('store.analytics.read'), ctrl.getStoreTopProducts);

export default router;
