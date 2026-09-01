import { translateFreeText } from '@/lib/hebrew';
import { getConflict, getConflictFromRequest } from '@/lib/conflicts';
import { fetchUpstreamText, UpstreamError } from '@/lib/upstream';
import { sanitizeText } from '@/lib/security/sanitize';
import { cached, cacheKey } from '@/lib/cache';
import { CACHE_TTL, UPSTREAM } from '@/lib/config';
import { feedResponse, feedUnavailable, statusFromSettled } from '@/lib/api/respond';
import { parsePostHtml, latestIdFromPreviewHtml } from '@/lib/telegramPost';

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
const postCache: Record<string, { exists: boolean; text: string; date: string }> = {};
const POST_CACHE_MAX = 4000;

/** Telegram channel names are user-supplied config; keep them to the documented charset. */
const CHANNEL_RE = /^[A-Za-z0-9_]{3,64}$/;

/**
 * A post's existence and its text are different questions.
 *
 * This used to return null for a post with no text, and the discovery walk
 * below used it as an existence probe — so a channel whose posts are media
 * without captions read as a channel with no posts. `exists` now comes from
 * Telegram's own error marker, and `text` may legitimately be empty.
 */
async function fetchPost(
  channel: string,
  postId: number,
): Promise<{ exists: boolean; text: string; date: string } | null> {
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

    const post = parsePostHtml(html);
    if (!post.exists) return { exists: false, text: '', date: '' };

    // This is raw scraped HTML from a public channel — the single most
    // untrusted input in the app. sanitizeText strips script/style bodies and
    // all markup, decodes entities exactly once, and removes bidi-override
    // characters (which can be used to make a post render deceptively).
    let text = post.rawText ? sanitizeText(post.rawText, { maxLength: 1200 }) : '';

    const rawDate = post.rawDate ?? '';
    const parsed = rawDate ? new Date(rawDate) : null;
    const date =
      parsed && !Number.isNaN(parsed.getTime()) ? parsed.toISOString() : new Date().toISOString();

    // A media post with no caption still exists; it simply has nothing to show.
    if (!text) return { exists: true, text: '', date };

    // Auto-translate non-Latin text (Hebrew, Farsi, Arabic, etc.)
    if (hasNonLatinText(text)) {
      // Translation output is third-party content too — sanitize the result.
      text = sanitizeText(await translateFreeText(text), { maxLength: 1200 });
    }

    const result = { exists: true, text, date };
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
    // Null means "could not determine", which is not the same as "absent" —
    // callers must not treat a fetch failure as the end of the channel.
    return null;
  }
}

// On first call, find latest post via binary search. After that, just check ahead.
/**
 * Read the newest post id straight off the channel's public preview page.
 *
 * One request, and it is exact. The binary search below needs a dozen or more
 * and assumes post ids are contiguous — they are not: channels delete posts and
 * leave gaps, and a probe landing in a gap made the search collapse into the
 * wrong range entirely.
 */
async function latestFromPreview(channel: string): Promise<number | null> {
  try {
    const html = await fetchUpstreamText(`https://t.me/s/${channel}`, {
      timeout: UPSTREAM.fastTimeoutMs,
      maxBytes: 2_000_000,
      headers: { Accept: 'text/html' },
    });
    // `channel` is already validated against CHANNEL_RE, so it is regex-safe.
    return latestIdFromPreviewHtml(channel, html);
  } catch (err) {
    if (err instanceof UpstreamError && err.kind === 'breaker') throw err;
    return null;
  }
}

async function findLatestPostId(channel: string): Promise<number> {
  const known = latestKnownIds[channel];

  if (known) {
    // Check up to 20 ahead in parallel for new posts
    const checks = Array.from({ length: 20 }, (_, i) => known + 20 - i);
    const results = await Promise.allSettled(
      checks.map(id => fetchPost(channel, id).then(r => (r?.exists ? id : null)))
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

  const fromPreview = await latestFromPreview(channel);
  if (fromPreview) {
    latestKnownIds[channel] = fromPreview;
    return fromPreview;
  }

  // Fallback only: channels without a public preview. Same caveat as ever —
  // this assumes roughly contiguous ids.
  let low = 1;
  let high = 200000;

  // Quick probe to find rough range
  for (const probe of [500, 5000, 15000, 30000, 50000, 80000, 120000, 180000]) {
    if (probe >= high) break;
    const result = await fetchPost(channel, probe);
    if (result?.exists) {
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
    if (result?.exists) {
      low = mid;
    } else {
      high = mid;
    }
  }

  // Fine scan the last few
  for (let i = high; i >= low; i--) {
    const result = await fetchPost(channel, i);
    if (result?.exists) {
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

      // Walk back until we have enough posts that actually carry text. Taking a
      // fixed last-three window meant one uncaptioned image could empty a
      // channel's panel entirely. Staged so the common case — a text channel —
      // still costs three requests, and only a media-heavy one pays for more.
      const WANTED = 3;
      const WINDOW = 12;
      for (let offset = 0; offset < WINDOW && posts.length < WANTED; offset += WANTED) {
        const ids = Array.from({ length: WANTED }, (_, i) => latestId - offset - i).filter(
          id => id > 0,
        );
        if (ids.length === 0) break;

        const results = await Promise.allSettled(ids.map(id => fetchPost(channel.name, id)));

        results.forEach((r, i) => {
          if (posts.length >= WANTED) return;
          if (r.status !== 'fulfilled' || !r.value?.exists || !r.value.text) return;
          posts.push({
            channel: channel.name,
            channelLabel: channel.label,
            color: channel.color,
            postId: ids[i],
            text: r.value.text,
            date: r.value.date,
            url: `https://t.me/${channel.name}/${ids[i]}`,
          });
        });
      }

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
