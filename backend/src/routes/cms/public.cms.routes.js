import { Router } from 'express';
import { cmsCacheMiddleware, registerSseClient } from '../../middleware/cmsCache.middleware.js';
import * as cms from '../../services/cms.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/apiResponse.js';

const router = Router();

// ── Server-Sent Events — real-time CMS update push ────────────────────────────
// Landing page subscribes here; whenever admin saves any CMS content the backend
// pushes a "cms-updated" event so the page refreshes instantly (no polling delay).
router.get('/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // disable nginx buffering
  res.flushHeaders();

  // Send initial heartbeat
  res.write(': connected\n\n');

  const unregister = registerSseClient(res);

  // Heartbeat every 25s to keep connection alive through proxies
  const heartbeat = setInterval(() => {
    try { res.write(': heartbeat\n\n'); } catch { /* ignore */ }
  }, 25_000);

  req.on('close', () => {
    clearInterval(heartbeat);
    unregister();
  });
});

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
