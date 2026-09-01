import type { NextConfig } from "next";

// Baseline security headers are declared here as well as in src/middleware.ts.
// Middleware handles the per-request CSP nonce; these are the constant headers,
// duplicated so they still apply to any response path middleware skips (static
// files, error pages, and edge cases in some hosting setups). Values are
// inlined rather than imported because next.config.ts is evaluated outside the
// app's module graph and does not resolve the "@/" alias.
const isProd = process.env.NODE_ENV === "production";

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  {
    key: "Permissions-Policy",
    value:
      "accelerometer=(), autoplay=(), camera=(), display-capture=(), encrypted-media=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), midi=(), payment=(), usb=(), interest-cohort=()",
  },
  ...(isProd
    ? [
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
      ]
    : []),
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Emit a self-contained server bundle for a slim Docker runtime image
  output: "standalone",
  // Never leak the framework version to scanners
  poweredByHeader: false,
  // Disable Next.js fetch cache globally — we handle our own polling intervals
  experimental: {
    serverComponentsHmrCache: false,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        // API responses are live intelligence — never let a CDN or browser
        // cache them, and never let another origin read them.
        source: "/api/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store, max-age=0" },
          { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
