import { z } from 'zod';

// ── Strong password rule (used for reset; login stays permissive for legacy) ──
export const strongPasswordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must not exceed 128 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character (e.g. @, #, !, $)');

export const loginSchema = z.object({
  email: z.string().email('Invalid email address').max(254),
  // Login keeps min-8 only; lockout + rate limit protect against brute force
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
  rememberMe: z.boolean().optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address').max(254),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required').max(256),
  // Apply full strong-password rule on reset / new password creation
  newPassword: strongPasswordSchema,
});
