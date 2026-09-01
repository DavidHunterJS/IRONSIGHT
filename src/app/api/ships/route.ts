
import { getConflictFromRequest } from '@/lib/conflicts';
import { feedResponse, feedUnavailable } from '@/lib/api/respond';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { server } = getConflictFromRequest(req);
  try {
    // Curated known naval positions from public OSINT / Navy reports.
    // No live AIS feed — warships routinely disable AIS in conflict zones.
    const now = new Date().toISOString();
    const ships: NavalVessel[] = server.ships.map(s => ({ ...s, lastReported: now }));
    const regions = server.shipRegions.map(name => ({ name }));

    return feedResponse(
      {
        regions,
        totalTracked: ships.length,
        ships,
        source: 'OSINT / Public Naval Reports',
        updated: now,
        note: 'Positions approximate - based on last known public reports',
      },
      { sourcesOk: 1, sourcesTotal: 1 },
      { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=120' } },
    );
  } catch (err) {
    console.error('Naval tracking error:', err);
    return feedUnavailable(
      { regions: [], totalTracked: 0, ships: [], updated: new Date().toISOString() },
      err,
    );
  }
}

interface NavalVessel {
  name: string;
  hull: string;
  type: string;
  class: string;
  navy: string;
  lat: number;
  lon: number;
  status: string;
  region: string;
  lastReported: string;
  group?: string;
}
