import { Router } from 'express';
import * as ctrl from '../controllers/notification.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();
router.use(authenticate);

router.get('/unread-count', ctrl.getUnreadCount);
router.post('/read-all', ctrl.markAllRead);

// Push notification devices — every authenticated panel may register its own.
router.get('/push-status', ctrl.getPushStatus);
router.get('/devices', ctrl.listDevices);
router.post('/devices', ctrl.registerDevice);
router.delete('/devices', ctrl.unregisterDevice);
router.post('/test-push', ctrl.sendTestPush);

router.get('/', ctrl.listNotifications);
router.post('/:id/read', ctrl.markRead);

export default router;
