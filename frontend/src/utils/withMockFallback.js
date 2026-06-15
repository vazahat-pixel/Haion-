import { env } from '@/config/env';

export async function withMockFallback(apiFn, mockFn) {
  if (env.useMockApi) return mockFn();
  try {
    return await apiFn();
  } catch (err) {
    if (env.isDev && env.useMockApi) return mockFn();
    throw err;
  }
}

export function listResponse(items, filters = {}) {
  const { page = 1, limit = 20, search = '' } = filters;
  let filtered = [...items];
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter((row) =>
      Object.values(row).some((v) => String(v ?? '').toLowerCase().includes(q))
    );
  }
  const start = (page - 1) * limit;
  const data = filtered.slice(start, start + limit);
  return {
    data,
    meta: { total: filtered.length, page, limit, totalPages: Math.ceil(filtered.length / limit) || 1 },
  };
}
