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
