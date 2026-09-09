// Grouping the same story reported by several outlets.
//
// The six theaters share wire feeds and Google News queries, so one event
// arrives repeatedly. Collapsing those into a single row with a source count
// turns the repetition into corroboration: five outlets carrying a strike is
// worth more than one, and the panel could not show that before.
//
// The error budget is deliberately lopsided. This panel is read to find out
// what happened, so merging two distinct events is expensive — the second one
// disappears with nothing to indicate it arrived. Leaving a duplicate costs a
// row. Every judgement below is tuned that way.
//
// Free of imports so the news route and any script can share it.

/** The fields clustering needs. Kept minimal so callers aren't forced to care. */
export interface Clusterable {
  title: string;
  pubDate: string;
  publisher?: string;
  source: string;
}

export interface Cluster<T extends Clusterable> {
  /** The most recent item; what the panel renders. */
  lead: T;
  /** Everything else in the cluster, newest first. */
  related: T[];
  /** Distinct outlets, alphabetical. The corroboration count is its length. */
  publishers: string[];
}

/**
 * Words carrying no topical signal. Dropping them stops two unrelated stories
 * scoring on their grammar — 'says', 'after' and 'new' appear in half of all
 * headlines and would otherwise pull everything toward everything else.
 */
const STOP_WORDS = new Set([
  'a', 'an', 'the', 'of', 'in', 'on', 'at', 'to', 'for', 'and', 'or', 'with',
  'by', 'from', 'as', 'is', 'are', 'was', 'were', 'be', 'been', 'says', 'say',
  'said', 'after', 'over', 'into', 'new', 'his', 'her', 'its', 'their', 'this',
  'that', 'not', 'but',
]);

/** Similarity at or above this counts as the same story. */
export const SIMILARITY_THRESHOLD = 0.45;

/**
 * How far apart two reports of one event can be published.
 *
 * Two days rather than a few hours, because plenty of feeds publish a date with
 * no time: two items a day apart land exactly 24h apart and a tighter window
 * would split genuine matches on a formatting detail. Measured against live
 * data, 48h admits every true pair and still blocks all six false ones —
 * recurring weekly reports months apart, and two different interdictions five
 * days apart. The curve is flat from 24h to 72h, so the exact figure is not
 * delicate.
 */
export const WINDOW_MS = 48 * 60 * 60 * 1000;

function tokenize(title: string): Set<string> {
  const words = title.toLowerCase().match(/[a-z0-9']+/g) ?? [];
  return new Set(words.filter(w => w.length > 2 && !STOP_WORDS.has(w)));
}

/**
 * How much two headlines overlap, 0 to 1 (Jaccard over their word sets).
 *
 * Word overlap rather than anything cleverer because it needs no model, no key
 * and no network — the same constraints as the rest of this project — and the
 * failure it cannot see (two events described in different vocabulary) is the
 * safe direction to fail in: it leaves a duplicate rather than hiding a story.
 */
export function titleSimilarity(a: string, b: string): number {
  const ta = tokenize(a);
  const tb = tokenize(b);
  if (ta.size === 0 || tb.size === 0) return 0;

  let shared = 0;
  for (const word of ta) if (tb.has(word)) shared++;
  return shared / (ta.size + tb.size - shared);
}

/** Epoch millis, or null when the feed gave us nothing we can read. */
function timeOf(item: Clusterable): number | null {
  const parsed = new Date(item.pubDate).getTime();
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Group items reporting the same story.
 *
 * Each item is compared against the lead of each existing cluster rather than
 * every member. That refusal to chain is the point: with single-link grouping,
 * A joining B and B joining C puts A and C together even when they share almost
 * nothing, which turns a conservative threshold into an aggressive one a few
 * hops down the chain.
 *
 * Items whose timestamp cannot be read never merge. Similarity alone would
 * reunite a weekly report with its own back issues, which is exactly the
 * mistake the window exists to prevent.
 */
export function clusterStories<T extends Clusterable>(
  items: T[],
  options: { threshold?: number; windowMs?: number } = {},
): Cluster<T>[] {
  const threshold = options.threshold ?? SIMILARITY_THRESHOLD;
  const windowMs = options.windowMs ?? WINDOW_MS;

  // Newest first, so a cluster's lead is its most recent item and the output
  // order does not depend on the order feeds happened to answer in.
  const ordered = [...items].sort((a, b) => (timeOf(b) ?? 0) - (timeOf(a) ?? 0));

  const clusters: { lead: T; leadTokens: Set<string>; leadTime: number | null; related: T[] }[] = [];

  for (const item of ordered) {
    const tokens = tokenize(item.title);
    const time = timeOf(item);

    const home = time === null
      ? undefined
      : clusters.find(c => {
          if (c.leadTime === null) return false;
          if (Math.abs(c.leadTime - time) > windowMs) return false;
          if (tokens.size === 0 || c.leadTokens.size === 0) return false;
          let shared = 0;
          for (const w of tokens) if (c.leadTokens.has(w)) shared++;
          return shared / (tokens.size + c.leadTokens.size - shared) >= threshold;
        });

    if (home) home.related.push(item);
    else clusters.push({ lead: item, leadTokens: tokens, leadTime: time, related: [] });
  }

  return clusters.map(({ lead, related }) => ({
    lead,
    related,
    publishers: distinctPublishers([lead, ...related]),
  }));
}

/**
 * Articles and punctuation, removed so one outlet under two spellings counts
 * once. Live output showed 'Korea Herald' beside 'The Korea Herald' and
 * 'War on Rocks' beside 'War on the Rocks', each inflating a cluster to two
 * sources — the corroboration signal reporting itself twice.
 */
const NAME_NOISE = new Set(['the', 'on', 'of', 'and', 'a', 'an']);

function canonicalName(name: string): string {
  const stripped = name
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, ' ')
    .split(/\s+/)
    .filter(w => w && !NAME_NOISE.has(w))
    .join(' ');
  // A name written in a non-Latin script reduces to nothing here. Keying on
  // that would fuse every such outlet into a single source — an Arabic and a
  // Korean masthead counted as one — so those keep their own name as the key.
  return stripped || name.trim().toLowerCase();
}

/**
 * Distinct outlets across a cluster, alphabetical.
 *
 * Distinct outlets, not distinct items: several papers running one wire story
 * is what corroboration looks like, but the same masthead twice is not. Where
 * one outlet appears under several spellings the shortest wins, since the name
 * has a badge to fit into.
 */
function distinctPublishers(items: Clusterable[]): string[] {
  const byKey = new Map<string, string>();
  for (const item of items) {
    const name = item.publisher || item.source;
    const key = canonicalName(name);
    const existing = byKey.get(key);
    if (existing === undefined || name.length < existing.length) byKey.set(key, name);
  }
  return [...byKey.values()].sort();
}
