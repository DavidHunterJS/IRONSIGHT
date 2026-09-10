// How old a news item may be and still appear in a panel.
//
// The route sorts by recency and keeps 100 rows, which quietly assumed a
// theater always has 100 recent items to fill them. The busiest theaters do,
// so nothing old ever reaches them. The thinner ones do not, and the slice
// filled their remaining rows with whatever the feeds still carried: CENTCOM
// press releases from months ago, and Google News search results from 2022.
// Each row carries its age, but a live panel is read as current, and a
// 329-day-old exercise announcement sat on the Red Sea panel among the day's
// reporting.
//
// Free of imports so the news route and any script can share it.

/**
 * Items older than this are dropped before clustering.
 *
 * Measured on the live API across all six theaters on 2026-09-10.
 * iran-israel and russia-ukraine served 100 rows each, all under a day old,
 * and no window changes them. Among the others, 14 days removed:
 *
 * - red-sea 62 -> 47: all fifteen CENTCOM rows, 217 to 329 days old
 * - taiwan-china 79 -> 58: think-tank pieces from 2022-2025 returned by an
 *   unbounded Google News query, Global Times at 84 and 182 days, RFA at 16-22
 * - north-korea 75 -> 53: Beyond Parallel analysis up to 220 days, and a
 *   cluster of missile-launch reports from three weeks earlier
 * - global 100 -> 93: Long War Journal and UN Security Council items at 15-19
 *
 * Nothing was served between 35 and 52 days, so 30 or 45 would have cut
 * only the archival rows. 14 was chosen over those deliberately: a
 * three-week-old launch reads as news at a glance, and the panel's job is
 * what is happening now. At 7 the global panel lost 16 rows, mostly
 * week-old analysis, which is its normal cadence rather than staleness.
 *
 * A consequence worth knowing: Beyond Parallel publishes every few weeks, so
 * it contributes nothing between posts. The link checker does not flag it as
 * stale, because its threshold is 30 days and asks a different question —
 * whether a feed is abandoned, not whether its items are current.
 */
export const MAX_ITEM_AGE_DAYS = 14;

const MAX_ITEM_AGE_MS = MAX_ITEM_AGE_DAYS * 86_400_000;

/**
 * True when an item is known to be older than the window.
 *
 * Unknown is not old. An item with no parseable date is kept, because some
 * feeds date items in fields the route does not read and would otherwise lose
 * current reporting wholesale. Future dates are kept too: clock and timezone
 * skew in a feed is a different problem from age.
 */
export function isTooOld(pubDate: string, now: number): boolean {
  const published = Date.parse(pubDate);
  if (Number.isNaN(published)) return false;
  return now - published > MAX_ITEM_AGE_MS;
}
