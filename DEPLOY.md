# Deployment

Two supported targets. Both work with zero environment variables set; everything
below is tuning.

---

## 1. Vercel (fastest path to `ironsight.trippy.lol`)

```bash
git push origin main          # your fork
```

Then in the Vercel dashboard: **Add New → Project → import your fork**. Framework
detection picks up Next.js automatically; `vercel.json` supplies the function
timeouts.

**Set these environment variables before the first build** — `NEXT_PUBLIC_*`
values are inlined into the client bundle at build time, so changing them later
requires a redeploy, not just a restart:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://ironsight.trippy.lol` |
| `CSP_MODE` | `report-only` for the first deploy — see below |

Then **Settings → Domains → Add** `ironsight.trippy.lol`, and at your DNS host
add the `CNAME` Vercel gives you.

### Turning on CSP safely

Deploy once with `CSP_MODE=report-only`, open the site, and check the browser
console for CSP violation reports. If it's clean, set `CSP_MODE=enforce` and
redeploy.

This matters because the policy uses `'strict-dynamic'`, which makes browsers
ignore the `'unsafe-inline'` and host-source fallbacks. If a script ever renders
without the per-request nonce, **every script on the page is blocked and you get
a blank screen**. The dashboard and `/about` are both `force-dynamic`
specifically so Next.js can stamp the nonce; keep them that way. If you add a
statically prerendered page with scripts, either make it dynamic too or drop
`'strict-dynamic'` from `buildCsp()` in `src/lib/security/headers.ts`.

### Known limitation on Vercel

Rate-limit counters and the response cache live in process memory. Serverless
runs many instances, so the effective rate limit is roughly
`RATE_LIMIT_MAX × instanceCount`, and cache hit rate is lower than on a single
server. Both are still effective against a single client hammering the API, but
if you want hard guarantees, swap `hit()` in `src/lib/security/rateLimit.ts` and
the store in `src/lib/cache.ts` for Vercel KV / Upstash. The call signatures were
designed as drop-in replacements.

---

## 2. Docker (correct shared limits, one process)

```bash
cp .env.example .env
# edit .env — at minimum set NEXT_PUBLIC_SITE_URL
docker compose up -d --build
curl localhost:3000/api/health
```

The container binds to `127.0.0.1:3000` only. Terminate TLS in front of it with
Caddy, nginx, or Cloudflare Tunnel. A minimal Caddyfile:

```
ironsight.trippy.lol {
    reverse_proxy 127.0.0.1:3000
}
```

Do not set `CSP_MODE=enforce` with HSTS until HTTPS actually works — HSTS is
emitted only when `NODE_ENV=production`, and a broken HTTPS setup with HSTS
cached in browsers is painful to undo.

The compose file runs the container read-only, with `no-new-privileges`, a
tmpfs for `/tmp`, and a 512 MB memory cap. `HEALTHCHECK` polls `/api/health`.

---

## Tuning under load

The single most effective lever if an upstream provider starts throttling you is
raising the cache TTLs — they decouple visitor count from upstream request count:

```
CACHE_TTL_NEWS_MS=180000
CACHE_TTL_TELEGRAM_MS=90000
```

Second lever: lower `UPSTREAM_MAX_CONCURRENT_PER_HOST`.

Set `UPSTREAM_USER_AGENT` to something with a real contact URL. Providers who can
identify and reach you will email before they block you.

---

## Operating

- `GET /api/health` — uptime, cache stats, and `trippedUpstreams`: the list of
  hosts currently short-circuited by the circuit breaker. A non-empty list is the
  fastest explanation for a panel showing STALE or OFFLINE.
- Panel states: **LIVE** (healthy) · **PARTIAL** (some sources failed) ·
  **STALE** (refresh failing, showing last known data) · **OFFLINE** (nothing
  retrieved). A panel never silently shows an empty list — see
  `src/components/FeedState.tsx` for why that rule exists.
- Rate-limited clients get `429` with `Retry-After` and `RateLimit-*` headers.

## Pre-flight checks

```bash
npm run check     # typecheck + lint
npm run build
```

Note: `src/components/panels/ThreatClock.tsx` carries one pre-existing lint error
inherited from upstream (synchronous `setState` in an effect). It does not block
the build. Fixing it means reworking how that component avoids a hydration
mismatch on first render.
