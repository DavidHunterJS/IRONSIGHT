import type { Metadata } from 'next';
import Link from 'next/link';
import { BRAND, UPSTREAM_ATTRIBUTION } from '@/lib/brand';
import { DISCLAIMER_TEXT } from '@/lib/disclaimer';

// Same reason as the dashboard: per-request rendering lets the CSP nonce apply.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: `About & Disclaimer — ${BRAND.name}`,
  description: `Data sources, limitations, and licensing for ${BRAND.name}.`,
};

// Public-facing accountability page. Linked from the footer and the first-visit
// disclaimer. Covers what the project is, what it is not, where the data comes
// from, and the upstream MIT attribution.

const SOURCE_GROUPS: { label: string; items: string[] }[] = [
  {
    label: 'News & wires',
    items: [
      'Public RSS/Atom feeds from international, regional, and state-affiliated outlets',
      'Google News aggregation queries',
      'GDELT public event records',
    ],
  },
  {
    label: 'Social & messaging',
    items: ['Public Telegram channel posts via t.me embed pages (no API key, no private channels)'],
  },
  {
    label: 'Alerting',
    items: [
      'Public air-raid alert APIs published by civil-defence services',
      'These are mirrors and may lag or fail — they are not a substitute for official alerts',
    ],
  },
  {
    label: 'Movement & sensing',
    items: [
      'ADS-B aircraft positions from public community networks',
      'Publicly reported vessel positions and static order-of-battle references',
      'NASA FIRMS satellite thermal anomaly detections (fires, not confirmed strikes)',
    ],
  },
  {
    label: 'Markets',
    items: [
      'Public quote endpoints for equities, energy and crypto',
      'Polymarket public prediction-market odds',
    ],
  },
  {
    label: 'Cartography',
    items: [
      'CARTO dark basemap tiles (© OpenStreetMap contributors, © CARTO)',
      'Natural Earth public-domain boundary vectors',
    ],
  },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen overflow-y-auto p-6 md:p-10 max-w-3xl mx-auto">
      <Link href="/" className="text-[10px] tracking-[2px] text-[var(--cyan)] hover:underline">
        ← BACK TO DASHBOARD
      </Link>

      <h1 className="mt-6 text-lg font-bold tracking-[3px] text-[var(--cyan)]">{BRAND.name}</h1>
      <p className="text-[10px] tracking-[2px] text-[var(--text-secondary)] mb-8">{BRAND.tagline}</p>

      <section className="mb-8">
        <h2 className="text-xs font-bold tracking-[2px] text-[var(--text-primary)] mb-3">
          {DISCLAIMER_TEXT.headline}
        </h2>
        <ul className="space-y-3">
          {DISCLAIMER_TEXT.points.map((point, i) => (
            <li
              key={i}
              className="text-[12px] leading-relaxed text-[var(--text-secondary)] pl-3 border-l border-[var(--border-color)]"
            >
              {point}
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xs font-bold tracking-[2px] text-[var(--text-primary)] mb-3">
          HOW TO READ THIS DASHBOARD
        </h2>
        <div className="space-y-2 text-[12px] leading-relaxed text-[var(--text-secondary)]">
          <p>
            Each panel reports its own health. <strong>LIVE</strong> means the feed refreshed
            normally. <strong>PARTIAL</strong> means some sources failed and the view is incomplete.
            <strong> STALE</strong> means refreshes are failing and you are looking at older data.
            <strong> OFFLINE</strong> means nothing could be retrieved.
          </p>
          <p>
            Satellite thermal detections indicate heat, not confirmed strikes — wildfires, flaring,
            and industrial heat all register. Aircraft and vessel positions come from voluntary
            public networks with large coverage gaps; military traffic is frequently absent.
            Prediction-market odds reflect trader sentiment, not verified probability.
          </p>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-xs font-bold tracking-[2px] text-[var(--text-primary)] mb-3">
          DATA SOURCES
        </h2>
        <div className="space-y-4">
          {SOURCE_GROUPS.map((group) => (
            <div key={group.label}>
              <h3 className="text-[11px] font-bold text-[var(--cyan)] tracking-wider mb-1">
                {group.label}
              </h3>
              <ul className="list-disc pl-5 space-y-0.5">
                {group.items.map((item) => (
                  <li key={item} className="text-[11px] text-[var(--text-secondary)]">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-4 text-[11px] text-[var(--text-secondary)]">
          All third-party data remains the property of its providers and is displayed under their
          public terms. This project claims no ownership over any aggregated content. Provider
          takedown or access requests are honoured — see contact below.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xs font-bold tracking-[2px] text-[var(--text-primary)] mb-3">
          LICENSE &amp; ATTRIBUTION
        </h2>
        <p className="text-[12px] leading-relaxed text-[var(--text-secondary)]">
          {BRAND.name} is built on{' '}
          <a
            href={UPSTREAM_ATTRIBUTION.repository}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--cyan)] underline"
          >
            {UPSTREAM_ATTRIBUTION.project}
          </a>{' '}
          by{' '}
          <a
            href={UPSTREAM_ATTRIBUTION.authorUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--cyan)] underline"
          >
            {UPSTREAM_ATTRIBUTION.author}
          </a>
          , used under the {UPSTREAM_ATTRIBUTION.license} License.
        </p>
        <pre className="mt-3 p-3 border border-[var(--border-color)] text-[10px] leading-relaxed text-[var(--text-secondary)] whitespace-pre-wrap">
{`${UPSTREAM_ATTRIBUTION.copyright}

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`}
        </pre>
        <p className="mt-3 text-[11px] text-[var(--text-secondary)]">
          Modifications in this deployment are documented in NOTICE.md in the repository.
        </p>
      </section>

      {(BRAND.operator || BRAND.contact) && (
        <section className="mb-10">
          <h2 className="text-xs font-bold tracking-[2px] text-[var(--text-primary)] mb-3">
            OPERATOR
          </h2>
          <p className="text-[12px] text-[var(--text-secondary)]">
            {BRAND.operator && (
              <>
                This instance is operated by{' '}
                {BRAND.operatorUrl ? (
                  <a
                    href={BRAND.operatorUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--cyan)] underline"
                  >
                    {BRAND.operator}
                  </a>
                ) : (
                  BRAND.operator
                )}
                .{' '}
              </>
            )}
            {BRAND.contact && <>Contact: {BRAND.contact}</>}
          </p>
        </section>
      )}
    </main>
  );
}
