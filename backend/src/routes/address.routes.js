import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import * as ctrl from '../controllers/address.controller.js';

const router = Router();

router.use(authenticate);
router.get('/states', ctrl.listStates);
router.get('/pincode/:pin', ctrl.lookupPincode);

export default router;
