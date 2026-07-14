import { Router } from 'express';
import { cmsCacheMiddleware } from '../../middleware/cmsCache.middleware.js';
import * as cms from '../../services/cms.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/apiResponse.js';

const router = Router();

router.get(
  '/settings',
  cmsCacheMiddleware(() => 'cms:settings'),
  asyncHandler(async (_req, res) => {
    return sendSuccess(res, { data: await cms.getOrCreateSettings() });
  })
);

router.get(
  '/page/:page',
  cmsCacheMiddleware((req) => `cms:page:${req.params.page}`),
  asyncHandler(async (req, res) => {
    const data = await cms.getPublicPageBundle(req.params.page);
    return sendSuccess(res, { data });
  })
);

router.get(
  '/page/:page/seo',
  cmsCacheMiddleware((req) => `cms:seo:${req.params.page}`),
  asyncHandler(async (req, res) => {
    const data = await cms.getPageSeo(req.params.page);
    return sendSuccess(res, { data });
  })
);

router.get(
  '/:collection',
  cmsCacheMiddleware((req) => `cms:collection:${req.params.collection}`),
  asyncHandler(async (req, res) => {
    const data = await cms.listCollection(req.params.collection, { visibleOnly: true });
    return sendSuccess(res, { data });
  })
);

export default router;
