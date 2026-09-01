'use client';

import { useConflictFeed, timeAgo, useTick } from '@/lib/hooks';
import { FeedBadge, FeedFallback, shouldShowFallback } from '@/components/FeedState';
import type { ConflictEvent } from '@/types';

const TYPE_COLORS: Record<string, string> = {
  STRIKE: 'var(--red)',
  DEFENSE: 'var(--green)',
  MILITARY: 'var(--amber)',
  DIPLOMATIC: 'var(--blue)',
  NUCLEAR: 'var(--purple)',
  REPORT: 'var(--text-secondary)',
};

export default function ConflictFeed() {
  const {
    data: rawEvents,
    status,
    error,
    lastUpdated,
    sources,
    refetch,
  } = useConflictFeed<ConflictEvent[]>('/api/conflicts', 180000);
  useTick(15000);

  // Sort most recent first
  const events = rawEvents
    ? [...rawEvents].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    : [];

  return (
    <div className="panel h-full flex flex-col">
      <div className="panel-header">
        <span className="status-dot" style={{ background: 'var(--red)' }} />
        CONFLICT MONITOR
        <span className="ml-auto flex items-center gap-2 text-[9px] text-[var(--text-secondary)] font-normal normal-case tracking-normal">
          <span>{events.length} events</span>
          <FeedBadge status={status} lastUpdated={lastUpdated} sources={sources} />
        </span>
      </div>
      <div className="flex-1 overflow-y-auto">
        {shouldShowFallback(status, events.length > 0) ? (
          <FeedFallback
            status={status}
            error={error}
            onRetry={refetch}
            rows={6}
            emptyNote="No conflict events matched in the current reporting window."
          />
        ) : (
          events.map((event, i) => {
            const color = TYPE_COLORS[event.type] || TYPE_COLORS.REPORT;
            return (
              <div key={i} className="data-row">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                    style={{
                      color,
                      backgroundColor: `${color}15`,
                      border: `1px solid ${color}30`,
                    }}
                  >
                    {event.type}
                  </span>
                  <span className="text-[9px] text-[var(--text-secondary)]">
                    {event.location}
                  </span>
                  <span className="text-[9px] text-[var(--text-secondary)] ml-auto">
                    {timeAgo(event.date)}
                  </span>
                </div>
                <p className="text-[11px] leading-tight text-[var(--text-primary)]">
                  {event.description}
                </p>
                <span className="text-[8px] text-[var(--text-secondary)]">
                  via {event.source}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
