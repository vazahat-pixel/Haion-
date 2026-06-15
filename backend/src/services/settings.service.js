import Settings from '../models/Settings.model.js';
import { env } from '../config/env.js';

const DEFAULTS = {
  general: {
    companyName: env.companyName,
    email: 'contact@haion.com',
    phone: '+91 80 1234 5678',
    address: 'Bangalore, Karnataka',
  },
  gst: {
    gstin: env.companyGstin,
    stateCode: env.companyStateCode,
    defaultRate: 18,
  },
  notifications: {
    emailAlerts: true,
    smsAlerts: false,
    lowStockAlert: true,
    complaintEscalation: true,
  },
};

export async function getSettings(key) {
  const doc = await Settings.findOne({ key }).lean();
  return { ...(DEFAULTS[key] || {}), ...(doc?.value || {}) };
}

export async function updateSettings(key, value, userId) {
  const merged = { ...(DEFAULTS[key] || {}), ...value };
  const doc = await Settings.findOneAndUpdate(
    { key },
    { key, value: merged, updatedBy: userId },
    { upsert: true, new: true }
  );
  return doc.value;
}
