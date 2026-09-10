import { describe, it, expect } from 'vitest';
import { DOMParser } from '@xmldom/xmldom';

import { itemDate } from './feedDate';

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
