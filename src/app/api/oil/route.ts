
import { fetchWithTimeout } from '@/lib/fetcher';
import { feedResponse, feedUnavailable, statusFromSettled } from '@/lib/api/respond';

export const dynamic = 'force-dynamic';

const COMMODITIES = [
  { symbol: 'CL=F', name: 'WTI Crude Oil', type: 'crude_wti' },
  { symbol: 'BZ=F', name: 'Brent Crude', type: 'crude_brent' },
  { symbol: 'NG=F', name: 'Natural Gas', type: 'natural_gas' },
  { symbol: 'HO=F', name: 'Heating Oil', type: 'heating_oil' },
  { symbol: 'RB=F', name: 'RBOB Gasoline', type: 'gasoline' },
];

export async function GET() {
  try {
    // Same as markets: a failed commodity used to render as $0.00.
    const settled = await Promise.allSettled(
      COMMODITIES.map(async (c) => {
        {
          const url = `https://query1.finance.yahoo.com/v8/finance/chart/${c.symbol}?interval=1d&range=5d`;
          const res = await fetchWithTimeout(url, {
            timeout: 8000,
          });
          if (!res.ok) throw new Error('Failed');
          const data = await res.json();
          const meta = data?.chart?.result?.[0]?.meta;
          if (!meta) throw new Error('No data');

          const price = meta.regularMarketPrice ?? 0;
          const prev = meta.chartPreviousClose ?? price;
          const change = Math.round((price - prev) * 100) / 100;
          const pct = prev ? Math.round(((price - prev) / prev) * 10000) / 100 : 0;

          return {
            type: c.type,
            name: c.name,
            price: Math.round(price * 100) / 100,
            change,
            changePercent: pct,
            currency: 'USD',
            updated: new Date().toISOString(),
          };
        }
      })
    );

    const { status, sourcesOk, sourcesTotal } = statusFromSettled(settled);
    const prices = settled.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : []));

    if (status === 'error') {
      return feedUnavailable([], new Error('all commodity symbols failed'));
    }

    return feedResponse(
      prices,
      { status, sourcesOk, sourcesTotal },
      { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=120' } },
    );
  } catch (err) {
    return feedUnavailable([], err);
  }
}
