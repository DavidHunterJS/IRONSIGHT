
import { fetchWithTimeout } from '@/lib/fetcher';
import { feedResponse, feedUnavailable } from '@/lib/api/respond';

export const dynamic = 'force-dynamic';

// CoinGecko free API — no API key required
const COINS = ['bitcoin', 'ethereum', 'solana', 'binancecoin'];

const COIN_META: Record<string, { name: string; symbol: string }> = {
  bitcoin: { name: 'Bitcoin', symbol: 'BTC' },
  ethereum: { name: 'Ethereum', symbol: 'ETH' },
  solana: { name: 'Solana', symbol: 'SOL' },
  binancecoin: { name: 'BNB', symbol: 'BNB' },
};

export async function GET() {
  try {
    const ids = COINS.join(',');
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`;

    const res = await fetchWithTimeout(url, {
      timeout: 8000,
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) throw new Error('CoinGecko API failed');
    const data = await res.json();

    // Coins missing from the response are dropped rather than shown at $0.
    const prices = COINS.flatMap((id) => {
      const coin = data[id];
      const meta = COIN_META[id];
      if (!coin) return [];
      return [
        {
          name: meta.name,
          symbol: meta.symbol,
          price: coin.usd,
          changePercent: Math.round((coin.usd_24h_change || 0) * 100) / 100,
        },
      ];
    });

    if (prices.length === 0) {
      return feedUnavailable([], new Error('no coins returned'));
    }

    return feedResponse(
      prices,
      {
        status: prices.length < COINS.length ? 'degraded' : 'ok',
        sourcesOk: prices.length,
        sourcesTotal: COINS.length,
      },
      { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=120' } },
    );
  } catch (err) {
    return feedUnavailable([], err);
  }
}
