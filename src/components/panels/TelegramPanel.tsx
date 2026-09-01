'use client';

import { useConflictFeed, timeAgo } from '@/lib/hooks';
import { FeedBadge, FeedFallback, shouldShowFallback } from '@/components/FeedState';

interface TelegramPost {
  channel: string;
  channelLabel: string;
  color: string;
  postId: number;
  text: string;
  date: string;
  url: string;
}

interface TelegramData {
  posts: TelegramPost[];
  channels: string[];
  updated: string;
}

export default function TelegramPanel() {
  const { data, status, error, lastUpdated, sources, refetch } =
    useConflictFeed<TelegramData>('/api/telegram', 60000);
  const posts = data?.posts ?? [];

  return (
    <div className="panel h-full flex flex-col">
      <div className="panel-header">
        <span className="status-dot" style={{ background: 'var(--cyan)' }} />
        TELEGRAM OSINT (UNVERIFIED)
        <span className="ml-auto flex items-center gap-2 text-[9px] text-[var(--text-secondary)] font-normal normal-case tracking-normal">
          <span>{data?.posts.length || 0} posts // {data?.channels.length || 0} channels{lastUpdated ? ` // ${new Date(lastUpdated).toLocaleTimeString()}` : ''}</span>
          <FeedBadge status={status} lastUpdated={lastUpdated} sources={sources} />
        </span>
      </div>
      <div className="flex-1 overflow-y-auto">
        {shouldShowFallback(status, posts.length > 0) ? (
          <FeedFallback
            status={status}
            error={error}
            onRetry={refetch}
            rows={4}
            emptyNote="No recent posts from the configured channels."
          />
        ) : (
          posts.map((post) => (
            <a
              key={`${post.channel}-${post.postId}`}
              href={post.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block data-row hover:!bg-[rgba(0,212,255,0.05)] cursor-pointer"
            >
              <div className="flex items-center gap-2 mb-0.5">
                <span
                  className="text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0"
                  style={{
                    color: post.color,
                    backgroundColor: `${post.color}15`,
                    border: `1px solid ${post.color}30`,
                  }}
                >
                  {post.channelLabel}
                </span>
                <span className="text-[9px] text-[var(--text-secondary)] ml-auto shrink-0">
                  {timeAgo(post.date)}
                </span>
              </div>
              <p className="text-[11px] leading-snug text-[var(--text-primary)] line-clamp-3">
                {post.text}
              </p>
            </a>
          ))
        )}
      </div>
    </div>
  );
}
