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
  'ca-reports': {
    enabled: false,
    caName: '',
    caWhatsapp: '',
    caEmail: '',
  },
  business: {
    logoUrl: null,
    businessName: env.companyName,
    phone: '+91 80 1234 5678',
    email: 'contact@haion.com',
    billingAddress: 'Bangalore, Karnataka',
    state: 'Karnataka',
    stateCode: env.companyStateCode,
    pincode: '560001',
    city: 'Bangalore',
    businessTypes: ['Retailer'],
    industryType: 'Electronics',
    registrationType: 'Private Limited',
    gstin: env.companyGstin,
    pan: '',
    website: '',
    msmeNumber: '',
    signatureUrl: null,
    bankName: '',
    bankAccount: '',
    ifsc: '',
    accountHolderName: '',
  },
  invoice: {
    theme: 'luxury',
    autoFestivalTheme: false,
    invoiceTitle: 'TAX INVOICE',
    copyLabel: 'ORIGINAL FOR RECIPIENT',
    showLogo: true,
    showSignature: true,
    showBankDetails: true,
    showNotes: true,
    showTerms: true,
    showHsn: true,
    showDiscount: true,
    showTaxBreakdown: true,
    dueDateDays: 30,
    notes: 'Thanks for your business.',
    termsAndConditions: [
      'Goods once sold will not be taken back.',
      'Subject to local jurisdiction.',
    ],
  },
  print: {
    printerType: 'regular',
    paperSize: 'A4',
    orientation: 'portrait',
    marginTopMm: 10,
    marginBottomMm: 10,
    marginLeftMm: 10,
    marginRightMm: 10,
    copies: 1,
    printLogo: true,
    printSignature: true,
    printBankDetails: true,
    thermalWidthMm: 80,
  },
  'customer-portal': {
    appName: 'Haion Customer',
    tagline: 'Your products, warranty & service in one place',
    logoUrl: null,
    primaryColor: '#c4714f',
    supportPhone: '+91 80 1234 5678',
    supportEmail: 'support@haion.com',
    supportWhatsapp: '',
    heroSubtitle: 'Track warranty, orders & service requests live',
    announcements: [],
    features: {
      orders: true,
      warranty: true,
      serviceRequests: true,
      complaints: true,
      products: true,
      liveTracking: true,
      notifications: true,
    },
    quickLinks: [
      { label: 'Warranty Check', href: '/warranty/check', enabled: true },
      { label: 'Raise Complaint', href: '/support/complaint', enabled: true },
    ],
    liveRefreshMs: 30000,
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
