// API response helpers.
//
// The panels expect their existing JSON shapes, so feed health is carried in
// HEADERS rather than by wrapping the body. That keeps every existing component
// working while giving the client enough information to render an honest state:
//
//   X-Feed-Status   ok | degraded | stale | error
//   X-Feed-Age      age of the served data in seconds
//   X-Feed-Sources  "ok/total" upstream sources that answered
//   X-Feed-Error    short reason, when something went wrong

import { NextResponse } from 'next/server';

export type FeedStatus = 'ok' | 'degraded' | 'stale' | 'error';

export interface FeedMeta {
  status?: FeedStatus;
  ageMs?: number;
  sourcesOk?: number;
  sourcesTotal?: number;
  error?: string;
}

const NO_STORE = 'no-cache, no-store, must-revalidate';

export function feedResponse<T>(data: T, meta: FeedMeta = {}, init: ResponseInit = {}) {
  const { status = 'ok', ageMs = 0, sourcesOk, sourcesTotal, error } = meta;

  const headers: Record<string, string> = {
    'Cache-Control': NO_STORE,
    'X-Feed-Status': status,
    'X-Feed-Age': String(Math.round(ageMs / 1000)),
  };

  if (sourcesTotal !== undefined) {
    headers['X-Feed-Sources'] = `${sourcesOk ?? 0}/${sourcesTotal}`;
  }
  if (error) {
    // Header values must be ASCII and short.
    headers['X-Feed-Error'] = error.replace(/[^\x20-\x7E]/g, '').slice(0, 200);
  }

  return NextResponse.json(data, {
    ...init,
    headers: { ...headers, ...(init.headers as Record<string, string> | undefined) },
  });
}

/**
 * Total failure with no cached fallback. Returns 503 with an empty payload of
 * the right shape so the client renders "feed unavailable" instead of crashing
 * on an unexpected body.
 */
export function feedUnavailable<T>(emptyValue: T, error: unknown) {
  const message = error instanceof Error ? error.message : 'upstream unavailable';
  return feedResponse(emptyValue, { status: 'error', error: message }, { status: 503 });
}

/**
 * Derive an overall status from a set of Promise.allSettled results.
 * Any failures with some successes = degraded; all failures = error.
 */
export function statusFromSettled(results: PromiseSettledResult<unknown>[]): {
  status: FeedStatus;
  sourcesOk: number;
  sourcesTotal: number;
} {
  const sourcesTotal = results.length;
  const sourcesOk = results.filter((r) => r.status === 'fulfilled').length;
  const status: FeedStatus =
    sourcesOk === 0 && sourcesTotal > 0 ? 'error' : sourcesOk < sourcesTotal ? 'degraded' : 'ok';
  return { status, sourcesOk, sourcesTotal };
}
