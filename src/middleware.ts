import { NextResponse, type NextRequest } from 'next/server';
import { RATE_LIMIT } from '@/lib/config';
import {
  buildCsp,
  cspHeaderName,
  generateNonce,
  hstsHeader,
  STATIC_SECURITY_HEADERS,
} from '@/lib/security/headers';
import {
  clientIp,
  hit,
  limitForPath,
  rateLimitHeaders,
} from '@/lib/security/rateLimit';

// Runs on every request that isn't a static asset. Two responsibilities:
//   1. per-IP rate limiting on /api/* (protects us and our upstreams)
//   2. security headers, including a per-response CSP nonce
//
// Next.js reads the nonce from the outgoing request's CSP header and applies it
// to its own inline bootstrap scripts, which is why the CSP is set on BOTH the
// request headers and the response.

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ---- rate limiting -------------------------------------------------------
  if (RATE_LIMIT.enabled && pathname.startsWith('/api/')) {
    const ip = clientIp(request.headers);
    const limit = limitForPath(pathname);
    const result = hit(`${ip}:${limit}`, limit, RATE_LIMIT.windowMs);

    if (!result.ok) {
      return new NextResponse(
        JSON.stringify({
          error: 'rate_limited',
          message: 'Too many requests. This is a shared public instance — please slow down.',
          retryAfter: result.retryAfterSec,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(result.retryAfterSec),
            'Cache-Control': 'no-store',
            ...rateLimitHeaders(result),
            ...STATIC_SECURITY_HEADERS,
          },
        },
      );
    }

    const response = NextResponse.next();
    for (const [key, value] of Object.entries(rateLimitHeaders(result))) {
      response.headers.set(key, value);
    }
    applySecurityHeaders(response.headers);
    return response;
  }

  // ---- security headers + CSP nonce ---------------------------------------
  const nonce = generateNonce();
  const csp = buildCsp(nonce);
  const cspHeader = cspHeaderName();

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  if (cspHeader) requestHeaders.set(cspHeader, csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  if (cspHeader) response.headers.set(cspHeader, csp);
  applySecurityHeaders(response.headers);
  return response;
}

function applySecurityHeaders(headers: Headers) {
  for (const [key, value] of Object.entries({ ...STATIC_SECURITY_HEADERS, ...hstsHeader() })) {
    headers.set(key, value);
  }
}

export const config = {
  matcher: [
    // Everything except Next internals and static files. Note the negative
    // lookahead keeps middleware off the hot path for assets.
    {
      source: '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|woff2?)$).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};
