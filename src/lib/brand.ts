// Branding — separates *your* deployment identity from the upstream project's.
//
// Everything under BRAND is yours and is driven by NEXT_PUBLIC_* env vars, so a
// rebrand is a deploy-time change, not a code change.
//
// Everything under UPSTREAM_ATTRIBUTION is the MIT attribution for the original
// IRONSIGHT project. The MIT license requires the copyright notice and
// permission notice to be preserved in all copies and substantial portions of
// the software. Do not delete this block — rendering it in the UI (see
// components/AttributionNote and /about) is what keeps the fork compliant.

export const BRAND = {
  /** Wordmark shown in the header. */
  name: process.env.NEXT_PUBLIC_APP_NAME || 'IRONSIGHT',
  /** Short form used in tight spaces and the browser tab. */
  short: process.env.NEXT_PUBLIC_APP_SHORT || process.env.NEXT_PUBLIC_APP_NAME || 'IRONSIGHT',
  /** Line under the wordmark. */
  tagline:
    process.env.NEXT_PUBLIC_APP_TAGLINE || 'OSINT COMMAND CENTER // UNCLASSIFIED',
  description:
    process.env.NEXT_PUBLIC_APP_DESCRIPTION ||
    'Real-time dashboard aggregating free, public open-source feeds across active conflict theaters. All data belongs to its respective providers.',
  /** Who operates this deployment. */
  operator: process.env.NEXT_PUBLIC_OPERATOR_NAME || '',
  operatorUrl: process.env.NEXT_PUBLIC_OPERATOR_URL || '',
  /** Optional contact shown on /about. */
  contact: process.env.NEXT_PUBLIC_CONTACT || '',
} as const;

export const UPSTREAM_ATTRIBUTION = {
  project: 'IRONSIGHT',
  author: 'Nobler Works',
  authorUrl: 'https://noblerworks.com/',
  repository: 'https://github.com/NoblerWorks-HQ/IRONSIGHT',
  license: 'MIT',
  copyright: 'Copyright (c) 2026 Nobler Works',
  licenseUrl: 'https://github.com/NoblerWorks-HQ/IRONSIGHT/blob/main/LICENSE',
} as const;

/** One-line credit safe to render anywhere in the UI. */
export const ATTRIBUTION_LINE =
  `Built on ${UPSTREAM_ATTRIBUTION.project} by ${UPSTREAM_ATTRIBUTION.author} — ` +
  `${UPSTREAM_ATTRIBUTION.license} licensed.`;

/** True when the deployment has been renamed away from the upstream project. */
export const IS_REBRANDED = BRAND.name !== UPSTREAM_ATTRIBUTION.project;
