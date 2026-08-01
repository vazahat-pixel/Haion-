import { Router } from 'express';
import * as ctrl from '../controllers/payment.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requirePermission } from '../middleware/requirePermission.middleware.js';

const router = Router();
router.use(authenticate);

// ── Static routes FIRST (must be before /:id) ────────────────────────────────

// Next payment number
router.get('/next-number', requirePermission('purchases.read'), ctrl.getNextPaymentNo);

// List all payments (filter by type=PAYMENT_IN|PAYMENT_OUT)
router.get('/', requirePermission('purchases.read'), ctrl.listPayments);

// Create Payment In
router.post('/in', requirePermission('purchases.create'), ctrl.createPaymentIn);

// Create Payment Out
router.post('/out', requirePermission('purchases.create'), ctrl.createPaymentOut);

// Party ledger (statement) — must be before /:id
router.get('/ledger/:partyId', requirePermission('purchases.read'), ctrl.getPartyLedger);

// Pending invoices for party (for settlement UI) — must be before /:id
router.get('/pending-invoices/:partyId', requirePermission('purchases.read'), ctrl.getPartyPendingInvoices);

// Pending purchases for party (for settlement UI) — must be before /:id
router.get('/pending-purchases/:partyId', requirePermission('purchases.read'), ctrl.getPartyPendingPurchases);

// ── Dynamic :id routes LAST ───────────────────────────────────────────────────

// Get single payment
router.get('/:id', requirePermission('purchases.read'), ctrl.getPayment);

// Cancel payment
router.post('/:id/cancel', requirePermission('purchases.create'), ctrl.cancelPayment);

export default router;
