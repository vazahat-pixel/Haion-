import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../config/env.js';
import { getPermissionsForRole } from '../services/permission.service.js';
import User from '../models/User.model.js';
import { sendSuccess, sendError, sendCreated } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { logAudit } from '../services/audit.service.js';

// ── Account lockout constants ─────────────────────────────────────────────────
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

function signAccessToken(userId) {
  return jwt.sign({ userId }, env.jwtAccessSecret, { expiresIn: env.jwtAccessExpires });
}

function signRefreshToken(userId) {
  return jwt.sign({ userId }, env.jwtRefreshSecret, { expiresIn: env.jwtRefreshExpires });
}

function setRefreshCookie(res, token) {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: env.nodeEnv === 'production',
    sameSite: env.isDev ? 'lax' : 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/api/auth',
  });
}

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() })
    .select('+password +refreshTokens +failedLoginAttempts +lockedUntil');

  // ── Generic error for both "not found" and "wrong password" (same message) ──
  // This prevents user enumeration
  const genericError = () =>
    sendError(res, { message: 'Invalid email or password', statusCode: 401 });

  if (!user || !user.isActive) {
    return genericError();
  }

  // ── Account lockout check ─────────────────────────────────────────────────
  if (user.lockedUntil && user.lockedUntil > Date.now()) {
    const minutesLeft = Math.ceil((user.lockedUntil - Date.now()) / 60000);
    await logAudit({
      action: 'LOGIN_BLOCKED_LOCKOUT',
      user: user.email,
      userId: user._id,
      module: 'Auth',
      ip: req.ip || req.headers['x-forwarded-for'] || '',
    });
    return sendError(res, {
      message: `Account temporarily locked due to too many failed attempts. Try again in ${minutesLeft} minute(s).`,
      statusCode: 429,
    });
  }

  const valid = await user.comparePassword(password);

  if (!valid) {
    // ── Increment failure counter ─────────────────────────────────────────
    user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
    if (user.failedLoginAttempts >= MAX_LOGIN_ATTEMPTS) {
      user.lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);
      await logAudit({
        action: 'LOGIN_LOCKOUT_TRIGGERED',
        user: user.email,
        userId: user._id,
        module: 'Auth',
        ip: req.ip || req.headers['x-forwarded-for'] || '',
        metadata: { attempts: user.failedLoginAttempts },
      });
    }
    await user.save();
    return genericError();
  }

  // ── Success: reset lockout counters ──────────────────────────────────────
  user.failedLoginAttempts = 0;
  user.lockedUntil = null;

  const accessToken = signAccessToken(user._id);
  const rawRefreshToken = signRefreshToken(user._id);
  const tokenHash = User.hashRefreshToken(rawRefreshToken);

  // Store hashed token (not the raw JWT) — protects against DB compromise
  user.refreshTokens = [
    ...(user.refreshTokens || []).filter((t) => t && t.tokenHash).slice(-4),
    { tokenHash, createdAt: new Date() },
  ];
  user.lastLogin = new Date();
  
  let retries = 3;
  while (retries > 0) {
    try {
      await user.save();
      break;
    } catch (err) {
      if (err.name === 'VersionError' && retries > 1) {
        retries--;
        const freshUser = await User.findById(user._id).select('+password +refreshTokens +failedLoginAttempts +lockedUntil');
        if (freshUser) {
          freshUser.failedLoginAttempts = 0;
          freshUser.lockedUntil = null;
          freshUser.refreshTokens = [
            ...(freshUser.refreshTokens || []).filter((t) => t && t.tokenHash).slice(-4),
            { tokenHash, createdAt: new Date() },
          ];
          freshUser.lastLogin = new Date();
          user = freshUser;
        }
      } else {
        throw err;
      }
    }
  }

  await logAudit({
    action: 'LOGIN',
    user: user.email,
    userId: user._id,
    module: 'Auth',
    ip: req.ip || req.headers['x-forwarded-for'] || '',
  });

  setRefreshCookie(res, rawRefreshToken);

  const userData = user.toAuthJSON();
  userData.permissions = await getPermissionsForRole(user.role);

  return sendSuccess(res, {
    data: { user: userData, accessToken },
    message: 'Login successful',
  });
});

export const logout = asyncHandler(async (req, res) => {
  const rawToken = req.cookies?.refreshToken;

  if (rawToken && req.user) {
    const tokenHash = User.hashRefreshToken(rawToken);
    const user = await User.findById(req.user._id).select('+refreshTokens');
    if (user) {
      user.refreshTokens = (user.refreshTokens || []).filter((t) => t && t.tokenHash && t.tokenHash !== tokenHash);
      await user.save();
    }
  }

  res.clearCookie('refreshToken', { path: '/api/auth' });
  return sendSuccess(res, { message: 'Logged out successfully' });
});

export const refreshToken = asyncHandler(async (req, res) => {
  const rawToken = req.cookies?.refreshToken;
  if (!rawToken) {
    return sendError(res, { message: 'Refresh token required', statusCode: 401 });
  }

  let decoded;
  try {
    decoded = jwt.verify(rawToken, env.jwtRefreshSecret);
  } catch {
    return sendError(res, { message: 'Invalid refresh token', statusCode: 401 });
  }

  const user = await User.findById(decoded.userId).select('+refreshTokens');
  if (!user || !user.isActive) {
    return sendError(res, { message: 'User not found', statusCode: 401 });
  }

  // ── Compare hashed token against stored hashes ────────────────────────────
  const incomingHash = User.hashRefreshToken(rawToken);
  const stored = user.refreshTokens?.find((t) => t.tokenHash === incomingHash);
  if (!stored) {
    // Token not found — possible token reuse / theft; invalidate ALL sessions atomically
    await User.findByIdAndUpdate(user._id, { $set: { refreshTokens: [] } });
    await logAudit({
      action: 'REFRESH_TOKEN_REUSE_DETECTED',
      user: user.email,
      userId: user._id,
      module: 'Auth',
      ip: req.ip || req.headers['x-forwarded-for'] || '',
    });
    return sendError(res, { message: 'Refresh token revoked', statusCode: 401 });
  }

  const newAccessToken = signAccessToken(user._id);
  const newRawRefreshToken = signRefreshToken(user._id);
  const newTokenHash = User.hashRefreshToken(newRawRefreshToken);

  // Rotate atomically: remove old hash, add new hash (one-time use tokens).
  // Using findOneAndUpdate avoids Mongoose VersionError when concurrent refresh
  // requests hit the same user document (e.g. multiple tabs, rapid Ctrl+R).
  await User.findOneAndUpdate(
    { _id: user._id, 'refreshTokens.tokenHash': incomingHash },
    {
      $pull: { refreshTokens: { tokenHash: incomingHash } },
    }
  );
  await User.findByIdAndUpdate(user._id, {
    $push: { refreshTokens: { tokenHash: newTokenHash, createdAt: new Date() } },
  });

  setRefreshCookie(res, newRawRefreshToken);

  const userData = user.toAuthJSON();
  userData.permissions = await getPermissionsForRole(user.role);

  return sendSuccess(res, {
    data: { user: userData, accessToken: newAccessToken },
    message: 'Token refreshed',
  });
});

export const getMe = asyncHandler(async (req, res) => {
  const userData = req.user.toAuthJSON();
  userData.permissions = await getPermissionsForRole(req.user.role);
  return sendSuccess(res, { data: userData });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email: email.toLowerCase() });

  if (user) {
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    // SECURITY: In dev, log to console ONLY — never include in API response
    if (env.isDev) {
      console.log(`[DEV ONLY] Password reset token for ${email}: ${resetToken}`);
    }

    const { sendPasswordResetEmail } = await import('../services/email.service.js');
    await sendPasswordResetEmail({ to: email, resetToken });
  }

  // Always return the same message to prevent user enumeration
  return sendSuccess(res, {
    message: 'If an account exists with this email, a reset link has been sent.',
  });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;
  const hashedInput = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedInput,
    passwordResetExpires: { $gt: Date.now() },
  }).select('+password +passwordResetToken +passwordResetExpires');

  if (!user) {
    return sendError(res, { message: 'Invalid or expired reset token', statusCode: 400 });
  }

  // ── Constant-time comparison to prevent timing attacks ───────────────────
  const storedBuffer = Buffer.from(user.passwordResetToken, 'hex');
  const inputBuffer = Buffer.from(hashedInput, 'hex');

  let tokenValid = false;
  try {
    tokenValid = storedBuffer.length === inputBuffer.length &&
      crypto.timingSafeEqual(storedBuffer, inputBuffer);
  } catch {
    tokenValid = false;
  }

  if (!tokenValid) {
    return sendError(res, { message: 'Invalid or expired reset token', statusCode: 400 });
  }

  user.password = await User.hashPassword(newPassword);
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  // Invalidate all sessions on password change
  user.refreshTokens = [];
  user.failedLoginAttempts = 0;
  user.lockedUntil = null;
  await user.save();

  return sendSuccess(res, { message: 'Password reset successful. Please log in again.' });
});
