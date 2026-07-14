import { getSettings } from './settings.service.js';

export async function getPortalConfig() {
  const [portal, general] = await Promise.all([
    getSettings('customer-portal'),
    getSettings('general'),
  ]);

  const activeAnnouncements = (portal.announcements || []).filter((a) => {
    if (a.active === false) return false;
    if (a.expiresAt && new Date(a.expiresAt) < new Date()) return false;
    return true;
  });

  return {
    appName: portal.appName || general.companyName || 'Haion Customer',
    tagline: portal.tagline,
    logoUrl: portal.logoUrl,
    primaryColor: portal.primaryColor || '#c4714f',
    supportPhone: portal.supportPhone || general.phone,
    supportEmail: portal.supportEmail || general.email,
    supportWhatsapp: portal.supportWhatsapp || '',
    heroSubtitle: portal.heroSubtitle,
    companyName: general.companyName,
    companyAddress: general.address,
    announcements: activeAnnouncements,
    features: portal.features || {},
    quickLinks: (portal.quickLinks || []).filter((l) => l.enabled !== false),
    liveRefreshMs: portal.liveRefreshMs || 30000,
  };
}
