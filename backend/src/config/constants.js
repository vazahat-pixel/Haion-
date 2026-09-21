export const ROLES = {
  MASTER_ADMIN: 'MASTER_ADMIN',
  CEO: 'CEO',
  NSM: 'NSM',
  STATE_HEAD: 'STATE_HEAD',
  ASM: 'ASM',
  STORE_MANAGER: 'STORE_MANAGER',
  WAREHOUSE_MANAGER: 'WAREHOUSE_MANAGER',
  DEALER_ADMIN: 'DEALER_ADMIN',
  DEALER_SALES: 'DEALER_SALES',
  EMPLOYEE: 'EMPLOYEE',
  MANAGER: 'MANAGER',
  CUSTOMER_SUPPORT: 'CUSTOMER_SUPPORT',
  SERVICE_CENTER: 'SERVICE_CENTER',
  CUSTOMER: 'CUSTOMER',
};

// Organizational verticals for HRMS hierarchy
export const VERTICALS = {
  SALES_PRODUCTION: 'SALES_PRODUCTION',
  FINANCE: 'FINANCE',
  PRODUCTION_MARKETING: 'PRODUCTION_MARKETING',
};

// Sub-verticals (used within SALES_PRODUCTION)
export const SUB_VERTICALS = {
  SALES: 'SALES',
  SERVICE: 'SERVICE',
};

// Hierarchy level order (top → bottom) for sorting/display
export const DESIGNATION_HIERARCHY = [
  'CEO',
  'NSM',
  'STATE_HEAD',
  'ASM',
  'STORE_MANAGER',
];

// ── Real-Time Attendance constants ────────────────────────────────────────
export const ATTENDANCE_WORK_MODES = ['OFFICE', 'FIELD', 'REMOTE', 'MANUAL'];
export const DEFAULT_GEOFENCE_RADIUS_METERS = 250;

// Haion Corporate Headquarters location (Delhi NCR default — update via Admin Settings)
export const COMPANY_HEADQUARTERS = {
  name: 'Haion Headquarters',
  address: 'Haion Industries Pvt Ltd, Delhi, India',
  coordinates: {
    latitude: 28.6139,   // New Delhi (override in .env for exact location)
    longitude: 77.2090,
  },
  geofenceRadiusMeters: DEFAULT_GEOFENCE_RADIUS_METERS,
};

export const INDIAN_STATES = [
  { code: 'AN', name: 'Andaman and Nicobar Islands' },
  { code: 'AP', name: 'Andhra Pradesh' },
  { code: 'AR', name: 'Arunachal Pradesh' },
  { code: 'AS', name: 'Assam' },
  { code: 'BR', name: 'Bihar' },
  { code: 'CH', name: 'Chandigarh' },
  { code: 'CT', name: 'Chhattisgarh' },
  { code: 'DN', name: 'Dadra and Nagar Haveli and Daman and Diu' },
  { code: 'DL', name: 'Delhi' },
  { code: 'GA', name: 'Goa' },
  { code: 'GJ', name: 'Gujarat' },
  { code: 'HR', name: 'Haryana' },
  { code: 'HP', name: 'Himachal Pradesh' },
  { code: 'JK', name: 'Jammu and Kashmir' },
  { code: 'JH', name: 'Jharkhand' },
  { code: 'KA', name: 'Karnataka' },
  { code: 'KL', name: 'Kerala' },
  { code: 'LA', name: 'Ladakh' },
  { code: 'LD', name: 'Lakshadweep' },
  { code: 'MP', name: 'Madhya Pradesh' },
  { code: 'MH', name: 'Maharashtra' },
  { code: 'MN', name: 'Manipur' },
  { code: 'ML', name: 'Meghalaya' },
  { code: 'MZ', name: 'Mizoram' },
  { code: 'NL', name: 'Nagaland' },
  { code: 'OR', name: 'Odisha' },
  { code: 'PY', name: 'Puducherry' },
  { code: 'PB', name: 'Punjab' },
  { code: 'RJ', name: 'Rajasthan' },
  { code: 'SK', name: 'Sikkim' },
  { code: 'TN', name: 'Tamil Nadu' },
  { code: 'TG', name: 'Telangana' },
  { code: 'TR', name: 'Tripura' },
  { code: 'UP', name: 'Uttar Pradesh' },
  { code: 'UT', name: 'Uttarakhand' },
  { code: 'WB', name: 'West Bengal' },
];

export const GST_RATES = [0, 5, 12, 18, 28];

export const DEFAULT_PER_PAGE = 20;
export const MAX_PER_PAGE = 100;
