import { translateFreeText } from '@/lib/hebrew';
import { getConflict, getConflictFromRequest } from '@/lib/conflicts';
import { fetchUpstreamText, UpstreamError } from '@/lib/upstream';
import { sanitizeText } from '@/lib/security/sanitize';
import { cached, cacheKey } from '@/lib/cache';
import { CACHE_TTL, UPSTREAM } from '@/lib/config';
import { feedResponse, feedUnavailable, statusFromSettled } from '@/lib/api/respond';

// Detect non-Latin scripts (Hebrew, Arabic, Farsi, Cyrillic, etc.)
function hasNonLatinText(text: string): boolean {
  return /[\u0590-\u05FF\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF\u0400-\u04FF]/.test(text);
}

export const dynamic = 'force-dynamic';

// Scrape public Telegram channels via embed endpoint
// Completely free, no API key, no bot needed
// Channel list is per-conflict (see src/lib/conflicts/*).

interface TelegramPost {
  channel: string;
  channelLabel: string;
  color: string;
  postId: number;
  text: string;
  date: string;
  url: string;
}

// Persist latest known post IDs across requests (in-memory cache)
const latestKnownIds: Record<string, number> = {};
// Cache of fetched posts so we don't re-fetch
const postCache: Record<string, { text: string; date: string }> = {};
const POST_CACHE_MAX = 4000;

/** Telegram channel names are user-supplied config; keep them to the documented charset. */
const CHANNEL_RE = /^[A-Za-z0-9_]{3,64}$/;

async function fetchPost(
  channel: string,
  postId: number,
): Promise<{ text: string; date: string } | null> {
  if (!CHANNEL_RE.test(channel) || !Number.isInteger(postId) || postId < 1) return null;

  const cacheKeyStr = `${channel}/${postId}`;
  if (postCache[cacheKeyStr]) return postCache[cacheKeyStr];

  try {
    // t.me embed pages are small; anything large is not a post we can parse.
    const html = await fetchUpstreamText(
      `https://t.me/${channel}/${postId}?embed=1&mode=tme`,
      {
        timeout: UPSTREAM.fastTimeoutMs,
        maxBytes: 512_000,
        headers: {
          Accept: 'text/html',
        },
      },
    );

    const textMatch = html.match(
      /<div class="tgme_widget_message_text js-message_text"[^>]*>(.*?)<\/div>/s,
    );
    if (!textMatch) return null;

    // This is raw scraped HTML from a public channel — the single most
    // untrusted input in the app. sanitizeText strips script/style bodies and
    // all markup, decodes entities exactly once, and removes bidi-override
    // characters (which can be used to make a post render deceptively).
    let text = sanitizeText(textMatch[1], { maxLength: 1200 });

    const dateMatch = html.match(/<time[^>]*datetime="([^"]+)"/);
    const rawDate = dateMatch ? dateMatch[1] : '';
    const parsed = rawDate ? new Date(rawDate) : null;
    const date =
      parsed && !Number.isNaN(parsed.getTime()) ? parsed.toISOString() : new Date().toISOString();

    if (!text) return null;

    // Auto-translate non-Latin text (Hebrew, Farsi, Arabic, etc.)
    if (hasNonLatinText(text)) {
      // Translation output is third-party content too — sanitize the result.
      text = sanitizeText(await translateFreeText(text), { maxLength: 1200 });
    }

    const result = { text, date };
    // Bound the process-lifetime cache; without this a long-running container
    // accumulates every post it has ever seen.
    if (Object.keys(postCache).length > POST_CACHE_MAX) {
      for (const key of Object.keys(postCache).slice(0, POST_CACHE_MAX / 2)) {
        delete postCache[key];
      }
    }
    postCache[cacheKeyStr] = result;
    return result;
  } catch (err) {
    // A tripped circuit breaker must not look like "post does not exist",
    // otherwise the discovery walk below would rewind the channel position.
    if (err instanceof UpstreamError && err.kind === 'breaker') throw err;
    return null;
  }
}

// On first call, find latest post via binary search. After that, just check ahead.
async function findLatestPostId(channel: string): Promise<number> {
  const known = latestKnownIds[channel];

  if (known) {
    // Check up to 20 ahead in parallel for new posts
    const checks = Array.from({ length: 20 }, (_, i) => known + 20 - i);
    const results = await Promise.allSettled(
      checks.map(id => fetchPost(channel, id).then(r => r ? id : null))
    );

    let highest = known;
    for (const r of results) {
      if (r.status === 'fulfilled' && r.value && r.value > highest) {
        highest = r.value;
      }
    }
    latestKnownIds[channel] = highest;
    return highest;
  }

  // First time: binary search (sequential but fast with big jumps)
  let low = 1;
  let high = 200000;

  // Quick probe to find rough range
  for (const probe of [500, 5000, 15000, 30000, 50000, 80000, 120000, 180000]) {
    if (probe >= high) break;
    const result = await fetchPost(channel, probe);
    if (result) {
      low = probe;
    } else {
      high = probe;
      break;
    }
  }

  // Binary search
  while (high - low > 10) {
    const mid = Math.floor((low + high) / 2);
    const result = await fetchPost(channel, mid);
    if (result) {
      low = mid;
    } else {
      high = mid;
    }
  }

  // Fine scan the last few
  for (let i = high; i >= low; i--) {
    const result = await fetchPost(channel, i);
    if (result) {
      latestKnownIds[channel] = i;
      return i;
    }
  }

  latestKnownIds[channel] = low;
  return low;
}

async function buildTelegram(conflictKey: string) {
  const { server } = getConflict(conflictKey);
  const channels = server.telegramChannels;

  // Process ALL channels in parallel — each finds latest + fetches 3 posts.
  // Per-host concurrency limiting in the upstream client keeps this from
  // opening dozens of simultaneous sockets to t.me.
  const channelResults = await Promise.allSettled(
    channels.map(async (channel) => {
      const latestId = await findLatestPostId(channel.name);
      const posts: TelegramPost[] = [];

      const ids = [latestId, latestId - 1, latestId - 2].filter(id => id > 0);
      const results = await Promise.allSettled(
        ids.map(id => fetchPost(channel.name, id))
      );

      results.forEach((r, i) => {
        if (r.status === 'fulfilled' && r.value) {
          posts.push({
            channel: channel.name,
            channelLabel: channel.label,
            color: channel.color,
            postId: ids[i],
            text: r.value.text,
            date: r.value.date,
            url: `https://t.me/${channel.name}/${ids[i]}`,
          });
        }
      });

      if (posts.length === 0) throw new Error(`${channel.name}: no posts retrieved`);
      return posts;
    })
  );

  const health = statusFromSettled(channelResults);

  const allPosts: TelegramPost[] = [];
  for (const result of channelResults) {
    if (result.status === 'fulfilled') allPosts.push(...result.value);
  }

  allPosts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Total failure — throw so the cache serves the last good snapshot instead of
  // caching an empty result and showing an empty panel.
  if (health.sourcesOk === 0 && health.sourcesTotal > 0) {
    throw new Error(`all ${health.sourcesTotal} Telegram channels failed`);
  }

  return {
    payload: {
      posts: allPosts,
      channels: channels.map(c => c.label),
      updated: new Date().toISOString(),
    },
    health,
  };
}

export async function GET(req: Request) {
  const { key } = getConflictFromRequest(req);

  try {
    const result = await cached(
      cacheKey('telegram', { conflict: key }),
      CACHE_TTL.telegram,
      () => buildTelegram(key),
    );

    return feedResponse(result.value.payload, {
      status: result.stale ? 'stale' : result.value.health.status,
      ageMs: result.ageMs,
      sourcesOk: result.value.health.sourcesOk,
      sourcesTotal: result.value.health.sourcesTotal,
      error: result.error,
    });
  } catch (err) {
    return feedUnavailable(
      { posts: [] as TelegramPost[], channels: [] as string[], updated: new Date().toISOString() },
      err,
    );
  }
}
