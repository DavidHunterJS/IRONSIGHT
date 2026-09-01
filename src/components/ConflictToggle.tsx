'use client';

import { useConflict } from '@/lib/conflicts/context';
import { CONFLICT_KEYS, CONFLICTS } from '@/lib/conflicts';
import type { ConflictKey } from '@/lib/conflicts';

// Theater picker. A select rather than a button row: the registry grows to six
// or more theaters, and a row of that many buttons wraps and eats the header on
// mobile. One fixed-width control stays the same size at any N.
export default function ConflictToggle() {
  const { key, setConflict } = useConflict();

  // Nothing to switch between when the deployment enables a single theater.
  if (CONFLICT_KEYS.length < 2) return null;

  return (
    <div className="flex items-center gap-1">
      <span className="text-[8px] text-[var(--text-secondary)] tracking-[2px] hidden md:inline">
        THEATER
      </span>
      <select
        value={key}
        onChange={e => setConflict(e.target.value as ConflictKey)}
        aria-label="Conflict theater"
        title="Switch dashboard theater"
        className="text-[9px] font-bold tracking-[1px] px-2 py-1 rounded border border-[var(--border-color)] bg-transparent text-[var(--cyan)] cursor-pointer outline-none focus:border-[var(--cyan)]"
      >
        {CONFLICT_KEYS.map(k => (
          // Options inherit the native menu's colors, so set them explicitly —
          // a transparent background renders as white-on-white on some platforms.
          <option key={k} value={k} style={{ background: '#0a0e17', color: '#e6edf3' }}>
            {CONFLICTS[k].label}
          </option>
        ))}
      </select>
    </div>
  );
}
