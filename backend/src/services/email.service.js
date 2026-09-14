import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  if (env.smtpUser && env.smtpPass) {
    if (env.smtpService === 'gmail' || (!env.smtpHost && env.smtpUser.includes('@gmail.com'))) {
      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: env.smtpUser,
          pass: env.smtpPass,
        },
      });
    } else {
      transporter = nodemailer.createTransport({
        host: env.smtpHost || 'smtp.gmail.com',
        port: env.smtpPort || 587,
        secure: env.smtpSecure ?? false,
        auth: { user: env.smtpUser, pass: env.smtpPass },
      });
    }
  } else if (env.smtpHost) {
    transporter = nodemailer.createTransport({
      host: env.smtpHost,
      port: env.smtpPort || 587,
      secure: env.smtpSecure ?? false,
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

  const url = resetUrl || `${env.corsOrigin}/auth/reset-password?token=${resetToken}`;
  const info = await transport.sendMail({
    from: env.smtpFrom || env.smtpUser || 'noreply@haion.com',
    to,
    subject: 'Haion ERP — Password Reset',
    text: `Reset your password: ${url}\n\nThis link expires in 1 hour.`,
    html: `<p>Reset your password:</p><p><a href="${url}">${url}</a></p><p>Expires in 1 hour.</p>`,
  });

  if (env.isDev && info.message) console.log('[email]', info.message);
  return info;
}

export async function sendDealerWelcomeEmail({ to, dealerName, dealerCode, email, password, loginUrl }) {
  const transport = getTransporter();
  const url = loginUrl || `${env.corsOrigin}/login`;
  const subject = `Welcome to Haion Dealer Network — Your Portal Login [${dealerCode}]`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f7f4f1; margin: 0; padding: 24px; color: #1c1714; }
        .container { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); border: 1px solid #e3dbd4; }
        .header { background: linear-gradient(135deg, #16131a 0%, #261f2f 100%); padding: 32px 24px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; color: #f59e0b; }
        .header p { margin: 6px 0 0; font-size: 13px; color: #b8b0bd; }
        .content { padding: 32px 28px; }
        .greeting { font-size: 17px; font-weight: 700; margin-bottom: 12px; color: #1c1714; }
        .desc { font-size: 14px; line-height: 1.6; color: #6b635c; margin-bottom: 24px; }
        .creds-box { background: #fdfaf7; border: 1px solid #f9e6d9; border-left: 4px solid #c4714f; border-radius: 8px; padding: 18px 20px; margin-bottom: 24px; }
        .cred-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; font-size: 13px; }
        .cred-row:last-child { margin-bottom: 0; }
        .cred-label { color: #8b4a32; font-weight: 600; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px; }
        .cred-val { font-family: monospace; font-weight: 700; color: #1c1714; font-size: 14px; }
        .btn-container { text-align: center; margin: 28px 0 20px; }
        .btn { display: inline-block; background: #c4714f; color: #ffffff !important; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-weight: 700; font-size: 14px; box-shadow: 0 2px 8px rgba(196, 113, 79, 0.3); }
        .footer { background: #f7f4f1; padding: 20px 24px; font-size: 11px; color: #9a918a; text-align: center; border-top: 1px solid #f0ebe6; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⚡ HAION INDUSTRIES</h1>
          <p>Official Dealer Network Portal</p>
        </div>
        <div class="content">
          <div class="greeting">Congratulations, ${dealerName}!</div>
          <p class="desc">
            Your dealership registration for <strong>${dealerName}</strong> (Dealer Code: <strong>${dealerCode}</strong>) has been processed on the Haion ERP platform.<br/><br/>
            Below are your official credentials to access the Haion Dealer Portal for inventory, order placement, billing, and customer service:
          </p>
          
          <div class="creds-box">
            <div class="cred-row">
              <span class="cred-label">Dealer Code:</span>
              <span class="cred-val">${dealerCode}</span>
            </div>
            <div class="cred-row">
              <span class="cred-label">Login ID (Email):</span>
              <span class="cred-val">${email}</span>
            </div>
            <div class="cred-row">
              <span class="cred-label">Password:</span>
              <span class="cred-val" style="color: #c4714f;">${password}</span>
            </div>
          </div>

          <div class="btn-container">
            <a href="${url}" class="btn" target="_blank">Login to Dealer Portal →</a>
          </div>

          <p style="font-size: 12px; color: #9a918a; text-align: center; margin-top: 24px;">
            For security, please change your password after logging in. If you did not request this account, please contact Haion Support immediately.
          </p>
        </div>
        <div class="footer">
          © ${new Date().getFullYear()} Haion Industries Pvt Ltd. All rights reserved.<br/>
          This is an automated notification. Please do not reply directly to this email.
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `Welcome to Haion Dealer Network, ${dealerName}!\n\n` +
    `Your dealer account has been registered successfully.\n\n` +
    `Dealer Code: ${dealerCode}\n` +
    `Login Email: ${email}\n` +
    `Password: ${password}\n\n` +
    `Login URL: ${url}\n\n` +
    `Please change your password upon your first login.`;

  if (!transport) {
    console.log(`[email:mocked] Welcome email to ${to}: Code=${dealerCode}, Pass=${password}`);
    return { mocked: true };
  }

  try {
    const info = await transport.sendMail({
      from: env.smtpFrom || env.smtpUser || 'noreply@haion.com',
      to,
      subject,
      html,
      text,
    });
    console.log(`[email:sent] Welcome email sent to ${to}`);
    return info;
  } catch (err) {
    console.error(`[email:error] Failed sending welcome email to ${to}:`, err.message);
    return { error: err.message };
  }
}

export async function sendEmail({ to, subject, html, text }) {
  const transport = getTransporter();
  if (!transport) {
    if (env.isDev) console.log(`[email] To ${to}: ${subject}`);
    return { mocked: true };
  }
  return transport.sendMail({
    from: env.smtpFrom || env.smtpUser || 'noreply@haion.com',
    to,
    subject,
    html,
    text: text || subject,
  });
}
