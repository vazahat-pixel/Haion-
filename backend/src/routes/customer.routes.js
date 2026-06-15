import { Router } from 'express';
import * as ctrl from '../controllers/customer.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requirePermission } from '../middleware/requirePermission.middleware.js';

const router = Router();
router.use(authenticate);

router.get('/', requirePermission('dealer.customers.read'), ctrl.listCustomers);
router.post('/', requirePermission('dealer.customers.create'), ctrl.createCustomer);
router.get('/:id', requirePermission('dealer.customers.read'), ctrl.getCustomer);
router.patch('/:id', requirePermission('dealer.customers.create'), ctrl.updateCustomer);

export default router;
