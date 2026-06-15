export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  appName: import.meta.env.VITE_APP_NAME || 'Haion ERP',
  appVersion: import.meta.env.VITE_APP_VERSION || '1.0.0',
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
  /** Use VITE_USE_MOCK_API=true on Vercel to bypass backend */
  useMockApi: import.meta.env.VITE_USE_MOCK_API === 'true' || (import.meta.env.VITE_USE_MOCK_API !== 'false' && import.meta.env.DEV),
};
