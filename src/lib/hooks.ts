import { useState, useEffect, useCallback, useRef } from 'react';
import { useConflict } from './conflicts/context';

/**
 * Health of a single panel's feed.
 *  loading — first fetch in flight, nothing to show yet
 *  ok      — fresh data from a healthy upstream
 *  degraded— data present, but some upstream sources failed
 *  stale   — refresh is failing; showing the last good data with its age
 *  empty   — upstream answered successfully with nothing
 *  error   — no data at all and the refresh failed
 */
export type FeedStatus = 'loading' | 'ok' | 'degraded' | 'stale' | 'empty' | 'error';

export interface FeedState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  status: FeedStatus;
  /** Consecutive failed refreshes. Used to escalate the UI from stale to error. */
  failures: number;
  /** "3/9" when the route reported partial upstream success. */
  sources: string | null;
  refetch: () => void;
}

function isEmptyPayload(json: unknown): boolean {
  if (Array.isArray(json)) return json.length === 0;
  if (json && typeof json === 'object') {
    const obj = json as Record<string, unknown>;
    if (Array.isArray(obj.posts)) return obj.posts.length === 0;
    if (Array.isArray(obj.items)) return obj.items.length === 0;
  }
  return false;
}

/**
 * Polling data hook with explicit failure states.
 *
 * Behaviour that matters for a public dashboard:
 *  - the last good payload is NEVER discarded because of a failed refresh; it
 *    is re-shown and labelled stale, so a panel degrades instead of blanking
 *  - failures back off exponentially (up to 8x the interval) so a broken
 *    upstream isn't hammered by every open tab
 *  - polling pauses while the tab is hidden and resumes with an immediate fetch
 */
export function useDataFeed<T>(
  url: string,
  interval: number = 60000,
  initialData: T | null = null,
): FeedState<T> {
  const [data, setData] = useState<T | null>(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [status, setStatus] = useState<FeedStatus>('loading');
  const [failures, setFailures] = useState(0);
  const [sources, setSources] = useState<string | null>(null);

  const hasData = useRef(initialData !== null);
  const failureRef = useRef(0);

  const fetchData = useCallback(async () => {
    try {
      const bustUrl = `${url}${url.includes('?') ? '&' : '?'}_t=${Date.now()}`;
      const res = await fetch(bustUrl, { cache: 'no-store' });

      if (res.status === 429) {
        const retry = res.headers.get('Retry-After');
        throw new Error(`Rate limited${retry ? ` — retry in ${retry}s` : ''}`);
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const json = (await res.json()) as T;
      const feedStatus = res.headers.get('X-Feed-Status');
      const feedSources = res.headers.get('X-Feed-Sources');
      const feedError = res.headers.get('X-Feed-Error');
      const empty = isEmptyPayload(json);

      setSources(feedSources);

      // An empty payload from a route we already have data for usually means a
      // throttled or briefly failing upstream — keep what we have.
      if (!empty || !hasData.current) {
        setData(json);
        if (!empty) hasData.current = true;
      }

      failureRef.current = 0;
      setFailures(0);
      setLastUpdated(new Date());

      if (feedStatus === 'stale') {
        setStatus('stale');
        setError(feedError || 'Upstream refresh failing');
      } else if (feedStatus === 'degraded') {
        setStatus('degraded');
        setError(feedError || null);
      } else if (empty && !hasData.current) {
        setStatus('empty');
        setError(null);
      } else {
        setStatus('ok');
        setError(null);
      }
    } catch (err) {
      failureRef.current += 1;
      setFailures(failureRef.current);
      setError(err instanceof Error ? err.message : 'Failed to fetch');
      // Distinguish "we have something to show" from "we have nothing".
      setStatus(hasData.current ? 'stale' : 'error');
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    let cancelled = false;

    const schedule = () => {
      // Exponential backoff on repeated failure, capped at 8x the interval.
      const backoff = Math.min(2 ** failureRef.current, 8);
      timer = setTimeout(run, interval * backoff);
    };

    const run = async () => {
      if (cancelled) return;
      if (typeof document !== 'undefined' && document.hidden) {
        // Don't poll a tab nobody is looking at.
        schedule();
        return;
      }
      await fetchData();
      if (!cancelled) schedule();
    };

    run();

    const onVisible = () => {
      if (typeof document !== 'undefined' && !document.hidden) {
        clearTimeout(timer);
        run();
      }
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [fetchData, interval]);

  return { data, loading, error, lastUpdated, status, failures, sources, refetch: fetchData };
}

/**
 * Like useDataFeed, but automatically appends the active conflict as a
 * `?conflict=<key>` query param. When the user toggles conflicts the URL
 * changes, so the feed re-fetches for the newly selected theater.
 */
export function useConflictFeed<T>(
  path: string,
  interval: number = 60000,
  initialData: T | null = null,
): FeedState<T> {
  const { key } = useConflict();
  const url = `${path}${path.includes('?') ? '&' : '?'}conflict=${key}`;
  return useDataFeed<T>(url, interval, initialData);
}

/** Forces a re-render every `ms` milliseconds so relative timestamps stay fresh. */
export function useTick(ms: number = 15000) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), ms);
    return () => clearInterval(id);
  }, [ms]);
}

export function timeAgo(date: string | Date): string {
  if (!date) return '';
  const now = new Date();
  const then = new Date(date);

  // Invalid date
  if (isNaN(then.getTime())) return '';

  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);
  const abs = Math.abs(seconds);

  if (abs < 60) return 'just now';
  if (abs < 3600) return `${Math.floor(abs / 60)}m ago`;
  if (abs < 86400) return `${Math.floor(abs / 3600)}h ago`;
  return `${Math.floor(abs / 86400)}d ago`;
}

export function formatPrice(price: number, decimals: number = 2): string {
  return price.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatChange(change: number, percent: number): string {
  const c = change ?? 0;
  const p = percent ?? 0;
  const sign = c >= 0 ? '+' : '';
  return `${sign}${c.toFixed(2)} (${sign}${p.toFixed(2)}%)`;
}
