import { describe, it, expect } from 'vitest';

import { MAX_ITEM_AGE_DAYS, isTooOld } from './recency';

// Dates here are taken from live feeds on 2026-09-10.

const NOW = Date.parse('2026-09-10T14:44:00Z');
const DAY = 86_400_000;
const daysAgo = (d: number) => new Date(NOW - d * DAY).toUTCString();

describe('isTooOld', () => {
  it('drops an item older than the window', () => {
    expect(isTooOld(daysAgo(MAX_ITEM_AGE_DAYS + 1), NOW)).toBe(true);
  });

  it('keeps an item inside the window', () => {
    expect(isTooOld(daysAgo(MAX_ITEM_AGE_DAYS - 1), NOW)).toBe(false);
  });

  it('drops CENTCOM press releases from months ago', () => {
    // Red Sea rows #48 and #62 as served: 217 and 329 days old.
    expect(isTooOld('Thu, 05 Feb 2026 17:47:00 GMT', NOW)).toBe(true);
    expect(isTooOld('Thu, 16 Oct 2025 17:04:00 GMT', NOW)).toBe(true);
  });

  it('drops a missile launch from three weeks ago', () => {
    // The Guardian, 21.3 days. This is the case that separates 14 from 30:
    // it reads as news at a glance, and was deliberately chosen to go.
    expect(isTooOld('Thu, 20 Aug 2026 07:00:00 GMT', NOW)).toBe(true);
  });

  it('keeps a report from last week', () => {
    // 'Top Islamic State spokesman killed in Yemen', Long War Journal, 8.7 days.
    expect(isTooOld('Tue, 01 Sep 2026 22:19:42 +0000', NOW)).toBe(false);
  });

  it('keeps an undated item, because its age is unknown rather than old', () => {
    // Taipei Times dates its items in <dc:date>, which the route does not read,
    // so all fifteen of its current headlines arrive with no date. Treating
    // unknown as old would empty the theater's main Taiwanese source.
    expect(isTooOld('', NOW)).toBe(false);
    expect(isTooOld('not a date', NOW)).toBe(false);
  });

  it('keeps a future-dated item', () => {
    // Walla labels Israel local time as GMT, putting its items up to three
    // hours ahead. That skew is a separate problem; age is not.
    expect(isTooOld('Thu, 10 Sep 2026 17:17:00 GMT', NOW)).toBe(false);
  });
});
