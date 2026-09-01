import { describe, it, expect } from 'vitest';

import { ALL_CONFLICT_KEYS, CONFLICTS } from './index';
import type { ConflictKey } from './index';

// Invariants every registered theater must hold. A theater is a large hand-built
// data payload, so these catch the errors that data entry actually produces —
// a swapped lat/lon, an inverted bounding box, a Telegram handle the scraper
// will silently reject, a ship filed under a navy with no colour.

const keys = ALL_CONFLICT_KEYS as ConflictKey[];

// Mirrors CHANNEL_RE in src/app/api/telegram/route.ts. A name failing this is
// dropped by the route without an error, so the panel just quietly loses a source.
const CHANNEL_RE = /^[A-Za-z0-9_]{3,64}$/;

// Feeds with no HTTPS endpoint at all. rss.cnn.com refuses TLS connections, so
// this cannot be fixed by rewriting the scheme — the choice is an unencrypted
// fetch or dropping the source. Listed explicitly so the exception stays visible
// and the invariant keeps applying to every other feed.
const HTTP_ONLY_FEEDS = new Set<string>([
  // No HTTPS endpoint at all; rss.cnn.com refuses TLS connections.
  'http://rss.cnn.com/rss/edition_meast.rss',
  // Serves valid HTTPS, but anchored to an Actalis 2025 root that is not in the
  // Mozilla program, so Node cannot verify it. Plain HTTP is the working route
  // until that root is added.
  'http://www.presstv.ir/rss.xml',
]);

function isLat(n: number) { return Number.isFinite(n) && n >= -90 && n <= 90; }
function isLon(n: number) { return Number.isFinite(n) && n >= -180 && n <= 180; }

describe.each(keys)('theater: %s', (key) => {
  const cfg = CONFLICTS[key];
  const { client, server } = cfg;

  it('has a label and a theater line', () => {
    expect(cfg.label.trim().length).toBeGreaterThan(0);
    expect(cfg.theater.trim().length).toBeGreaterThan(0);
  });

  it('has a plottable map centre', () => {
    expect(isLat(client.mapCenter[0])).toBe(true);
    expect(isLon(client.mapCenter[1])).toBe(true);
  });

  it('has cities with in-range coordinates', () => {
    expect(client.cities.length).toBeGreaterThan(0);
    for (const c of client.cities) {
      expect(isLat(c.lat), `${c.name} lat`).toBe(true);
      expect(isLon(c.lon), `${c.name} lon`).toBe(true);
    }
  });

  it('colours every country it plots', () => {
    for (const c of client.cities) {
      expect(
        client.cityColors[c.country] ?? client.cityColors.default,
        `no colour for ${c.country}`,
      ).toBeDefined();
    }
  });

  it('has in-range geocode tables', () => {
    for (const [name, [lat, lon]] of Object.entries(client.strikeLocations)) {
      expect(isLat(lat), `${name} lat`).toBe(true);
      expect(isLon(lon), `${name} lon`).toBe(true);
    }
    for (const [name, [lat, lon]] of Object.entries(client.alertCities)) {
      expect(isLat(lat), `${name} lat`).toBe(true);
      expect(isLon(lon), `${name} lon`).toBe(true);
    }
  });

  it('names a strike target for every geocode key it advertises', () => {
    for (const [k] of client.strikeTargets) {
      expect(client.strikeLocations[k], `strikeTargets key "${k}" has no coordinates`).toBeDefined();
    }
  });

  it('uses real IANA time zones', () => {
    // A typo here throws inside Intl at render time rather than at build.
    for (const tz of client.timeZones) {
      expect(() => new Intl.DateTimeFormat('en-US', { timeZone: tz.zone }).format(), tz.zone).not.toThrow();
    }
  });

  it('has bounding boxes that are the right way round', () => {
    for (const [label, b] of [
      ['firesBBox', server.firesBBox],
      ['flightsBBox', server.flightsBBox],
    ] as const) {
      expect(b.latMin, `${label} lat`).toBeLessThan(b.latMax);
      expect(b.lonMin, `${label} lon`).toBeLessThan(b.lonMax);
      expect(isLat(b.latMin) && isLat(b.latMax), `${label} lat range`).toBe(true);
      expect(isLon(b.lonMin) && isLon(b.lonMax), `${label} lon range`).toBe(true);
    }
    for (const r of client.regionBoxes) {
      expect(r.latMin, `${r.name} lat`).toBeLessThan(r.latMax);
      expect(r.lonMin, `${r.name} lon`).toBeLessThan(r.lonMax);
    }
  });

  it('has https news feeds with no duplicates', () => {
    expect(server.newsFeeds.length).toBeGreaterThan(0);
    const urls = server.newsFeeds.map((f) => f.url);
    expect(new Set(urls).size, 'duplicate feed url').toBe(urls.length);
    for (const f of server.newsFeeds) {
      expect(f.name.trim().length, f.url).toBeGreaterThan(0);
      if (HTTP_ONLY_FEEDS.has(f.url)) continue;
      expect(f.url.startsWith('https://'), `${f.url} is not https`).toBe(true);
    }
  });

  it('has Telegram handles the scraper will accept', () => {
    const names = server.telegramChannels.map((c) => c.name);
    expect(new Set(names).size, 'duplicate channel').toBe(names.length);
    for (const c of server.telegramChannels) {
      expect(CHANNEL_RE.test(c.name), `"${c.name}" is rejected by the telegram route`).toBe(true);
    }
  });

  it('files every ship under a coloured navy and a listed region', () => {
    for (const s of server.ships) {
      expect(isLat(s.lat), `${s.name} lat`).toBe(true);
      expect(isLon(s.lon), `${s.name} lon`).toBe(true);
      expect(client.navyColors[s.navy], `no colour for navy "${s.navy}"`).toBeDefined();
      expect(server.shipRegions, `${s.name} region "${s.region}"`).toContain(s.region);
    }
  });

  it('lists every navy it colours in the panel order', () => {
    for (const navy of Object.keys(client.navyColors)) {
      expect(client.navyOrder, `navy "${navy}" missing from navyOrder`).toContain(navy);
    }
  });

  it('declares a known alert provider or none at all', () => {
    // Undefined is a valid answer — not every theater has an air-raid mirror.
    // The alerts route must treat it as "no source", never as a default.
    expect([undefined, 'tzevaadom', 'alertsua']).toContain(server.alertProvider);
  });

  it('only claims a drone tracker when a provider backs it', () => {
    if (client.hasDroneTracker) expect(server.droneProvider).toBeDefined();
  });
});

describe('taiwan-china', () => {
  const cfg = CONFLICTS['taiwan-china'];

  it('is registered', () => {
    expect(ALL_CONFLICT_KEYS).toContain('taiwan-china');
  });

  it('declares no air-raid provider', () => {
    // The point of adding this theater first: it is the first one with no
    // provider, which is what proves the alerts route no longer falls through
    // to another theater's feed.
    expect(cfg.server.alertProvider).toBeUndefined();
    expect(cfg.client.hasDroneTracker).toBe(false);
  });

  it('scopes its news relevance filter to the theater', () => {
    const re = cfg.server.newsRelevanceKeywords;
    expect(re.test('PLA aircraft crossed the Taiwan Strait median line')).toBe(true);
    expect(re.test('Philippine resupply mission to Second Thomas Shoal')).toBe(true);
    // Must not pull in the other theaters' stories.
    expect(re.test('Russian drone strike on Kyiv overnight')).toBe(false);
    expect(re.test('Israeli strikes reported near Tehran')).toBe(false);
  });
});

describe('north-korea', () => {
  const cfg = CONFLICTS['north-korea'];

  it('is registered', () => {
    expect(ALL_CONFLICT_KEYS).toContain('north-korea');
  });

  it('declares no air-raid provider', () => {
    // Second provider-less theater. South Korea's civil defence warnings are
    // not mirrored through a free public API.
    expect(cfg.server.alertProvider).toBeUndefined();
    expect(cfg.client.hasDroneTracker).toBe(false);
  });

  it('scopes its news relevance filter to the theater', () => {
    const re = cfg.server.newsRelevanceKeywords;
    expect(re.test('North Korea fired an ICBM into the East Sea')).toBe(true);
    expect(re.test('Artillery exchanged near the Northern Limit Line')).toBe(true);
    expect(re.test('Inspection at the Yongbyon nuclear complex')).toBe(true);
    // Must not pull in the other theaters' stories.
    expect(re.test('Russian drone strike on Kyiv overnight')).toBe(false);
    expect(re.test('PLA aircraft crossed the Taiwan Strait median line')).toBe(false);
    expect(re.test('Israeli strikes reported near Tehran')).toBe(false);
  });

  it('does not pick a side on the naming of the eastern sea', () => {
    // "East Sea" is Korean usage, "Sea of Japan" international. The config
    // writes both rather than choosing, and the filter matches either.
    expect(cfg.server.shipRegions).toContain('East Sea / Sea of Japan');
    expect(cfg.server.newsRelevanceKeywords.test('a launch into the Sea of Japan')).toBe(true);
    expect(cfg.server.newsRelevanceKeywords.test('a launch into the East Sea')).toBe(true);
  });
});

describe('news relevance filters reject ordinary English', () => {
  // Every term in these regexes is a substring match unless anchored, and short
  // place names collide with common words. Three shipped that way:
  //   "plan\\b"  matched the English word "plan"
  //   "bashi"   matched "Bashir"
  //   "matsu"   matched "Matsushita"
  //   "osan"    matched "Doosan"
  //   "seoul"   matched any Seoul-datelined domestic story
  const NOISE = [
    'Company announces restructuring plan for next quarter',
    'The government unveiled an economic plan',
    'Omar al-Bashir appears in court',
    'Matsushita reports quarterly earnings',
    'Doosan widens helicopter search for missing workers in Nepal',
    "2PM's Chansung walks Re Rhee show opening Seoul Fashion Week",
    'Three regional universities to receive funding to close gap with Seoul',
    'Chipotle brings burritos to Korea, and a familiar American anxiety',
  ];

  it.each(keys)('%s does not match unrelated headlines', (key) => {
    const re = CONFLICTS[key].server.newsRelevanceKeywords;
    for (const t of NOISE) {
      expect(re.test(t), `"${t}" matched ${re.source.slice(0, 40)}...`).toBe(false);
    }
  });

  it('still matches genuinely on-topic headlines', () => {
    const nk = CONFLICTS['north-korea'].server.newsRelevanceKeywords;
    expect(nk.test('North Korea fired an ICBM into the East Sea')).toBe(true);
    expect(nk.test('South Korea scrambles jets after airspace incursion')).toBe(true);
    expect(nk.test('Aircraft diverted to Osan Air Base')).toBe(true);

    const tw = CONFLICTS['taiwan-china'].server.newsRelevanceKeywords;
    expect(tw.test('PLA Navy vessels transited the Bashi Channel')).toBe(true);
    expect(tw.test('Shelling reported near Matsu islands')).toBe(true);
    expect(tw.test('PLA aircraft crossed the median line')).toBe(true);
  });
});

describe('red-sea', () => {
  const cfg = CONFLICTS['red-sea'];

  it('is registered', () => {
    expect(ALL_CONFLICT_KEYS).toContain('red-sea');
  });

  it('declares no air-raid provider', () => {
    expect(cfg.server.alertProvider).toBeUndefined();
    expect(cfg.client.hasDroneTracker).toBe(false);
  });

  it('anchors the short place names that sit inside common words', () => {
    const re = cfg.server.newsRelevanceKeywords;
    // "aden" inside laden/maiden/garden is the trap this theater walks into.
    expect(re.test('The vessel was heavily laden with crude')).toBe(false);
    expect(re.test('A maiden voyage for the new carrier')).toBe(false);
    expect(re.test('Attack reported in the Gulf of Aden')).toBe(true);
    expect(re.test('Port of Aden reopened to traffic')).toBe(true);
  });

  it('does not match ordinary commercial shipping chatter', () => {
    const re = cfg.server.newsRelevanceKeywords;
    // The shipping trade press is filtered, so bare "shipping" would drag in
    // every freight-rate and logistics story they publish.
    expect(re.test('Retailer offers free shipping this weekend')).toBe(false);
    expect(re.test('Shipping costs fall on weaker demand')).toBe(false);
    expect(re.test('Merchant vessel struck in the Red Sea')).toBe(true);
    expect(re.test('Bab el-Mandeb transits down sharply')).toBe(true);
  });

  it('is maritime-first: every region it plots is a waterway', () => {
    // Unlike the land theaters, this one is a corridor. Its ship regions and
    // maritime regions must agree, or the naval panel silently drops vessels.
    expect(cfg.server.shipRegions).toEqual(cfg.client.maritimeRegions);
  });
});
