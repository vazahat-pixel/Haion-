/**
 * Service CRM request context & role-based access control.
 * - MASTER_ADMIN Haion users and CrmUserProfile with crmRole='Admin' get full access.
 * - Call Center, ASP, and WH users get scoped access to their role & location.
 */
import { CrmUserProfile } from '../models/crm.masters.js';

export class CrmError extends Error {
  constructor(message, statusCode = 400, errors = {}) {
    super(message);
    this.name = 'CrmError';
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

export async function crmContext(req, res, next) {
  try {
    const user = req.user;
    const profile = await CrmUserProfile.findOne({ user: user._id }).populate('location').lean();
    const isAdmin = user.role === 'MASTER_ADMIN' || profile?.crmRole === 'Admin';
    if (!isAdmin && (!profile || profile.status !== 'Active')) {
      throw new CrmError('You do not have access to the Service CRM panel', 403);
    }
    if (!isAdmin && ['Engineer', 'Pickup Boy', 'Delivery boy', 'Cordinator'].includes(profile.userType)) {
      throw new CrmError('Field staff accounts (Engineer, Pickup Boy, Delivery boy, Cordinator) use the engineer app, not this panel', 403);
    }
    const crmRole = isAdmin ? 'Admin' : profile.crmRole;
    req.crm = {
      isAdmin,
      crmRole,
      userType: profile?.userType || crmRole,
      profile,
      displayName: profile?.displayName || [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email,
      loginId: profile?.loginId || 'admin',
      location: profile?.location || null,
      locationId: profile?.location?._id ? String(profile.location._id) : null,
      pages: profile?.pages || [],
    };
    next();
  } catch (err) {
    next(err);
  }
}

export const requireCrmRole = (...roles) => (req, res, next) => {
  if (req.crm?.isAdmin || roles.includes(req.crm?.crmRole)) return next();
  return next(new CrmError('You do not have permission for this action', 403));
};
