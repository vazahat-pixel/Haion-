import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Enter email or 10-digit mobile number')
    .refine(
      (val) => z.string().email().safeParse(val).success || /^\d{10}$/.test(val.trim()) || val.trim().length >= 3,
      { message: 'Enter a valid email or 10-digit mobile number' }
    ),
  password: z.string().min(1, 'Password is required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const resetPasswordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});
