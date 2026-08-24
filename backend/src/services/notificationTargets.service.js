/**
 * notificationTargets.service.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Turns a business record (a complaint's customer, an order's dealer, a job
 * card's service centre) into the User ids that should be notified.
 *
 * Customers are not hard-linked to a login: the customer portal matches them by
 * email, falling back to phone (see customerPanel.controller.js), so the same
 * rule is applied here in reverse.
 *
 * Every lookup returns [] rather than throwing — a missing recipient must never
 * break the action that raised the notification.
 */
import User from '../models/User.model.js';
import Customer from '../models/Customer.model.js';
import { ROLES } from '../config/constants.js';

const ACTIVE = { isActive: { $ne: false } };

async function idsFrom(filter) {
  try {
    const rows = await User.find({ ...filter, ...ACTIVE }, { _id: 1 }).lean();
    return rows.map((r) => r._id);
  } catch (err) {
    console.error('[NotificationTargets] lookup failed:', err.message);
    return [];
  }
}

/** Users holding any of the given roles. */
export async function usersWithRoles(roles) {
  const list = (Array.isArray(roles) ? roles : [roles]).filter(Boolean);
  if (!list.length) return [];
  return idsFrom({ role: { $in: list } });
}

/** Admin-side staff who should see company-wide events. */
export function adminUserIds() {
  return usersWithRoles([ROLES.MASTER_ADMIN, ROLES.WAREHOUSE_MANAGER, ROLES.MANAGER]);
}

/** Support staff who handle complaints and service requests. */
export function supportUserIds() {
  return usersWithRoles([ROLES.MASTER_ADMIN, ROLES.CUSTOMER_SUPPORT]);
}

/** Logins belonging to a dealer. */
export async function dealerUserIds(dealerId) {
  if (!dealerId) return [];
  return idsFrom({ dealerId });
}

/** Logins belonging to a service centre. */
export async function serviceCenterUserIds(serviceCenterId) {
  if (!serviceCenterId) return [];
  return idsFrom({ serviceCenterId });
}

/** The login for an employee record. */
export async function employeeUserIds(employeeId) {
  if (!employeeId) return [];
  return idsFrom({ employeeId });
}

/**
 * The customer's login, matched the same way the portal does: email first,
 * then phone. Accepts a Customer id, a Customer document, or a loose
 * `{ email, phone }` shape so callers can pass whatever they already hold.
 */
export async function customerUserIds(customerOrId) {
  if (!customerOrId) return [];
  try {
    // Already holding contact details? Use them. Otherwise treat the argument
    // as an id (or a document we only have the id of) and fetch the record.
    let customer = customerOrId;
    if (!customer.email && !customer.phone) {
      const id = customer._id ?? customer;
      customer = id ? await Customer.findById(id).lean() : null;
    }
    if (!customer) return [];

    const or = [];
    if (customer.email) or.push({ email: String(customer.email).toLowerCase() });
    if (customer.phone) or.push({ phone: String(customer.phone) });
    if (!or.length) return [];

    return idsFrom({ $or: or, role: ROLES.CUSTOMER });
  } catch (err) {
    console.error('[NotificationTargets] customer lookup failed:', err.message);
    return [];
  }
}

/** Customer login matched directly from contact details on a document. */
export async function contactUserIds({ email, phone } = {}) {
  const or = [];
  if (email) or.push({ email: String(email).toLowerCase() });
  if (phone) or.push({ phone: String(phone) });
  if (!or.length) return [];
  return idsFrom({ $or: or, role: ROLES.CUSTOMER });
}
