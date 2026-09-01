import type { ConflictConfig } from './types';

// Red Sea / Bab el-Mandeb theater.
//
// The first maritime-first theater: the subject is a shipping corridor rather
// than a land front, so the naval order of battle and the commercial-shipping
// press carry more of the signal than the city grid does.
//
// Third theater with no air-raid mirror. alertProvider is omitted and the
// alerts route returns NO_SOURCE.
//
// Telegram is three regionally-focused channels verified active on 2026-09-01.
// Al-Masirah (AlMasirahNews), the Ansarallah-aligned outlet and the closest
// thing to a primary Houthi voice, was last active 2026-08-09 and is left out
// on the same freshness bar applied to the other theaters — worth adding back
// if it resumes posting.
//
// Feeds checked 2026-09-01; those shared with iran-israel are already verified
// there.

export const redSea: ConflictConfig = {
  key: 'red-sea',
  label: 'RED SEA',
  theater: 'OSINT COMMAND CENTER // UNCLASSIFIED',

  client: {
    mapCenter: [18.0, 42.0],
    mapZoom: 5,

    cities: [
      // Yemen
      { name: 'Sanaa', lat: 15.3694, lon: 44.1910, country: 'Yemen', capital: true },
      { name: 'Aden', lat: 12.7797, lon: 45.0095, country: 'Yemen', capital: false },
      { name: 'Hodeidah', lat: 14.7978, lon: 42.9545, country: 'Yemen', capital: false },
      { name: 'Taiz', lat: 13.5789, lon: 44.0219, country: 'Yemen', capital: false },
      { name: 'Mocha', lat: 13.3167, lon: 43.2500, country: 'Yemen', capital: false },
      { name: 'Saada', lat: 16.9402, lon: 43.7637, country: 'Yemen', capital: false },
      { name: 'Mukalla', lat: 14.5426, lon: 49.1242, country: 'Yemen', capital: false },
      // Saudi Arabia
      { name: 'Riyadh', lat: 24.7136, lon: 46.6753, country: 'Saudi Arabia', capital: true },
      { name: 'Jeddah', lat: 21.4858, lon: 39.1925, country: 'Saudi Arabia', capital: false },
      { name: 'Jizan', lat: 16.8892, lon: 42.5511, country: 'Saudi Arabia', capital: false },
      // Egypt
      { name: 'Cairo', lat: 30.0444, lon: 31.2357, country: 'Egypt', capital: true },
      { name: 'Suez', lat: 29.9668, lon: 32.5498, country: 'Egypt', capital: false },
      { name: 'Port Said', lat: 31.2653, lon: 32.3019, country: 'Egypt', capital: false },
      // Horn of Africa
      { name: 'Djibouti City', lat: 11.5721, lon: 43.1456, country: 'Djibouti', capital: true },
      { name: 'Asmara', lat: 15.3229, lon: 38.9251, country: 'Eritrea', capital: true },
      { name: 'Assab', lat: 13.0000, lon: 42.7333, country: 'Eritrea', capital: false },
      { name: 'Massawa', lat: 15.6089, lon: 39.4500, country: 'Eritrea', capital: false },
      { name: 'Port Sudan', lat: 19.6158, lon: 37.2164, country: 'Sudan', capital: false },
      { name: 'Berbera', lat: 10.4396, lon: 45.0143, country: 'Somalia', capital: false },
      { name: 'Mogadishu', lat: 2.0469, lon: 45.3182, country: 'Somalia', capital: true },
      // Other littoral
      { name: 'Eilat', lat: 29.5581, lon: 34.9482, country: 'Israel', capital: false },
      { name: 'Salalah', lat: 17.0151, lon: 54.0924, country: 'Oman', capital: false },
      { name: 'Muscat', lat: 23.5880, lon: 58.3829, country: 'Oman', capital: true },
    ],

    cityColors: {
      Yemen: '#ff6666',
      'Saudi Arabia': '#88ddaa',
      Egypt: '#ffaa44',
      Djibouti: '#66ccff',
      Eritrea: '#dd88ff',
      Sudan: '#cc8866',
      Somalia: '#aaccff',
      Israel: '#ffffff',
      Oman: '#c8a415',
      default: '#999999',
    },

    // Publicly reported Houthi launch areas, at governorate/coastal granularity.
    // Ranges are indicative rings for the map, not weapon data.
    launchSites: [
      { name: 'Hodeidah Coast (anti-ship missiles)', lat: 14.80, lon: 42.95, range: 300 },
      { name: 'Ras Isa', lat: 15.15, lon: 42.65, range: 300 },
      { name: 'Mocha / Bab el-Mandeb approaches', lat: 13.32, lon: 43.25, range: 200 },
      { name: 'Sanaa (medium-range)', lat: 15.37, lon: 44.19, range: 1500 },
      { name: 'Saada', lat: 16.94, lon: 43.76, range: 1000 },
      { name: 'Al Jawf', lat: 16.20, lon: 45.30, range: 1200 },
    ],

    strikeLocations: {
      // Yemen
      'sanaa': [15.37, 44.19], 'aden': [12.78, 45.01], 'hodeidah': [14.80, 42.95],
      'hudaydah': [14.80, 42.95], 'taiz': [13.58, 44.02], 'mocha': [13.32, 43.25],
      'saada': [16.94, 43.76], 'mukalla': [14.54, 49.12], 'ras isa': [15.15, 42.65],
      'al jawf': [16.20, 45.30], 'marib': [15.47, 45.32], 'socotra': [12.50, 53.90],
      // Waterways and chokepoints
      'bab el-mandeb': [12.58, 43.33], 'bab al-mandab': [12.58, 43.33],
      'red sea': [19.00, 39.00], 'gulf of aden': [12.50, 47.00],
      'suez canal': [30.50, 32.35], 'suez': [29.97, 32.55], 'port said': [31.27, 32.30],
      'strait of hormuz': [26.50, 56.50], 'arabian sea': [14.00, 60.00],
      'perim': [12.66, 43.41], 'mayyun': [12.66, 43.41],
      // Littoral states
      'jeddah': [21.49, 39.19], 'jizan': [16.89, 42.55], 'riyadh': [24.71, 46.68],
      'djibouti': [11.57, 43.15], 'assab': [13.00, 42.73], 'massawa': [15.61, 39.45],
      'asmara': [15.32, 38.93], 'port sudan': [19.62, 37.22], 'berbera': [10.44, 45.01],
      'mogadishu': [2.05, 45.32], 'eilat': [29.56, 34.95], 'salalah': [17.02, 54.09],
      'muscat': [23.59, 58.38], 'cairo': [30.04, 31.24],
    },

    strikeTargets: [
      ['sanaa', 'Sanaa'], ['aden', 'Aden'], ['hodeidah', 'Hodeidah'],
      ['taiz', 'Taiz'], ['mocha', 'Mocha'], ['saada', 'Saada'],
      ['mukalla', 'Mukalla'], ['ras isa', 'Ras Isa'], ['al jawf', 'Al Jawf'],
      ['marib', 'Marib'], ['socotra', 'Socotra'],
      ['bab el-mandeb', 'Bab el-Mandeb'], ['red sea', 'Red Sea'],
      ['gulf of aden', 'Gulf of Aden'], ['suez canal', 'Suez Canal'],
      ['suez', 'Suez'], ['port said', 'Port Said'],
      ['strait of hormuz', 'Strait of Hormuz'], ['arabian sea', 'Arabian Sea'],
      ['perim', 'Perim (Mayyun) Island'],
      ['jeddah', 'Jeddah'], ['jizan', 'Jizan'], ['djibouti', 'Djibouti'],
      ['assab', 'Assab'], ['massawa', 'Massawa'], ['port sudan', 'Port Sudan'],
      ['berbera', 'Berbera'], ['eilat', 'Eilat'], ['salalah', 'Salalah'],
    ],

    // No air-raid mirror feeds this theater. These are map reference points for
    // the ports and chokepoints the corridor turns on, not siren locations.
    alertCities: {
      'sanaa': [15.37, 44.19], 'hodeidah': [14.80, 42.95], 'aden': [12.78, 45.01],
      'mocha': [13.32, 43.25], 'bab el-mandeb': [12.58, 43.33], 'jizan': [16.89, 42.55],
      'jeddah': [21.49, 39.19], 'djibouti': [11.57, 43.15], 'assab': [13.00, 42.73],
      'port sudan': [19.62, 37.22], 'suez': [29.97, 32.55], 'eilat': [29.56, 34.95],
    },
    alertFallbackCenter: [12.58, 43.33],

    defaultMissileOrigin: [14.80, 42.95],
    missileOrigins: [
      { match: 'hodeidah', coords: [14.80, 42.95] },
      { match: 'hudaydah', coords: [14.80, 42.95] },
      { match: 'sanaa', coords: [15.37, 44.19] },
      { match: 'saada', coords: [16.94, 43.76] },
      { match: 'mocha', coords: [13.32, 43.25] },
      { match: 'ras isa', coords: [15.15, 42.65] },
    ],

    flightColors: [
      { match: 'United States', color: '#ffffff' },
      { match: 'United Kingdom', color: '#66ccff' },
      { match: 'France', color: '#dd88ff' },
      { match: 'Saudi Arabia', color: '#88ddaa' },
      { match: 'Egypt', color: '#ffaa44' },
      { match: 'Yemen', color: '#ff6666' },
    ],

    navyColors: {
      'US Navy': '#ffffff',
      'Royal Navy': '#66ccff',
      'French Navy': '#dd88ff',
      'EU NAVFOR': '#88ddaa',
      'Houthi Forces': '#ff6666',
    },

    timeZones: [
      { label: 'ADE', zone: 'Asia/Aden', flag: '🇾🇪' },
      { label: 'RUH', zone: 'Asia/Riyadh', flag: '🇸🇦' },
      { label: 'CAI', zone: 'Africa/Cairo', flag: '🇪🇬' },
      { label: 'JIB', zone: 'Africa/Djibouti', flag: '🇩🇯' },
      { label: 'LON', zone: 'Europe/London', flag: '🇬🇧' },
      { label: 'DC', zone: 'America/New_York', flag: '🇺🇸' },
    ],

    sourceColors: {
      'gCaptain': '#ffd500',
      'Splash 247': '#00a0a0',
      'Maritime Exec': '#4fb0d8',
      'USNI': '#ffd500',
      'CENTCOM': '#4b5320',
      'Long War Jrnl': '#a0522d',
      'Al Jazeera': '#c8a415',
      'The National': '#88ddaa',
      'Arab News': '#2e8bc0',
      'New Arab': '#e67e22',
      'BBC': '#bb1919',
      'NYT': '#cccccc',
      'Reuters': '#ff8000',
      'Breaking Def': '#8e44ad',
      'Defense News': '#2e8bc0',
      'Google News': '#34a853',
    },

    navyOrder: ['US Navy', 'Royal Navy', 'French Navy', 'EU NAVFOR', 'Houthi Forces'],
    maritimeRegions: ['Red Sea', 'Bab el-Mandeb', 'Gulf of Aden', 'Suez Canal', 'Arabian Sea'],

    countryColors: {
      Yemen: '#ff6666',
      'Saudi Arabia': '#88ddaa',
      Egypt: '#ffaa44',
      'United States': '#ffffff',
    },

    regionBoxes: [
      { name: 'Suez Canal', latMin: 29.5, latMax: 31.5, lonMin: 32.0, lonMax: 32.9 },
      { name: 'Red Sea', latMin: 12.5, latMax: 29.5, lonMin: 32.0, lonMax: 43.5 },
      { name: 'Bab el-Mandeb', latMin: 11.5, latMax: 13.5, lonMin: 42.5, lonMax: 44.0 },
      { name: 'Gulf of Aden', latMin: 10.0, latMax: 15.0, lonMin: 43.5, lonMax: 52.0 },
      { name: 'Yemen', latMin: 12.0, latMax: 19.0, lonMin: 42.0, lonMax: 54.0 },
      { name: 'Arabian Sea', latMin: 5.0, latMax: 20.0, lonMin: 52.0, lonMax: 65.0 },
    ],
    defaultRegion: 'Red Sea Corridor',

    // No public air-raid mirror for this theater — see the module comment.
    alertSystemName: 'No public alert mirror',
    alertStatusTitle: 'RED SEA ALERT STATUS',

    hasDroneTracker: false,
  },

  server: {
    strikeQueries: [
      'Red+Sea+Houthi+shipping+attack+OR+missile+OR+drone',
      'Yemen+Houthi+strike+OR+CENTCOM+OR+coalition',
    ],
    countryAttribution: [
      { match: ['yemen', 'houthi', 'sanaa', 'hodeidah', 'ansarallah'], country: 'Yemen' },
      { match: ['saudi', 'riyadh', 'jeddah', 'jizan'], country: 'Saudi Arabia' },
      { match: ['egypt', 'suez', 'port said', 'cairo'], country: 'Egypt' },
      { match: ['centcom', 'us navy', 'united states', 'prosperity guardian'], country: 'United States' },
      { match: ['royal navy', 'united kingdom', 'britain'], country: 'United Kingdom' },
    ],
    defaultCountry: 'Red Sea Corridor',

    conflictQueries: [
      'Red Sea Houthi shipping attack missile drone vessel',
      'Bab el-Mandeb OR Suez OR Gulf of Aden merchant vessel OR tanker OR naval escort',
    ],
    conflictLocations: [
      { match: ['bab el-mandeb', 'bab al-mandab', 'mandeb'], location: 'Bab el-Mandeb' },
      { match: ['red sea'], location: 'Red Sea' },
      { match: ['gulf of aden'], location: 'Gulf of Aden' },
      { match: ['suez canal', 'suez'], location: 'Suez Canal' },
      { match: ['port said'], location: 'Port Said, Egypt' },
      { match: ['sanaa'], location: 'Sanaa, Yemen' },
      { match: ['hodeidah', 'hudaydah'], location: 'Hodeidah, Yemen' },
      { match: ['aden'], location: 'Aden, Yemen' },
      { match: ['mocha'], location: 'Mocha, Yemen' },
      { match: ['saada'], location: 'Saada, Yemen' },
      { match: ['taiz'], location: 'Taiz, Yemen' },
      { match: ['mukalla'], location: 'Mukalla, Yemen' },
      { match: ['marib'], location: 'Marib, Yemen' },
      { match: ['socotra'], location: 'Socotra, Yemen' },
      { match: ['jizan'], location: 'Jizan, Saudi Arabia' },
      { match: ['jeddah'], location: 'Jeddah, Saudi Arabia' },
      { match: ['djibouti'], location: 'Djibouti' },
      { match: ['assab'], location: 'Assab, Eritrea' },
      { match: ['massawa'], location: 'Massawa, Eritrea' },
      { match: ['port sudan'], location: 'Port Sudan, Sudan' },
      { match: ['berbera'], location: 'Berbera, Somaliland' },
      { match: ['eilat'], location: 'Eilat, Israel' },
      { match: ['salalah'], location: 'Salalah, Oman' },
      { match: ['strait of hormuz'], location: 'Strait of Hormuz' },
      { match: ['arabian sea'], location: 'Arabian Sea' },
    ],

    countryQueries: [
      { country: 'Yemen', flag: '🇾🇪', query: 'Yemen Houthi Red Sea attack missile' },
      { country: 'Saudi Arabia', flag: '🇸🇦', query: 'Saudi Arabia Yemen Red Sea security' },
      { country: 'Egypt', flag: '🇪🇬', query: 'Egypt Suez Canal traffic revenue shipping' },
      { country: 'United States', flag: '🇺🇸', query: 'CENTCOM Red Sea Houthi strike US Navy' },
    ],

    polymarketKeywords: /houthi|red sea|yemen|suez|bab el.?mandeb|tanker|shipping lane|maritime/i,
    polymarketExclude: /ukraine|russia|taiwan|north korea|nfl|nba|oscar|election night/i,

    firesBBox: { latMin: 10.0, latMax: 32.0, lonMin: 31.0, lonMax: 56.0 },

    // Centred on the Red Sea itself rather than on Yemen, because adsb.lol is a
    // community receiver network and the southern end of the corridor has
    // essentially none: a 700km query around Sanaa returns 0 aircraft, and
    // Bab el-Mandeb and Djibouti return 0 too. This centre with a 1000km radius
    // reaches Suez down to the Yemen approaches and returns ~215. The bbox
    // below still clips results to the corridor.
    flightsCenter: { lat: 24.0, lon: 37.0, dist: 1000 },
    flightsBBox: { latMin: 10.0, latMax: 32.0, lonMin: 31.0, lonMax: 56.0 },

    // Every feed below returned a valid RSS/Atom document on 2026-09-01. Those
    // shared with iran-israel are already verified in that theater.
    newsFeeds: [
      // Commercial shipping press — this theater's primary signal, and the part
      // no general wire covers well. Filtered, since most of their output is
      // ordinary trade news.
      { url: 'https://gcaptain.com/feed/', name: 'gCaptain' },
      { url: 'https://splash247.com/feed/', name: 'Splash 247' },
      { url: 'https://maritime-executive.com/articles.rss', name: 'Maritime Exec' },
      // Naval and military
      { url: 'https://news.usni.org/feed', name: 'USNI' },
      { url: 'https://www.centcom.mil/DesktopModules/ArticleCS/RSS.ashx?ContentType=1&Site=808&max=20', name: 'CENTCOM', unfiltered: true },
      { url: 'https://www.longwarjournal.org/feed', name: 'Long War Jrnl' },
      { url: 'https://breakingdefense.com/feed/', name: 'Breaking Def' },
      { url: 'https://www.defensenews.com/arc/outboundfeeds/rss/?outputType=xml', name: 'Defense News' },
      // Regional
      { url: 'https://www.aljazeera.com/xml/rss/all.xml', name: 'Al Jazeera' },
      { url: 'https://www.thenationalnews.com/arc/outboundfeeds/rss/?outputType=xml', name: 'The National' },
      { url: 'https://www.arabnews.com/rss.xml', name: 'Arab News' },
      { url: 'https://english.alaraby.co.uk/rss', name: 'New Arab' },
      // Wires
      { url: 'https://feeds.bbci.co.uk/news/world/middle_east/rss.xml', name: 'BBC' },
      { url: 'https://rss.nytimes.com/services/xml/rss/nyt/MiddleEast.xml', name: 'NYT' },
      { url: 'https://news.google.com/rss/search?q=site:reuters.com+when:1d&hl=en-US&gl=US&ceid=US:en', name: 'Reuters' },
      // Theater-scoped searches — bypass the filter
      { url: 'https://news.google.com/rss/search?q=Red+Sea+Houthi+shipping+attack&hl=en-US&gl=US&ceid=US:en', name: 'Google News', unfiltered: true },
      { url: 'https://news.google.com/rss/search?q=Bab+el-Mandeb+OR+Suez+shipping+OR+vessel&hl=en-US&gl=US&ceid=US:en', name: 'Google News', unfiltered: true },
      { url: 'https://news.google.com/rss/search?q=Yemen+Houthi+missile+OR+drone+OR+strike&hl=en-US&gl=US&ceid=US:en', name: 'Google News', unfiltered: true },
    ],
    // Short place names here collide badly with ordinary English — "aden" sits
    // inside "laden" and "maiden", "taiz" and "saada" inside other words — so
    // every one of them is anchored. Bare "shipping" is deliberately absent:
    // it would match "free shipping" and "shipping costs" from any trade story.
    newsRelevanceKeywords: /houthi|ansarallah|ansar allah|\byemen\b|yemeni|sanaa|hodeidah|hudaydah|\baden\b|gulf of aden|red sea|bab el-?mandeb|bab al-?mandab|\bmandeb\b|\bsuez\b|\bsaada\b|\btaiz\b|mukalla|\bmarib\b|socotra|djibouti|eritrea|massawa|assab|port sudan|berbera|\bjizan\b|\beilat\b|prosperity guardian|\baspides\b|centcom|\bukmto\b|fifth fleet|5th fleet|merchant vessel|bulk carrier|container ship|shipping lane|commercial shipping|maritime security|naval escort|strait of hormuz/i,

    // Verified active on 2026-09-01. Short on purpose: the telegram route does
    // no relevance filtering, so a general OSINT channel would fill this panel
    // with other theaters' content.
    telegramChannels: [
      { name: 'TheCradleMedia', label: 'The Cradle', color: '#c8a415' },
      { name: 'AlMayadeenEnglish', label: 'Al Mayadeen', color: '#e67e22' },
      { name: 'PressTV', label: 'PressTV (IR state)', color: '#ff6666' },
    ],

    // Curated order of battle. Positions are indicative patrol-area placements
    // for the map, not live tracks — these are real vessels that have operated
    // in the corridor, not a claim about where any of them is today.
    ships: [
      { name: 'USS Gravely', hull: 'DDG-107', type: 'Destroyer', class: 'Arleigh Burke-class', navy: 'US Navy', lat: 17.50, lon: 40.50, status: 'Escort Ops', region: 'Red Sea', group: 'Prosperity Guardian' },
      { name: 'USS Carney', hull: 'DDG-64', type: 'Destroyer', class: 'Arleigh Burke-class', navy: 'US Navy', lat: 15.20, lon: 41.80, status: 'Escort Ops', region: 'Red Sea', group: 'Prosperity Guardian' },
      { name: 'USS Laboon', hull: 'DDG-58', type: 'Destroyer', class: 'Arleigh Burke-class', navy: 'US Navy', lat: 12.80, lon: 43.60, status: 'Chokepoint Patrol', region: 'Bab el-Mandeb', group: 'Prosperity Guardian' },
      { name: 'HMS Diamond', hull: 'D34', type: 'Destroyer', class: 'Type 45', navy: 'Royal Navy', lat: 16.40, lon: 41.20, status: 'Air Defence', region: 'Red Sea' },
      { name: 'HMS Richmond', hull: 'F239', type: 'Frigate', class: 'Type 23', navy: 'Royal Navy', lat: 12.60, lon: 46.50, status: 'Patrol', region: 'Gulf of Aden' },
      { name: 'FS Languedoc', hull: 'D653', type: 'Frigate', class: 'FREMM', navy: 'French Navy', lat: 14.20, lon: 42.30, status: 'Escort Ops', region: 'Red Sea' },
      { name: 'ITS Fasan', hull: 'F591', type: 'Frigate', class: 'FREMM', navy: 'EU NAVFOR', lat: 13.10, lon: 47.20, status: 'Escort Ops', region: 'Gulf of Aden', group: 'Op Aspides' },
      { name: 'HS Hydra', hull: 'F452', type: 'Frigate', class: 'Hydra-class', navy: 'EU NAVFOR', lat: 15.80, lon: 41.60, status: 'Escort Ops', region: 'Red Sea', group: 'Op Aspides' },
      { name: 'Coastal Missile Batteries', hull: 'Various', type: 'Coastal Missile Battery', class: 'ASBM / ASCM', navy: 'Houthi Forces', lat: 14.80, lon: 42.95, status: 'Hodeidah Coast', region: 'Red Sea', group: 'Houthi Coastal' },
      { name: 'Explosive USVs', hull: 'Various', type: 'Naval Drone (USV)', class: 'Various', navy: 'Houthi Forces', lat: 13.20, lon: 43.10, status: 'Chokepoint Threat', region: 'Bab el-Mandeb', group: 'Houthi Coastal' },
      { name: 'Suez Convoy Traffic', hull: 'Commercial', type: 'Merchant Traffic', class: 'Mixed', navy: 'EU NAVFOR', lat: 30.20, lon: 32.35, status: 'Transit Monitoring', region: 'Suez Canal' },
    ],
    shipRegions: ['Red Sea', 'Bab el-Mandeb', 'Gulf of Aden', 'Suez Canal', 'Arabian Sea'],

    // alertProvider deliberately omitted: no free public air-raid mirror for
    // this theater. droneProvider omitted: no real-time track source.
  },
};
