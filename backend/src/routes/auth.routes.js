import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as authController from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { loginSchema, forgotPasswordSchema, resetPasswordSchema } from '../validations/auth.validation.js';

const router = Router();

// ── Brute-force protection: strict per-IP+email limiter on login ──────────────
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,    // 15 minutes window
  max: 10,                       // 10 attempts per IP per window
  standardHeaders: true,
  legacyHeaders: false,
  // Key by IP + email body so distributed attacks per-account are caught
  keyGenerator: (req) => `${req.ip}:${(req.body?.email || '').toLowerCase()}`,
  message: {
    success: false,
    message: 'Too many login attempts from this IP. Please try again in 15 minutes.',
  },
  skipSuccessfulRequests: true,  // Don't count successful logins against limit
});

// ── Rate limit forgot-password to prevent email bombing + user enumeration ────
const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,   // 1 hour window
  max: 3,                       // 3 reset requests per IP per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many password reset requests. Please try again in 1 hour.',
  },
});

// ── Reset password limiter ────────────────────────────────────────────────────
const resetPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many reset attempts. Please try again later.',
  },
});

router.post('/login', loginLimiter, validate(loginSchema), authController.login);
router.post('/logout', authenticate, authController.logout);
router.post('/refresh-token', authController.refreshToken);
router.post('/forgot-password', forgotPasswordLimiter, validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', resetPasswordLimiter, validate(resetPasswordSchema), authController.resetPassword);
router.get('/me', authenticate, authController.getMe);

export default router;
