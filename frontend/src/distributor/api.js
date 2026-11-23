import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import client from '@/services/api/client';
import { toast } from '@/utils/toast';

/** Thin wrapper over the shared axios client for /api/dms. */
export const dms = {
  get: async (url, params) => (await client.get(`/dms${url}`, { params })).normalized,
  // config carries e.g. the multipart header: without it axios would turn a FormData upload into JSON
  post: async (url, body, config) => (await client.post(`/dms${url}`, body, config)).normalized,
  put: async (url, body) => (await client.put(`/dms${url}`, body)).normalized,
};

/** Extract { message, fieldErrors } from an axios error. */
export function apiError(err) {
  const body = err?.response?.data || {};
  return { message: body.message || err?.message || 'Request failed', fieldErrors: body.errors || {} };
}

export function useDmsQuery(key, url, params, opts = {}) {
  return useQuery({
    queryKey: ['dms', key, url, params],
    queryFn: () => dms.get(url, params),
    placeholderData: keepPreviousData,
    staleTime: 15_000,
    ...opts,
  });
}

export const useMe = () => useDmsQuery('me', '/me', undefined, { staleTime: 60_000 });
export const useLookups = () => useDmsQuery('lookups', '/lookups', undefined, { staleTime: 60_000 });

/** Mutation that toasts the server message and invalidates every DMS query on success. */
export function useDmsMutation(fn, { onSuccess, silent } = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: (res, vars) => {
      if (!silent) toast.success(res?.message || 'Saved');
      qc.invalidateQueries({ queryKey: ['dms'] });
      onSuccess?.(res, vars);
    },
    onError: (err) => toast.error(apiError(err).message),
  });
}

export const fmt = {
  money: (n) => (Number(n) || 0).toFixed(2),
  date: (d) => (d ? new Date(d).toISOString().slice(0, 10) : ''),
  /** Axis labels in Indian units (L = lakh, Cr = crore). */
  short: (n) => { const v = Number(n) || 0; const a = Math.abs(v); return a >= 1e7 ? `${(v / 1e7).toFixed(1)} Cr` : a >= 1e5 ? `${(v / 1e5).toFixed(1)} L` : a >= 1e3 ? `${(v / 1e3).toFixed(0)}k` : String(v); },
  dmy: (d) => (d ? new Date(d).toISOString().slice(0, 10).split('-').reverse().join('-') : ''),
  /** Reference ledger style: zero prints as 0, anything else with two decimals. */
  amt: (n) => (Number(n) ? Number(n).toFixed(2) : '0'),
  dt: (d) => (d ? new Date(d).toLocaleString('en-IN', { hour12: false }) : ''),
  party: (p) => (p ? [p.name, p.city].filter(Boolean).join(',') : ''),
};

export const BRAND = {
  name: import.meta.env.VITE_DMS_BRAND || 'HAION',
  accent: import.meta.env.VITE_DMS_BRAND_ACCENT || 'DMS',
  footer: import.meta.env.VITE_DMS_FOOTER || `Copyright © ${new Date().getFullYear()}. All Rights Reserved.`,
};
