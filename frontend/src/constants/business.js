import { INVOICE_THEMES, THEME_CATEGORIES, getSuggestedFestivalThemes, getInvoiceTheme, resolveEffectiveInvoiceTheme } from '@/constants/invoiceThemes';

export { INVOICE_THEMES, THEME_CATEGORIES, getSuggestedFestivalThemes, getInvoiceTheme, resolveEffectiveInvoiceTheme };

export const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa',
  'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala',
  'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland',
  'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi', 'Jammu and Kashmir', 'Ladakh',
];

export const STATE_CODES = {
  'Jammu and Kashmir': '01', Ladakh: '38', 'Himachal Pradesh': '02', Punjab: '03',
  Chandigarh: '04', Uttarakhand: '05', Haryana: '06', Delhi: '07', Rajasthan: '08',
  'Uttar Pradesh': '09', Bihar: '10', Sikkim: '11', 'Arunachal Pradesh': '12',
  Nagaland: '13', Manipur: '14', Mizoram: '15', Tripura: '16', Meghalaya: '17',
  Assam: '18', 'West Bengal': '19', Jharkhand: '20', Odisha: '21', Chhattisgarh: '22',
  'Madhya Pradesh': '23', Gujarat: '24', 'Daman and Diu': '25', 'Dadra and Nagar Haveli': '26',
  Maharashtra: '27', Karnataka: '29', Goa: '30', Lakshadweep: '31', Kerala: '32',
  'Tamil Nadu': '33', Puducherry: '34', 'Andaman and Nicobar Islands': '35',
  Telangana: '36', 'Andhra Pradesh': '37',
};

export const BUSINESS_TYPES = ['Retailer', 'Wholesaler', 'Manufacturer', 'Distributor', 'Service Provider', 'Exporter'];
export const INDUSTRY_TYPES = ['Electronics', 'FMCG', 'Automobile', 'Hardware', 'Electrical', 'General Trading', 'Services', 'Other'];
export const REGISTRATION_TYPES = ['Sole Proprietorship', 'Partnership', 'Private Limited', 'Public Limited', 'LLP', 'HUF', 'Other'];

/** Default Haion brand logo — shown on invoices when no custom logo is uploaded */
export const HAION_BRAND_LOGO = '/brand/haion-logo.png';

export function assetUrl(path) {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const base = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api').replace(/\/api\/?$/, '');
  return `${base}${path}`;
}

/** Business logo from Manage Business, or Haion default for invoices */
export function resolveInvoiceLogo(logoUrl) {
  if (logoUrl) return assetUrl(logoUrl);
  return HAION_BRAND_LOGO;
}
