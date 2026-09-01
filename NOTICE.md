# NOTICE

This project is a derivative work of **IRONSIGHT**.

    IRONSIGHT
    Copyright (c) 2026 Nobler Works
    https://github.com/NoblerWorks-HQ/IRONSIGHT
    Licensed under the MIT License

The full MIT license text is retained in `LICENSE` and is also rendered in the
application itself at `/about`. Under the MIT License, that copyright notice and
permission notice must be preserved in all copies and substantial portions of
the software — do not remove them from `LICENSE`, `src/lib/brand.ts`, or the
`/about` page when rebranding.

## Modifications in this fork

- Public-deployment security headers, including a nonce-based Content Security
  Policy (`src/middleware.ts`, `src/lib/security/headers.ts`, `next.config.ts`).
- Per-IP rate limiting on `/api/*` (`src/lib/security/rateLimit.ts`).
- Upstream request protection: hard timeouts, response size caps, per-host
  concurrency limits, and a circuit breaker (`src/lib/upstream.ts`).
- A server-side response cache with single-flight and stale-on-error semantics,
  so visitor count no longer multiplies into upstream request count
  (`src/lib/cache.ts`).
- Sanitization of all externally sourced HTML and URLs
  (`src/lib/security/sanitize.ts`), applied to the RSS and Telegram routes.
- Explicit feed failure states in the UI (`src/components/FeedState.tsx`,
  `src/lib/hooks.ts`).
- An OSINT / public-data disclaimer, shown on first visit and permanently in the
  footer, plus an `/about` page documenting sources and limitations
  (`src/components/Disclaimer.tsx`, `src/app/about/page.tsx`).
- Environment-based deployment configuration (`src/lib/config.ts`,
  `.env.example`) and branding separation (`src/lib/brand.ts`).
- Vercel and Docker deployment configuration (`vercel.json`, `Dockerfile`,
  `docker-compose.yml`), plus a `/api/health` endpoint.

## Third-party data

All data displayed by this application is retrieved from third-party public
sources and remains the property of its respective providers. No ownership is
claimed over any aggregated content. See `/about` for the source list.

Map tiles: © OpenStreetMap contributors, © CARTO.
Boundary vectors: Natural Earth (public domain).
