import { describe, it, expect } from 'vitest';

import { titleSimilarity, clusterStories } from './cluster';

// Titles here are taken from live feeds. The panel is read to find out what
// happened, so merging two distinct events is the expensive mistake: the second
// one disappears with nothing to show it ever arrived. Leaving a duplicate only
// costs a row.

const at = (iso: string) => new Date(iso).toUTCString();

const item = (title: string, publisher: string, iso: string) => ({
  title,
  publisher,
  source: 'Google News',
  pubDate: at(iso),
});

describe('titleSimilarity', () => {
  it('scores identical titles as one', () => {
    expect(titleSimilarity('North Korea fires missile', 'North Korea fires missile')).toBe(1);
  });

  it('scores unrelated titles at zero', () => {
    expect(titleSimilarity('Oil climbs toward $100', 'Taipei reports airspace incursion')).toBe(0);
  });

  it('ignores case, punctuation and filler words', () => {
    expect(
      titleSimilarity('Russia and North Korea open the first road', 'RUSSIA, NORTH KOREA OPEN FIRST ROAD'),
    ).toBe(1);
  });

  it('is symmetric', () => {
    const a = 'North Korea fires barrage of short-range missiles';
    const b = 'North Korea launches barrage of missiles from Pyongyang';
    expect(titleSimilarity(a, b)).toBe(titleSimilarity(b, a));
  });

  it('survives a title with nothing but filler', () => {
    expect(titleSimilarity('', 'North Korea fires missile')).toBe(0);
    expect(titleSimilarity('at the of', 'in on to')).toBe(0);
  });
});

describe('clusterStories', () => {
  it('merges one event reported by two outlets', () => {
    // Live pair, similarity 0.46.
    const clusters = clusterStories([
      item('Russia and North Korea open the first road across their shared border', 'NPR', '2026-09-09T10:00:00Z'),
      item('North Korea and Russia open first road bridge linking both countries', 'BBC', '2026-09-09T11:00:00Z'),
    ]);
    expect(clusters).toHaveLength(1);
    expect(clusters[0].publishers).toEqual(['BBC', 'NPR']);
  });

  it('does not merge a recurring report with its own back issue', () => {
    // The highest-scoring pair in the whole feed at 0.67, and entirely wrong:
    // two editions of a weekly, four months apart. Only time separates them.
    const clusters = clusterStories([
      item('China & Taiwan Update, September 4, 2026', 'ISW', '2026-09-04T12:00:00Z'),
      item('China & Taiwan Update, May 1, 2026', 'ISW', '2026-05-01T12:00:00Z'),
    ]);
    expect(clusters).toHaveLength(2);
  });

  it('leaves stories below the threshold alone', () => {
    // 0.38 — two different Russian strikes that share their casualty phrasing.
    const clusters = clusterStories([
      item('Drone attack damages homes in Poltava region, three people injured', 'Ukrinform', '2026-09-09T10:00:00Z'),
      item('Three people injured in Russian attack on port infrastructure', 'Ukrinform', '2026-09-09T11:00:00Z'),
    ]);
    expect(clusters).toHaveLength(2);
  });

  it('does not chain unrelated stories through a middle one', () => {
    // A~B is 0.63 and B~C is 0.46, but A~C is only 0.18. Single-link clustering
    // would put all three together and quietly turn a conservative threshold
    // into an aggressive one.
    const a = item('Iran seizes tanker in Strait of Hormuz', 'Reuters', '2026-09-09T10:00:00Z');
    const b = item('Iran seizes tanker near Strait of Hormuz, crew detained', 'AP', '2026-09-09T10:30:00Z');
    const c = item('Tanker crew detained near Hormuz, shipping firm confirms', 'BBC', '2026-09-09T11:00:00Z');

    const clusters = clusterStories([a, b, c]);
    const withA = clusters.find(k => [k.lead, ...k.related].some(i => i.title === a.title))!;
    const titles = [withA.lead, ...withA.related].map(i => i.title);
    expect(titles).not.toContain(c.title);
  });

  it('counts outlets, not copies', () => {
    // Otherwise '3 sources' can be one outlet three times, which makes the
    // corroboration signal worse than no signal.
    const clusters = clusterStories([
      item('North Korea fires barrage of short-range ballistic missiles', 'Yonhap', '2026-09-09T10:00:00Z'),
      item('North Korea fires barrage of short range ballistic missiles', 'Yonhap', '2026-09-09T10:30:00Z'),
    ]);
    expect(clusters).toHaveLength(1);
    expect(clusters[0].publishers).toEqual(['Yonhap']);
  });

  it('treats one outlet under two spellings as one source', () => {
    // Live output showed '2 sources: Korea Herald, The Korea Herald' and
    // '2 sources: War on Rocks, War on the Rocks'. Both are one outlet, and
    // counting them twice inflates exactly the signal this feature adds.
    const herald = clusterStories([
      item('North Korea-Russia bridge signals deeper trade and military ties', 'The Korea Herald', '2026-09-09T10:00:00Z'),
      item('North Korea-Russia bridge signals deeper trade and military ties', 'Korea Herald', '2026-09-09T10:30:00Z'),
    ]);
    expect(herald[0].publishers).toEqual(['Korea Herald']);

    const rocks = clusterStories([
      item('China Warrior Scientists: Insights from Recent Operations Around Taiwan', 'War on the Rocks', '2026-09-09T10:00:00Z'),
      item('China Warrior Scientists: Insights from Recent Operations Around Taiwan', 'War on Rocks', '2026-09-09T10:30:00Z'),
    ]);
    expect(rocks[0].publishers).toEqual(['War on Rocks']);
  });

  it('keeps outlets apart when their names share no Latin letters', () => {
    // Stripping punctuation and articles reduces both of these to nothing.
    // Keying on that would fuse an Arabic and a Korean outlet into one source.
    const clusters = clusterStories([
      item('Iranian army says military doctrine shifting to offensive', 'اسلام تايمز', '2026-09-09T10:00:00Z'),
      item('Iranian army says military doctrine shifting to offensive', '조선일보', '2026-09-09T10:30:00Z'),
    ]);
    expect(clusters).toHaveLength(1);
    expect(clusters[0].publishers).toHaveLength(2);
  });

  it('never merges an item whose timestamp cannot be read', () => {
    // 3% of items arrive without a usable date. Merging on similarity alone
    // would reintroduce the back-issue mistake.
    const clusters = clusterStories([
      { title: 'Iran seizes tanker in Strait of Hormuz', publisher: 'Reuters', source: 'X', pubDate: '' },
      { title: 'Iran seizes tanker near Strait of Hormuz, crew detained', publisher: 'AP', source: 'X', pubDate: 'not a date' },
    ]);
    expect(clusters).toHaveLength(2);
  });

  it('leads with the most recent item in a cluster', () => {
    const older = item('Russia and North Korea open the first road across their shared border', 'NPR', '2026-09-09T10:00:00Z');
    const newer = item('North Korea and Russia open first road bridge linking both countries', 'BBC', '2026-09-09T11:00:00Z');
    const clusters = clusterStories([older, newer]);
    expect(clusters[0].lead.title).toBe(newer.title);
    expect(clusters[0].related.map(i => i.title)).toEqual([older.title]);
  });

  it('keeps every item when nothing matches', () => {
    const items = [
      item('Oil climbs toward $100 a barrel', 'NYT', '2026-09-09T10:00:00Z'),
      item('Taipei reports airspace incursion', 'CNA', '2026-09-09T10:30:00Z'),
      item('Houthis claim attack on shipping', 'AP', '2026-09-09T11:00:00Z'),
    ];
    const clusters = clusterStories(items);
    expect(clusters).toHaveLength(3);
    expect(clusters.every(k => k.related.length === 0)).toBe(true);
  });

  it('handles an empty feed', () => {
    expect(clusterStories([])).toEqual([]);
  });
});
