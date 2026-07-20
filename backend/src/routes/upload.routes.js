import { Router } from 'express';
import * as ctrl from '../controllers/upload.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { uploadImage } from '../middleware/upload.middleware.js';

const router = Router();
router.use(authenticate);

// SECURITY: Only images allowed (jpeg/png/webp, max 2MB)
// uploadAny has been removed — see upload.middleware.js
router.post('/', uploadImage.single('file'), ctrl.uploadFile);

export default router;
