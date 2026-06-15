import { env } from './env';

export const appConfig = {
  name: env.appName,
  version: env.appVersion,
  defaultLocale: 'en-IN',
  defaultCurrency: 'INR',
  idleTimeoutMs: 30 * 60 * 1000,
  draftTtlMs: 24 * 60 * 60 * 1000,
  searchDebounceMs: 300,
  prefetchHoverMs: 200,
  apiTimeoutMs: 15000,
};
