import { env } from '../config/env.js';

// ── SSE client registry for real-time CMS push ────────────────────────────────
const sseClients = new Set();

export function registerSseClient(res) {
  sseClients.add(res);
  return () => sseClients.delete(res);
}

export function broadcastCmsUpdate(payload = {}) {
  const data = JSON.stringify({ type: 'cms-updated', at: Date.now(), ...payload });
  for (const client of sseClients) {
    try {
      client.write(`data: ${data}\n\n`);
    } catch {
      sseClients.delete(client);
    }
  }
}

const cache = new Map();
const DEFAULT_TTL_MS = env.isDev ? 3_000 : 60_000;
export function getCached(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.value;
}

export function setCached(key, value, ttlMs = DEFAULT_TTL_MS) {
  cache.set(key, { value, expiresAt: Date.now() + ttlMs });
}

export function invalidateCache(prefix = '') {
  if (!prefix) {
    cache.clear();
  } else {
    for (const key of cache.keys()) {
      if (key.startsWith(prefix)) cache.delete(key);
    }
  }
  // Push real-time update to all SSE-connected clients (landing pages)
  broadcastCmsUpdate();
}

export function cmsCacheMiddleware(keyBuilder) {
  return (req, res, next) => {
    const key = keyBuilder(req);
    const cached = getCached(key);
    if (cached) {
      return res.json(cached);
    }
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      if (body?.success) setCached(key, body);
      return originalJson(body);
    };
    next();
  };
}
