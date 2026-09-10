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

// Feeds with no HTTPS endpoint at all. Empty, and worth keeping that way: every
// configured feed is now fetched over TLS. The list held one entry, CNN's
// Middle East feed, which was carried over plain HTTP because rss.cnn.com
// refuses TLS connections — then turned out to have published nothing in 1415
// days and was dropped. An exception belongs here rather than in a weakened
// invariant, so a future one stays visible.
const HTTP_ONLY_FEEDS = new Set<string>([]);

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

  // A feed whose name has no entry in sourceColors still renders — NewsFeed
  // falls back to a grey badge — so adding or renaming a source silently drops
  // its colour with nothing to notice.
  it('colours every news source it lists', () => {
    for (const feed of server.newsFeeds) {
      expect(client.sourceColors[feed.name], `no colour for '${feed.name}'`).toBeDefined();
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

  it('matches the abbreviations headlines actually use', () => {
    // Korean outlets and the BBC write 'N. Korea' and 'N Korea'. Both of these
    // were dropped from filtered feeds on 2026-09-10.
    const re = cfg.server.newsRelevanceKeywords;
    expect(re.test('N Korea has built two-storey uranium enrichment facility, says watchdog')).toBe(true);
    expect(re.test("S. Korea, U.S. hold talks on joint responses to N. Korea's WMD")).toBe(true);
    expect(re.test('N. Korean troops cross MDL more than 20 times in August')).toBe(true);
    expect(re.test('North Korea test-fires two ICBMs')).toBe(true);
  });

  it('leaves "S. Korea" alone, because Yonhap uses it for everything', () => {
    // Matching it would have added basketball, flood relief and child-welfare
    // rankings for roughly two alliance stories. 'South Korea' spelled out is
    // still matched; the abbreviation is where the domestic news lives.
    const re = cfg.server.newsRelevanceKeywords;
    expect(re.test("(Asiad) S. Korea beats Saudi Arabia to open men's basketball tournament")).toBe(false);
    expect(re.test('S. Korea ranks 27th among wealthy nations for child well-being: UNICEF')).toBe(false);
    // And the abbreviation must not fire inside a word.
    expect(re.test('Samsung opens a new chip plant in Korea')).toBe(false);
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

describe('global', () => {
  const cfg = CONFLICTS['global'];

  it('is registered', () => {
    expect(ALL_CONFLICT_KEYS).toContain('global');
  });

  it('covers the whole world', () => {
    for (const b of [cfg.server.firesBBox, cfg.server.flightsBBox]) {
      expect(b.latMin).toBe(-90);
      expect(b.latMax).toBe(90);
      expect(b.lonMin).toBe(-180);
      expect(b.lonMax).toBe(180);
    }
  });

  it('is empty where a global value would be arbitrary, and says so', () => {
    // These are deliberate, not oversights. A partial worldwide order of battle
    // would imply the rest of the world's navies are quiet.
    expect(cfg.server.ships).toEqual([]);
    expect(cfg.client.navyColors).toEqual({});
    expect(cfg.client.launchSites).toEqual([]);
    expect(cfg.server.alertProvider).toBeUndefined();
  });

  it('still has the fields the populated panels need', () => {
    expect(cfg.client.cities.length).toBeGreaterThan(20);
    expect(cfg.server.newsFeeds.length).toBeGreaterThan(10);
    expect(cfg.server.telegramChannels.length).toBeGreaterThan(0);
    expect(cfg.client.regionBoxes.length).toBeGreaterThan(5);
  });

  it('filters on conflict vocabulary, not geography', () => {
    const re = cfg.server.newsRelevanceKeywords;
    expect(re.test('Russian missile strike on Kyiv kills three')).toBe(true);
    expect(re.test('Ceasefire holds for a second day')).toBe(true);
    expect(re.test('NATO scrambles jets after border incursion')).toBe(true);
    expect(re.test('Warship shot down a drone')).toBe(true);
    // Bare "strike" and "offensive" would wreck this at global scope.
    expect(re.test('Union announces strike over pay dispute')).toBe(false);
    expect(re.test('Critics called the remarks deeply offensive')).toBe(false);
  });

  it('matches its terms in the plural, and "counteroffensive" as one word', () => {
    // Every term was anchored at both ends in the singular, so 'missiles',
    // 'airstrikes' and 'warships' failed, and 'counteroffensive' failed the
    // separator. Every headline below was in a configured feed on 2026-09-10
    // and failed the filter; across all 4,034 titles that day the fix newly
    // matched 78 conflict headlines and lost none.
    const re = cfg.server.newsRelevanceKeywords;
    expect(re.test('Houthis launch 14 missiles, drone attacks on western Yemen')).toBe(true);
    expect(re.test('US launches new airstrikes on Iran, with Tehran firing back at 3 Gulf Arab states')).toBe(true);
    expect(re.test('With Close Calls on U.S. Warships, Iran Shows New Appetite for Escalation')).toBe(true);
    expect(re.test('US-backed effort to disarm Iraq’s Iran-linked militias hits setback, experts say')).toBe(true);
    expect(re.test('Ukrainian counteroffensive pushes back Russian forces near Lyman, Russian military bloggers say')).toBe(true);
    expect(re.test('How Ukrainian Drone Strikes Are Pounding Russia’s Economy')).toBe(true);
    // The plurals must not reopen what the compounds were there to prevent.
    expect(re.test('Carney, at a Cabinet Retreat, Considers Further Trade Strikes Against the U.S.')).toBe(false);
    expect(re.test('Eiffel Tower Workers Strike, Saying Women Were Excluded From Hindu Group’s Visit')).toBe(false);
  });

  it('keeps the war reporting the major outlets file', () => {
    // BBC, NYT, Al Jazeera, Reuters, WSJ and Fox, 2026-09-10. The filter kept
    // 3 of their 103 current items; all of these were among the 100 it dropped.
    const re = cfg.server.newsRelevanceKeywords;
    // A strike named by who carried it out.
    expect(re.test('Family of four killed as they slept in Israeli strike on Gaza')).toBe(true);
    expect(re.test('Russian strikes continue following visit by Witkoff and Kushner to Kyiv')).toBe(true);
    // Named armed groups.
    expect(re.test('Houthis Seize Strategic Red Sea Port, a Major Victory for Iranian Ally')).toBe(true);
    expect(re.test('Is the Iran-backed terrorist movement Hezbollah on the ropes in Lebanon?')).toBe(true);
    // War, drones and the forces that fight them.
    expect(re.test("Iran war won't end until after crucial November elections, says Trump")).toBe(true);
    expect(re.test("Russia's new jet-powered drones outpacing Ukraine's air defences with daily launches")).toBe(true);
    expect(re.test('Canada agrees on C$350 million air defense package for Ukraine, Carney says')).toBe(true);
  });

  it('does not take trade, price or culture wars for wars', () => {
    const re = cfg.server.newsRelevanceKeywords;
    expect(re.test('Bombardier Shares Down as Trump’s Trade War Targets Canadian Jet Maker')).toBe(false);
    expect(re.test('The Theme Park at the Heart of France’s Culture War')).toBe(false);
    expect(re.test('Supermarkets cut milk prices as price war deepens')).toBe(false);
  });
});
