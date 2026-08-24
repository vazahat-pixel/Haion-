import { Router } from 'express';
import * as ctrl from '../controllers/companyLedger.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { ROLES } from '../config/constants.js';

const router = Router();

// Only admin-level roles can view company ledger
const adminRoles = [ROLES.MASTER_ADMIN, ROLES.WAREHOUSE_MANAGER, ROLES.MANAGER];

router.use(authenticate, authorize(adminRoles));

router.get('/', ctrl.listCompanyLedger);
router.get('/summary', ctrl.getCompanyLedgerSummary);
router.get('/types', ctrl.getTxnTypes);
router.get('/reconciliation', ctrl.getReconciliation);
router.get('/party/:partyId', ctrl.getPartyLinkedEntries);
router.post('/', ctrl.createManualEntry);
router.patch('/:id/void', ctrl.voidEntry);

export default router;
