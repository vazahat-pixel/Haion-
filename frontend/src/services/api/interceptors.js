import { useAuthStore } from '@/store/auth.store';
import { useSessionStore } from '@/store/session.store';
import { generateRequestId } from '@/utils/uuid';
import { ROUTES } from '@/constants/routes';

let isRefreshing = false;
let refreshQueue = [];

function processQueue(error, token = null) {
  refreshQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
  refreshQueue = [];
}

function normalizeResponse(response) {
  const body = response.data;
  if (body && typeof body === 'object' && 'data' in body) {
    const pagination = body.pagination || body.meta || {};
    return {
      data: body.data,
      meta: {
        ...pagination,
        total: pagination.total ?? pagination.totalCount,
        limit: pagination.perPage ?? pagination.limit,
      },
      pagination,
      message: body.message,
      errors: body.errors || {},
    };
  }
  return { data: body, meta: {}, pagination: {}, message: null, errors: {} };
}

export function setupInterceptors(client) {
  client.interceptors.request.use((config) => {
    const token = useAuthStore.getState().accessToken;
    const panel = useAuthStore.getState().panel;

    if (token) config.headers.Authorization = `Bearer ${token}`;
    if (panel) config.headers['X-Panel'] = panel;
    config.headers['X-Request-ID'] = generateRequestId();

    return config;
  });

  client.interceptors.response.use(
    (response) => {
      response.normalized = normalizeResponse(response);
      return response;
    },
    async (error) => {
      const original = error.config;
      const url = original?.url || '';
      const isAuthEndpoint =
        url.includes('/auth/refresh-token') ||
        url.includes('/auth/login') ||
        url.includes('/auth/logout');

      if (error.response?.status === 401 && !original._retry && !isAuthEndpoint) {
        const isPublicCms =
          url.includes('/cms/') && !url.includes('/admin/cms');
        if (isPublicCms) {
          return Promise.reject(error);
        }

        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            refreshQueue.push({ resolve, reject });
          }).then((token) => {
            original.headers.Authorization = `Bearer ${token}`;
            return client(original);
          });
        }

        original._retry = true;
        isRefreshing = true;

        try {
          const success = await useAuthStore.getState().refreshToken();
          if (success) {
            const token = useAuthStore.getState().accessToken;
            processQueue(null, token);
            original.headers.Authorization = `Bearer ${token}`;
            return client(original);
          }
          throw error;
        } catch (refreshError) {
          processQueue(refreshError, null);
          const path = window.location.pathname;
          if (!path.startsWith('/auth')) {
            useSessionStore.getState().saveLastPath(path);
          }
          useAuthStore.getState().clearAuth();
          window.location.href = ROUTES.AUTH_SESSION_EXPIRED;
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      if (error.response?.status === 403) {
        window.dispatchEvent(new CustomEvent('permission-denied', { detail: error.response.data }));
      }

      if (error.response?.status === 422) {
        error.fieldErrors = error.response.data?.errors || {};
      }

      return Promise.reject(error);
    }
  );
}
