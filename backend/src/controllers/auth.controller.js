import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../config/env.js';
import { getPermissionsForRole } from '../services/permission.service.js';
import User from '../models/User.model.js';
import { sendSuccess, sendError, sendCreated } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { logAudit } from '../services/audit.service.js';

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

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password +refreshTokens');
  if (!user || !user.isActive) {
    return sendError(res, { message: 'Invalid email or password', statusCode: 401 });
  }

  const valid = await user.comparePassword(password);
  if (!valid) {
    return sendError(res, { message: 'Invalid email or password', statusCode: 401 });
  }

  const accessToken = signAccessToken(user._id);
  const refreshToken = signRefreshToken(user._id);

  user.refreshTokens = [
    ...(user.refreshTokens || []).slice(-4),
    { token: refreshToken, createdAt: new Date() },
  ];
  user.lastLogin = new Date();
  await user.save();

  await logAudit({
    action: 'LOGIN',
    user: user.email,
    userId: user._id,
    module: 'Auth',
    ip: req.ip || req.headers['x-forwarded-for'] || '',
  });

  setRefreshCookie(res, refreshToken);

  const userData = user.toAuthJSON();
  userData.permissions = await getPermissionsForRole(user.role);

  return sendSuccess(res, {
    data: { user: userData, accessToken },
    message: 'Login successful',
  });
});

export const logout = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;

  if (refreshToken && req.user) {
    const user = await User.findById(req.user._id).select('+refreshTokens');
    if (user) {
      user.refreshTokens = user.refreshTokens.filter((t) => t.token !== refreshToken);
      await user.save();
    }
  }

  res.clearCookie('refreshToken', { path: '/api/auth' });
  return sendSuccess(res, { message: 'Logged out successfully' });
});

export const refreshToken = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) {
    return sendError(res, { message: 'Refresh token required', statusCode: 401 });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, env.jwtRefreshSecret);
  } catch {
    return sendError(res, { message: 'Invalid refresh token', statusCode: 401 });
  }

  const user = await User.findById(decoded.userId).select('+refreshTokens');
  if (!user || !user.isActive) {
    return sendError(res, { message: 'User not found', statusCode: 401 });
  }

  const stored = user.refreshTokens?.find((t) => t.token === token);
  if (!stored) {
    return sendError(res, { message: 'Refresh token revoked', statusCode: 401 });
  }

  const accessToken = signAccessToken(user._id);
  const newRefreshToken = signRefreshToken(user._id);

  await User.updateOne(
    { _id: user._id },
    { 
      $pull: { refreshTokens: { token: token } },
    }
  );
  
  await User.updateOne(
    { _id: user._id },
    { 
      $push: { refreshTokens: { token: newRefreshToken, createdAt: new Date() } }
    }
  );

  // We need to fetch the updated user or manually update the document for the response
  user.refreshTokens = user.refreshTokens.filter((t) => t.token !== token);
  user.refreshTokens.push({ token: newRefreshToken, createdAt: new Date() });
  setRefreshCookie(res, newRefreshToken);

  const userData = user.toAuthJSON();
  userData.permissions = await getPermissionsForRole(user.role);

  return sendSuccess(res, {
    data: { user: userData, accessToken },
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
    const { sendPasswordResetEmail } = await import('../services/email.service.js');
    await sendPasswordResetEmail({ to: email, resetToken });
  }

  return sendSuccess(res, {
    message: 'If an account exists with this email, a reset link has been sent.',
  });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;
  const hashed = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashed,
    passwordResetExpires: { $gt: Date.now() },
  }).select('+password');

  if (!user) {
    return sendError(res, { message: 'Invalid or expired reset token', statusCode: 400 });
  }

  user.password = await User.hashPassword(newPassword);
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  user.refreshTokens = [];
  await user.save();

  return sendSuccess(res, { message: 'Password reset successful' });
});
