import { parseXML, getTextContent } from '@/lib/fetcher';
import { rewriteLinkHost } from '@/lib/links';
import { itemDate, undatedItemDate, inClockZone, startOfStampedDay } from '@/lib/feedDate';
import { extractPublisher, isNotNews } from '@/lib/publisher';
import { provenanceOf } from '@/lib/provenance';
import { clusterStories } from '@/lib/cluster';
import { isTooOld } from '@/lib/recency';
import { selectRows, NEWS_ROW_CAP, ROWS_PER_SOURCE } from '@/lib/rowLimit';
import { fetchUpstreamText } from '@/lib/upstream';
import { isHebrew, translateFreeText } from '@/lib/hebrew';
import { getConflict, getConflictFromRequest } from '@/lib/conflicts';
import { sanitizeText, sanitizeUrl } from '@/lib/security/sanitize';
import { cached, cacheKey } from '@/lib/cache';
import { CACHE_TTL, UPSTREAM } from '@/lib/config';
import { feedResponse, feedUnavailable, statusFromSettled } from '@/lib/api/respond';
import type { NewsFeedSource } from '@/lib/conflicts';
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
async function fetchRSS(feed: NewsFeedSource): Promise<NewsItem[]> {
  const { url: feedUrl, name: source } = feed;
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

  // Some feeds (PressTV among them) publish items with no date element at all,
  // only a channel-level lastBuildDate. Undated items resolve to epoch 1970 in
  // the recency sort below and sink beneath everything dated. The build time is
  // kept as the last resort, and as an upper bound - see undatedItemDate.
  const channel = doc.getElementsByTagName('channel')[0];
  const channelDate = channel
    ? sanitizeText(getTextContent(channel, 'lastBuildDate'), { maxLength: 64 })
    : '';

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
    let link = sanitizeUrl(rawLink) ?? '';
    if (link && feed.rewriteLinkHost) link = rewriteLinkHost(link, feed.rewriteLinkHost);

    // An item's own date, then a date in its URL, then the feed's build time.
    // Stamping every undated item with the build time made all of them look
    // minutes old and pinned them to the top of the panel.
    // Feeds that write local time under a GMT label are corrected first, and
    // feeds that date an edition rather than a moment are read as that day.
    let ownDate = sanitizeText(itemDate(item), { maxLength: 64 });
    if (ownDate && feed.clockZone) ownDate = inClockZone(ownDate, feed.clockZone);
    if (ownDate && feed.datePrecision === 'day') ownDate = startOfStampedDay(ownDate);
    const pubDate = ownDate || undatedItemDate(link, channelDate);

    if (!title) continue;

    // Google News files every item under one source and carries the real outlet
    // separately — in a <source url="..."> element, with the title suffix as a
    // fallback. Recover it for display, then strip the suffix so the headline
    // reads cleanly. `source` deliberately stays the feed name: the relevance
    // filter's unfiltered allowlist is keyed on it, and overwriting it here
    // would quietly drop most aggregated items.
    let publisher: string | undefined;
    // Known from our own fetch rather than inferred: this feed is an
    // aggregator, so anything arriving through it was picked up rather than
    // published by the outlet whose name we just recovered.
    let viaAggregator = false;
    if (source === 'Google News') {
      viaAggregator = true;
      const sourceEl = item.getElementsByTagName('source')[0];
      const sourceUrl = sourceEl?.getAttribute('url') ?? undefined;
      // A search returns encyclopedia entries and streaming listings as well
      // as reporting. They bypass the relevance filter along with the rest of
      // the search, so they are dropped here or not at all.
      if (isNotNews(sourceUrl)) continue;
      publisher = extractPublisher({
        sourceText: sourceEl?.textContent ?? undefined,
        sourceUrl,
        title,
      });
      const dashIdx = title.lastIndexOf(' - ');
      if (dashIdx > 0) title = title.substring(0, dashIdx);
    }

    results.push({
      title,
      link,
      source,
      publisher: publisher ? sanitizeText(publisher, { maxLength: 40 }) : undefined,
      stateMedia: provenanceOf(publisher ?? source)?.state,
      viaAggregator: viaAggregator || undefined,
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
    feeds.map(feed => withBudget(fetchRSS(feed), ROUTE_BUDGET_MS)),
  );

  const health = statusFromSettled(results);

  // Age is judged here, before translation and clustering, so an old item can
  // neither cost a translation call nor lead a cluster of current reports.
  const now = Date.now();

  const allNews: NewsItem[] = results
    .filter((r): r is PromiseFulfilledResult<NewsItem[]> => r.status === 'fulfilled')
    .flatMap(r => r.value)
    .filter(isRelevant)
    .filter(item => !isTooOld(item.pubDate, now));

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

  // Group reports of one story. This replaces an exact-match dedupe on the
  // first 60 characters of the title, which only ever caught verbatim
  // syndication — 'Israel strikes Beirut suburb' and 'IDF hits Hezbollah
  // target in Beirut' survived it as two rows. Matching on word overlap within
  // a time window catches those, and keeping the duplicates as `related` turns
  // them into a corroboration count rather than discarding them.
  const clusters = clusterStories(allNews);
  const deduped: NewsItem[] = clusters.map(({ lead, related, publishers, reports }) =>
    related.length > 0 ? { ...lead, related, publishers, reports } : lead,
  );

  // Sort by closest to now first (handles RSS feeds with future timestamps)
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

  // Not simply the 100 newest: that handed a busy theater's panel to whoever
  // publishes fastest. Every source keeps its few newest rows; see rowLimit.ts.
  return { items: selectRows(deduped, { cap: NEWS_ROW_CAP, perSource: ROWS_PER_SOURCE }), health };
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
