// Security headers for public deployment.
//
// Split into two groups:
//   - STATIC_SECURITY_HEADERS: constant, also applied via next.config.ts so
//     they're present even on responses the proxy doesn't touch.
//   - buildCsp(): per-request, because a nonce is generated per response.
//
// CSP allowlist is derived from what the app actually loads:
//   fonts.googleapis.com / fonts.gstatic.com  — JetBrains Mono
//   *.basemaps.cartocdn.com                   — Leaflet dark basemap tiles
//   raw.githubusercontent.com                 — Natural Earth boundary GeoJSON
// Everything else is proxied through our own /api routes, so connect-src stays
// tight. Add hosts without editing code via CSP_EXTRA_HOSTS.

import { CSP_EXTRA_HOSTS, CSP_MODE, IS_PROD } from '@/lib/config';

export const STATIC_SECURITY_HEADERS: Record<string, string> = {
  // Deny framing outright — this dashboard has no embed use case, and framing
  // is the delivery vector for clickjacking an operator into a wrong action.
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-DNS-Prefetch-Control': 'on',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
  // No use of these APIs anywhere in the app; deny them all.
  'Permissions-Policy': [
    'accelerometer=()',
    'autoplay=()',
    'camera=()',
    'display-capture=()',
    'encrypted-media=()',
    'geolocation=()',
    'gyroscope=()',
    'magnetometer=()',
    'microphone=()',
    'midi=()',
    'payment=()',
    'usb=()',
    'interest-cohort=()',
  ].join(', '),
};

/** HSTS is only meaningful over HTTPS, and dangerous to set on localhost. */
export function hstsHeader(): Record<string, string> {
  if (!IS_PROD) return {};
  return {
    'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  };
}

const FONT_HOSTS = ['https://fonts.googleapis.com', 'https://fonts.gstatic.com'];
const TILE_HOSTS = ['https://*.basemaps.cartocdn.com'];
const GEO_HOSTS = ['https://raw.githubusercontent.com'];

/**
 * Build the CSP for one response.
 *
 * `style-src` keeps 'unsafe-inline' because Leaflet writes inline styles onto
 * map panes at runtime and the app sets inline `style` props for feed colors.
 * Scripts use a nonce — Next.js reads the nonce out of the request CSP header
 * and stamps it onto its own bootstrap scripts automatically.
 */
export function buildCsp(nonce: string): string {
  const directives: Record<string, string[]> = {
    'default-src': ["'self'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"],
    'object-src': ["'none'"],
    'script-src': [
      "'self'",
      `'nonce-${nonce}'`,
      "'strict-dynamic'",
      // Ignored by browsers that support strict-dynamic; needed for older ones.
      "'unsafe-inline'",
      // Next.js dev tooling relies on eval; production build does not.
      ...(IS_PROD ? [] : ["'unsafe-eval'"]),
    ],
    'style-src': ["'self'", "'unsafe-inline'", ...FONT_HOSTS],
    'font-src': ["'self'", 'data:', ...FONT_HOSTS],
    'img-src': ["'self'", 'data:', 'blob:', ...TILE_HOSTS],
    'connect-src': ["'self'", ...GEO_HOSTS, ...(IS_PROD ? [] : ['ws:', 'wss:'])],
    'worker-src': ["'self'", 'blob:'],
    'manifest-src': ["'self'"],
    'media-src': ["'self'"],
  };

  for (const host of CSP_EXTRA_HOSTS) {
    directives['connect-src'].push(host);
    directives['img-src'].push(host);
  }

  if (IS_PROD) directives['upgrade-insecure-requests'] = [];

  return Object.entries(directives)
    .map(([key, values]) => (values.length ? `${key} ${values.join(' ')}` : key))
    .join('; ');
}

export function cspHeaderName(): string | null {
  if (CSP_MODE === 'off') return null;
  return CSP_MODE === 'report-only'
    ? 'Content-Security-Policy-Report-Only'
    : 'Content-Security-Policy';
}

/** Web Crypto is available in both the edge and node runtimes. */
export function generateNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}
