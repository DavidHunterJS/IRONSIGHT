import type { ConflictConfig } from './types';

// Korean Peninsula theater.
//
// Second theater with no air-raid mirror. South Korea's civil defence warnings
// are not republished through a free public API, so `alertProvider` is omitted
// and the alerts route returns an empty result rather than falling through to
// another theater's provider.
//
// Telegram coverage is thin here, as it is for Taiwan/China: the route does no
// relevance filtering, so a general OSINT channel would fill this panel with
// other theaters' content. Only regionally-focused channels verified active
// belong here. Feeds and channels checked 2026-09-01.
//
// Naming note: the sea east of Korea is "East Sea" in Korean usage and "Sea of
// Japan" internationally. Both are written out rather than picking a side.

export const northKorea: ConflictConfig = {
  key: 'north-korea',
  label: 'KOREAN PENINSULA',
  theater: 'OSINT COMMAND CENTER // UNCLASSIFIED',

  client: {
    mapCenter: [38.0, 127.5],
    mapZoom: 6,

    cities: [
      // North Korea
      { name: 'Pyongyang', lat: 39.0392, lon: 125.7625, country: 'North Korea', capital: true },
      { name: 'Wonsan', lat: 39.1538, lon: 127.4453, country: 'North Korea', capital: false },
      { name: 'Hamhung', lat: 39.9183, lon: 127.5364, country: 'North Korea', capital: false },
      { name: 'Chongjin', lat: 41.7956, lon: 129.7756, country: 'North Korea', capital: false },
      { name: 'Sinuiju', lat: 40.1006, lon: 124.3983, country: 'North Korea', capital: false },
      { name: 'Nampo', lat: 38.7375, lon: 125.4075, country: 'North Korea', capital: false },
      { name: 'Kaesong', lat: 37.9708, lon: 126.5544, country: 'North Korea', capital: false },
      { name: 'Hyesan', lat: 41.4008, lon: 128.1783, country: 'North Korea', capital: false },
      { name: 'Sinpo', lat: 40.0300, lon: 128.1900, country: 'North Korea', capital: false },
      // South Korea
      { name: 'Seoul', lat: 37.5665, lon: 126.9780, country: 'South Korea', capital: true },
      { name: 'Busan', lat: 35.1796, lon: 129.0756, country: 'South Korea', capital: false },
      { name: 'Incheon', lat: 37.4563, lon: 126.7052, country: 'South Korea', capital: false },
      { name: 'Daegu', lat: 35.8714, lon: 128.6014, country: 'South Korea', capital: false },
      { name: 'Daejeon', lat: 36.3504, lon: 127.3845, country: 'South Korea', capital: false },
      { name: 'Gwangju', lat: 35.1595, lon: 126.8526, country: 'South Korea', capital: false },
      { name: 'Pyeongtaek', lat: 36.9922, lon: 127.1128, country: 'South Korea', capital: false },
      { name: 'Panmunjom (JSA)', lat: 37.9553, lon: 126.6768, country: 'South Korea', capital: false },
      { name: 'Jeju', lat: 33.4996, lon: 126.5312, country: 'South Korea', capital: false },
      // Regional
      { name: 'Tokyo', lat: 35.6762, lon: 139.6503, country: 'Japan', capital: true },
      { name: 'Osaka', lat: 34.6937, lon: 135.5023, country: 'Japan', capital: false },
      { name: 'Naha (Okinawa)', lat: 26.2124, lon: 127.6809, country: 'Japan', capital: false },
      { name: 'Beijing', lat: 39.9042, lon: 116.4074, country: 'China', capital: true },
      { name: 'Dandong', lat: 40.1292, lon: 124.3947, country: 'China', capital: false },
      { name: 'Vladivostok', lat: 43.1332, lon: 131.9113, country: 'Russia', capital: false },
      { name: 'Hagatna (Guam)', lat: 13.4745, lon: 144.7504, country: 'United States', capital: false },
    ],

    cityColors: {
      'North Korea': '#ff6666',
      'South Korea': '#66ccff',
      Japan: '#dd88ff',
      China: '#ffaa44',
      Russia: '#cc8866',
      'United States': '#ffffff',
      default: '#999999',
    },

    // Publicly documented DPRK launch and test infrastructure, at site-level
    // granularity. Ranges are indicative rings for the map, not weapon data.
    launchSites: [
      { name: 'Sohae Satellite Launching Station (Tongchang-ri)', lat: 39.66, lon: 124.71, range: 5000 },
      { name: 'Tonghae Satellite Launching Ground (Musudan-ri)', lat: 40.86, lon: 129.67, range: 3000 },
      { name: 'Sunan (Pyongyang, road-mobile launches)', lat: 39.22, lon: 125.67, range: 2000 },
      { name: 'Wonsan / Kalma', lat: 39.17, lon: 127.49, range: 1500 },
      { name: 'Sinpo South Shipyard (SLBM)', lat: 40.03, lon: 128.19, range: 1500 },
    ],

    strikeLocations: {
      // North Korea
      'pyongyang': [39.04, 125.76], 'wonsan': [39.15, 127.45], 'hamhung': [39.92, 127.54],
      'chongjin': [41.80, 129.78], 'sinuiju': [40.10, 124.40], 'nampo': [38.74, 125.41],
      'kaesong': [37.97, 126.55], 'hyesan': [41.40, 128.18], 'sinpo': [40.03, 128.19],
      'sohae': [39.66, 124.71], 'tongchang-ri': [39.66, 124.71], 'tonghae': [40.86, 129.67],
      'musudan-ri': [40.86, 129.67], 'punggye-ri': [41.28, 129.09], 'yongbyon': [39.80, 125.76],
      'sunan': [39.22, 125.67], 'kalma': [39.17, 127.49],
      // South Korea
      'seoul': [37.57, 126.98], 'busan': [35.18, 129.08], 'incheon': [37.46, 126.71],
      'daegu': [35.87, 128.60], 'daejeon': [36.35, 127.38], 'gwangju': [35.16, 126.85],
      'pyeongtaek': [36.99, 127.11], 'camp humphreys': [36.96, 127.03],
      'osan': [37.09, 127.03], 'kunsan': [35.90, 126.62], 'jeju': [33.50, 126.53],
      'panmunjom': [37.96, 126.68], 'jsa': [37.96, 126.68], 'dmz': [38.00, 127.50],
      'yeonpyeong': [37.66, 125.70], 'baengnyeong': [37.96, 124.68],
      // Regional
      'tokyo': [35.68, 139.65], 'osaka': [34.69, 135.50], 'okinawa': [26.21, 127.68],
      'naha': [26.21, 127.68], 'sasebo': [33.16, 129.72], 'yokosuka': [35.28, 139.66],
      'beijing': [39.90, 116.41], 'dandong': [40.13, 124.39],
      'vladivostok': [43.13, 131.91], 'guam': [13.47, 144.75],
      'yellow sea': [37.00, 124.00], 'east sea': [39.00, 131.00],
      'korea strait': [34.50, 129.00], 'northern limit line': [37.70, 125.20],
    },

    strikeTargets: [
      ['pyongyang', 'Pyongyang'], ['wonsan', 'Wonsan'], ['hamhung', 'Hamhung'],
      ['chongjin', 'Chongjin'], ['sinuiju', 'Sinuiju'], ['nampo', 'Nampo'],
      ['kaesong', 'Kaesong'], ['sinpo', 'Sinpo'], ['sohae', 'Sohae'],
      ['tonghae', 'Tonghae'], ['punggye-ri', 'Punggye-ri'], ['yongbyon', 'Yongbyon'],
      ['sunan', 'Sunan'],
      ['seoul', 'Seoul'], ['busan', 'Busan'], ['incheon', 'Incheon'],
      ['pyeongtaek', 'Pyeongtaek'], ['camp humphreys', 'Camp Humphreys'],
      ['osan', 'Osan AB'], ['kunsan', 'Kunsan AB'], ['jeju', 'Jeju'],
      ['panmunjom', 'Panmunjom (JSA)'], ['dmz', 'DMZ'],
      ['yeonpyeong', 'Yeonpyeong Island'], ['baengnyeong', 'Baengnyeong Island'],
      ['northern limit line', 'Northern Limit Line'],
      ['tokyo', 'Tokyo'], ['okinawa', 'Okinawa'], ['sasebo', 'Sasebo'],
      ['yokosuka', 'Yokosuka'], ['guam', 'Guam'],
      ['yellow sea', 'Yellow Sea'], ['east sea', 'East Sea / Sea of Japan'],
      ['korea strait', 'Korea Strait'],
    ],

    // No air-raid mirror feeds this theater, so these are map reference points
    // rather than live siren locations.
    alertCities: {
      'seoul': [37.57, 126.98], 'incheon': [37.46, 126.71], 'gyeonggi': [37.41, 127.52],
      'busan': [35.18, 129.08], 'daegu': [35.87, 128.60], 'daejeon': [36.35, 127.38],
      'gwangju': [35.16, 126.85], 'ulsan': [35.54, 129.31], 'sejong': [36.48, 127.29],
      'gangwon': [37.86, 128.31], 'jeju': [33.50, 126.53], 'pyeongtaek': [36.99, 127.11],
      'paju': [37.76, 126.78], 'yeonpyeong': [37.66, 125.70],
    },
    alertFallbackCenter: [37.57, 126.98],

    defaultMissileOrigin: [39.22, 125.67],
    missileOrigins: [
      { match: 'sohae', coords: [39.66, 124.71] },
      { match: 'tongchang', coords: [39.66, 124.71] },
      { match: 'sunan', coords: [39.22, 125.67] },
      { match: 'wonsan', coords: [39.17, 127.49] },
      { match: 'sinpo', coords: [40.03, 128.19] },
      { match: 'musudan', coords: [40.86, 129.67] },
    ],

    flightColors: [
      { match: 'North Korea', color: '#ff6666' },
      { match: 'South Korea', color: '#66ccff' },
      { match: 'United States', color: '#ffffff' },
      { match: 'Japan', color: '#dd88ff' },
      { match: 'China', color: '#ffaa44' },
      { match: 'Russia', color: '#cc8866' },
    ],

    navyColors: {
      'KPA Navy': '#ff6666',
      'ROK Navy': '#66ccff',
      'US Navy': '#ffffff',
      'JMSDF': '#dd88ff',
    },

    timeZones: [
      { label: 'SEL', zone: 'Asia/Seoul', flag: '🇰🇷' },
      { label: 'FNJ', zone: 'Asia/Pyongyang', flag: '🇰🇵' },
      { label: 'TYO', zone: 'Asia/Tokyo', flag: '🇯🇵' },
      { label: 'PEK', zone: 'Asia/Shanghai', flag: '🇨🇳' },
      { label: 'GUM', zone: 'Pacific/Guam', flag: '🇬🇺' },
      { label: 'DC', zone: 'America/New_York', flag: '🇺🇸' },
    ],

    sourceColors: {
      'Yonhap': '#66ccff',
      'KBS World': '#4fb0d8',
      'Korea Herald': '#2e8bc0',
      'Korea Times': '#1f6fb2',
      'NK News': '#ffd500',
      '38 North': '#e67e22',
      'Beyond Parallel': '#a0522d',
      'RFA': '#c8a415',
      'Japan Times': '#dd88ff',
      'Nikkei Asia': '#88ddaa',
      'SCMP': '#ffaa44',
      'The Diplomat': '#00a0a0',
      'USNI': '#ffd500',
      'BBC': '#bb1919',
      'NYT': '#cccccc',
      'Al Jazeera': '#c8a415',
      'Breaking Def': '#8e44ad',
      'Reuters': '#ff8000',
      'Google News': '#34a853',
    },

    navyOrder: ['ROK Navy', 'US Navy', 'JMSDF', 'KPA Navy'],
    maritimeRegions: ['Yellow Sea', 'East Sea / Sea of Japan', 'Korea Strait', 'Philippine Sea'],

    countryColors: {
      'North Korea': '#ff6666',
      'South Korea': '#66ccff',
      Japan: '#dd88ff',
      'United States': '#ffffff',
    },

    regionBoxes: [
      { name: 'North Korea', latMin: 37.6, latMax: 43.0, lonMin: 124.2, lonMax: 130.7 },
      { name: 'South Korea', latMin: 33.0, latMax: 38.6, lonMin: 125.0, lonMax: 129.6 },
      { name: 'DMZ', latMin: 37.6, latMax: 38.4, lonMin: 126.4, lonMax: 128.6 },
      { name: 'Yellow Sea', latMin: 33.0, latMax: 39.5, lonMin: 122.0, lonMax: 126.5 },
      { name: 'East Sea / Sea of Japan', latMin: 35.0, latMax: 43.5, lonMin: 128.5, lonMax: 133.5 },
      { name: 'Korea Strait', latMin: 33.0, latMax: 35.5, lonMin: 127.5, lonMax: 130.5 },
    ],
    defaultRegion: 'Korean Peninsula',

    // No public air-raid mirror for this theater — see the module comment.
    alertSystemName: 'No public alert mirror',
    alertStatusTitle: 'KOREA ALERT STATUS',

    hasDroneTracker: false,
  },

  server: {
    strikeQueries: [
      'North+Korea+missile+OR+ICBM+launch+OR+test',
      'Korea+DMZ+OR+NLL+incident+OR+provocation+OR+artillery',
    ],
    countryAttribution: [
      { match: ['north korea', 'dprk', 'pyongyang', 'kim jong', 'kcna'], country: 'North Korea' },
      { match: ['south korea', 'seoul', 'busan', 'incheon', 'rok '], country: 'South Korea' },
      { match: ['japan', 'tokyo', 'okinawa', 'sasebo', 'yokosuka'], country: 'Japan' },
      { match: ['united states', 'usfk', 'camp humphreys', 'guam'], country: 'United States' },
    ],
    defaultCountry: 'Korean Peninsula',

    conflictQueries: [
      'North Korea South Korea military tension missile provocation',
      'DPRK OR Kim Jong Un OR ICBM OR Hwasong OR DMZ OR Panmunjom OR Northern Limit Line',
    ],
    conflictLocations: [
      { match: ['pyongyang'], location: 'Pyongyang, North Korea' },
      { match: ['wonsan'], location: 'Wonsan, North Korea' },
      { match: ['hamhung'], location: 'Hamhung, North Korea' },
      { match: ['chongjin'], location: 'Chongjin, North Korea' },
      { match: ['sinuiju'], location: 'Sinuiju, North Korea' },
      { match: ['nampo'], location: 'Nampo, North Korea' },
      { match: ['kaesong'], location: 'Kaesong, North Korea' },
      { match: ['sinpo'], location: 'Sinpo, North Korea' },
      { match: ['sohae', 'tongchang'], location: 'Sohae Launch Station, North Korea' },
      { match: ['tonghae', 'musudan'], location: 'Tonghae Launch Ground, North Korea' },
      { match: ['punggye'], location: 'Punggye-ri Test Site, North Korea' },
      { match: ['yongbyon'], location: 'Yongbyon Nuclear Complex, North Korea' },
      { match: ['sunan'], location: 'Sunan, North Korea' },
      { match: ['seoul'], location: 'Seoul, South Korea' },
      { match: ['busan'], location: 'Busan, South Korea' },
      { match: ['incheon'], location: 'Incheon, South Korea' },
      { match: ['pyeongtaek', 'camp humphreys'], location: 'Pyeongtaek, South Korea' },
      { match: ['osan'], location: 'Osan Air Base, South Korea' },
      { match: ['kunsan'], location: 'Kunsan Air Base, South Korea' },
      { match: ['panmunjom', 'jsa'], location: 'Panmunjom (JSA)' },
      { match: ['dmz'], location: 'Korean DMZ' },
      { match: ['yeonpyeong'], location: 'Yeonpyeong Island, South Korea' },
      { match: ['baengnyeong'], location: 'Baengnyeong Island, South Korea' },
      { match: ['northern limit line', 'nll'], location: 'Northern Limit Line' },
      { match: ['yellow sea'], location: 'Yellow Sea' },
      { match: ['east sea', 'sea of japan'], location: 'East Sea / Sea of Japan' },
      { match: ['okinawa'], location: 'Okinawa, Japan' },
      { match: ['yokosuka'], location: 'Yokosuka, Japan' },
      { match: ['guam'], location: 'Guam' },
    ],

    countryQueries: [
      { country: 'North Korea', flag: '🇰🇵', query: 'North Korea missile launch KCNA military' },
      { country: 'South Korea', flag: '🇰🇷', query: 'South Korea military North Korea response JCS' },
      { country: 'Japan', flag: '🇯🇵', query: 'Japan North Korea missile EEZ defense ministry' },
      { country: 'United States', flag: '🇺🇸', query: 'USFK United States Korea military exercise' },
    ],

    polymarketKeywords: /north korea|dprk|kim jong|denuclear|korean peninsula|icbm|missile test|nuclear test/i,
    polymarketExclude: /ukraine|russia|israel|iran|gaza|taiwan|nfl|nba|oscar|election night/i,

    firesBBox: { latMin: 32.0, latMax: 44.0, lonMin: 123.0, lonMax: 133.0 },

    flightsCenter: { lat: 38.0, lon: 127.5, dist: 500 },
    flightsBBox: { latMin: 32.0, latMax: 44.0, lonMin: 123.0, lonMax: 133.0 },

    // Every feed below returned a valid RSS/Atom document on 2026-09-01.
    newsFeeds: [
      // South Korean national outlets, deliberately FILTERED. Unlike Ukraine's
      // wartime press, these are ordinary domestic newsrooms — left unfiltered
      // they push restaurant openings and police reshuffles into a conflict
      // dashboard. The relevance keywords scope them to the theater.
      { url: 'https://en.yna.co.kr/RSS/news.xml', name: 'Yonhap' },
      { url: 'https://world.kbs.co.kr/rss/rss_news.htm?lang=e', name: 'KBS World' },
      { url: 'https://www.koreaherald.com/rss/newsAll', name: 'Korea Herald' },
      { url: 'https://www.koreatimes.co.kr/www/rss/nation.xml', name: 'Korea Times' },
      // DPRK specialists — every item is on-topic by construction, so these are
      // the ones that genuinely earn the unfiltered flag.
      { url: 'https://www.nknews.org/feed/', name: 'NK News', unfiltered: true },
      { url: 'https://www.38north.org/feed/', name: '38 North', unfiltered: true },
      { url: 'https://beyondparallel.csis.org/feed/', name: 'Beyond Parallel', unfiltered: true },
      { url: 'https://www.rfa.org/english/rss2.xml', name: 'RFA' },
      // Regional
      { url: 'https://www.japantimes.co.jp/feed/', name: 'Japan Times' },
      { url: 'https://asia.nikkei.com/rss/feed/nar', name: 'Nikkei Asia' },
      { url: 'https://www.scmp.com/rss/4/feed', name: 'SCMP' },
      { url: 'https://thediplomat.com/feed/', name: 'The Diplomat' },
      // Wires
      { url: 'https://feeds.bbci.co.uk/news/world/asia/rss.xml', name: 'BBC' },
      { url: 'https://rss.nytimes.com/services/xml/rss/nyt/AsiaPacific.xml', name: 'NYT' },
      { url: 'https://www.aljazeera.com/xml/rss/all.xml', name: 'Al Jazeera' },
      { url: 'https://news.google.com/rss/search?q=site:reuters.com+when:1d&hl=en-US&gl=US&ceid=US:en', name: 'Reuters' },
      // Defence trade press
      { url: 'https://news.usni.org/feed', name: 'USNI' },
      { url: 'https://breakingdefense.com/feed/', name: 'Breaking Def' },
      // Theater-scoped searches — bypass the filter
      { url: 'https://news.google.com/rss/search?q=North+Korea+missile+OR+ICBM+test&hl=en-US&gl=US&ceid=US:en', name: 'Google News', unfiltered: true },
      { url: 'https://news.google.com/rss/search?q=North+Korea+Kim+Jong+Un+military&hl=en-US&gl=US&ceid=US:en', name: 'Google News', unfiltered: true },
      { url: 'https://news.google.com/rss/search?q=DMZ+OR+inter-Korean+South+Korea+North+Korea&hl=en-US&gl=US&ceid=US:en', name: 'Google News', unfiltered: true },
    ],
    // Korea-specific geography and actors. Deliberately avoids bare "japan" and
    // "china", which would pull in unrelated regional business coverage.
    newsRelevanceKeywords: /north korea|dprk|pyongyang|kim jong|kim yo jong|kcna|south korea|\brok\b|\busfk\b|inter-?korean|korean peninsula|\bdmz\b|panmunjom|\bjsa\b|38th parallel|northern limit line|\bnll\b|yeonpyeong|baengnyeong|\bicbm\b|hwasong|musudan|\bnodong\b|pukguksong|punggye|yongbyon|sohae|tongchang|musudan-ri|\bsinpo\b|\bslbm\b|denuclear|six-party|kaesong|camp humphreys|pyeongtaek|\bosan\b|\bkunsan\b|yellow sea|east sea|sea of japan|korea strait|juche|workers.? party of korea/i,

    // Verified active on 2026-09-01. Short on purpose: the telegram route does
    // no relevance filtering, so a general OSINT channel would fill this panel
    // with other theaters' content. Korea-specific Telegram OSINT is thin —
    // most DPRK-focused handles tested either do not exist or are years stale.
    telegramChannels: [
      { name: 'koreatimes', label: 'Korea Times', color: '#1f6fb2' },
      { name: 'NikkeiAsia', label: 'Nikkei Asia', color: '#88ddaa' },
      { name: 'scmpnews', label: 'SCMP', color: '#ffaa44' },
    ],

    // Curated order of battle. Positions are indicative home-port / patrol-area
    // placements for the map, not live tracks.
    ships: [
      { name: 'ROKS Dokdo', hull: 'LPH-6111', type: 'Amphibious Assault Ship', class: 'Dokdo-class', navy: 'ROK Navy', lat: 35.10, lon: 129.05, status: 'Home Port (Busan)', region: 'Korea Strait', group: 'ROKN' },
      { name: 'ROKS Sejong the Great', hull: 'DDG-991', type: 'Destroyer (Aegis)', class: 'Sejong the Great-class', navy: 'ROK Navy', lat: 37.20, lon: 129.60, status: 'BMD Patrol', region: 'East Sea / Sea of Japan', group: 'ROKN' },
      { name: 'ROKS Chungmugong Yi Sun-sin', hull: 'DDH-975', type: 'Destroyer', class: 'Chungmugong Yi Sun-sin-class', navy: 'ROK Navy', lat: 36.80, lon: 125.60, status: 'Patrol', region: 'Yellow Sea', group: 'ROKN' },
      { name: 'ROKS Dosan Ahn Changho', hull: 'SS-083', type: 'Submarine', class: 'Dosan Ahn Changho-class', navy: 'ROK Navy', lat: 35.05, lon: 129.10, status: 'Home Port (Busan)', region: 'Korea Strait', group: 'ROKN' },
      { name: 'USS George Washington', hull: 'CVN-73', type: 'Aircraft Carrier', class: 'Nimitz-class', navy: 'US Navy', lat: 35.28, lon: 139.66, status: 'Forward Deployed (Yokosuka)', region: 'Philippine Sea', group: '7th Fleet' },
      { name: 'USS America', hull: 'LHA-6', type: 'Amphibious Assault Ship', class: 'America-class', navy: 'US Navy', lat: 33.16, lon: 129.72, status: 'Forward Deployed (Sasebo)', region: 'Korea Strait', group: '7th Fleet' },
      { name: 'USS Milius', hull: 'DDG-69', type: 'Destroyer (Aegis BMD)', class: 'Arleigh Burke-class', navy: 'US Navy', lat: 38.20, lon: 131.00, status: 'BMD Patrol', region: 'East Sea / Sea of Japan', group: '7th Fleet' },
      { name: 'JS Kongo', hull: 'DDG-173', type: 'Destroyer (Aegis BMD)', class: 'Kongo-class', navy: 'JMSDF', lat: 37.50, lon: 132.00, status: 'BMD Patrol', region: 'East Sea / Sea of Japan' },
      { name: 'JS Izumo', hull: 'DDH-183', type: 'Helicopter Destroyer', class: 'Izumo-class', navy: 'JMSDF', lat: 34.00, lon: 132.50, status: 'Active', region: 'Korea Strait' },
      { name: 'Najin', hull: '531', type: 'Frigate', class: 'Najin-class', navy: 'KPA Navy', lat: 38.72, lon: 125.35, status: 'West Sea Fleet', region: 'Yellow Sea', group: 'KPN' },
      { name: 'Sinpo-class SSB', hull: 'Various', type: 'Submarine (SSB)', class: 'Sinpo-class', navy: 'KPA Navy', lat: 40.03, lon: 128.19, status: 'Sinpo Shipyard', region: 'East Sea / Sea of Japan', group: 'KPN' },
      { name: 'Romeo-class Submarines', hull: 'Various', type: 'Submarine', class: 'Romeo-class', navy: 'KPA Navy', lat: 39.80, lon: 128.00, status: 'East Sea Fleet', region: 'East Sea / Sea of Japan', group: 'KPN' },
    ],
    shipRegions: ['Yellow Sea', 'East Sea / Sea of Japan', 'Korea Strait', 'Philippine Sea'],

    // alertProvider deliberately omitted: no free public air-raid mirror for
    // this theater. droneProvider omitted: no real-time track source.
  },
};
