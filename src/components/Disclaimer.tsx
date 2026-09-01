'use client';

import { useEffect, useState } from 'react';
import { ATTRIBUTION_LINE, UPSTREAM_ATTRIBUTION } from '@/lib/brand';
import { DISCLAIMER_TEXT } from '@/lib/disclaimer';

// Public-deployment disclaimer.
//
// This matters more than it looks. The dashboard renders military-adjacent
// content in a command-center aesthetic, and a first-time visitor can easily
// read it as authoritative or official. The disclaimer's job is to make three
// things unambiguous before anyone acts on what they see:
//
//   1. everything here is unverified aggregation of public sources
//   2. "UNCLASSIFIED // FOUO" and similar strings are styling, not a
//      classification marking, and this is not affiliated with any government
//   3. absence of data means our feed is quiet, not that nothing is happening
//
// It is also where MIT attribution to the upstream project lives, which keeps
// the fork license-compliant in the product itself, not just in a file.

const STORAGE_KEY = 'disclaimer-ack-v1';

/** Compact strip for the footer. Always visible, never dismissible. */
export function DisclaimerBar({ className = '' }: { className?: string }) {
  return (
    <span className={`text-[9px] text-[var(--text-secondary)] ${className}`}>
      OSINT AGGREGATION — UNVERIFIED PUBLIC DATA · NOT AFFILIATED WITH ANY GOVERNMENT ·{' '}
      <a href="/about" className="underline hover:text-[var(--cyan)]">
        DISCLAIMER &amp; SOURCES
      </a>
    </span>
  );
}

/** One-line MIT credit to the upstream project. */
export function AttributionNote({ className = '' }: { className?: string }) {
  return (
    <span className={`text-[9px] text-[var(--text-secondary)] ${className}`}>
      {ATTRIBUTION_LINE.replace(/\.$/, '')} ·{' '}
      <a
        href={UPSTREAM_ATTRIBUTION.repository}
        target="_blank"
        rel="noopener noreferrer"
        className="underline hover:text-[var(--cyan)]"
      >
        source
      </a>
    </span>
  );
}

/**
 * First-visit interstitial. Shown once per browser, then acknowledged.
 * Rendered client-side only so it never blocks or delays the dashboard itself.
 */
export function DisclaimerGate() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // localStorage can't be read during render (it doesn't exist on the server,
    // and reading it would desync hydration), so the check runs after mount.
    // Setting state synchronously in an effect body triggers a cascading render;
    // deferring to an animation frame keeps it a callback-driven update and
    // still lands before the first paint the user actually sees.
    const frame = requestAnimationFrame(() => {
      try {
        if (!localStorage.getItem(STORAGE_KEY)) setOpen(true);
      } catch {
        // Private mode / storage disabled — show it, just don't persist.
        setOpen(true);
      }
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  if (!open) return null;

  const acknowledge = () => {
    try {
      localStorage.setItem(STORAGE_KEY, new Date().toISOString());
    } catch {
      /* non-fatal */
    }
    setOpen(false);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="disclaimer-title"
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 p-4"
    >
      <div className="max-w-xl w-full border border-[var(--border-color)] bg-[var(--bg-secondary)] p-5 max-h-[85vh] overflow-y-auto">
        <h2
          id="disclaimer-title"
          className="text-xs font-bold tracking-[2px] text-[var(--cyan)] mb-3"
        >
          {DISCLAIMER_TEXT.headline}
        </h2>
        <ul className="space-y-2 mb-4">
          {DISCLAIMER_TEXT.points.map((point, i) => (
            <li
              key={i}
              className="text-[11px] leading-relaxed text-[var(--text-secondary)] pl-3 border-l border-[var(--border-color)]"
            >
              {point}
            </li>
          ))}
        </ul>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <AttributionNote />
          <button
            type="button"
            onClick={acknowledge}
            className="text-[10px] tracking-[2px] px-4 py-2 border border-[var(--cyan)] text-[var(--cyan)] hover:bg-[var(--cyan)] hover:text-black transition-colors"
          >
            UNDERSTOOD
          </button>
        </div>
      </div>
    </div>
  );
}
