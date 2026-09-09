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

  it('matches a quoted word to its unquoted form', () => {
    // Headlines quote constantly. Treating "'immediately'" and 'immediately'
    // as different words depressed similarity for any quoted headline, which
    // pushed genuine duplicates below the merge threshold.
    expect(titleSimilarity(
      'Trump says the war will end immediately',
      "Trump says the war will end 'immediately'",
    )).toBe(1);
  });

  it('keeps a word with an internal apostrophe whole', () => {
    // Trimming must not reach inside the word.
    expect(titleSimilarity("Iran's nuclear site expands", 'Iran nuclear site expands')).toBeLessThan(1);
    expect(titleSimilarity("Iran's nuclear site expands", "Iran's nuclear site expands")).toBe(1);
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

  it('merges the same event under differently worded headlines', () => {
    // 0.429 — below the original 0.45 threshold, so these showed as two rows
    // until it was re-measured against the fixed tokenizer.
    const bridge = clusterStories([
      item('North Korea and Russia open first road bridge linking both countries', 'BBC', '2026-09-09T10:00:00Z'),
      item('Russia, North Korea open their first car bridge in ceremony: state media', 'NK News', '2026-09-09T11:00:00Z'),
    ]);
    expect(bridge).toHaveLength(1);

    const missile = clusterStories([
      item('North Korea launches another missile toward sea ahead of US-South Korea drills', 'AP', '2026-09-09T10:00:00Z'),
      item('North Korea fires missile ahead of major US-South Korea drills', 'Reuters', '2026-09-09T11:00:00Z'),
    ]);
    expect(missile).toHaveLength(1);
  });

  it('does not merge two instalments of one outlet’s series', () => {
    // 0.429 — the same score as genuine cross-outlet duplicates, so the story
    // threshold alone cannot separate them. These are two different articles
    // in 38 North's 'Beyond Pyongyang' series, published days apart, so the
    // time window does not catch them either.
    const clusters = clusterStories([
      item('Beyond Pyongyang: Mobile Networks, the Internet, and Broadcasting', '38 North', '2026-09-09T10:00:00Z'),
      item('Beyond Pyongyang: Transportation Networks', '38 North', '2026-09-09T11:00:00Z'),
    ]);
    expect(clusters).toHaveLength(2);
  });

  it('still merges an outlet republishing its own article', () => {
    // The legitimate same-outlet case: one piece arriving through two feeds,
    // or with a section prefix attached. These sit at 0.60 and above.
    const clusters = clusterStories([
      item('OPINION: Russian Sabotage Ops in Europe', 'Kyiv Post', '2026-09-09T10:00:00Z'),
      item('Russian Sabotage Ops in Europe', 'Kyiv Post', '2026-09-09T11:00:00Z'),
    ]);
    expect(clusters).toHaveLength(1);
  });

  it('holds the line where the two classes overlap', () => {
    // 0.417, and the highest-scoring pair that is NOT one story: Pakistan's
    // treaty position and Pakistan's message of support are different reports.
    // Genuine duplicates also occur at 0.417, so no threshold separates them —
    // this is the floor, not a dial. Lowering past it starts hiding stories.
    const clusters = clusterStories([
      item('Houthi attacks on Saudi Arabia could activate defence pact, Pakistan says', 'Al Jazeera', '2026-09-09T10:00:00Z'),
      item('Pakistan pledges ‘unwavering solidarity’ with Saudi Arabia after Houthi attacks', 'Arab News', '2026-09-09T11:00:00Z'),
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

  it('counts one wire story picked up by many papers as a single report', () => {
    // Seven CNHI papers ran identical AP copy under one headline while Anadolu
    // wrote its own. Eight outlets, two reports — calling it eight sources
    // overstates corroboration exactly where corroboration is the point.
    const wire = 'War of words between China and Philippines over South China Sea claims';
    const clusters = clusterStories([
      item('China, Philippines exchange sharp words about South China Sea', 'Anadolu Ajansı', '2026-09-09T10:00:00Z'),
      item(wire, 'The Seattle Times', '2026-09-09T10:10:00Z'),
      item(wire, 'Washington Times', '2026-09-09T10:20:00Z'),
      item(wire, 'Oskaloosa Herald', '2026-09-09T10:30:00Z'),
      item(wire, 'Ottumwa Courier', '2026-09-09T10:40:00Z'),
      item(wire, 'Temple Daily', '2026-09-09T10:50:00Z'),
      item(wire, 'Goshen News', '2026-09-09T11:00:00Z'),
    ]);
    expect(clusters).toHaveLength(1);
    expect(clusters[0].publishers).toHaveLength(7);
    expect(clusters[0].reports).toBe(2);
  });

  it('sees through a lightly edited wire headline', () => {
    // One AP story, four outlets, three spellings. Exact matching would call
    // this three reports; it is one.
    const clusters = clusterStories([
      item('Zelenskyy urges more international pressure on Russia for civilian deaths', 'Boston Herald', '2026-09-09T10:00:00Z'),
      item('Zelenskyy urges more international pressure on Russia for civilian deaths', 'Audacy', '2026-09-09T10:10:00Z'),
      item('Zelensky urges more international pressure on Russia for civilian deaths', 'Los Angeles Times', '2026-09-09T10:20:00Z'),
    ]);
    expect(clusters[0].publishers).toHaveLength(3);
    expect(clusters[0].reports).toBe(1);
  });

  it('does not call independent coverage a wire pickup', () => {
    // Two Israeli outlets on the same Trump remark, 0.64 similar. Different
    // reporting of one quote, not one piece of copy — understating this would
    // hide corroboration, which is the failure worth avoiding here.
    const clusters = clusterStories([
      item('Trump: The war with Iran will end immediately after the midterms', 'N12', '2026-09-09T10:00:00Z'),
      item("Trump: Iran war will end 'immediately' after the midterm elections", 'Haaretz', '2026-09-09T10:30:00Z'),
    ]);
    expect(clusters).toHaveLength(1);
    expect(clusters[0].reports).toBe(2);
  });

  it('reports one per outlet when nobody shares copy', () => {
    const clusters = clusterStories([
      item('Russia and North Korea open the first road across their shared border', 'NPR', '2026-09-09T10:00:00Z'),
      item('North Korea and Russia open first road bridge linking both countries', 'BBC', '2026-09-09T11:00:00Z'),
    ]);
    expect(clusters[0].reports).toBe(2);
    expect(clusters[0].publishers).toHaveLength(2);
  });

  it('counts a lone story as one report', () => {
    const clusters = clusterStories([
      item('Oil climbs toward $100 a barrel', 'NYT', '2026-09-09T10:00:00Z'),
    ]);
    expect(clusters[0].reports).toBe(1);
  });

  it('handles an empty feed', () => {
    expect(clusterStories([])).toEqual([]);
  });
});
