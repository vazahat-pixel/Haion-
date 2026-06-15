import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  if (env.smtpHost) {
    transporter = nodemailer.createTransport({
      host: env.smtpHost,
      port: env.smtpPort,
      secure: env.smtpSecure,
      auth: env.smtpUser ? { user: env.smtpUser, pass: env.smtpPass } : undefined,
    });
  } else if (env.isDev) {
    transporter = nodemailer.createTransport({ jsonTransport: true });
  }
  return transporter;
}

export async function sendPasswordResetEmail({ to, resetToken, resetUrl }) {
  const transport = getTransporter();
  if (!transport) {
    if (env.isDev) console.log(`[email] Password reset for ${to}: token=${resetToken}`);
    return { mocked: true };
  }

  const url = resetUrl || `${env.corsOrigin}/reset-password?token=${resetToken}`;
  const info = await transport.sendMail({
    from: env.smtpFrom || 'noreply@haion.com',
    to,
    subject: 'Haion ERP — Password Reset',
    text: `Reset your password: ${url}\n\nThis link expires in 1 hour.`,
    html: `<p>Reset your password:</p><p><a href="${url}">${url}</a></p><p>Expires in 1 hour.</p>`,
  });

  if (env.isDev && info.message) console.log('[email]', info.message);
  return info;
}
