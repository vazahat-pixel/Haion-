import { Router } from 'express';
import * as ctrl from '../controllers/expense.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requirePermission } from '../middleware/requirePermission.middleware.js';

const router = Router();
router.use(authenticate);

router.get('/', requirePermission('expenses.read'), ctrl.listExpenses);
router.post('/', requirePermission('expenses.create'), ctrl.createExpense);
router.get('/:id', requirePermission('expenses.read'), ctrl.getExpense);
router.patch('/:id/status', requirePermission('approvals.update'), ctrl.updateExpenseStatus);

export default router;
