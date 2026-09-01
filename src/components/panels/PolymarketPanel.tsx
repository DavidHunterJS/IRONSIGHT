'use client';

import { useConflictFeed } from '@/lib/hooks';
import { FeedBadge, FeedFallback, shouldShowFallback } from '@/components/FeedState';

interface MarketOutcome {
  label: string;
  price: number;
}

interface Market {
  id: string;
  question: string;
  slug: string;
  outcomes: MarketOutcome[];
  volume24hr: number;
  volumeTotal: number;
  oneDayPriceChange: number;
  endDate: string;
}

interface PolymarketData {
  markets: Market[];
  count: number;
  updated: string;
}

function formatVolume(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
}

export default function PolymarketPanel() {
  const { data, status, error, lastUpdated, sources, refetch } =
    useConflictFeed<PolymarketData>('/api/polymarket', 600000);
  const markets = data?.markets ?? [];

  return (
    <div className="panel h-full flex flex-col">
      <div className="panel-header flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="status-dot" style={{ background: '#5affb0' }} />
          PREDICTION MARKETS
        </div>
        <span className="ml-auto flex items-center gap-2 text-[9px] text-[var(--text-secondary)]">
          {data && <span>{data.count} markets // Polymarket</span>}
          <FeedBadge status={status} lastUpdated={lastUpdated} sources={sources} />
        </span>
      </div>
      <div className="flex-1 overflow-y-auto">
        {shouldShowFallback(status, markets.length > 0) ? (
          <FeedFallback
            status={status}
            error={error}
            onRetry={refetch}
            rows={5}
            emptyNote="No prediction markets matched this theater's keywords."
          />
        ) : (
          markets.map((market) => {
            const yesOutcome = market.outcomes.find(o => o.label === 'Yes') || market.outcomes[0];
            const yesPrice = yesOutcome?.price ?? 0;
            const change = market.oneDayPriceChange;
            const changePercent = change ? (change * 100).toFixed(1) : null;

            return (
              <div key={market.id} className="data-row">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] text-[var(--text-primary)] leading-tight">
                      {market.question}
                    </div>
                    <div className="text-[8px] text-[var(--text-secondary)] mt-0.5">
                      Vol: {formatVolume(market.volume24hr)} 24h
                      {' · '}
                      {formatVolume(market.volumeTotal)} total
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-bold" style={{
                      color: yesPrice >= 70 ? 'var(--green)' :
                             yesPrice >= 40 ? '#ffaa00' :
                             'var(--red)'
                    }}>
                      {yesPrice}%
                    </div>
                    <div className="text-[8px] text-[var(--text-secondary)]">
                      {yesOutcome?.label || 'YES'}
                    </div>
                    {changePercent && (
                      <div className={`text-[9px] ${parseFloat(changePercent) >= 0 ? 'value-up' : 'value-down'}`}>
                        {parseFloat(changePercent) >= 0 ? '+' : ''}{changePercent}%
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-1 h-1.5 rounded overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                  <div
                    className="h-full rounded transition-all duration-500"
                    style={{
                      width: `${Math.max(yesPrice, 2)}%`,
                      background: yesPrice >= 70 ? 'var(--green)' :
                                  yesPrice >= 40 ? '#ffaa00' :
                                  'var(--red)',
                      opacity: 0.8,
                    }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
