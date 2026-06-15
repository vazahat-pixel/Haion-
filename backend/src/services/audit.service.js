import AuditLog from '../models/AuditLog.model.js';

export async function logAudit({ action, user, userId, module, ip, resourceId, metadata }) {
  try {
    await AuditLog.create({
      action,
      user: user || 'system',
      userId,
      module,
      ip: ip || '',
      resourceId,
      metadata,
    });
  } catch (err) {
    console.error('Audit log failed:', err.message);
  }
}
