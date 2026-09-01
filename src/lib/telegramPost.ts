// Pure parsing for scraped Telegram embed pages.
//
// Kept out of the route so it can be tested directly. The distinction these
// functions draw is the one the scraper got wrong for a long time: whether a
// post *exists* is a different question from whether it has *text*, and
// conflating them made every media-heavy channel look like an empty channel.

export interface ParsedPost {
  /** Telegram served a real post for this id. */
  exists: boolean;
  /** Raw (unsanitized) message HTML, or null for a post with no text. */
  rawText: string | null;
  /** Raw datetime attribute, or null when absent. */
  rawDate: string | null;
}

const MISSING = { exists: false, rawText: null, rawDate: null } as const;

export function parsePostHtml(html: string): ParsedPost {
  // Telegram serves an explicit error widget for an id that does not exist.
  if (html.includes('tgme_widget_message_error')) return { ...MISSING };

  // A real post always carries a <time datetime=...>, with or without text.
  const dateMatch = html.match(/<time[^>]*datetime="([^"]+)"/);
  if (!dateMatch) return { ...MISSING };

  const textMatch = html.match(
    /<div class="tgme_widget_message_text js-message_text"[^>]*>(.*?)<\/div>/s,
  );

  return {
    exists: true,
    rawText: textMatch ? textMatch[1] : null,
    rawDate: dateMatch[1],
  };
}

/**
 * Highest post id linked from a channel's public preview page.
 *
 * One request and it is exact, where a binary search needs a dozen and assumes
 * ids are contiguous. They are not — channels delete posts, and a probe landing
 * in a gap sent the old search into entirely the wrong range.
 *
 * `channel` must already be validated against the route's CHANNEL_RE so it is
 * safe to interpolate into a pattern.
 */
export function latestIdFromPreviewHtml(channel: string, html: string): number | null {
  let max = 0;
  for (const m of html.matchAll(new RegExp(`/${channel}/(\\d+)`, 'gi'))) {
    const n = Number.parseInt(m[1], 10);
    if (Number.isFinite(n) && n > max) max = n;
  }
  return max > 0 ? max : null;
}
