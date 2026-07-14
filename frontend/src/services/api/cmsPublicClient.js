import axios from 'axios';
import { env } from '@/config/env';
import { appConfig } from '@/config/app.config';
import { generateRequestId } from '@/utils/uuid';

/** Public CMS reads — no auth headers, no session-expired redirect on failure */
const cmsPublicClient = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: appConfig.apiTimeoutMs,
  headers: { 'Content-Type': 'application/json' },
});

cmsPublicClient.interceptors.request.use((config) => {
  config.headers['X-Request-ID'] = generateRequestId();
  return config;
});

cmsPublicClient.interceptors.response.use((response) => {
  const body = response.data;
  if (body && typeof body === 'object' && 'data' in body) {
    response.normalized = {
      data: body.data,
      message: body.message,
    };
  } else {
    response.normalized = { data: body, message: null };
  }
  return response;
});

export default cmsPublicClient;
