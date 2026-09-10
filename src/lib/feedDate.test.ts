import { describe, it, expect } from 'vitest';
import { DOMParser } from '@xmldom/xmldom';

import { itemDate, undatedItemDate, inClockZone, startOfStampedDay } from './feedDate';

// Items are taken from live feeds on 2026-09-10.

const firstItem = (xml: string) => {
  const doc = new DOMParser().parseFromString(xml, 'text/xml');
  const items = doc.getElementsByTagName('item');
  return items.length > 0 ? items[0] : doc.getElementsByTagName('entry')[0];
};

describe('itemDate', () => {
  it('reads an RSS 2.0 pubDate', () => {
    const item = firstItem(
      '<rss><channel><item><title>Top Islamic State spokesman killed in Yemen</title>' +
        '<pubDate>Tue, 01 Sep 2026 22:19:42 +0000</pubDate></item></channel></rss>',
    );
    expect(itemDate(item)).toBe('Tue, 01 Sep 2026 22:19:42 +0000');
  });

  it('reads a Dublin Core dc:date from an RSS 1.0 feed', () => {
    // Taipei Times, verbatim. It dates every item this way and no other, and
    // the news route did not read it, so all fifteen of its current headlines
    // arrived undated and sorted below every dated row in the theater.
    const item = firstItem(
      '<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" ' +
        'xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns="http://purl.org/rss/1.0/">' +
        '<channel rdf:about="https://www.taipeitimes.com/"><title>Taipei Times</title></channel>' +
        '<item rdf:about="https://www.taipeitimes.com/News/front/archives/2026/09/10/2003863996">' +
        '<title><![CDATA[Brace for new AI threats ahead of elections, AIT head says]]></title>' +
        '<link>https://www.taipeitimes.com/News/front/archives/2026/09/10/2003863996</link>' +
        '<description></description><dc:subject></dc:subject><dc:creator></dc:creator>' +
        '<dc:date>2026-09-10T08:00:00+08:00</dc:date></item></rdf:RDF>',
    );
    expect(itemDate(item)).toBe('2026-09-10T08:00:00+08:00');
  });

  it('reads an Atom updated date', () => {
    const item = firstItem(
      '<feed xmlns="http://www.w3.org/2005/Atom"><entry><title>x</title>' +
        '<updated>2026-09-10T11:02:00Z</updated></entry></feed>',
    );
    expect(itemDate(item)).toBe('2026-09-10T11:02:00Z');
  });

  it('reads a date wrapped in CDATA', () => {
    // The Diplomat writes every date this way.
    const item = firstItem(
      '<rss><channel><item><title>x</title>' +
        '<pubDate><![CDATA[Wed, 09 Sep 2026 22:39:00 +0900]]></pubDate></item></channel></rss>',
    );
    expect(itemDate(item)).toBe('Wed, 09 Sep 2026 22:39:00 +0900');
  });

  it('passes over a field that is not a date to one that is', () => {
    const item = firstItem(
      '<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" ' +
        'xmlns:dc="http://purl.org/dc/elements/1.1/"><item><title>x</title>' +
        '<pubDate>today</pubDate><dc:date>2026-09-10T08:00:00+08:00</dc:date></item></rdf:RDF>',
    );
    expect(itemDate(item)).toBe('2026-09-10T08:00:00+08:00');
  });

  it('returns nothing for an item that carries no date', () => {
    // Nikkei Asia, verbatim: title and link, and no date at item or channel level.
    const item = firstItem(
      '<rdf:RDF xmlns="http://purl.org/rss/1.0/" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">' +
        '<item rdf:about="https://asia.nikkei.com/politics/defense/china-sells-j-10c-fighter-jet-to-uzbekistan-eyes-more-markets-for-weapons">' +
        '<title><![CDATA[China sells J-10C fighter jet to Uzbekistan, eyes more markets for weapons]]></title>' +
        '<link>https://asia.nikkei.com/politics/defense/china-sells-j-10c-fighter-jet-to-uzbekistan-eyes-more-markets-for-weapons</link>' +
        '</item></rdf:RDF>',
    );
    expect(itemDate(item)).toBe('');
  });
});

describe('undatedItemDate', () => {
  // PressTV publishes items with no date at all. The route used to give every
  // one the feed's own build time, so all fifteen claimed to be minutes old
  // and held rows 1-15 of the iran-israel panel permanently - six of them were
  // from the day before. The article URL carries the real day.
  const BUILT = 'Fri, 11 Sep 2026 00:41:49 +0330';

  it("takes the day from the article's URL", () => {
    expect(undatedItemDate(
      'https://presstv.co.uk/Detail/2026/09/09/775988/Iran-slams-IAEA-resolution',
      BUILT,
    )).toBe('2026-09-09T00:00:00.000Z');
  });

  it('never dates an item later than the feed that carried it', () => {
    // PressTV's path uses Tehran's calendar, which runs ahead of UTC late in
    // the evening. Midnight of 11 September UTC is after this feed was built
    // (21:11 UTC on the 10th), so the build time is the honest upper bound.
    expect(undatedItemDate(
      'https://presstv.co.uk/Detail/2026/09/11/776100/Some-story',
      BUILT,
    )).toBe(BUILT);
  });

  it("falls back to the feed's build time when the URL carries no date", () => {
    expect(undatedItemDate('https://asia.nikkei.com/politics/defense/china-sells-j-10c', BUILT)).toBe(BUILT);
  });

  it('ignores numbers in a path that cannot be a date', () => {
    expect(undatedItemDate('https://example.com/archive/2026/13/45/story', BUILT)).toBe(BUILT);
    expect(undatedItemDate('https://example.com/2026/02/30/story', BUILT)).toBe(BUILT);
  });

  it('returns nothing when there is neither', () => {
    expect(undatedItemDate('https://example.com/story', '')).toBe('');
    expect(undatedItemDate('', '')).toBe('');
  });
});

describe('inClockZone', () => {
  // Walla and JPost write Israel's wall-clock time and label it GMT. Walla's
  // item 'Thu, 10 Sep 2026 23:45:00 GMT' is, by the article's own page,
  // "datePublished": "2026-09-10T23:45:00+03:00" - 20:45 UTC. Read as GMT it
  // sat three hours in the future and outranked every honestly dated outlet.
  it("reads Walla's 'GMT' as Israel summer time", () => {
    expect(inClockZone('Thu, 10 Sep 2026 23:45:00 GMT', 'Asia/Jerusalem')).toBe('2026-09-10T20:45:00.000Z');
  });

  it("reads JPost's across midnight", () => {
    // Labelled a quarter past midnight on the 11th; really 21:07 UTC on the 10th.
    expect(inClockZone('Fri, 11 Sep 2026 00:07:57 GMT', 'Asia/Jerusalem')).toBe('2026-09-10T21:07:57.000Z');
  });

  it('follows the zone into winter time rather than assuming three hours', () => {
    // Israel returns to UTC+2 at the end of October. A fixed correction would
    // push every winter item an hour early.
    expect(inClockZone('Tue, 15 Dec 2026 12:00:00 GMT', 'Asia/Jerusalem')).toBe('2026-12-15T10:00:00.000Z');
  });

  it('gets the offset right on the evening before the clocks change', () => {
    // Israel leaves summer time at 02:00 local on 25 October 2026 (23:00 UTC
    // on the 24th). 23:30 local on the 24th is still UTC+3, but the same digits
    // read as UTC fall after the change, where the offset is +2 - a single
    // lookup would land an hour late.
    expect(inClockZone('Sat, 24 Oct 2026 23:30:00 GMT', 'Asia/Jerusalem')).toBe('2026-10-24T20:30:00.000Z');
  });

  it('leaves text it cannot read alone', () => {
    expect(inClockZone('', 'Asia/Jerusalem')).toBe('');
    expect(inClockZone('not a date', 'Asia/Jerusalem')).toBe('not a date');
  });
});

describe('startOfStampedDay', () => {
  // Taipei Times stamps every item 08:00 on its edition day. Its article pages
  // say the same pieces were published at midnight Taipei - "datePublished":
  // "2026-09-11T00:00:00+08:00" on the front page, Taiwan, editorials and world
  // sections alike, all uploaded at 23:40 the night before. Read literally, the
  // feed's stamp sat 2.35 hours in the future at 21:39 UTC on the 10th.
  it("takes Taipei Times' edition stamp back to midnight in Taipei", () => {
    expect(startOfStampedDay('2026-09-11T08:00:00+08:00')).toBe('2026-09-10T16:00:00.000Z');
  });

  it("uses the stamp's own offset, not UTC's calendar", () => {
    // Midnight UTC would put the edition on the wrong side of the date line.
    expect(startOfStampedDay('2026-09-11T01:30:00-05:00')).toBe('2026-09-11T05:00:00.000Z');
    expect(startOfStampedDay('Thu, 10 Sep 2026 23:45:00 GMT')).toBe('2026-09-10T00:00:00.000Z');
  });

  it('leaves a stamp alone when it cannot tell which day it names', () => {
    // No offset means no calendar to take the day from.
    expect(startOfStampedDay('2026-09-11T08:00:00')).toBe('2026-09-11T08:00:00');
    expect(startOfStampedDay('not a date')).toBe('not a date');
    expect(startOfStampedDay('')).toBe('');
  });
});
