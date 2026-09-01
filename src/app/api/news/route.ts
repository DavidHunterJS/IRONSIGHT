import { parseXML, getTextContent } from '@/lib/fetcher';
import { fetchUpstreamText } from '@/lib/upstream';
import { isHebrew, translateFreeText } from '@/lib/hebrew';
import { getConflict, getConflictFromRequest } from '@/lib/conflicts';
import { sanitizeText, sanitizeUrl } from '@/lib/security/sanitize';
import { cached, cacheKey } from '@/lib/cache';
import { CACHE_TTL, UPSTREAM } from '@/lib/config';
import { feedResponse, feedUnavailable, statusFromSettled } from '@/lib/api/respond';
import type { NewsItem } from '@/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Upper bound on the whole route so one slow feed can't hold a request open.
// Vercel functions are also capped in vercel.json; this is the in-process guard.
const ROUTE_BUDGET_MS = 12_000;

/**
 * Fetch and parse one RSS/Atom feed.
 * Throws on failure so Promise.allSettled can count how many sources answered —
 * that count is what drives the degraded/error state shown in the UI.
 */
async function fetchRSS(feedUrl: string, source: string): Promise<NewsItem[]> {
  const text = await fetchUpstreamText(feedUrl, {
    timeout: UPSTREAM.timeoutMs,
    // RSS documents are small; a multi-MB "feed" is a misconfigured endpoint.
    maxBytes: 2_000_000,
    headers: {
      Accept: 'application/rss+xml, application/xml, text/xml, */*',
    },
    redirect: 'follow',
  });

  // Some feeds 200-OK an HTML error page. Treat that as a failed source.
  const head = text.trimStart().slice(0, 200).toLowerCase();
  if (head.startsWith('<!doctype') || head.startsWith('<html')) {
    throw new Error(`${source}: HTML response, not a feed`);
  }

  const doc = parseXML(text);
  const items = doc.getElementsByTagName('item');
  const entries = doc.getElementsByTagName('entry');
  const elements = items.length > 0 ? items : entries;

  const results: NewsItem[] = [];

  for (let i = 0; i < Math.min(elements.length, 15); i++) {
    const item = elements[i];

    // Everything below is untrusted third-party content. Titles routinely
    // contain HTML entities and occasionally raw markup; links are attacker
    // controlled from our perspective. Sanitize before the data leaves here so
    // no component ever has to trust it.
    let title = sanitizeText(getTextContent(item, 'title'), { maxLength: 300 });

    let rawLink = getTextContent(item, 'link');
    if (!rawLink) {
      const linkEl = item.getElementsByTagName('link')[0];
      if (linkEl) rawLink = linkEl.getAttribute('href') || '';
    }
    const link = sanitizeUrl(rawLink) ?? '';

    const pubDate = sanitizeText(
      getTextContent(item, 'pubDate') ||
        getTextContent(item, 'published') ||
        getTextContent(item, 'updated'),
      { maxLength: 64 },
    );

    if (!title) continue;

    // Dedupe Google News titles that include " - Source" suffix
    if (source === 'Google News') {
      const dashIdx = title.lastIndexOf(' - ');
      if (dashIdx > 0) title = title.substring(0, dashIdx);
    }

    results.push({
      title,
      link,
      source,
      pubDate,
      category: sanitizeText(getTextContent(item, 'category'), { maxLength: 80 }) || undefined,
    });
  }

  return results;
}

/** Race a promise against the route budget so a hung feed can't stall the response. */
function withBudget<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('route budget exceeded')), ms),
    ),
  ]);
}

async function buildNews(conflictKey: string) {
  const { server } = getConflict(conflictKey);
  const feeds = server.newsFeeds;
  const relevanceKeywords = server.newsRelevanceKeywords;
  const unfilteredSources = new Set(feeds.filter(f => f.unfiltered).map(f => f.name));

  // Drop obvious sports/entertainment noise from broad wires (e.g. "IOC lifts
  // Russia suspension" mentions a belligerent but isn't conflict news).
  const NOISE = /world.?cup|\bfifa\b|\bioc\b|olympic|premier.?league|champions.?league|super.?bowl|\bnba\b|\bnfl\b|\bnhl\b|\bmlb\b|grammy|oscar|\bemmy|box.?office|celebrity|eurovision/i;

  const isRelevant = (item: NewsItem): boolean => {
    if (NOISE.test(item.title)) return false; // hard exclude — sports/entertainment is never conflict news
    if (unfilteredSources.has(item.source)) return true;
    return relevanceKeywords.test(item.title) || relevanceKeywords.test(item.category || '');
  };

  const results = await Promise.allSettled(
    feeds.map(feed => withBudget(fetchRSS(feed.url, feed.name), ROUTE_BUDGET_MS)),
  );

  const health = statusFromSettled(results);

  const allNews: NewsItem[] = results
    .filter((r): r is PromiseFulfilledResult<NewsItem[]> => r.status === 'fulfilled')
    .flatMap(r => r.value)
    .filter(isRelevant);

  // Translate Hebrew titles to English
  const hebrewItems = allNews.filter(item => isHebrew(item.title));
  if (hebrewItems.length > 0) {
    const translations = await Promise.allSettled(
      hebrewItems.map(item => translateFreeText(item.title)),
    );
    translations.forEach((result, i) => {
      if (result.status === 'fulfilled' && result.value !== hebrewItems[i].title) {
        // Translation output is also third-party content.
        hebrewItems[i].title = sanitizeText(result.value, { maxLength: 300 });
      }
    });
  }

  // Deduplicate by title similarity (exact match after lowercasing)
  const seen = new Set<string>();
  const deduped = allNews.filter(item => {
    const key = item.title.toLowerCase().trim().substring(0, 60);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Sort by closest to now first (handles RSS feeds with future timestamps)
  const now = Date.now();
  deduped.sort((a, b) => {
    const distA = Math.abs(now - new Date(a.pubDate || 0).getTime());
    const distB = Math.abs(now - new Date(b.pubDate || 0).getTime());
    return distA - distB;
  });

  // Every source failed and we produced nothing — surface it as an error so the
  // cache layer can fall back to the last good result instead of storing [].
  if (health.sourcesOk === 0 && health.sourcesTotal > 0) {
    throw new Error(`all ${health.sourcesTotal} news sources failed`);
  }

  return { items: deduped.slice(0, 100), health };
}

export async function GET(req: Request) {
  const { key } = getConflictFromRequest(req);

  try {
    // One upstream sweep per TTL window, shared by every visitor.
    const result = await cached(cacheKey('news', { conflict: key }), CACHE_TTL.news, () =>
      buildNews(key),
    );

    return feedResponse(result.value.items, {
      status: result.stale ? 'stale' : result.value.health.status,
      ageMs: result.ageMs,
      sourcesOk: result.value.health.sourcesOk,
      sourcesTotal: result.value.health.sourcesTotal,
      error: result.error,
    });
  } catch (err) {
    return feedUnavailable([] as NewsItem[], err);
  }
}
