// Reading the publication date of one feed item.
//
// The news route and the link checker each kept their own list of date
// fields, and the lists drifted: the checker learned to read <dc:date> while
// measuring feed staleness, and the route never did. Taipei Times dates its
// items that way and no other, so the checker saw a healthy feed while the
// panel showed all fifteen of its current headlines with no time, sorted below
// every dated row. One list, used by both, keeps them from disagreeing again.
//
// Free of imports so the news route and any script can share it.

/**
 * Where feeds put an item's date, in order of preference.
 *
 * RSS 2.0 uses pubDate; Atom uses published and updated; RSS 1.0 feeds use
 * the Dublin Core dc:date. That one must be spelled with its prefix:
 * getElementsByTagName matches the qualified name, so a bare 'date' finds
 * nothing.
 */
const ITEM_DATE_TAGS = ['pubDate', 'published', 'updated', 'dc:date'] as const;

/** The DOM surface this needs, so the browser DOM and xmldom both satisfy it. */
interface ItemElement {
  getElementsByTagName(tag: string): ArrayLike<{ textContent: string | null }>;
}

/**
 * The item's own date as the feed wrote it, or '' if it carries none.
 *
 * A field is used only if it parses as a date; one that does not is passed
 * over for the next rather than trusted, since an unparseable date sorts
 * nowhere and renders as nothing.
 */
export function itemDate(item: ItemElement): string {
  for (const tag of ITEM_DATE_TAGS) {
    const text = item.getElementsByTagName(tag)[0]?.textContent?.trim();
    if (text && !Number.isNaN(Date.parse(text))) return text;
  }
  return '';
}

/** A /YYYY/MM/DD/ segment in an article path, as many publishers write it. */
const URL_DATE = /\/((?:19|20)\d{2})\/(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])\//;

/**
 * A date for an item whose feed gives it none.
 *
 * The feed's build time is not the item's date. PressTV publishes items with
 * no date at all, and stamping each with the channel's lastBuildDate made all
 * fifteen claim to be minutes old: they held rows 1-15 of the iran-israel
 * panel permanently, labelled 'just now', and on 2026-09-10 six of them were
 * from the day before. Its article URLs carry the real day
 * (/Detail/2026/09/09/...), so that comes first.
 *
 * Day precision, taken as midnight UTC, and never later than the feed's build
 * time: a path written in local time can name a day that has not started in
 * UTC, and nothing is published after the feed that carries it. With no date
 * in the URL, the build time is still better than nothing - it at least
 * bounds the item's age.
 */
export function undatedItemDate(link: string, channelDate: string): string {
  const m = URL_DATE.exec(link);
  if (m) {
    const day = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
    // Reject what Date.UTC silently rolls over: 30 February is 2 March.
    const real = day.getUTCMonth() === +m[2] - 1 && day.getUTCDate() === +m[3];
    if (real) {
      const built = Date.parse(channelDate);
      if (!Number.isNaN(built) && day.getTime() > built) return channelDate;
      return day.toISOString();
    }
  }
  return channelDate;
}

/** The zone's UTC offset in ms at a given instant, from the platform's tz data. */
function offsetAt(ms: number, zone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: zone,
    hourCycle: 'h23',
    year: 'numeric', month: 'numeric', day: 'numeric',
    hour: 'numeric', minute: 'numeric', second: 'numeric',
  }).formatToParts(new Date(ms));
  const get = (t: string) => +(parts.find(p => p.type === t)?.value ?? 0);
  const wall = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'));
  return wall - Math.floor(ms / 1000) * 1000;
}

/**
 * Read a timestamp whose digits are wall-clock time in `zone`, whatever zone
 * it claims to be in.
 *
 * Walla and JPost write Israel's local time and label it GMT (JPost's article
 * pages repeat the same wrong offset). Read as written, their items sat up to
 * three hours in the future, and because the news route sorts by distance from
 * now in either direction, anything of theirs more than about three hours old
 * read three hours younger and won the recency fill against every honestly
 * dated outlet.
 *
 * The offset comes from the zone's own rules rather than a fixed three hours,
 * so it stays right when Israel returns to UTC+2 in winter. Text that does not
 * parse is returned as it came.
 */
export function inClockZone(dateText: string, zone: string): string {
  const parsed = Date.parse(dateText);
  if (Number.isNaN(parsed)) return dateText;
  // The digits as if they were UTC; the zone's offset is then taken away. A
  // second pass settles items that fall near a daylight-saving change.
  const first = parsed - offsetAt(parsed, zone);
  return new Date(parsed - offsetAt(first, zone)).toISOString();
}
