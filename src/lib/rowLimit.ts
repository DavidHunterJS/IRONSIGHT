// Choosing which rows a news panel keeps when a theater has more than fit.
//
// The route kept the 100 newest, which quietly meant the 100 from whoever
// publishes fastest. Measured 2026-09-10 on a build with the cap lifted,
// iran-israel had 257 rows from 21 sources and its 100th was about seven hours
// old. Walla kept 15 of 15 while BBC kept 1 of 13, and DoD, PressTV and Long
// War Journal kept none: the panel's sources were being chosen by publishing
// frequency, not by anyone. russia-ukraine (145 rows) lost BBC, Fox and War on
// the Rocks the same way. The other four theaters never reach the cap.
//
// Free of imports so the news route and any script can share it.

/** Most rows a panel carries. */
export const NEWS_ROW_CAP = 100;

/**
 * Rows each source is guaranteed before the rest fill by recency.
 *
 * 3 was chosen over 5 and over a higher cap. At 3, iran-israel shows all 21
 * sources rather than 16 and its median row stays 3 hours old; the cost is 20
 * rows five to seven hours old, mostly from Haaretz, Times of Israel and The
 * National. At 5 the median went to 5 hours and the 80th percentile to a day.
 * Raising the cap to 200 kept pure recency, so the fastest publishers still
 * held the top, and doubled the scroll.
 *
 * Keep perSource x sources under the cap: at 8, iran-israel's 21 sources
 * guaranteed 168 rows, the guarantee could not be honoured, and the slowest
 * sources vanished again.
 */
export const ROWS_PER_SOURCE = 3;

/**
 * Keep up to `cap` rows, giving every source its `perSource` newest first.
 *
 * `sorted` must be newest first. The result keeps that order, so a slow
 * source's guaranteed rows sit where their age puts them rather than being
 * promoted. Where the guarantees alone exceed the cap, the newest of them win.
 */
export function selectRows<T extends { source: string }>(
  sorted: T[],
  { cap, perSource }: { cap: number; perSource: number },
): T[] {
  if (sorted.length <= cap) return sorted;

  const seen = new Map<string, number>();
  const guaranteed: number[] = [];
  sorted.forEach((row, i) => {
    const n = (seen.get(row.source) ?? 0) + 1;
    seen.set(row.source, n);
    if (n <= perSource) guaranteed.push(i);
  });

  const keep = new Set(guaranteed.slice(0, cap));
  for (let i = 0; i < sorted.length && keep.size < cap; i++) keep.add(i);

  return sorted.filter((_, i) => keep.has(i));
}
