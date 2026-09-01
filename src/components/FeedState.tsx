'use client';

import type { FeedStatus } from '@/lib/hooks';

// Shared feed failure UI.
//
// Design rule for this dashboard: never show a silently empty panel. An empty
// panel reads as "nothing is happening", which is the single most misleading
// thing an intelligence display can do. Every panel must distinguish:
//
//   nothing to report   vs   we cannot currently see
//
// FeedBadge goes in the panel header; FeedFallback replaces the panel body when
// there is nothing to render.

const STATUS_STYLE: Record<FeedStatus, { label: string; color: string; title: string }> = {
  loading: { label: 'SYNC', color: 'var(--text-secondary)', title: 'Fetching…' },
  ok: { label: 'LIVE', color: 'var(--green)', title: 'Feed healthy' },
  degraded: {
    label: 'PARTIAL',
    color: 'var(--yellow, #eab308)',
    title: 'Some upstream sources did not respond — this view is incomplete',
  },
  stale: {
    label: 'STALE',
    color: 'var(--orange, #f97316)',
    title: 'Refresh is failing — showing last known data',
  },
  empty: { label: 'NO DATA', color: 'var(--text-secondary)', title: 'Upstream returned nothing' },
  error: {
    label: 'OFFLINE',
    color: 'var(--red, #ef4444)',
    title: 'Feed unavailable — no data could be retrieved',
  },
};

export function FeedBadge({
  status,
  lastUpdated,
  sources,
  className = '',
}: {
  status: FeedStatus;
  lastUpdated?: Date | null;
  sources?: string | null;
  className?: string;
}) {
  const style = STATUS_STYLE[status];
  const degraded = status === 'degraded' || status === 'stale' || status === 'error';

  return (
    <span
      className={`inline-flex items-center gap-1 text-[9px] font-normal normal-case tracking-normal ${className}`}
      title={sources ? `${style.title} (${sources} sources)` : style.title}
    >
      <span
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{
          backgroundColor: style.color,
          animation: status === 'ok' ? 'pulse 2s infinite' : undefined,
        }}
      />
      <span style={{ color: degraded ? style.color : 'var(--text-secondary)' }}>
        {degraded ? style.label : lastUpdated ? lastUpdated.toLocaleTimeString() : style.label}
      </span>
    </span>
  );
}

export function FeedFallback({
  status,
  error,
  onRetry,
  rows = 6,
}: {
  status: FeedStatus;
  error?: string | null;
  onRetry?: () => void;
  rows?: number;
}) {
  if (status === 'loading') {
    return (
      <div className="space-y-2 p-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="loading-shimmer h-12 rounded" />
        ))}
      </div>
    );
  }

  if (status === 'empty') {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-1 p-4 text-center">
        <p className="text-[11px] text-[var(--text-secondary)]">NO REPORTABLE ACTIVITY</p>
        <p className="text-[9px] text-[var(--text-secondary)] opacity-70">
          Sources responded with no matching items.
        </p>
      </div>
    );
  }

  const style = STATUS_STYLE[status];

  return (
    <div className="flex flex-col items-center justify-center h-full gap-2 p-4 text-center">
      <p className="text-[11px] font-bold tracking-wider" style={{ color: style.color }}>
        {status === 'error' ? 'FEED UNAVAILABLE' : 'FEED DEGRADED'}
      </p>
      <p className="text-[9px] text-[var(--text-secondary)] max-w-[26ch] leading-snug">
        {status === 'error'
          ? 'No data could be retrieved. Absence of data here does not mean absence of activity.'
          : 'Showing last known data. Some sources are not responding.'}
      </p>
      {error && (
        <p className="text-[8px] text-[var(--text-secondary)] opacity-60 font-mono break-all max-w-full">
          {error}
        </p>
      )}
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-1 text-[9px] px-2 py-1 border border-[var(--border-color)] rounded text-[var(--text-secondary)] hover:text-[var(--cyan)] hover:border-[var(--cyan)] transition-colors"
        >
          RETRY
        </button>
      )}
    </div>
  );
}

/** True when the panel body should be replaced by FeedFallback. */
export function shouldShowFallback(status: FeedStatus, hasItems: boolean): boolean {
  if (status === 'loading') return !hasItems;
  return !hasItems;
}
