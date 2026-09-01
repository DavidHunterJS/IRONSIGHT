import { NextResponse } from 'next/server';
import { breakerSnapshot } from '@/lib/upstream';
import { cacheStats } from '@/lib/cache';
import { CSP_MODE, RATE_LIMIT } from '@/lib/config';
import { BRAND } from '@/lib/brand';

export const dynamic = 'force-dynamic';

// Liveness/readiness endpoint for Docker HEALTHCHECK, uptime monitors, and
// debugging a live deployment. Reports which upstream hosts are currently
// short-circuited, which is the fastest way to explain a degraded panel.
//
// Deliberately exposes no secrets and no request-identifying data.

export async function GET() {
  const breakers = breakerSnapshot();

  return NextResponse.json(
    {
      status: 'ok',
      app: BRAND.name,
      time: new Date().toISOString(),
      uptimeSec: Math.round(process.uptime()),
      cache: cacheStats(),
      protection: {
        rateLimit: RATE_LIMIT.enabled,
        csp: CSP_MODE,
      },
      // Non-empty means those hosts are failing and their panels are degraded.
      trippedUpstreams: breakers.map((b) => ({
        host: b.host,
        cooldownSec: Math.round(b.openForMs / 1000),
      })),
    },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
