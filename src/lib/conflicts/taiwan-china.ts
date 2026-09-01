import type { ConflictConfig } from './types';

// Taiwan / China theater.
//
// First theater with no air-raid alert mirror: Taiwan's civil defence warnings
// are not republished through a free public API the way Tzeva Adom and
// alerts.com.ua are. `alertProvider` is therefore omitted, and the alerts route
// returns an empty result rather than falling through to another theater's
// provider.
//
// Telegram coverage is genuinely thin here compared with Ukraine. The channel
// list is short on purpose: the telegram route does no relevance filtering, so
// a general-purpose OSINT channel would fill this panel with other theaters'
// content. Only regionally-focused channels that were verified active belong
// here. Feeds and channels below were checked 2026-09-01.

export const taiwanChina: ConflictConfig = {
  key: 'taiwan-china',
  label: 'TAIWAN / CHINA',
  theater: 'OSINT COMMAND CENTER // UNCLASSIFIED',

  client: {
    mapCenter: [23.5, 119.5],
    mapZoom: 6,

    cities: [
      // Taiwan
      { name: 'Taipei', lat: 25.0330, lon: 121.5654, country: 'Taiwan', capital: true },
      { name: 'Kaohsiung', lat: 22.6273, lon: 120.3014, country: 'Taiwan', capital: false },
      { name: 'Taichung', lat: 24.1477, lon: 120.6736, country: 'Taiwan', capital: false },
      { name: 'Tainan', lat: 22.9997, lon: 120.2270, country: 'Taiwan', capital: false },
      { name: 'Hsinchu', lat: 24.8138, lon: 120.9675, country: 'Taiwan', capital: false },
      { name: 'Keelung', lat: 25.1276, lon: 121.7392, country: 'Taiwan', capital: false },
      { name: 'Hualien', lat: 23.9871, lon: 121.6015, country: 'Taiwan', capital: false },
      { name: 'Taitung', lat: 22.7583, lon: 121.1444, country: 'Taiwan', capital: false },
      { name: 'Magong (Penghu)', lat: 23.5655, lon: 119.5663, country: 'Taiwan', capital: false },
      { name: 'Kinmen', lat: 24.4321, lon: 118.3186, country: 'Taiwan', capital: false },
      { name: 'Matsu (Nangan)', lat: 26.1608, lon: 119.9494, country: 'Taiwan', capital: false },
      // China
      { name: 'Beijing', lat: 39.9042, lon: 116.4074, country: 'China', capital: true },
      { name: 'Shanghai', lat: 31.2304, lon: 121.4737, country: 'China', capital: false },
      { name: 'Fuzhou', lat: 26.0745, lon: 119.2965, country: 'China', capital: false },
      { name: 'Xiamen', lat: 24.4798, lon: 118.0894, country: 'China', capital: false },
      { name: 'Quanzhou', lat: 24.8741, lon: 118.6757, country: 'China', capital: false },
      { name: 'Shantou', lat: 23.3535, lon: 116.6820, country: 'China', capital: false },
      { name: 'Guangzhou', lat: 23.1291, lon: 113.2644, country: 'China', capital: false },
      { name: 'Ningbo', lat: 29.8683, lon: 121.5440, country: 'China', capital: false },
      { name: 'Wenzhou', lat: 27.9938, lon: 120.6994, country: 'China', capital: false },
      { name: 'Zhanjiang', lat: 21.2707, lon: 110.3594, country: 'China', capital: false },
      { name: 'Sanya', lat: 18.2528, lon: 109.5119, country: 'China', capital: false },
      { name: 'Hong Kong', lat: 22.3193, lon: 114.1694, country: 'Hong Kong', capital: false },
      // Regional
      { name: 'Naha (Okinawa)', lat: 26.2124, lon: 127.6809, country: 'Japan', capital: false },
      { name: 'Tokyo', lat: 35.6762, lon: 139.6503, country: 'Japan', capital: true },
      { name: 'Manila', lat: 14.5995, lon: 120.9842, country: 'Philippines', capital: true },
      { name: 'Seoul', lat: 37.5665, lon: 126.9780, country: 'South Korea', capital: true },
      { name: 'Hagatna (Guam)', lat: 13.4745, lon: 144.7504, country: 'United States', capital: false },
    ],

    cityColors: {
      Taiwan: '#66ccff',
      China: '#ff6666',
      'Hong Kong': '#ffaa44',
      Japan: '#dd88ff',
      Philippines: '#88ddaa',
      'South Korea': '#aaccff',
      'United States': '#ffffff',
      default: '#999999',
    },

    // Publicly documented PLA coastal and theater bases, at city-level
    // granularity. Ranges are indicative rings for the map, not weapon data.
    launchSites: [
      { name: 'Fujian Coast (Eastern Theater, SRBM)', lat: 26.07, lon: 119.30, range: 400 },
      { name: 'Xiamen / Zhangzhou (SRBM)', lat: 24.48, lon: 118.09, range: 400 },
      { name: 'Shantou (Coastal)', lat: 23.35, lon: 116.68, range: 500 },
      { name: 'Leping (PLARF Base 61)', lat: 28.96, lon: 117.12, range: 1500 },
      { name: 'Ningbo / Zhoushan (Eastern Theater Navy)', lat: 30.25, lon: 122.20, range: 800 },
      { name: 'Sanya / Yulin (South Sea Fleet)', lat: 18.25, lon: 109.51, range: 1500 },
    ],

    strikeLocations: {
      // Taiwan
      'taipei': [25.03, 121.57], 'taibei': [25.03, 121.57],
      'kaohsiung': [22.63, 120.30], 'taichung': [24.15, 120.67], 'tainan': [23.00, 120.23],
      'hsinchu': [24.81, 120.97], 'keelung': [25.13, 121.74], 'hualien': [23.99, 121.60],
      'taitung': [22.76, 121.14], 'penghu': [23.57, 119.57], 'magong': [23.57, 119.57],
      'kinmen': [24.43, 118.32], 'quemoy': [24.43, 118.32], 'matsu': [26.16, 119.95],
      'pratas': [20.70, 116.72], 'itu aba': [10.38, 114.36], 'taiping island': [10.38, 114.36],
      // China
      'beijing': [39.90, 116.41], 'shanghai': [31.23, 121.47], 'fuzhou': [26.07, 119.30],
      'xiamen': [24.48, 118.09], 'quanzhou': [24.87, 118.68], 'shantou': [23.35, 116.68],
      'guangzhou': [23.13, 113.26], 'ningbo': [29.87, 121.54], 'wenzhou': [27.99, 120.70],
      'zhanjiang': [21.27, 110.36], 'sanya': [18.25, 109.51], 'hainan': [19.20, 109.75],
      'fujian': [26.07, 119.30], 'zhejiang': [29.00, 120.20], 'guangdong': [23.13, 113.26],
      'hong kong': [22.32, 114.17],
      // Regional / maritime
      'okinawa': [26.21, 127.68], 'naha': [26.21, 127.68], 'yonaguni': [24.47, 123.01],
      'miyako': [24.79, 125.28], 'senkaku': [25.75, 123.48], 'diaoyu': [25.75, 123.48],
      'tokyo': [35.68, 139.65], 'manila': [14.60, 120.98], 'seoul': [37.57, 126.98],
      'guam': [13.47, 144.75], 'scarborough shoal': [15.15, 117.76],
      'second thomas shoal': [9.73, 115.86], 'spratly': [10.00, 114.00],
      'paracel': [16.50, 112.00], 'woody island': [16.83, 112.34],
      'bashi channel': [21.50, 121.00], 'taiwan strait': [24.00, 119.50],
    },

    strikeTargets: [
      ['taipei', 'Taipei'], ['kaohsiung', 'Kaohsiung'], ['taichung', 'Taichung'],
      ['tainan', 'Tainan'], ['hsinchu', 'Hsinchu'], ['keelung', 'Keelung'],
      ['hualien', 'Hualien'], ['taitung', 'Taitung'], ['penghu', 'Penghu'],
      ['kinmen', 'Kinmen'], ['matsu', 'Matsu'], ['pratas', 'Pratas Island'],
      ['fuzhou', 'Fuzhou'], ['xiamen', 'Xiamen'], ['quanzhou', 'Quanzhou'],
      ['shantou', 'Shantou'], ['ningbo', 'Ningbo'], ['wenzhou', 'Wenzhou'],
      ['zhanjiang', 'Zhanjiang'], ['sanya', 'Sanya'], ['hainan', 'Hainan'],
      ['yonaguni', 'Yonaguni'], ['miyako', 'Miyako Strait'], ['senkaku', 'Senkaku Islands'],
      ['okinawa', 'Okinawa'], ['guam', 'Guam'],
      ['scarborough shoal', 'Scarborough Shoal'],
      ['second thomas shoal', 'Second Thomas Shoal'],
      ['woody island', 'Woody Island'],
      ['bashi channel', 'Bashi Channel'], ['taiwan strait', 'Taiwan Strait'],
    ],

    // No air-raid mirror feeds this theater, so these are map reference points
    // rather than live siren locations.
    alertCities: {
      'taipei': [25.03, 121.57], 'new taipei': [25.01, 121.47], 'keelung': [25.13, 121.74],
      'taoyuan': [24.99, 121.30], 'hsinchu': [24.81, 120.97], 'taichung': [24.15, 120.67],
      'changhua': [24.08, 120.54], 'chiayi': [23.48, 120.45], 'tainan': [23.00, 120.23],
      'kaohsiung': [22.63, 120.30], 'pingtung': [22.68, 120.49], 'yilan': [24.76, 121.75],
      'hualien': [23.99, 121.60], 'taitung': [22.76, 121.14], 'penghu': [23.57, 119.57],
      'kinmen': [24.43, 118.32], 'matsu': [26.16, 119.95],
    },
    alertFallbackCenter: [25.03, 121.57],

    defaultMissileOrigin: [26.07, 119.30],
    missileOrigins: [
      { match: 'fujian', coords: [26.07, 119.30] },
      { match: 'zhejiang', coords: [29.00, 120.20] },
      { match: 'guangdong', coords: [23.13, 113.26] },
      { match: 'hainan', coords: [19.20, 109.75] },
      { match: 'jiangxi', coords: [28.96, 117.12] },
    ],

    flightColors: [
      { match: 'China', color: '#ff6666' },
      { match: 'Taiwan', color: '#66ccff' },
      { match: 'United States', color: '#ffffff' },
      { match: 'Japan', color: '#dd88ff' },
      { match: 'Philippines', color: '#88ddaa' },
      { match: 'South Korea', color: '#aaccff' },
    ],

    navyColors: {
      'PLA Navy': '#ff6666',
      'ROC Navy': '#66ccff',
      'US Navy': '#ffffff',
      'JMSDF': '#dd88ff',
      'Philippine Navy': '#88ddaa',
    },

    timeZones: [
      { label: 'TPE', zone: 'Asia/Taipei', flag: '🇹🇼' },
      { label: 'PEK', zone: 'Asia/Shanghai', flag: '🇨🇳' },
      { label: 'TYO', zone: 'Asia/Tokyo', flag: '🇯🇵' },
      { label: 'MNL', zone: 'Asia/Manila', flag: '🇵🇭' },
      { label: 'GUM', zone: 'Pacific/Guam', flag: '🇬🇺' },
      { label: 'DC', zone: 'America/New_York', flag: '🇺🇸' },
    ],

    sourceColors: {
      'Focus Taiwan': '#66ccff',
      'Taipei Times': '#4fb0d8',
      'SCMP': '#ffaa44',
      'Global Times': '#ff6666',
      'China Daily': '#dd6666',
      'Nikkei Asia': '#88ddaa',
      'Japan Times': '#dd88ff',
      'USNI': '#ffd500',
      'The Diplomat': '#00a0a0',
      'RFA': '#e67e22',
      'BBC': '#bb1919',
      'NYT': '#cccccc',
      'Al Jazeera': '#c8a415',
      'Breaking Def': '#8e44ad',
      'War on Rocks': '#a0522d',
      'Defense News': '#2e8bc0',
      'DoD': '#4b5320',
      'WSJ': '#999999',
      'Fox News': '#3a7bd5',
      'Google News': '#34a853',
    },

    navyOrder: ['PLA Navy', 'ROC Navy', 'US Navy', 'JMSDF', 'Philippine Navy'],
    maritimeRegions: ['Taiwan Strait', 'East China Sea', 'South China Sea', 'Philippine Sea', 'Bashi Channel'],

    countryColors: {
      Taiwan: '#66ccff',
      China: '#ff6666',
      Japan: '#dd88ff',
      Philippines: '#88ddaa',
      'South Korea': '#aaccff',
    },

    regionBoxes: [
      { name: 'Taiwan', latMin: 21.8, latMax: 25.4, lonMin: 119.9, lonMax: 122.1 },
      { name: 'Taiwan Strait', latMin: 22.5, latMax: 26.5, lonMin: 117.5, lonMax: 120.5 },
      { name: 'Fujian', latMin: 23.5, latMax: 28.5, lonMin: 115.8, lonMax: 120.7 },
      { name: 'East China Sea', latMin: 25.0, latMax: 33.0, lonMin: 120.0, lonMax: 130.0 },
      { name: 'South China Sea', latMin: 5.0, latMax: 22.0, lonMin: 108.0, lonMax: 121.0 },
      { name: 'Bashi Channel', latMin: 20.0, latMax: 22.5, lonMin: 120.0, lonMax: 122.5 },
      { name: 'Ryukyu Islands', latMin: 24.0, latMax: 29.0, lonMin: 122.5, lonMax: 131.0 },
    ],
    defaultRegion: 'Western Pacific',

    // No public air-raid mirror for this theater — see the module comment.
    alertSystemName: 'No public alert mirror',
    alertStatusTitle: 'TAIWAN ALERT STATUS',

    hasDroneTracker: false,
  },

  server: {
    strikeQueries: [
      'Taiwan+China+PLA+incursion+OR+drill+OR+exercise',
      'Taiwan+Strait+OR+South+China+Sea+military+OR+coast+guard+OR+confrontation',
    ],
    countryAttribution: [
      { match: ['taiwan', 'taipei', 'kaohsiung', 'kinmen', 'matsu', 'penghu', 'hualien'], country: 'Taiwan' },
      { match: ['china', 'beijing', 'pla', 'fujian', 'xiamen', 'fuzhou', 'hainan'], country: 'China' },
      { match: ['japan', 'okinawa', 'senkaku', 'yonaguni', 'ryukyu'], country: 'Japan' },
      { match: ['philippines', 'manila', 'scarborough', 'second thomas'], country: 'Philippines' },
    ],
    defaultCountry: 'Western Pacific',

    conflictQueries: [
      'Taiwan China military tension strait incursion exercise',
      'PLA OR ADIZ OR median line OR blockade Taiwan OR Kinmen OR Matsu OR Penghu OR Bashi OR Miyako',
    ],
    conflictLocations: [
      { match: ['taipei'], location: 'Taipei, Taiwan' },
      { match: ['kaohsiung'], location: 'Kaohsiung, Taiwan' },
      { match: ['taichung'], location: 'Taichung, Taiwan' },
      { match: ['tainan'], location: 'Tainan, Taiwan' },
      { match: ['hualien'], location: 'Hualien, Taiwan' },
      { match: ['kinmen', 'quemoy'], location: 'Kinmen, Taiwan' },
      { match: ['matsu'], location: 'Matsu, Taiwan' },
      { match: ['penghu'], location: 'Penghu, Taiwan' },
      { match: ['pratas'], location: 'Pratas Island, Taiwan' },
      { match: ['taiwan strait'], location: 'Taiwan Strait' },
      { match: ['bashi'], location: 'Bashi Channel' },
      { match: ['fuzhou'], location: 'Fuzhou, China' },
      { match: ['xiamen'], location: 'Xiamen, China' },
      { match: ['ningbo', 'zhoushan'], location: 'Ningbo, China' },
      { match: ['sanya', 'yulin'], location: 'Sanya, China' },
      { match: ['hainan'], location: 'Hainan, China' },
      { match: ['beijing'], location: 'Beijing, China' },
      { match: ['okinawa', 'naha'], location: 'Okinawa, Japan' },
      { match: ['yonaguni'], location: 'Yonaguni, Japan' },
      { match: ['miyako'], location: 'Miyako Strait' },
      { match: ['senkaku', 'diaoyu'], location: 'Senkaku Islands' },
      { match: ['scarborough'], location: 'Scarborough Shoal' },
      { match: ['second thomas'], location: 'Second Thomas Shoal' },
      { match: ['woody island'], location: 'Woody Island, Paracels' },
      { match: ['spratly'], location: 'Spratly Islands' },
      { match: ['guam'], location: 'Guam' },
      { match: ['manila'], location: 'Manila, Philippines' },
    ],

    countryQueries: [
      { country: 'Taiwan', flag: '🇹🇼', query: 'Taiwan defense ministry PLA incursion ADIZ' },
      { country: 'China', flag: '🇨🇳', query: 'China PLA Eastern Theater Command exercise Taiwan' },
      { country: 'Japan', flag: '🇯🇵', query: 'Japan Self-Defense Force scramble China Senkaku' },
      { country: 'Philippines', flag: '🇵🇭', query: 'Philippines China coast guard South China Sea' },
    ],

    polymarketKeywords: /taiwan|china|chinese|pla\b|xi jinping|strait|south china sea|blockade|semiconductor|tsmc/i,
    polymarketExclude: /ukraine|russia|israel|iran|gaza|nfl|nba|oscar|election night/i,

    firesBBox: { latMin: 17.0, latMax: 33.0, lonMin: 107.0, lonMax: 128.0 },

    flightsCenter: { lat: 24.0, lon: 120.5, dist: 600 },
    flightsBBox: { latMin: 17.0, latMax: 33.0, lonMin: 107.0, lonMax: 128.0 },

    // Every feed below returned a valid RSS/Atom document on 2026-09-01.
    newsFeeds: [
      // Taiwan outlets — inherently on-topic, bypass the relevance filter
      { url: 'https://feeds.feedburner.com/rsscna/engnews/', name: 'Focus Taiwan', unfiltered: true },
      { url: 'https://www.taipeitimes.com/xml/index.rss', name: 'Taipei Times', unfiltered: true },
      // Regional outlets — general coverage, keyword-filtered
      { url: 'https://www.scmp.com/rss/4/feed', name: 'SCMP' },
      { url: 'https://asia.nikkei.com/rss/feed/nar', name: 'Nikkei Asia' },
      { url: 'https://www.japantimes.co.jp/feed/', name: 'Japan Times' },
      { url: 'https://thediplomat.com/feed/', name: 'The Diplomat' },
      { url: 'https://www.rfa.org/english/rss2.xml', name: 'RFA' },
      // Chinese state media — useful as a state-narrative counterpoint
      { url: 'https://www.globaltimes.cn/rss/outbrain.xml', name: 'Global Times' },
      { url: 'https://www.chinadaily.com.cn/rss/china_rss.xml', name: 'China Daily' },
      // Wires
      { url: 'https://feeds.bbci.co.uk/news/world/asia/rss.xml', name: 'BBC' },
      { url: 'https://rss.nytimes.com/services/xml/rss/nyt/AsiaPacific.xml', name: 'NYT' },
      { url: 'https://www.aljazeera.com/xml/rss/all.xml', name: 'Al Jazeera' },
      { url: 'https://feeds.content.dowjones.io/public/rss/RSSWorldNews', name: 'WSJ' },
      { url: 'https://moxie.foxnews.com/google-publisher/world.xml', name: 'Fox News' },
      // Defence trade press — naval coverage matters more here than in a land war
      { url: 'https://news.usni.org/feed', name: 'USNI' },
      { url: 'https://breakingdefense.com/feed/', name: 'Breaking Def' },
      { url: 'https://warontherocks.com/feed/', name: 'War on Rocks' },
      { url: 'https://www.defensenews.com/arc/outboundfeeds/rss/?outputType=xml', name: 'Defense News' },
      { url: 'https://www.defense.gov/DesktopModules/ArticleCS/RSS.ashx?ContentType=1&Site=945&max=10', name: 'DoD' },
      // Theater-scoped searches — bypass the filter
      { url: 'https://news.google.com/rss/search?q=Taiwan+China+military&hl=en-US&gl=US&ceid=US:en', name: 'Google News', unfiltered: true },
      { url: 'https://news.google.com/rss/search?q=Taiwan+Strait+PLA+incursion&hl=en-US&gl=US&ceid=US:en', name: 'Google News', unfiltered: true },
      { url: 'https://news.google.com/rss/search?q=South+China+Sea+Philippines+China&hl=en-US&gl=US&ceid=US:en', name: 'Google News', unfiltered: true },
    ],
    // Require a theater geography or actor term. "china" and "japan" alone are
    // broad, so the list leans on place names and military vocabulary that a
    // generic Asia-business story will not carry.
    newsRelevanceKeywords: /taiwan|taipei|kaohsiung|taichung|tainan|hsinchu|hualien|kinmen|quemoy|matsu|penghu|pratas|tsmc|cross-?strait|taiwan strait|median line|adiz|\bpla\b|pla navy|pla air force|plaaf|plan\b|eastern theater|rocket force|beijing|xi jinping|chinese coast guard|south china sea|east china sea|senkaku|diaoyu|yonaguni|miyako|bashi|scarborough|second thomas|spratly|paracel|woody island|okinawa|ryukyu|guam|indo-?pacific|seventh fleet|7th fleet/i,

    // Verified active on 2026-09-01. Deliberately short: the telegram route does
    // no relevance filtering, so a general OSINT channel would fill this panel
    // with other theaters' content.
    telegramChannels: [
      { name: 'scmpnews', label: 'SCMP', color: '#ffaa44' },
      { name: 'globaltimes_cn', label: 'Global Times (CN state)', color: '#ff6666' },
      { name: 'NikkeiAsia', label: 'Nikkei Asia', color: '#88ddaa' },
    ],

    // Curated order of battle. Positions are indicative home-port / patrol-area
    // placements for the map, not live tracks — the same convention the other
    // theaters use.
    ships: [
      { name: 'Shandong', hull: 'CV-17', type: 'Aircraft Carrier', class: 'Type 002', navy: 'PLA Navy', lat: 18.30, lon: 109.60, status: 'Home Port (Sanya)', region: 'South China Sea', group: 'South Sea Fleet' },
      { name: 'Liaoning', hull: 'CV-16', type: 'Aircraft Carrier', class: 'Type 001', navy: 'PLA Navy', lat: 27.50, lon: 123.50, status: 'Active', region: 'East China Sea', group: 'North Sea Fleet' },
      { name: 'Fujian', hull: 'CV-18', type: 'Aircraft Carrier', class: 'Type 003', navy: 'PLA Navy', lat: 31.30, lon: 121.90, status: 'Trials (Shanghai)', region: 'East China Sea' },
      { name: 'Nanchang', hull: '101', type: 'Destroyer', class: 'Type 055', navy: 'PLA Navy', lat: 26.80, lon: 122.20, status: 'Active', region: 'East China Sea', group: 'Eastern Theater' },
      { name: 'Lhasa', hull: '102', type: 'Destroyer', class: 'Type 055', navy: 'PLA Navy', lat: 24.90, lon: 119.60, status: 'Patrol', region: 'Taiwan Strait', group: 'Eastern Theater' },
      { name: 'Kunming', hull: '172', type: 'Destroyer', class: 'Type 052D', navy: 'PLA Navy', lat: 19.50, lon: 112.50, status: 'Active', region: 'South China Sea', group: 'South Sea Fleet' },
      { name: 'Type 094 SSBN', hull: 'Various', type: 'Submarine (SSBN)', class: 'Type 094 Jin-class', navy: 'PLA Navy', lat: 18.20, lon: 109.70, status: 'Yulin Base', region: 'South China Sea', group: 'South Sea Fleet' },
      { name: 'Kee Lung', hull: 'DDG-1801', type: 'Destroyer', class: 'Kidd-class', navy: 'ROC Navy', lat: 25.15, lon: 121.75, status: 'Home Port (Keelung)', region: 'East China Sea', group: 'ROCN' },
      { name: 'Cheng Kung', hull: 'PFG-1101', type: 'Frigate', class: 'Oliver Hazard Perry-class', navy: 'ROC Navy', lat: 22.60, lon: 120.25, status: 'Active', region: 'Taiwan Strait', group: 'ROCN' },
      { name: 'Tuo Chiang', hull: 'PGG-618', type: 'Corvette', class: 'Tuo Chiang-class', navy: 'ROC Navy', lat: 24.10, lon: 120.10, status: 'Patrol', region: 'Taiwan Strait', group: 'ROCN' },
      { name: 'Hai Kun', hull: 'SS-711', type: 'Submarine', class: 'Hai Kun-class', navy: 'ROC Navy', lat: 22.55, lon: 120.28, status: 'Trials (Kaohsiung)', region: 'Taiwan Strait', group: 'ROCN' },
      { name: 'USS George Washington', hull: 'CVN-73', type: 'Aircraft Carrier', class: 'Nimitz-class', navy: 'US Navy', lat: 35.28, lon: 139.66, status: 'Forward Deployed (Yokosuka)', region: 'Philippine Sea', group: '7th Fleet' },
      { name: 'USS America', hull: 'LHA-6', type: 'Amphibious Assault Ship', class: 'America-class', navy: 'US Navy', lat: 33.16, lon: 129.72, status: 'Forward Deployed (Sasebo)', region: 'East China Sea', group: '7th Fleet' },
      { name: 'USS Higgins', hull: 'DDG-76', type: 'Destroyer', class: 'Arleigh Burke-class', navy: 'US Navy', lat: 21.80, lon: 120.80, status: 'Transit', region: 'Bashi Channel', group: '7th Fleet' },
      { name: 'JS Izumo', hull: 'DDH-183', type: 'Helicopter Destroyer', class: 'Izumo-class', navy: 'JMSDF', lat: 30.50, lon: 129.00, status: 'Active', region: 'East China Sea' },
      { name: 'JS Kaga', hull: 'DDH-184', type: 'Helicopter Destroyer', class: 'Izumo-class', navy: 'JMSDF', lat: 26.60, lon: 127.90, status: 'Active', region: 'Philippine Sea' },
      { name: 'BRP Jose Rizal', hull: 'FF-150', type: 'Frigate', class: 'Jose Rizal-class', navy: 'Philippine Navy', lat: 15.10, lon: 117.80, status: 'Patrol', region: 'South China Sea' },
    ],
    shipRegions: ['Taiwan Strait', 'East China Sea', 'South China Sea', 'Philippine Sea', 'Bashi Channel'],

    // alertProvider deliberately omitted: no free public air-raid mirror exists
    // for this theater. The alerts route returns an empty result.
    // droneProvider deliberately omitted: no real-time track source.
  },
};
