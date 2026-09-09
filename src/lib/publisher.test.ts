import { describe, it, expect } from 'vitest';

import { extractPublisher, colourForSource } from './publisher';

// Google News hands us the real outlet in a structured element, a title suffix,
// or occasionally something unusable. Everything here comes from live feeds.

describe('extractPublisher', () => {
  it('prefers the structured source element', () => {
    expect(extractPublisher({
      sourceText: 'AP News',
      sourceUrl: 'https://apnews.com',
      title: 'North Korea launches another missile - AP News',
    })).toBe('AP');
  });

  it('maps a bare domain to a readable name', () => {
    // Google returns 'reuters.com' as the display text for over a third of items.
    expect(extractPublisher({ sourceText: 'reuters.com', sourceUrl: 'https://www.reuters.com' }))
      .toBe('Reuters');
  });

  it('shortens long outlet names so the badge stays a badge', () => {
    expect(extractPublisher({ sourceText: 'South China Morning Post', sourceUrl: 'https://www.scmp.com' }))
      .toBe('SCMP');
  });

  it('falls back to the hostname when the text is a page title, not a name', () => {
    // Observed live: CNN arrives as its own <title> tag.
    expect(extractPublisher({
      sourceText: 'Breaking News, Latest News and Videos',
      sourceUrl: 'https://www.cnn.com',
    })).toBe('CNN');
  });

  it('rejects a page title dressed up as a name', () => {
    // Observed live: a Substack's <title> arrived as the publisher and was cut
    // mid-name into 'ChinaTalk | Jordan S'. A separator means a page title.
    expect(extractPublisher({
      sourceText: 'ChinaTalk | Jordan Schneider',
      sourceUrl: 'https://www.chinatalk.media',
    })).toBe('Chinatalk');
  });

  it('never cuts a name mid-word', () => {
    const long = extractPublisher({
      sourceText: 'Royal United Services Institute for Defence',
      sourceUrl: 'https://rusi.org',
    })!;
    expect(long.length).toBeLessThanOrEqual(20);
    // Truncation lands on a word boundary, not partway through one.
    expect(long).not.toMatch(/\s\S{1,2}$/);
  });

  it('reads the title suffix when there is no source element', () => {
    expect(extractPublisher({ title: 'North Korea fires missile ahead of drills - reuters.com' }))
      .toBe('Reuters');
  });

  it('keeps an unknown but readable publisher as-is', () => {
    expect(extractPublisher({ sourceText: 'Korea Herald', sourceUrl: 'https://koreaherald.com' }))
      .toBe('Korea Herald');
  });

  it('derives something readable from an unknown domain', () => {
    // No alias, and the text is a bare domain rather than a name.
    expect(extractPublisher({ sourceText: 'sundaytimes.lk', sourceUrl: 'https://www.sundaytimes.lk' }))
      .toBe('Sundaytimes');
  });

  it('uses the alias table over the hostname when both would work', () => {
    expect(extractPublisher({ sourceText: 'defensenews.com', sourceUrl: 'https://www.defensenews.com' }))
      .toBe('Defense News');
  });

  it('keeps two outlets with the same initials apart', () => {
    // Both call themselves 'ABC News'. Without distinct aliases the acronym
    // rule renders the Australian broadcaster identically to the American one.
    expect(extractPublisher({
      sourceText: 'ABC News - Breaking News, Latest News and Videos',
      sourceUrl: 'https://abcnews.com',
    })).toBe('ABC News');
    expect(extractPublisher({
      sourceText: 'ABC News & Headlines – Australian Broadcasting Corporation',
      sourceUrl: 'https://www.abc.net.au',
    })).toBe('ABC AU');
  });

  it('gives a long institutional name its known short form', () => {
    // Truncation alone yields 'Institute for the', which names nothing.
    expect(extractPublisher({
      sourceText: 'Institute for the Study of War',
      sourceUrl: 'https://www.understandingwar.org',
    })).toBe('ISW');
  });

  it('reads a short domain as an acronym', () => {
    // 'upi.com' title-cased is 'Upi', which looks like a typo rather than a
    // masthead. Short domains are almost always initialisms.
    expect(extractPublisher({ sourceText: 'upi.com', sourceUrl: 'https://www.upi.com' })).toBe('UPI');
    expect(extractPublisher({ sourceText: 'tass.com', sourceUrl: 'https://tass.com' })).toBe('TASS');
  });

  it('does not shout a normal word', () => {
    expect(extractPublisher({ sourceText: 'stripes.com', sourceUrl: 'https://www.stripes.com' }))
      .toBe('Stripes');
  });

  it('gives up rather than inventing a publisher', () => {
    // A hyphen in a headline is not a publisher suffix.
    expect(extractPublisher({})).toBeUndefined();
    expect(extractPublisher({ title: 'No suffix here' })).toBeUndefined();
    expect(extractPublisher({ title: 'Iran-Israel tensions rise' })).toBeUndefined();
  });
});

describe('colourForSource', () => {
  it('gives the same source the same colour every time', () => {
    // A badge that changes colour between refreshes is worse than a grey one.
    expect(colourForSource('Reuters')).toBe(colourForSource('Reuters'));
  });

  it('gives different sources different colours', () => {
    const names = ['Reuters', 'AP', 'Yonhap', 'NK News', 'Kyodo', 'CBS'];
    const colours = new Set(names.map(colourForSource));
    expect(colours.size).toBeGreaterThan(names.length - 2);
  });

  it('returns a colour the badge can actually use', () => {
    for (const name of ['Reuters', 'AP', 'A', '']) {
      expect(colourForSource(name)).toMatch(/^hsl\(\d{1,3} \d{1,3}% \d{1,3}%\)$/);
    }
  });

  it('stays dark enough for white badge text', () => {
    // Badge text is #fff, so lightness must stay well under 50%.
    for (const name of ['Reuters', 'AP', 'Yonhap', 'NK News', 'zzz', '']) {
      const lightness = Number(colourForSource(name).match(/(\d+)%\)$/)![1]);
      expect(lightness, name).toBeLessThanOrEqual(42);
    }
  });
});
