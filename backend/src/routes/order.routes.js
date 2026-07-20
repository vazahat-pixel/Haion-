import { Router } from 'express';
import * as ctrl from '../controllers/order.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireAnyPermission } from '../middleware/requirePermission.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { createOrderSchema, updateOrderStatusSchema } from '../validations/order.validation.js';

const router = Router();
router.use(authenticate);

router.get('/', requireAnyPermission('orders.read', 'dealer.dashboard'), ctrl.listOrders);
router.post('/', requireAnyPermission('orders.read'), validate(createOrderSchema), ctrl.createOrder);
router.post('/:id/status', requireAnyPermission('orders.update', 'orders.read'), validate(updateOrderStatusSchema), ctrl.updateOrderStatus);
router.get('/:id/tracking', requireAnyPermission('orders.read'), ctrl.getOrderTracking);
router.get('/:id', requireAnyPermission('orders.read'), ctrl.getOrder);

export default router;
