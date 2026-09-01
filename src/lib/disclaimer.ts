// Disclaimer copy, kept in a plain module (no 'use client') so BOTH the client
// components and the server-rendered /about page can import the same text.
//
// This was a real bug source: importing a constant from a 'use client' file
// into a server component yields a client reference proxy, not the value.

import { BRAND } from '@/lib/brand';

export const DISCLAIMER_TEXT = {
  headline: 'OPEN-SOURCE INFORMATION — NOT VERIFIED INTELLIGENCE',
  points: [
    `${BRAND.name} aggregates freely available public feeds: news RSS, public Telegram channels, public flight and vessel data, satellite thermal anomalies, market prices and prediction markets.`,
    'Nothing here is verified, corroborated, or authoritative. Reports from any single source — including state media and partisan channels — may be inaccurate, delayed, propagandistic, or deliberately false.',
    'This project is not affiliated with, endorsed by, or sourced from any government, military, or intelligence agency. Terminology and styling in this interface are aesthetic; they are not classification markings and carry no official meaning.',
    'An empty or quiet panel means our sources are quiet. It is not evidence that nothing is happening.',
    'Do not use this dashboard for safety-of-life decisions, emergency response, navigation, targeting, trading, or any other operational purpose. For air-raid warnings, follow your official national alerting system.',
    'All data belongs to its respective providers and is displayed under their public terms. No ownership is claimed over any third-party content.',
  ],
} as const;
