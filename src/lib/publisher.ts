// Recovering the outlet behind a Google News item, and colouring it.
//
// Google News is an aggregator: every item it returns is filed under the feed
// name 'Google News', while the outlet that actually wrote the story is carried
// separately. Discarding that left the panel unable to distinguish five outlets
// reporting a story from one aggregator returning it five times — in the
// theaters that lean hardest on Google News, over half the rows carried the
// same badge.
//
// Free of imports so the news route and any script can share it.

/**
 * Display names for outlets that arrive as a bare domain, under an inconsistent
 * name, or too long to fit a badge.
 *
 * Keyed by hostname where possible, since that is the stable identifier —
 * Google returns 'reuters.com' and 'Reuters' for the same outlet on different
 * items. Kept to outlets actually observed in these feeds rather than an
 * exhaustive directory; anything missing still renders, just less prettily.
 */
const ALIASES: Record<string, string> = {
  'reuters.com': 'Reuters',
  'apnews.com': 'AP',
  'ap news': 'AP',
  'bbc.com': 'BBC',
  'bbc.co.uk': 'BBC',
  'cnn.com': 'CNN',
  'nytimes.com': 'NYT',
  'washingtonpost.com': 'WaPo',
  'wsj.com': 'WSJ',
  'cbsnews.com': 'CBS',
  'nbcnews.com': 'NBC',
  'abcnews.com': 'ABC News',
  // Australian ABC, a different broadcaster that also calls itself ABC News.
  // Without this the acronym rule renders abc.net.au identically to the US one.
  'abc.net.au': 'ABC AU',
  'pbs.org': 'PBS',
  'npr.org': 'NPR',
  'aljazeera.com': 'Al Jazeera',
  'scmp.com': 'SCMP',
  'south china morning post': 'SCMP',
  'japantimes.co.jp': 'Japan Times',
  'the japan times': 'Japan Times',
  'nknews.org': 'NK News',
  'koreajoongangdaily.com': 'JoongAng',
  'koreajoongangdaily.joins.com': 'JoongAng',
  'yna.co.kr': 'Yonhap',
  'en.yna.co.kr': 'Yonhap',
  'kyodonews.net': 'Kyodo',
  'timesofisrael.com': 'ToI',
  'haaretz.com': 'Haaretz',
  'jpost.com': 'JPost',
  'presstv.ir': 'PressTV',
  'presstv.co.uk': 'PressTV',
  'globaltimes.cn': 'Global Times',
  'taipeitimes.com': 'Taipei Times',
  'focustaiwan.tw': 'Focus Taiwan',
  'rfa.org': 'RFA',
  // Matches the configured feed name exactly. Shortening it to 'Kyiv Indep'
  // made the same outlet count as two sources when both spellings met in a
  // cluster.
  'kyivindependent.com': 'Kyiv Independent',
  'pravda.com.ua': 'Pravda UA',
  'defensenews.com': 'Defense News',
  'breakingdefense.com': 'Breaking Def',
  'thediplomat.com': 'The Diplomat',
  // Truncating this one on a word boundary yields 'Institute for the', which
  // names nothing. Long institutional sources need their short form spelled out.
  'understandingwar.org': 'ISW',
  'institute for the study of war': 'ISW',
  'csis.org': 'CSIS',
  'chathamhouse.org': 'Chatham House',
  'rand.org': 'RAND',
};

/** Longest an outlet name can be before it stops reading as a badge. */
const MAX_BADGE_LENGTH = 20;

const stripHost = (host: string) => host.replace(/^(www|m|amp|edition)\./, '').toLowerCase();

/**
 * Does this read like an outlet's name, or like something else that ended up in
 * the field?
 *
 * Google sometimes returns a page's <title> here — 'Breaking News, Latest News
 * and Videos' is CNN, and 'ChinaTalk | Jordan Schneider' is a Substack. Both
 * give themselves away with punctuation a masthead does not use. A bare domain
 * is not a name either; it has an alias or a hostname to derive from, both
 * better than printing 'reuters.com' on a badge.
 */
const TITLE_PUNCTUATION = /[,|·—–:]/;

function isDisplayName(text: string): boolean {
  if (text.length === 0 || text.length > 40) return false;
  if (TITLE_PUNCTUATION.test(text)) return false;
  if (/\.[a-z]{2,4}(\.[a-z]{2})?$/i.test(text)) return false;
  return true;
}

/** Trim to badge length on a word boundary — a name cut mid-word reads as a bug. */
function toBadgeLength(name: string): string {
  if (name.length <= MAX_BADGE_LENGTH) return name;
  const cut = name.slice(0, MAX_BADGE_LENGTH);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > 0 ? cut.slice(0, lastSpace) : cut).trim();
}

/**
 * 'defensenews.com' -> 'Defensenews'. Last resort, but readable.
 *
 * Short domains are initialisms far more often than words — 'upi.com' title-cased
 * reads as a typo — so anything up to four letters is uppercased instead.
 * Multi-word domains have no reliable split, and a wrong guess is worse than a
 * run-on, so they are left alone.
 */
const ACRONYM_MAX = 4;

function fromHostname(host: string): string | undefined {
  const bare = stripHost(host).split('.')[0];
  if (!bare) return undefined;
  if (bare.length <= ACRONYM_MAX) return bare.toUpperCase();
  return bare.charAt(0).toUpperCase() + bare.slice(1);
}

function hostnameOf(url: string | undefined): string | undefined {
  if (!url) return undefined;
  try {
    return stripHost(new URL(url).hostname);
  } catch {
    return undefined;
  }
}

/**
 * Work out which outlet an aggregated item came from.
 *
 * Sources are tried most to least trustworthy: the structured <source> element
 * with its url attribute, then the ' - Publisher' suffix Google appends to
 * titles. Returns undefined rather than a guess — a headline containing a
 * hyphen is not a publisher suffix, and a wrong attribution is worse than none.
 */
export function extractPublisher(input: {
  sourceText?: string;
  sourceUrl?: string;
  title?: string;
}): string | undefined {
  const host = hostnameOf(input.sourceUrl);

  // Hostname first: it is the one identifier Google reports consistently.
  if (host && ALIASES[host]) return ALIASES[host];

  const text = input.sourceText?.trim();
  if (text) {
    const alias = ALIASES[text.toLowerCase()];
    if (alias) return alias;
    if (isDisplayName(text)) return toBadgeLength(text);
  }

  if (host) return fromHostname(host);

  // No structured element: Google appends ' - Publisher' to the title.
  const title = input.title?.trim();
  if (title) {
    const idx = title.lastIndexOf(' - ');
    if (idx > 0) {
      const suffix = title.slice(idx + 3).trim();
      // Recurse so the suffix goes through the same alias and shape rules —
      // it is usually a bare domain.
      if (suffix) return extractPublisher({ sourceText: suffix });
    }
  }

  return undefined;
}

/**
 * A stable colour for a source with no hand-picked one.
 *
 * Hashed from the name so an outlet keeps its colour between refreshes — a
 * badge that changes colour on every poll is worse than a grey one. Saturation
 * and lightness are fixed rather than hashed: the badge prints white text, so
 * lightness has to stay low enough to read, and letting the hash choose it
 * would eventually produce an unreadable pairing.
 */
export function colourForSource(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue} 45% 34%)`;
}

/**
 * Hosts whose pages reach the theater searches without being reporting.
 *
 * Google News search returns more than news: on 2026-09-10 a Disney+ film
 * listing ('Watch Salaar: Part 1 - Ceasefire') sat at row 13 of the global
 * panel, and Britannica's encyclopedia entries on the Iran and Ukraine wars
 * came through two regional searches. The searches bypass the relevance
 * filter, and the filter would not have helped: the film passed it on the word
 * 'ceasefire'.
 *
 * This says what kind of site something is - an encyclopedia, a streaming
 * catalogue - not how far to trust it; see src/lib/disclaimer.ts. It is short,
 * explicit and hand-edited for the same reason STATE_MEDIA is. Measured
 * across all 248 search items that day, these two were the only hosts that
 * publish no news at all. A reference-database page (missilethreat.csis.org)
 * and an open blogging platform (medium.com) were considered and left out:
 * both carry analysis some of the time, and excluding them would drift from
 * describing a site toward judging it.
 */
const NOT_NEWS_HOSTS = new Set(['britannica.com', 'disneyplus.com']);

/**
 * Whether an aggregated item's source is a site that publishes no news.
 *
 * Matches the whole host, never a substring: an outlet's reporting must not
 * disappear because its address happens to contain a listed one. An unknown
 * source is kept.
 */
export function isNotNews(sourceUrl: string | undefined): boolean {
  const host = hostnameOf(sourceUrl);
  return host !== undefined && NOT_NEWS_HOSTS.has(host);
}
