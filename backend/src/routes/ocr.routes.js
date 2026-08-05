import { Router } from 'express';
import * as ctrl from '../controllers/ocr.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { uploadImage } from '../middleware/upload.middleware.js';

const router = Router();
router.use(authenticate);

// POST /api/ocr/extract — upload image, get extracted text back
router.post('/extract', uploadImage.single('file'), ctrl.extractText);

export default router;
