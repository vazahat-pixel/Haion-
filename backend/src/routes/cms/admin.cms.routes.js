import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/requirePermission.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import {
  updateSettingsSchema,
  upsertSectionSchema,
  reorderSectionsSchema,
  collectionBodySchema,
  reorderCollectionSchema,
} from '../../validations/cms.validation.js';
import * as ctrl from '../../controllers/cms/settings.controller.js';
import { cmsCollectionTypes } from '../../models/cms/shared.cms.schema.js';

const router = Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(__dirname, '../../../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const cmsUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
      const unique = `cms-${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `${unique}${path.extname(file.originalname)}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/gif'];
    cb(null, allowed.includes(file.mimetype));
  },
});

router.use(authenticate);

router.get('/settings', requirePermission('cms.read'), ctrl.getSettings);
router.put('/settings', requirePermission('cms.update'), validate(updateSettingsSchema), ctrl.updateSettings);
router.put('/settings/theme', requirePermission('cms.update'), ctrl.updateTheme);
router.put('/settings/navbar', requirePermission('cms.update'), ctrl.updateNavbar);
router.put('/settings/footer', requirePermission('cms.update'), ctrl.updateFooter);
router.put('/settings/seo', requirePermission('cms.update'), ctrl.updateSeoDefaults);
router.put('/settings/maintenance', requirePermission('cms.update'), ctrl.updateMaintenance);

router.get('/sections/:page', requirePermission('cms.read'), ctrl.listSections);
router.get('/sections/:page/:sectionKey', requirePermission('cms.read'), ctrl.getSection);
router.put('/sections/:page/:sectionKey', requirePermission('cms.update'), validate(upsertSectionSchema), ctrl.upsertSection);
router.patch('/sections/:page/:sectionKey/toggle', requirePermission('cms.update'), ctrl.toggleSection);
router.put('/sections/reorder', requirePermission('cms.update'), validate(reorderSectionsSchema), ctrl.reorderSections);

for (const collection of cmsCollectionTypes) {
  router.get(`/${collection}`, requirePermission('cms.read'), (req, res, next) => {
    req.params.collection = collection;
    return ctrl.listCollection(req, res, next);
  });
  router.post(`/${collection}`, requirePermission('cms.create'), validate(collectionBodySchema), (req, res, next) => {
    req.params.collection = collection;
    return ctrl.createCollectionItem(req, res, next);
  });
  router.put(`/${collection}/reorder`, requirePermission('cms.update'), validate(reorderCollectionSchema), (req, res, next) => {
    req.params.collection = collection;
    return ctrl.reorderCollection(req, res, next);
  });
  router.get(`/${collection}/:id`, requirePermission('cms.read'), (req, res, next) => {
    req.params.collection = collection;
    return ctrl.getCollectionItem(req, res, next);
  });
  router.put(`/${collection}/:id`, requirePermission('cms.update'), validate(collectionBodySchema.partial()), (req, res, next) => {
    req.params.collection = collection;
    return ctrl.updateCollectionItem(req, res, next);
  });
  router.delete(`/${collection}/:id`, requirePermission('cms.delete'), (req, res, next) => {
    req.params.collection = collection;
    return ctrl.deleteCollectionItem(req, res, next);
  });
  router.patch(`/${collection}/:id/toggle`, requirePermission('cms.update'), (req, res, next) => {
    req.params.collection = collection;
    return ctrl.toggleCollectionItem(req, res, next);
  });
}

router.post('/upload/image', requirePermission('cms.update'), cmsUpload.single('file'), ctrl.uploadImage);
router.post('/upload/images', requirePermission('cms.update'), cmsUpload.array('files', 10), async (req, res, next) => {
  try {
    const files = (req.files || []).map((f) => ({ url: `/uploads/${f.filename}`, publicId: f.filename, alt: '' }));
    return res.json({ success: true, data: files, message: 'Images uploaded' });
  } catch (err) {
    next(err);
  }
});
router.delete('/upload/:publicId', requirePermission('cms.delete'), ctrl.deleteUpload);

router.post('/sync', requirePermission('cms.update'), ctrl.syncFromSeed);

export default router;
