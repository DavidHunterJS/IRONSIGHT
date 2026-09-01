// Environment-based deployment configuration.
//
// Every tunable that differs between local dev, Docker, and Vercel lives here
// so nothing has to be edited in code to deploy. All values have safe defaults,
// so the app still boots with zero environment variables set.
//
// NOTE: values read from `process.env.NEXT_PUBLIC_*` are inlined at BUILD time.
// In Docker you must pass them as build args (see Dockerfile), not just at run
// time. Server-only values below are read at runtime.

function int(value: string | undefined, fallback: number): number {
  const n = Number.parseInt(value ?? '', 10);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

function bool(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined || value === '') return fallback;
  return /^(1|true|yes|on)$/i.test(value);
}

function list(value: string | undefined): string[] {
  return (value ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export const IS_PROD = process.env.NODE_ENV === 'production';

/** Public base URL, used for canonical URLs, OG tags and robots.txt. */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : '') ||
  'http://localhost:3000'
).replace(/\/+$/, '');

/** Upstream (third-party) request protection. */
export const UPSTREAM = {
  /** Hard timeout for any single outbound request, in ms. */
  timeoutMs: int(process.env.UPSTREAM_TIMEOUT_MS, 8_000),
  /** Timeout for cheap/latency-sensitive calls (Telegram probes, translate). */
  fastTimeoutMs: int(process.env.UPSTREAM_FAST_TIMEOUT_MS, 3_500),
  /** Max bytes we will read from any upstream response body. */
  maxBytes: int(process.env.UPSTREAM_MAX_BYTES, 4_000_000),
  /**
   * Allowance for the handful of upstreams that legitimately serve a bulk file.
   * NASA FIRMS publishes only a global 24h CSV on its key-free endpoint — about
   * 17 MB and growing — so the default cap cannot apply to it. Routes must opt
   * in per call; this is not a general raise.
   */
  maxBytesBulk: int(process.env.UPSTREAM_MAX_BYTES_BULK, 32_000_000),
  /** Max simultaneous in-flight requests to a single upstream host. */
  maxConcurrentPerHost: int(process.env.UPSTREAM_MAX_CONCURRENT_PER_HOST, 4),
  /** Consecutive failures before a host is short-circuited. */
  breakerThreshold: int(process.env.UPSTREAM_BREAKER_THRESHOLD, 5),
  /** How long a tripped host stays short-circuited, in ms. */
  breakerCooldownMs: int(process.env.UPSTREAM_BREAKER_COOLDOWN_MS, 60_000),
} as const;

/**
 * Server-side response cache TTLs (ms), per API route.
 * These decouple visitor count from upstream request count: 10,000 viewers
 * still produce one upstream fetch per TTL window.
 */
export const CACHE_TTL = {
  news: int(process.env.CACHE_TTL_NEWS_MS, 90_000),
  telegram: int(process.env.CACHE_TTL_TELEGRAM_MS, 45_000),
  markets: int(process.env.CACHE_TTL_MARKETS_MS, 60_000),
  alerts: int(process.env.CACHE_TTL_ALERTS_MS, 5_000),
  default: int(process.env.CACHE_TTL_DEFAULT_MS, 60_000),
  /** How long stale data may be served after upstream starts failing. */
  staleMaxMs: int(process.env.CACHE_STALE_MAX_MS, 15 * 60_000),
} as const;

/** Per-IP rate limiting applied to /api/* by middleware. */
export const RATE_LIMIT = {
  enabled: bool(process.env.RATE_LIMIT_ENABLED, IS_PROD),
  windowMs: int(process.env.RATE_LIMIT_WINDOW_MS, 60_000),
  /** Requests per window for ordinary API routes. */
  max: int(process.env.RATE_LIMIT_MAX, 240),
  /** Requests per window for expensive routes (news, telegram, satellite). */
  expensiveMax: int(process.env.RATE_LIMIT_EXPENSIVE_MAX, 60),
  /** Trusted proxy header order for client IP resolution. */
  ipHeaders: list(process.env.RATE_LIMIT_IP_HEADERS).length
    ? list(process.env.RATE_LIMIT_IP_HEADERS)
    : ['x-forwarded-for', 'x-real-ip', 'cf-connecting-ip'],
} as const;

/**
 * Content Security Policy mode:
 *   'enforce'      — nonce-based CSP, blocks violations (default in prod)
 *   'report-only'  — logs violations without blocking (use when debugging)
 *   'off'          — no CSP header (other security headers still apply)
 */
export const CSP_MODE = (process.env.CSP_MODE ||
  (IS_PROD ? 'enforce' : 'report-only')) as 'enforce' | 'report-only' | 'off';

/** Extra hosts to allow in CSP connect-src/img-src, comma separated. */
export const CSP_EXTRA_HOSTS = list(process.env.CSP_EXTRA_HOSTS);

/** Which conflict theaters are exposed in this deployment. Empty = all. */
export const ENABLED_THEATERS = list(process.env.NEXT_PUBLIC_ENABLED_THEATERS);
