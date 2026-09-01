
import { fetchWithTimeout } from '@/lib/fetcher';
import { feedResponse, feedUnavailable, statusFromSettled } from '@/lib/api/respond';

export const dynamic = 'force-dynamic';

const SYMBOLS = [
  { symbol: 'LMT', name: 'Lockheed Martin' },
  { symbol: 'RTX', name: 'Raytheon' },
  { symbol: 'NOC', name: 'Northrop Grumman' },
  { symbol: 'BA', name: 'Boeing' },
  { symbol: 'GD', name: 'General Dynamics' },
  { symbol: 'LHX', name: 'L3Harris' },
  { symbol: '^GSPC', name: 'S&P 500' },
  { symbol: '^DJI', name: 'Dow Jones' },
  { symbol: '^VIX', name: 'VIX (Fear Index)' },
  { symbol: 'GC=F', name: 'Gold' },
  { symbol: 'DX-Y.NYB', name: 'US Dollar Index' },
];

async function fetchYahoo(sym: string) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?interval=1d&range=5d`;
  const res = await fetchWithTimeout(url, {
    timeout: 8000,
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
  });
  if (!res.ok) throw new Error('Failed');
  const data = await res.json();
  return data?.chart?.result?.[0]?.meta;
}

export async function GET() {
  try {
    // Previously Promise.all with an inner catch that substituted price: 0.
    // A failed symbol rendered as a real quote of $0.00 — a wrong number shown
    // as fact, which is worse than showing nothing. Let it reject and drop it.
    const settled = await Promise.allSettled(
      SYMBOLS.map(async (s) => {
        {
          const meta = await fetchYahoo(s.symbol);
          if (!meta) throw new Error('No data');

          const price = meta.regularMarketPrice ?? 0;
          const prev = meta.chartPreviousClose ?? meta.previousClose ?? price;
          const change = Math.round((price - prev) * 100) / 100;
          const pct = prev ? Math.round(((price - prev) / prev) * 10000) / 100 : 0;

          return {
            symbol: s.symbol,
            name: s.name,
            price: Math.round(price * 100) / 100,
            change,
            changePercent: pct,
          };
        }
      })
    );

    const { status, sourcesOk, sourcesTotal } = statusFromSettled(settled);
    const markets = settled.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : []));

    if (status === 'error') {
      return feedUnavailable([], new Error('all market symbols failed'));
    }

    return feedResponse(
      markets,
      { status, sourcesOk, sourcesTotal },
      { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=120' } },
    );
  } catch (err) {
    return feedUnavailable([], err);
  }
}
