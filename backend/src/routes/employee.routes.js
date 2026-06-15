import { Router } from 'express';
import * as ctrl from '../controllers/employee.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requirePermission } from '../middleware/requirePermission.middleware.js';

const router = Router();
router.use(authenticate);

router.get('/hierarchy', requirePermission('employees.read'), ctrl.getHierarchy);
router.get('/team/:managerId', requirePermission('employees.read'), ctrl.getTeam);
router.get('/', requirePermission('employees.read'), ctrl.listEmployees);
router.post('/', requirePermission('employees.create'), ctrl.createEmployee);
router.get('/:id', requirePermission('employees.read'), ctrl.getEmployee);
router.patch('/:id', requirePermission('employees.update'), ctrl.updateEmployee);

export default router;
