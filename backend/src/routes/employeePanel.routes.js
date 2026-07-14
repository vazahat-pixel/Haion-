import { Router } from 'express';
import * as ctrl from '../controllers/employeePanel.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireAnyPermission } from '../middleware/requirePermission.middleware.js';

const router = Router();
router.use(authenticate);

const employeeAccess = requireAnyPermission(
  'employee.dealers.read',
  'employee.analytics.read',
  'employee.performance.read',
  'team.read'
);

router.get('/assigned-dealers', employeeAccess, ctrl.listAssignedDealers);
router.get('/team-dealers', employeeAccess, ctrl.listTeamDealers);
router.get('/assigned-dealers/:id', employeeAccess, ctrl.getAssignedDealer);
router.get('/performance', employeeAccess, ctrl.getPerformance);
router.get('/dealer-analytics', requireAnyPermission('employee.analytics.read', 'team.read'), ctrl.getDealerAnalytics);

export default router;
