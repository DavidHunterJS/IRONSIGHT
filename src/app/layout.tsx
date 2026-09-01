import type { Metadata } from "next";
import "leaflet/dist/leaflet.css";
import "./globals.css";
import { ConflictProvider } from "@/lib/conflicts/context";
import { DisclaimerGate } from "@/components/Disclaimer";
import { BRAND } from "@/lib/brand";
import { SITE_URL } from "@/lib/config";

// Metadata is driven by src/lib/brand.ts so renaming the deployment is an env
// change, not a code change.
//
// Note on CSP: we deliberately render no inline <script> tags here. Next.js
// reads the nonce from the CSP header set in src/middleware.ts and applies it
// to its own bootstrap scripts automatically, so this layout can stay statically
// rendered. If you ever add your own inline script, read the nonce via
// `(await headers()).get('x-nonce')` and pass it as the `nonce` prop.

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${BRAND.name} // ${BRAND.tagline}`,
    template: `%s — ${BRAND.name}`,
  },
  description: BRAND.description,
  applicationName: BRAND.name,
  keywords: [
    "OSINT",
    "dashboard",
    "conflict monitor",
    "open source intelligence",
    "air raid alerts",
    "drone tracker",
  ],
  ...(BRAND.operator
    ? { authors: [{ name: BRAND.operator, ...(BRAND.operatorUrl ? { url: BRAND.operatorUrl } : {}) }] }
    : {}),
  openGraph: {
    type: "website",
    siteName: BRAND.name,
    title: `${BRAND.name} // ${BRAND.tagline}`,
    description: BRAND.description,
    url: SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: `${BRAND.name} // ${BRAND.tagline}`,
    description: BRAND.description,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="scanlines antialiased">
        <ConflictProvider>
          {children}
        </ConflictProvider>
        {/* First-visit OSINT disclaimer. Client-only, never blocks the dashboard. */}
        <DisclaimerGate />
      </body>
    </html>
  );
}
