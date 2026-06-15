import { Router } from 'express';
import * as productController from '../controllers/product.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/rbac.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { createProductSchema, updateProductSchema, createTierSchema, updateTierSchema } from '../validations/product.validation.js';
import { ROLES } from '../config/constants.js';

const router = Router();
const adminRoles = [ROLES.MASTER_ADMIN, ROLES.WAREHOUSE_MANAGER];

router.use(authenticate);

router.get('/categories/list', productController.getCategories);
router.get('/tiers/all', productController.listAllTiers);
router.get('/tiers/:tierId', productController.getTier);
router.get('/', productController.listProducts);
router.get('/:id', productController.getProduct);
router.post('/', requireRole(...adminRoles), validate(createProductSchema), productController.createProduct);
router.put('/:id', requireRole(...adminRoles), validate(updateProductSchema), productController.updateProduct);
router.patch('/:id/status', requireRole(...adminRoles), productController.updateProductStatus);

router.get('/:id/tiers', productController.listTiers);
router.post('/:id/tiers', requireRole(...adminRoles), validate(createTierSchema), productController.createTier);
router.put('/:id/tiers/:tierId', requireRole(...adminRoles), validate(updateTierSchema), productController.updateTier);
router.patch('/:id/tiers/:tierId/status', requireRole(...adminRoles), productController.updateTierStatus);

export default router;
