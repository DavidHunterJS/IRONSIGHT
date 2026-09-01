// Outbound request protection.
//
// Public deployments amplify: one visitor refresh can fan out to ~40 upstream
// feeds. Without protection a modest traffic spike turns this dashboard into an
// unintentional load generator against BBC, Telegram, NASA FIRMS et al — and
// gets the deployment IP blocked. This module enforces, for every outbound call:
//
//   1. a hard timeout (no request can hang a route)
//   2. a response size cap (a huge/streaming body can't exhaust memory)
//   3. per-host concurrency limits (we never open 30 sockets to one host)
//   4. a circuit breaker (a dead host is skipped instead of retried on every poll)
//   5. an identifying User-Agent (so operators can contact us, not just block us)

import { UPSTREAM } from '@/lib/config';
import { BRAND } from '@/lib/brand';

export const USER_AGENT =
  process.env.UPSTREAM_USER_AGENT ||
  `${BRAND.short.replace(/\s+/g, '')}/1.0 (+OSINT aggregator; public feeds only)`;

// ---------------------------------------------------------------- concurrency

const inFlight = new Map<string, number>();
const waiters = new Map<string, (() => void)[]>();

function acquire(host: string): Promise<void> {
  const current = inFlight.get(host) ?? 0;
  if (current < UPSTREAM.maxConcurrentPerHost) {
    inFlight.set(host, current + 1);
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    const queue = waiters.get(host) ?? [];
    queue.push(resolve);
    waiters.set(host, queue);
  });
}

function release(host: string) {
  const queue = waiters.get(host);
  if (queue && queue.length > 0) {
    // Hand the slot straight to the next waiter; count stays the same.
    queue.shift()!();
    if (queue.length === 0) waiters.delete(host);
    return;
  }
  const current = inFlight.get(host) ?? 1;
  if (current <= 1) inFlight.delete(host);
  else inFlight.set(host, current - 1);
}

// ------------------------------------------------------------ circuit breaker

interface BreakerState {
  failures: number;
  openUntil: number;
}

const breakers = new Map<string, BreakerState>();

function breakerOpen(host: string): boolean {
  const state = breakers.get(host);
  if (!state) return false;
  if (state.openUntil > Date.now()) return true;
  if (state.openUntil !== 0) breakers.delete(host); // cooldown elapsed, half-open
  return false;
}

function recordSuccess(host: string) {
  breakers.delete(host);
}

function recordFailure(host: string) {
  const state = breakers.get(host) ?? { failures: 0, openUntil: 0 };
  state.failures += 1;
  if (state.failures >= UPSTREAM.breakerThreshold) {
    state.openUntil = Date.now() + UPSTREAM.breakerCooldownMs;
    state.failures = 0;
  }
  breakers.set(host, state);
}

/** Snapshot of currently short-circuited hosts, for /api/health. */
export function breakerSnapshot(): { host: string; openForMs: number }[] {
  const now = Date.now();
  return [...breakers.entries()]
    .filter(([, s]) => s.openUntil > now)
    .map(([host, s]) => ({ host, openForMs: s.openUntil - now }));
}

// -------------------------------------------------------------------- fetching

export class UpstreamError extends Error {
  constructor(
    message: string,
    readonly kind: 'timeout' | 'http' | 'network' | 'too-large' | 'breaker',
    readonly host: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = 'UpstreamError';
  }
}

export interface UpstreamOptions extends Omit<RequestInit, 'signal'> {
  timeout?: number;
  maxBytes?: number;
  /** Skip the circuit breaker (for health checks). */
  ignoreBreaker?: boolean;
}

/**
 * Read a response body with a hard byte ceiling.
 * Aborts as soon as the cap is exceeded rather than buffering the whole body.
 */
/**
 * Wrap a response so its body cannot exceed `maxBytes`.
 *
 * This has to happen here rather than in the read helpers. `guardedFetch`
 * hands back a Response and most routes read the body themselves, so a cap
 * applied only inside fetchUpstreamText/Json covers two of the twelve fetching
 * routes and silently misses the rest — including the largest download in the
 * app. Capping the stream means the limit holds no matter how the caller reads.
 */
export function capResponseBody(res: Response, maxBytes: number, host: string): Response {
  const declared = Number.parseInt(res.headers.get('content-length') ?? '', 10);
  if (Number.isFinite(declared) && declared > maxBytes) {
    throw new UpstreamError(
      `Response too large (${declared} bytes) from ${host}`,
      'too-large',
      host,
    );
  }

  // 204/304 carry no body, and constructing a Response with one throws.
  if (!res.body || res.status === 204 || res.status === 304) return res;

  let total = 0;
  const capped = res.body.pipeThrough(
    new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        total += chunk.byteLength;
        if (total > maxBytes) {
          controller.error(
            new UpstreamError(
              `Response exceeded ${maxBytes} byte cap from ${host}`,
              'too-large',
              host,
            ),
          );
          return;
        }
        controller.enqueue(chunk);
      },
    }),
  );

  return new Response(capped, {
    status: res.status,
    statusText: res.statusText,
    headers: res.headers,
  });
}

/**
 * Guarded fetch returning the raw Response.
 *
 * Applies the circuit breaker, per-host concurrency limit, timeout and
 * identifying User-Agent. Used directly by legacy call sites that need a
 * Response object; prefer fetchUpstreamText/Json, which additionally enforce
 * the response size cap.
 */
export async function guardedFetch(
  url: string,
  options: UpstreamOptions = {},
): Promise<Response> {
  const {
    timeout = UPSTREAM.timeoutMs,
    ignoreBreaker = false,
    headers,
    maxBytes = UPSTREAM.maxBytes,
    ...rest
  } = options;

  let host: string;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      throw new Error('unsupported protocol');
    }
    host = parsed.host;
  } catch {
    throw new UpstreamError('Refusing to fetch invalid URL', 'network', 'invalid');
  }

  if (!ignoreBreaker && breakerOpen(host)) {
    throw new UpstreamError(`Circuit open for ${host}`, 'breaker', host);
  }

  await acquire(host);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const res = await fetch(url, {
      ...rest,
      headers: {
        'User-Agent': USER_AGENT,
        ...(headers as Record<string, string> | undefined),
      },
      signal: controller.signal,
      cache: 'no-store',
      redirect: rest.redirect ?? 'follow',
    });

    if (!res.ok) {
      // 4xx (except 429) means our request is wrong, not that the host is down —
      // don't trip the breaker on those.
      if (res.status >= 500 || res.status === 429) recordFailure(host);
      else recordSuccess(host);
      return capResponseBody(res, maxBytes, host);
    }

    recordSuccess(host);
    return capResponseBody(res, maxBytes, host);
  } catch (err) {
    recordFailure(host);
    if (err instanceof Error && (err.name === 'AbortError' || err.name === 'TimeoutError')) {
      throw new UpstreamError(`Timeout after ${timeout}ms: ${host}`, 'timeout', host);
    }
    throw new UpstreamError(
      err instanceof Error ? err.message : `Network error: ${host}`,
      'network',
      host,
    );
  } finally {
    clearTimeout(timer);
    release(host);
  }
}

/**
 * Fetch an upstream resource as text, with every protection applied.
 * Throws UpstreamError; callers are expected to catch and degrade.
 */
export async function fetchUpstreamText(
  url: string,
  options: UpstreamOptions = {},
): Promise<string> {
  const res = await guardedFetch(url, options);
  const host = (() => {
    try {
      return new URL(url).host;
    } catch {
      return 'unknown';
    }
  })();

  if (!res.ok) {
    throw new UpstreamError(`HTTP ${res.status} from ${host}`, 'http', host, res.status);
  }

  // Body is already capped by guardedFetch.
  return res.text();
}

/** Same protections, JSON-decoded. */
export async function fetchUpstreamJson<T = unknown>(
  url: string,
  options: UpstreamOptions = {},
): Promise<T> {
  const text = await fetchUpstreamText(url, {
    ...options,
    headers: { Accept: 'application/json', ...(options.headers as Record<string, string>) },
  });
  try {
    return JSON.parse(text) as T;
  } catch {
    let host = 'unknown';
    try {
      host = new URL(url).host;
    } catch {
      /* ignore */
    }
    throw new UpstreamError(`Invalid JSON from ${host}`, 'network', host);
  }
}
