'use client';

import { useConflictFeed, timeAgo, useTick } from '@/lib/hooks';
import { useConflict } from '@/lib/conflicts/context';
import { FeedBadge, FeedFallback, shouldShowFallback } from '@/components/FeedState';
import { sanitizeUrl } from '@/lib/security/sanitize';
import type { NewsItem } from '@/types';

// Reference implementation of the panel failure-state pattern:
//   1. FeedBadge in the header always reports feed health, not just a timestamp
//   2. FeedFallback replaces the body when there is nothing to show, and says
//      WHY — an empty news panel must never be mistaken for a quiet theater
//   3. hrefs are re-validated client-side even though the API already
//      sanitizes them (defence in depth, and it costs nothing)
//
// Apply the same three steps to the remaining panels.

export default function NewsFeed() {
  const { config } = useConflict();
  const SOURCE_COLORS = config.client.sourceColors;
  const {
    data: news,
    status,
    error,
    lastUpdated,
    sources,
    refetch,
  } = useConflictFeed<NewsItem[]>('/api/news', 90000);
  useTick(15000);

  const items = news ?? [];

  return (
    <div className="panel h-full flex flex-col">
      <div className="panel-header">
        <span className="status-dot" />
        LIVE INTEL FEED
        <span className="ml-auto flex items-center gap-2 text-[9px] text-[var(--text-secondary)] font-normal normal-case tracking-normal">
          <span>{items.length} items</span>
          <FeedBadge status={status} lastUpdated={lastUpdated} sources={sources} />
        </span>
      </div>
      <div className="flex-1 overflow-y-auto">
        {shouldShowFallback(status, items.length > 0) ? (
          <FeedFallback status={status} error={error} onRetry={refetch} rows={8} />
        ) : (
          <>
            {status === 'stale' && (
              <div className="px-2 py-1 text-[9px] text-[var(--orange,#f97316)] border-b border-[var(--border-color)]">
                REFRESH FAILING — SHOWING LAST KNOWN DATA
              </div>
            )}
            {items.map((item, i) => {
              const href = sanitizeUrl(item.link);
              const Wrapper = href ? 'a' : 'div';
              return (
                <Wrapper
                  key={`${item.source}-${i}-${item.title.slice(0, 24)}`}
                  {...(href ? { href, target: '_blank', rel: 'noopener noreferrer nofollow' } : {})}
                  className="data-row flex items-start gap-2 hover:cursor-pointer block"
                >
                  <span
                    className="text-[9px] font-bold px-1.5 py-0.5 rounded mt-0.5 shrink-0"
                    style={{
                      backgroundColor: SOURCE_COLORS[item.source] || '#555',
                      color: '#fff',
                    }}
                  >
                    {item.source}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] leading-tight text-[var(--text-primary)] truncate">
                      {item.title}
                    </p>
                    <span className="text-[9px] text-[var(--text-secondary)]">
                      {timeAgo(item.pubDate)}
                    </span>
                  </div>
                </Wrapper>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
