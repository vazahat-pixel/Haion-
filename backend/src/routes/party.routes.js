import { Router } from 'express';
import * as ctrl from '../controllers/party.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requirePermission } from '../middleware/requirePermission.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { createPartySchema, updatePartySchema } from '../validations/party.validation.js';

const router = Router();
router.use(authenticate);

router.get('/', requirePermission('parties.read'), ctrl.listParties);
router.post('/', requirePermission('parties.create'), validate(createPartySchema), ctrl.createParty);
router.get('/:id', requirePermission('parties.read'), ctrl.getParty);
router.patch('/:id', requirePermission('parties.update'), validate(updatePartySchema), ctrl.updateParty);
router.patch('/:id/status', requirePermission('parties.update'), ctrl.updatePartyStatus);

export default router;
