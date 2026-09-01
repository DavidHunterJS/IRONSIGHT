import Dashboard from '@/components/Dashboard';

// Thin server wrapper around the client dashboard.
//
// Its only job is this segment config: rendering per request is what allows the
// CSP nonce generated in src/middleware.ts to be stamped onto Next's bootstrap
// scripts. A statically prerendered shell is baked once and cannot carry a
// per-request nonce, so the nonce-based CSP would block every script on the
// page. Nothing is given up by rendering dynamically here — the dashboard has
// no server-side data and hydrates entirely from the /api routes.
//
// Route segment config cannot live in the client component itself, which is why
// the UI moved to components/Dashboard.tsx.
export const dynamic = 'force-dynamic';

export default function Page() {
  return <Dashboard />;
}
