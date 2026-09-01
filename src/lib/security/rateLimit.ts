// Per-IP rate limiting.
//
// Sliding-window counter held in module memory. This is deliberately dependency
// free so it works identically in `next dev`, Docker, and Vercel.
//
// SCOPE LIMITATION — read before relying on this in production:
// the counter is per process. One Docker container = one shared limit (correct).
// Vercel serverless/edge runs many instances, so the effective limit is roughly
// `max * instanceCount`. That is still enough to stop a single client hammering
// the upstream feeds, but for hard guarantees swap `hit()` for a Redis /
// Upstash / Vercel KV backed implementation — the call signature is designed to
// be a drop-in replacement.

import { RATE_LIMIT } from '@/lib/config';

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();
let lastSweep = 0;

/** Drop expired buckets so the Map can't grow without bound. */
function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
  // Hard ceiling in case of a distributed source spraying unique IPs.
  if (buckets.size > 50_000) buckets.clear();
}

export interface RateLimitResult {
  ok: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfterSec: number;
}

/** Record a request against `key` and report whether it may proceed. */
export function hit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  sweep(now);

  let bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + windowMs };
    buckets.set(key, bucket);
  }

  bucket.count += 1;
  const remaining = Math.max(0, limit - bucket.count);

  return {
    ok: bucket.count <= limit,
    limit,
    remaining,
    resetAt: bucket.resetAt,
    retryAfterSec: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
  };
}

/**
 * Resolve the client IP from proxy headers.
 * Takes the FIRST entry of x-forwarded-for (the original client); later entries
 * are proxies. Falls back to a constant so a missing header degrades to a
 * shared bucket rather than to no limiting at all.
 */
export function clientIp(headers: Headers): string {
  for (const name of RATE_LIMIT.ipHeaders) {
    const value = headers.get(name);
    if (!value) continue;
    const first = value.split(',')[0]?.trim();
    if (first) return first.slice(0, 64);
  }
  return 'unknown';
}

/** Routes that fan out to many upstreams get a tighter budget. */
const EXPENSIVE_ROUTES = [
  '/api/news',
  '/api/telegram',
  '/api/fires',
  '/api/strikes',
  '/api/conflicts',
  '/api/regional-alerts',
];

export function limitForPath(pathname: string): number {
  return EXPENSIVE_ROUTES.some((p) => pathname.startsWith(p))
    ? RATE_LIMIT.expensiveMax
    : RATE_LIMIT.max;
}

/** Standard headers so clients can back off politely. */
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'RateLimit-Limit': String(result.limit),
    'RateLimit-Remaining': String(result.remaining),
    'RateLimit-Reset': String(Math.ceil((result.resetAt - Date.now()) / 1000)),
  };
}
