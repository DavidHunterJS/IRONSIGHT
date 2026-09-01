// Server-side response cache with single-flight and stale-on-error.
//
// Two jobs:
//
//   1. DECOUPLE VISITORS FROM UPSTREAM. Without this, every open browser tab
//      polling /api/news every 90s multiplies directly into upstream requests.
//      With it, N viewers produce one upstream fetch per TTL window.
//
//   2. SURVIVE UPSTREAM FAILURE. If the producer throws and we hold a recent
//      value, we serve it and flag the response stale rather than showing the
//      user an empty panel. This is what turns "the feed broke" into "the feed
//      is 4 minutes behind", which is the honest and more useful failure state
//      for an intelligence dashboard.
//
// Storage is per process (see the note in security/rateLimit.ts). The Store
// interface below is the seam for swapping in Redis / Vercel KV later.

import { CACHE_TTL } from '@/lib/config';

export interface CacheEntry<T> {
  value: T;
  storedAt: number;
  /** Set when the last refresh attempt failed and this value is being reused. */
  error?: string;
}

export interface FreshResult<T> {
  value: T;
  /** True when the value came from cache after a failed refresh. */
  stale: boolean;
  /** Age of the served value in ms. */
  ageMs: number;
  /** Present when the last refresh failed. */
  error?: string;
}

const store = new Map<string, CacheEntry<unknown>>();
const pending = new Map<string, Promise<unknown>>();

let lastSweep = 0;
function sweep() {
  const now = Date.now();
  if (now - lastSweep < 5 * 60_000) return;
  lastSweep = now;
  for (const [key, entry] of store) {
    if (now - entry.storedAt > CACHE_TTL.staleMaxMs * 2) store.delete(key);
  }
}

/**
 * Get `key` from cache, or produce it.
 *
 * - Fresh hit (age < ttl): returned immediately, no upstream work.
 * - Miss/expired: `producer` runs. Concurrent callers share the same promise
 *   (single-flight), so a cold cache under load still makes one upstream call.
 * - Producer throws: last known value is served as stale if it's within
 *   staleMaxMs. Otherwise the error propagates.
 */
export async function cached<T>(
  key: string,
  ttlMs: number,
  producer: () => Promise<T>,
): Promise<FreshResult<T>> {
  sweep();
  const now = Date.now();
  const entry = store.get(key) as CacheEntry<T> | undefined;

  if (entry && now - entry.storedAt < ttlMs) {
    return { value: entry.value, stale: false, ageMs: now - entry.storedAt };
  }

  const existing = pending.get(key) as Promise<T> | undefined;
  if (existing) {
    try {
      const value = await existing;
      return { value, stale: false, ageMs: 0 };
    } catch (err) {
      if (entry && now - entry.storedAt < CACHE_TTL.staleMaxMs) {
        return {
          value: entry.value,
          stale: true,
          ageMs: now - entry.storedAt,
          error: err instanceof Error ? err.message : 'refresh failed',
        };
      }
      throw err;
    }
  }

  const promise = producer()
    .then((value) => {
      store.set(key, { value, storedAt: Date.now() });
      return value;
    })
    .finally(() => {
      pending.delete(key);
    });

  pending.set(key, promise);

  try {
    const value = await promise;
    return { value, stale: false, ageMs: 0 };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'refresh failed';
    if (entry && Date.now() - entry.storedAt < CACHE_TTL.staleMaxMs) {
      store.set(key, { ...entry, error: message });
      return { value: entry.value, stale: true, ageMs: Date.now() - entry.storedAt, error: message };
    }
    throw err;
  }
}

/** Build a stable cache key from a route name and its meaningful params. */
export function cacheKey(route: string, params: Record<string, string | undefined>): string {
  const parts = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== '')
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`);
  return parts.length ? `${route}?${parts.join('&')}` : route;
}

export function cacheStats() {
  return { entries: store.size, inFlight: pending.size };
}
