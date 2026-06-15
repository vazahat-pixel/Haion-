import { Router } from 'express';
import * as ctrl from '../controllers/upload.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { uploadAny } from '../middleware/upload.middleware.js';

const router = Router();
router.use(authenticate);

router.post('/', uploadAny.single('file'), ctrl.uploadFile);

export default router;
