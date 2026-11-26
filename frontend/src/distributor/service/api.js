import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import client from '@/services/api/client';
import { toast } from '@/utils/toast';

export const crm = {
  get: async (url, params) => (await client.get(`/service-crm${url}`, { params })).normalized,
  post: async (url, body, config) => (await client.post(`/service-crm${url}`, body, config)).normalized,
  put: async (url, body) => (await client.put(`/service-crm${url}`, body)).normalized,
  del: async (url) => (await client.delete(`/service-crm${url}`)).normalized,
};

export function crmApiError(err) {
  const body = err?.response?.data || {};
  return { message: body.message || err?.message || 'Request failed', fieldErrors: body.errors || {} };
}

export function useCrmQuery(key, url, params, opts = {}) {
  return useQuery({
    queryKey: ['crm', key, url, params],
    queryFn: () => crm.get(url, params),
    placeholderData: keepPreviousData,
    staleTime: 15_000,
    ...opts,
  });
}

export const useCrmMe = () => useCrmQuery('me', '/me', undefined, { staleTime: 60_000 });
export const useCrmLookups = () => useCrmQuery('lookups', '/lookups', undefined, { staleTime: 60_000 });

export function useCrmMutation(fn, { onSuccess, silent } = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: (res, vars) => {
      if (!silent) toast.success(res?.message || 'Saved');
      qc.invalidateQueries({ queryKey: ['crm'] });
      onSuccess?.(res, vars);
    },
    onError: (err) => toast.error(crmApiError(err).message),
  });
}

export const fmt = {
  money: (n) => (Number(n) || 0).toFixed(2),
  date: (d) => (d ? new Date(d).toISOString().slice(0, 10) : ''),
  dmy: (d) => (d ? new Date(d).toISOString().slice(0, 10).split('-').reverse().join('-') : ''),
  dt: (d) => (d ? new Date(d).toLocaleString('en-IN', { hour12: false }) : ''),
};
