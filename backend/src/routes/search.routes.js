import { Router } from 'express';
import * as ctrl from '../controllers/search.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();
router.use(authenticate);

router.get('/', ctrl.globalSearch);

export default router;
