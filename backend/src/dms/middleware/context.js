/**
 * DMS request context.
 * - MASTER_ADMIN Haion users and DMS profiles of type "Admin" get full access.
 * - Other DMS users need a DmsProfile; they see data of their own location and
 *   every location below it in the hierarchy, and only the pages granted to them.
 */
import { DmsProfile, DmsLocation } from '../models/master.models.js';
import { DmsError } from '../services/core.service.js';
import { ENTITY_PAGES } from '../entities.config.js';

/** Page keys (mirrors the reference sidebar). Used for per-user page rights. */
export const DMS_PAGES = [...new Set([
  'home', 'dash_yearly', 'dash_monthly', 'dash_inventory', 'dash_po', 'dash_sale',
  'm_account', 'm_users', 'm_brand', 'm_city', 'm_color', 'm_coupon', 'm_courier', 'm_customer',
  'm_location', 'm_othertax', 'm_parameter', 'm_price', 'm_category', 'm_delivery', 'm_product',
  'm_subcategory', 'm_scheme', 'm_serial_activation', 'm_specification', 'm_state', 'm_tax', 'm_vendor',
  'r_collection', 'r_inventory', 'r_aging', 'r_ledger', 'r_party_master', 'r_payment', 'r_po', 'r_return',
  'r_sale', 'r_serial_activation', 'r_stock_ledger', 'r_vendor',
  'dispatch', 'corporate', 'serial_track_multi', 'retail', 'serial_track', 'stn_distribution',
  'stock_transfer', 'stock_transfer_approval', 'jobwork',
  'local_purchase', 'opening', 'po', 'po_approval', 'vendor_po',
  'customer_return', 'purchase_return', 'return_approval', 'vendor_return',
  'acc_adjust', 'payment_approval', 'payment_receive', 'receive', 'receive_jobwork',
  'dash_lead', 'r_beat', 'r_isd', 'r_price_drop', 'rp_attendance', 'rp_employee', 'rp_leave', 'rp_other', 'rp_salary', 'rp_slip',
  'hr_attendance', 'hr_salary_gen', 'hr_myteams',
  ...ENTITY_PAGES,
])];

async function descendantsOf(rootId) {
  const ids = [String(rootId)];
  let frontier = [rootId];
  for (let depth = 0; depth < 8 && frontier.length; depth += 1) {
    // eslint-disable-next-line no-await-in-loop
    const kids = await DmsLocation.find({ parent: { $in: frontier } }).select('_id').lean();
    frontier = kids.map((k) => k._id);
    ids.push(...frontier.map(String));
  }
  return ids;
}

export async function dmsContext(req, res, next) {
  try {
    const user = req.user;
    const profile = await DmsProfile.findOne({ user: user._id }).populate('location').lean();
    const isAdmin = user.role === 'MASTER_ADMIN' || profile?.userType === 'Admin';
    if (!isAdmin && (!profile || profile.status !== 'Active')) {
      throw new DmsError('You do not have access to the Distributor panel', 403);
    }
    let allowed = isAdmin ? null : profile.location ? await descendantsOf(profile.location._id) : [];
    // "Update User Permission" → Region and Location Type rights narrow the locations a non-admin user can see.
    // A user with a location keeps it and sees the matching locations below it; a user without a location
    // (e.g. a Sales Head) sees every location matching the ticked regions / location types.
    const sc = profile?.scopes;
    if (!isAdmin && (sc?.regions?.length || sc?.locationTypes?.length)) {
      const q = {};
      if (sc.regions?.length) q.region = { $in: sc.regions };
      if (sc.locationTypes?.length) q.locationType = { $in: sc.locationTypes };
      const match = new Set((await DmsLocation.find(q).select('_id').lean()).map((l) => String(l._id)));
      const own = profile.location ? String(profile.location._id) : null;
      allowed = profile.location ? allowed.filter((id) => id === own || match.has(id)) : [...match];
    }
    req.dms = {
      isAdmin,
      profile,
      displayName: profile?.displayName || [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email,
      loginId: profile?.loginId || 'admin',
      location: profile?.location || null,
      allowedLocationIds: allowed, // null = all
      pages: isAdmin && !(profile?.pages?.length) ? DMS_PAGES : profile?.pages || [],
      canSee(locId) {
        return allowed === null || allowed.includes(String(locId));
      },
    };
    next();
  } catch (err) {
    next(err);
  }
}

export const requirePage = (...keys) => (req, res, next) => {
  if (req.dms?.isAdmin || keys.some((k) => req.dms?.pages?.includes(k))) return next();
  return next(new DmsError('You do not have permission for this page', 403));
};

/** Mongo filter restricting docs to the caller's locations. `fields` are paths holding a location id. */
export function scopeFilter(req, fields) {
  const allowed = req.dms.allowedLocationIds;
  if (allowed === null) return {};
  return { $or: fields.map((f) => ({ [f]: { $in: allowed } })) };
}

export function assertCanSee(req, ...locIds) {
  for (const id of locIds) {
    if (id && !req.dms.canSee(id)) throw new DmsError('Location is outside your access', 403);
  }
}
