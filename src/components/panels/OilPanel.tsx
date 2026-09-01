'use client';

import { useConflictFeed, formatPrice, formatChange } from '@/lib/hooks';
import { FeedBadge, FeedFallback, shouldShowFallback } from '@/components/FeedState';

interface OilData {
  type: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  error?: boolean;
}

export default function OilPanel() {
  const {
    data: rawPrices,
    status,
    error,
    lastUpdated,
    sources,
    refetch,
  } = useConflictFeed<OilData[]>('/api/oil', 600000);
  const prices = rawPrices ?? [];

  return (
    <div className="panel h-full flex flex-col">
      <div className="panel-header">
        <span className="status-dot" />
        ENERGY MARKETS
        <span className="ml-auto flex items-center gap-2 text-[9px] text-[var(--text-secondary)] font-normal normal-case tracking-normal">
          <FeedBadge status={status} lastUpdated={lastUpdated} sources={sources} />
        </span>
      </div>
      <div className="flex-1 overflow-y-auto">
        {shouldShowFallback(status, prices.length > 0) ? (
          <FeedFallback status={status} error={error} onRetry={refetch} rows={5} />
        ) : (
          prices.map((item, i) => (
            <div key={i} className="data-row flex items-center justify-between">
              <div>
                <div className="text-[11px] font-medium text-[var(--text-primary)]">
                  {item.name}
                </div>
                <div className="text-[9px] text-[var(--text-secondary)] uppercase">
                  {item.type.replace('_', ' ')}
                </div>
              </div>
              <div className="text-right">
                <div className={`text-sm font-bold ${item.error ? 'text-[var(--text-secondary)]' : ''}`}>
                  {item.error ? 'N/A' : `$${formatPrice(item.price)}`}
                </div>
                {!item.error && (
                  <div
                    className={`text-[10px] ${
                      item.change >= 0 ? 'value-up' : 'value-down'
                    }`}
                  >
                    {formatChange(item.change, item.changePercent)}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
