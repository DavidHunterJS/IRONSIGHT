import type { ConflictConfig } from './types';

// Global theater.
//
// Not a front in the sense the other five are. This is a worldwide conflict
// view, and several ConflictConfig fields have no meaningful global value. They
// are left empty on purpose rather than filled with something arbitrary:
//
//   launchSites   no global equivalent
//   ships         a worldwide order of battle is unbounded
//   navyColors    follows ships
//   alertProvider no mirror; the route returns NO_SOURCE
//
// The panels those feed now report an honest empty state instead of looking
// broken, which is what makes this theater viable at all.
//
// Two things are cheaper here than in a regional theater rather than more
// expensive. The fires route already downloads the global FIRMS feed and
// filters locally, so a world bounding box is simply no filtering. And
// adsb.lol's /v2/mil endpoint returns every military aircraft it can see
// worldwide — around 400 — which the flights route already clips to the
// theater box, so a world box means all of them.
//
// This is also the only theater where the general OSINT Telegram channels are
// on-topic. They were excluded from all five regional theaters because the
// telegram route does no relevance filtering and they would have filled those
// panels with other theaters' content. Here there is no other theater to be
// wrong about. Feeds and channels checked 2026-09-01.

export const global: ConflictConfig = {
  key: 'global',
  label: 'GLOBAL',
  theater: 'OSINT COMMAND CENTER // UNCLASSIFIED',

  client: {
    mapCenter: [20.0, 10.0],
    mapZoom: 2,

    // Capitals of the principal actors plus the hubs of active conflicts.
    // Any global city list is a judgement call; this one follows where the
    // feeds above actually report from.
    cities: [
      { name: 'Washington DC', lat: 38.9072, lon: -77.0369, country: 'United States', capital: true },
      { name: 'London', lat: 51.5074, lon: -0.1278, country: 'United Kingdom', capital: true },
      { name: 'Brussels', lat: 50.8503, lon: 4.3517, country: 'Belgium', capital: true },
      { name: 'Moscow', lat: 55.7558, lon: 37.6173, country: 'Russia', capital: true },
      { name: 'Kyiv', lat: 50.4501, lon: 30.5234, country: 'Ukraine', capital: true },
      { name: 'Beijing', lat: 39.9042, lon: 116.4074, country: 'China', capital: true },
      { name: 'Taipei', lat: 25.0330, lon: 121.5654, country: 'Taiwan', capital: true },
      { name: 'Tokyo', lat: 35.6762, lon: 139.6503, country: 'Japan', capital: true },
      { name: 'Seoul', lat: 37.5665, lon: 126.9780, country: 'South Korea', capital: true },
      { name: 'Pyongyang', lat: 39.0392, lon: 125.7625, country: 'North Korea', capital: true },
      { name: 'New Delhi', lat: 28.6139, lon: 77.2090, country: 'India', capital: true },
      { name: 'Islamabad', lat: 33.6844, lon: 73.0479, country: 'Pakistan', capital: true },
      { name: 'Tehran', lat: 35.6892, lon: 51.3890, country: 'Iran', capital: true },
      { name: 'Jerusalem', lat: 31.7683, lon: 35.2137, country: 'Israel', capital: true },
      { name: 'Gaza', lat: 31.5017, lon: 34.4668, country: 'Palestine', capital: false },
      { name: 'Beirut', lat: 33.8938, lon: 35.5018, country: 'Lebanon', capital: true },
      { name: 'Damascus', lat: 33.5138, lon: 36.2765, country: 'Syria', capital: true },
      { name: 'Baghdad', lat: 33.3152, lon: 44.3661, country: 'Iraq', capital: true },
      { name: 'Riyadh', lat: 24.7136, lon: 46.6753, country: 'Saudi Arabia', capital: true },
      { name: 'Sanaa', lat: 15.3694, lon: 44.1910, country: 'Yemen', capital: true },
      { name: 'Ankara', lat: 39.9334, lon: 32.8597, country: 'Turkey', capital: true },
      { name: 'Cairo', lat: 30.0444, lon: 31.2357, country: 'Egypt', capital: true },
      { name: 'Tripoli', lat: 32.8872, lon: 13.1913, country: 'Libya', capital: true },
      { name: 'Khartoum', lat: 15.5007, lon: 32.5599, country: 'Sudan', capital: true },
      { name: 'Addis Ababa', lat: 9.0320, lon: 38.7469, country: 'Ethiopia', capital: true },
      { name: 'Mogadishu', lat: 2.0469, lon: 45.3182, country: 'Somalia', capital: true },
      { name: 'Bamako', lat: 12.6392, lon: -8.0029, country: 'Mali', capital: true },
      { name: 'Ouagadougou', lat: 12.3714, lon: -1.5197, country: 'Burkina Faso', capital: true },
      { name: 'Niamey', lat: 13.5116, lon: 2.1254, country: 'Niger', capital: true },
      { name: 'Kinshasa', lat: -4.4419, lon: 15.2663, country: 'DR Congo', capital: true },
      { name: 'Goma', lat: -1.6792, lon: 29.2228, country: 'DR Congo', capital: false },
      { name: 'Kabul', lat: 34.5553, lon: 69.2075, country: 'Afghanistan', capital: true },
      { name: 'Yangon', lat: 16.8661, lon: 96.1951, country: 'Myanmar', capital: false },
      { name: 'Manila', lat: 14.5995, lon: 120.9842, country: 'Philippines', capital: true },
      { name: 'Caracas', lat: 10.4806, lon: -66.9036, country: 'Venezuela', capital: true },
      { name: 'Bogota', lat: 4.7110, lon: -74.0721, country: 'Colombia', capital: true },
      { name: 'Port-au-Prince', lat: 18.5944, lon: -72.3074, country: 'Haiti', capital: true },
      { name: 'Brasilia', lat: -15.7975, lon: -47.8919, country: 'Brazil', capital: true },
      { name: 'Pretoria', lat: -25.7479, lon: 28.2293, country: 'South Africa', capital: true },
      { name: 'Canberra', lat: -35.2809, lon: 149.1300, country: 'Australia', capital: true },
    ],

    // A global map does not need forty distinct colours. The principal actors
    // are picked out; everything else takes the neutral default.
    cityColors: {
      'United States': '#ffffff',
      Russia: '#ff6666',
      China: '#ffaa44',
      Ukraine: '#66ccff',
      Israel: '#66ccff',
      Iran: '#ff6666',
      'North Korea': '#ff6666',
      Taiwan: '#66ccff',
      default: '#999999',
    },

    // No global equivalent — see the module comment.
    launchSites: [],

    strikeLocations: {
      'washington': [38.91, -77.04], 'london': [51.51, -0.13], 'brussels': [50.85, 4.35],
      'moscow': [55.76, 37.62], 'kyiv': [50.45, 30.52], 'beijing': [39.90, 116.41],
      'taipei': [25.03, 121.57], 'tokyo': [35.68, 139.65], 'seoul': [37.57, 126.98],
      'pyongyang': [39.04, 125.76], 'new delhi': [28.61, 77.21], 'islamabad': [33.68, 73.05],
      'tehran': [35.69, 51.39], 'jerusalem': [31.77, 35.21], 'gaza': [31.50, 34.47],
      'beirut': [33.89, 35.50], 'damascus': [33.51, 36.28], 'baghdad': [33.32, 44.37],
      'riyadh': [24.71, 46.68], 'sanaa': [15.37, 44.19], 'ankara': [39.93, 32.86],
      'cairo': [30.04, 31.24], 'tripoli': [32.89, 13.19], 'khartoum': [15.50, 32.56],
      'addis ababa': [9.03, 38.75], 'mogadishu': [2.05, 45.32], 'bamako': [12.64, -8.00],
      'ouagadougou': [12.37, -1.52], 'niamey': [13.51, 2.13], 'kinshasa': [-4.44, 15.27],
      'goma': [-1.68, 29.22], 'kabul': [34.56, 69.21], 'yangon': [16.87, 96.20],
      'manila': [14.60, 120.98], 'caracas': [10.48, -66.90], 'bogota': [4.71, -74.07],
      'port-au-prince': [18.59, -72.31], 'red sea': [19.00, 39.00],
      'taiwan strait': [24.00, 119.50], 'south china sea': [13.00, 114.00],
      'black sea': [43.50, 34.00], 'strait of hormuz': [26.50, 56.50],
    },

    strikeTargets: [
      ['kyiv', 'Kyiv'], ['moscow', 'Moscow'], ['gaza', 'Gaza'], ['jerusalem', 'Jerusalem'],
      ['beirut', 'Beirut'], ['damascus', 'Damascus'], ['baghdad', 'Baghdad'],
      ['tehran', 'Tehran'], ['sanaa', 'Sanaa'], ['khartoum', 'Khartoum'],
      ['mogadishu', 'Mogadishu'], ['goma', 'Goma'], ['bamako', 'Bamako'],
      ['ouagadougou', 'Ouagadougou'], ['niamey', 'Niamey'], ['tripoli', 'Tripoli'],
      ['kabul', 'Kabul'], ['yangon', 'Yangon'], ['port-au-prince', 'Port-au-Prince'],
      ['caracas', 'Caracas'], ['taipei', 'Taipei'], ['pyongyang', 'Pyongyang'],
      ['red sea', 'Red Sea'], ['taiwan strait', 'Taiwan Strait'],
      ['south china sea', 'South China Sea'], ['black sea', 'Black Sea'],
      ['strait of hormuz', 'Strait of Hormuz'],
    ],

    // No siren mirror anywhere at this scope; these are map reference points.
    alertCities: {
      'kyiv': [50.45, 30.52], 'jerusalem': [31.77, 35.21], 'gaza': [31.50, 34.47],
      'beirut': [33.89, 35.50], 'sanaa': [15.37, 44.19], 'taipei': [25.03, 121.57],
      'seoul': [37.57, 126.98],
    },
    alertFallbackCenter: [20.0, 10.0],

    defaultMissileOrigin: [20.0, 10.0],
    missileOrigins: [],

    flightColors: [
      { match: 'United States', color: '#ffffff' },
      { match: 'Russia', color: '#ff6666' },
      { match: 'China', color: '#ffaa44' },
      { match: 'United Kingdom', color: '#66ccff' },
      { match: 'France', color: '#dd88ff' },
      { match: 'NATO/Europe', color: '#88ddaa' },
    ],

    // Empty: no global order of battle. See the module comment.
    navyColors: {},

    timeZones: [
      { label: 'UTC', zone: 'Etc/UTC', flag: '🌐' },
      { label: 'DC', zone: 'America/New_York', flag: '🇺🇸' },
      { label: 'LON', zone: 'Europe/London', flag: '🇬🇧' },
      { label: 'MOW', zone: 'Europe/Moscow', flag: '🇷🇺' },
      { label: 'DXB', zone: 'Asia/Dubai', flag: '🇦🇪' },
      { label: 'PEK', zone: 'Asia/Shanghai', flag: '🇨🇳' },
    ],

    sourceColors: {
      'BBC': '#bb1919',
      'NYT': '#cccccc',
      'Al Jazeera': '#c8a415',
      'Reuters': '#ff8000',
      'WSJ': '#999999',
      'Fox News': '#3a7bd5',
      'The Diplomat': '#00a0a0',
      'War on Rocks': '#a0522d',
      'Breaking Def': '#8e44ad',
      'Defense News': '#2e8bc0',
      'USNI': '#ffd500',
      'Long War Jrnl': '#a0522d',
      'DoD': '#4b5320',
      'Google News': '#34a853',
    },

    navyOrder: [],
    maritimeRegions: [],

    countryColors: {
      'United States': '#ffffff',
      Russia: '#ff6666',
      China: '#ffaa44',
      Ukraine: '#66ccff',
    },

    // Continent-scale boxes so the satellite panel can still name a region.
    // Ordered most specific first; the first containing box wins.
    regionBoxes: [
      { name: 'Middle East', latMin: 12.0, latMax: 42.0, lonMin: 25.0, lonMax: 63.0 },
      { name: 'Europe', latMin: 35.0, latMax: 71.0, lonMin: -25.0, lonMax: 45.0 },
      { name: 'Africa', latMin: -35.0, latMax: 37.0, lonMin: -18.0, lonMax: 52.0 },
      { name: 'South Asia', latMin: 5.0, latMax: 37.0, lonMin: 60.0, lonMax: 92.0 },
      { name: 'East Asia', latMin: 18.0, latMax: 54.0, lonMin: 92.0, lonMax: 146.0 },
      { name: 'Southeast Asia', latMin: -11.0, latMax: 23.0, lonMin: 92.0, lonMax: 141.0 },
      { name: 'Russia / Central Asia', latMin: 40.0, latMax: 78.0, lonMin: 45.0, lonMax: 180.0 },
      { name: 'North America', latMin: 15.0, latMax: 72.0, lonMin: -170.0, lonMax: -50.0 },
      { name: 'South America', latMin: -56.0, latMax: 13.0, lonMin: -82.0, lonMax: -34.0 },
      { name: 'Oceania', latMin: -48.0, latMax: 0.0, lonMin: 110.0, lonMax: 180.0 },
    ],
    defaultRegion: 'Global',

    alertSystemName: 'No public alert mirror',
    alertStatusTitle: 'GLOBAL ALERT STATUS',

    hasDroneTracker: false,
  },

  server: {
    strikeQueries: [
      'armed+conflict+OR+airstrike+OR+military+offensive',
      'ceasefire+OR+escalation+OR+border+clash',
    ],
    countryAttribution: [
      { match: ['ukraine', 'kyiv', 'russia', 'moscow'], country: 'Russia / Ukraine' },
      { match: ['israel', 'gaza', 'lebanon', 'iran', 'yemen', 'houthi'], country: 'Middle East' },
      { match: ['taiwan', 'china', 'korea', 'japan'], country: 'East Asia' },
      { match: ['sudan', 'sahel', 'mali', 'congo', 'somalia', 'ethiopia'], country: 'Africa' },
    ],
    defaultCountry: 'Global',

    conflictQueries: [
      'armed conflict military offensive airstrike casualties',
      'ceasefire OR escalation OR border clash OR UN Security Council',
    ],
    conflictLocations: [
      { match: ['kyiv', 'ukraine'], location: 'Ukraine' },
      { match: ['gaza'], location: 'Gaza' },
      { match: ['lebanon', 'beirut'], location: 'Lebanon' },
      { match: ['syria', 'damascus'], location: 'Syria' },
      { match: ['iran', 'tehran'], location: 'Iran' },
      { match: ['yemen', 'sanaa', 'houthi'], location: 'Yemen' },
      { match: ['sudan', 'khartoum'], location: 'Sudan' },
      { match: ['somalia', 'mogadishu'], location: 'Somalia' },
      { match: ['mali', 'bamako'], location: 'Mali' },
      { match: ['burkina', 'ouagadougou'], location: 'Burkina Faso' },
      { match: ['niger', 'niamey'], location: 'Niger' },
      { match: ['congo', 'goma'], location: 'DR Congo' },
      { match: ['myanmar', 'yangon'], location: 'Myanmar' },
      { match: ['haiti', 'port-au-prince'], location: 'Haiti' },
      { match: ['venezuela', 'caracas'], location: 'Venezuela' },
      { match: ['taiwan', 'taipei'], location: 'Taiwan' },
      { match: ['korea', 'pyongyang'], location: 'Korean Peninsula' },
      { match: ['red sea'], location: 'Red Sea' },
    ],

    countryQueries: [
      { country: 'Ukraine', flag: '🇺🇦', query: 'Ukraine Russia war front line strike' },
      { country: 'Middle East', flag: '🌍', query: 'Gaza Israel Lebanon Iran Yemen strike' },
      { country: 'Africa', flag: '🌍', query: 'Sudan Sahel Congo Somalia conflict offensive' },
      { country: 'Indo-Pacific', flag: '🌏', query: 'Taiwan Korea South China Sea military' },
    ],

    polymarketKeywords: /war|conflict|ceasefire|invasion|nuclear|sanction|military|nato|missile|coup|escalat/i,
    polymarketExclude: /nfl|nba|nhl|mlb|oscar|grammy|super bowl|world cup/i,

    // The whole world. The fires route already downloads the global FIRMS feed
    // and filters locally, so this is simply no filtering.
    firesBBox: { latMin: -90.0, latMax: 90.0, lonMin: -180.0, lonMax: 180.0 },

    // Unused in practice. The flights route queries both a radius around this
    // centre and adsb.lol's global /v2/mil feed, and clips both to the box
    // below. At this scope /v2/mil already is the worldwide military picture
    // (~400 aircraft), so the radius query is kept minimal rather than
    // duplicating it.
    flightsCenter: { lat: 0.0, lon: 0.0, dist: 1 },
    flightsBBox: { latMin: -90.0, latMax: 90.0, lonMin: -180.0, lonMax: 180.0 },

    // Every feed below returned a valid RSS/Atom document on 2026-09-01.
    newsFeeds: [
      { url: 'https://feeds.bbci.co.uk/news/world/rss.xml', name: 'BBC' },
      { url: 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml', name: 'NYT' },
      { url: 'https://www.aljazeera.com/xml/rss/all.xml', name: 'Al Jazeera' },
      { url: 'https://news.google.com/rss/search?q=site:reuters.com+when:1d&hl=en-US&gl=US&ceid=US:en', name: 'Reuters' },
      { url: 'https://feeds.content.dowjones.io/public/rss/RSSWorldNews', name: 'WSJ' },
      { url: 'https://moxie.foxnews.com/google-publisher/world.xml', name: 'Fox News' },
      // Defence and conflict analysis — on-topic by construction, so unfiltered
      { url: 'https://thediplomat.com/feed/', name: 'The Diplomat' },
      { url: 'https://warontherocks.com/feed/', name: 'War on Rocks', unfiltered: true },
      { url: 'https://breakingdefense.com/feed/', name: 'Breaking Def', unfiltered: true },
      { url: 'https://www.defensenews.com/arc/outboundfeeds/rss/?outputType=xml', name: 'Defense News', unfiltered: true },
      { url: 'https://news.usni.org/feed', name: 'USNI', unfiltered: true },
      { url: 'https://www.longwarjournal.org/feed', name: 'Long War Jrnl', unfiltered: true },
      { url: 'https://www.defense.gov/DesktopModules/ArticleCS/RSS.ashx?ContentType=1&Site=945&max=10', name: 'DoD', unfiltered: true },
      // Conflict-scoped searches
      { url: 'https://news.google.com/rss/search?q=armed+conflict+OR+military+offensive+OR+airstrike&hl=en-US&gl=US&ceid=US:en', name: 'Google News', unfiltered: true },
      { url: 'https://news.google.com/rss/search?q=ceasefire+OR+peace+talks+OR+UN+Security+Council&hl=en-US&gl=US&ceid=US:en', name: 'Google News', unfiltered: true },
    ],
    // Conflict vocabulary rather than geography: at this scope there is no place
    // name that scopes the theater, so the filter has to describe what counts as
    // an event. Bare "strike" and "offensive" are deliberately absent — they
    // match pay strikes and offensive remarks. Compounds are used instead.
    newsRelevanceKeywords: /\b(?:missile|airstrike|air strike|drone strike|rocket attack|artillery|shelling|ballistic|hypersonic|icbm)\b|\b(?:military|ground|counter)[- ]offensive\b|\b(?:incursion|insurgen\w*|militia|paramilitary|junta|armistice|ceasefire|truce|blockade|embargo)\b|\bcoup\b|\bwar crimes?\b|\bgenocide\b|\bcasualt\w+\b|\brefugees?\b|\bdisplaced\b|\bnuclear test\b|\bborder clash\b|\bcross-border\b|\bpeacekeep\w*\b|\bsecurity council\b|\bnato\b|\bcentcom\b|\bhostages?\b|\bcar bomb\b|\bsuicide bomb\w*\b|\bshot down\b|\bshoot down\b|\bwarship\b|\bnaval clash\b/i,

    // The only theater where these belong. They were excluded from all five
    // regional theaters because the telegram route does no relevance filtering
    // and they would have filled those panels with other theaters' content.
    // Verified active 2026-09-01.
    telegramChannels: [
      { name: 'OSINTdefender', label: 'OSINT Defender', color: '#00aaff' },
      { name: 'clashreport', label: 'Clash Report', color: '#e67e22' },
      { name: 'warmonitors', label: 'War Monitors', color: '#ffd500' },
      { name: 'disclosetv', label: 'Disclose.tv', color: '#888888' },
    ],

    // Empty: a worldwide order of battle is unbounded, and a partial one would
    // imply the rest is quiet. The naval panel reports this honestly.
    ships: [],
    shipRegions: [],

    // alertProvider and droneProvider deliberately omitted.
  },
};
