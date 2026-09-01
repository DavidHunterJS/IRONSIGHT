import { getConflictFromRequest } from '@/lib/conflicts';
import { feedResponse, feedUnavailable } from '@/lib/api/respond';

export const dynamic = 'force-dynamic';

interface PolymarketMarket {
  id: string;
  question: string;
  slug: string;
  outcomes: string;
  outcomePrices: string;
  volume: string;
  volume24hr: number;
  liquidity: string;
  active: boolean;
  closed: boolean;
  endDate: string;
  oneDayPriceChange: number;
  image: string;
}

export async function GET(req: Request) {
  const { server } = getConflictFromRequest(req);
  const KEYWORDS = server.polymarketKeywords;
  const EXCLUDE = server.polymarketExclude;
  try {
    const res = await fetch(
      'https://gamma-api.polymarket.com/markets?limit=500&closed=false&active=true&order=volume24hr&ascending=false',
      {
        signal: AbortSignal.timeout(10000),
      }
    );

    if (!res.ok) {
      return feedUnavailable(
        { markets: [], count: 0, updated: new Date().toISOString() },
        new Error(`Polymarket HTTP ${res.status}`),
      );
    }

    const data: PolymarketMarket[] = await res.json();

    const filtered = data
      .filter(m => KEYWORDS.test(m.question) && !EXCLUDE.test(m.question))
      .map(m => {
        const outcomes = JSON.parse(m.outcomes) as string[];
        const prices = JSON.parse(m.outcomePrices) as string[];

        return {
          id: m.id,
          question: m.question,
          slug: m.slug,
          outcomes: outcomes.map((o, i) => ({
            label: o,
            price: Math.round(parseFloat(prices[i]) * 100),
          })),
          volume24hr: m.volume24hr,
          volumeTotal: parseFloat(m.volume),
          liquidity: parseFloat(m.liquidity),
          endDate: m.endDate,
          oneDayPriceChange: m.oneDayPriceChange,
          image: m.image,
        };
      })
      .sort((a, b) => {
        const aYes = a.outcomes.find(o => o.label === 'Yes')?.price ?? a.outcomes[0]?.price ?? 0;
        const bYes = b.outcomes.find(o => o.label === 'Yes')?.price ?? b.outcomes[0]?.price ?? 0;
        return bYes - aYes;
      })
      .slice(0, 20);

    return feedResponse(
      {
        markets: filtered,
        count: filtered.length,
        updated: new Date().toISOString(),
      },
      { sourcesOk: 1, sourcesTotal: 1 },
      { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60' } },
    );
  } catch (err) {
    return feedUnavailable({ markets: [], count: 0, updated: new Date().toISOString() }, err);
  }
}
