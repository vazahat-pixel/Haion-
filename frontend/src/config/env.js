function resolveApiBaseUrl() {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  // Production on Vercel: same-origin /api (proxied via middleware.js to BACKEND_URL)
  if (import.meta.env.PROD) {
    return '/api';
  }
  return 'http://localhost:3000/api';
}

export const env = {
  apiBaseUrl: resolveApiBaseUrl(),
  appName: import.meta.env.VITE_APP_NAME || 'Haion ERP',
  appVersion: import.meta.env.VITE_APP_VERSION || '1.0.0',
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
  /** Use VITE_USE_MOCK_API=true on Vercel to bypass backend */
  useMockApi: import.meta.env.VITE_USE_MOCK_API === 'true' || (import.meta.env.VITE_USE_MOCK_API !== 'false' && import.meta.env.DEV),
  razorpayKeyId: import.meta.env.VITE_RAZORPAY_KEY_ID || '',
};

