import { Router } from 'express';
import * as ctrl from '../controllers/catalog.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requirePermission } from '../middleware/requirePermission.middleware.js';

const categoryRouter = Router();
categoryRouter.use(authenticate);
categoryRouter.get('/', requirePermission('categories.read'), ctrl.listCategories);
categoryRouter.post('/', requirePermission('categories.create'), ctrl.createCategory);
categoryRouter.get('/:id', requirePermission('categories.read'), ctrl.getCategory);
categoryRouter.patch('/:id', requirePermission('categories.create'), ctrl.updateCategory);

const brandRouter = Router();
brandRouter.use(authenticate);
brandRouter.get('/', requirePermission('brands.read'), ctrl.listBrands);
brandRouter.post('/', requirePermission('brands.create'), ctrl.createBrand);
brandRouter.get('/:id', requirePermission('brands.read'), ctrl.getBrand);
brandRouter.patch('/:id', requirePermission('brands.create'), ctrl.updateBrand);

export { categoryRouter, brandRouter };
