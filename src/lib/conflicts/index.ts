// Conflict registry — single source of truth for which conflicts exist.
// Plain TS (server + client safe). The React context lives in ./context.

import { ENABLED_THEATERS } from '@/lib/config';

import type { ConflictConfig } from './types';
import { iranIsrael } from './iran-israel';
import { russiaUkraine } from './russia-ukraine';
import { taiwanChina } from './taiwan-china';

export * from './types';

// Every theater this build knows how to render. Adding one is a single line
// here — ConflictKey, the picker, and the API resolver all follow from it.
const REGISTRY = {
  'iran-israel': iranIsrael,
  'russia-ukraine': russiaUkraine,
  'taiwan-china': taiwanChina,
} satisfies Record<string, ConflictConfig>;

export type ConflictKey = keyof typeof REGISTRY;

export const CONFLICTS: Record<ConflictKey, ConflictConfig> = REGISTRY;

/** Everything registered in this build, regardless of what is switched on. */
export const ALL_CONFLICT_KEYS = Object.keys(REGISTRY) as ConflictKey[];

// Theater to open on first visit, when it is enabled.
const PREFERRED_DEFAULT = 'iran-israel';

/**
 * Narrow the registry to the theaters an operator has switched on.
 *
 * Registry order is preserved rather than the order given in the filter: the
 * env var is a filter, not a display-order control, and keeping it stable means
 * the picker and the default theater don't shift around based on how the list
 * happened to be typed.
 */
export function resolveEnabledKeys(
  all: readonly string[],
  enabled: readonly string[],
): string[] {
  const wanted = new Set(
    enabled.map((s) => s.trim().toLowerCase()).filter(Boolean),
  );
  if (wanted.size === 0) return [...all];

  const kept = all.filter((k) => wanted.has(k));

  // A filter that matches nothing is a misconfiguration — a typo, or a name
  // left behind by a rename. Ignoring it beats rendering a dashboard with zero
  // theaters, which is indistinguishable from the app being broken.
  return kept.length > 0 ? kept : [...all];
}

/** Preferred theater if it survived filtering, otherwise the first that did. */
export function resolveDefaultKey(
  enabledKeys: readonly string[],
  preferred: string,
): string {
  return enabledKeys.includes(preferred) ? preferred : enabledKeys[0];
}

export const CONFLICT_KEYS = resolveEnabledKeys(
  ALL_CONFLICT_KEYS,
  ENABLED_THEATERS,
) as ConflictKey[];

export const DEFAULT_CONFLICT = resolveDefaultKey(
  CONFLICT_KEYS,
  PREFERRED_DEFAULT,
) as ConflictKey;

// Surface a bad filter loudly. Silent fail-open would leave an operator staring
// at theaters they thought they had switched off.
if (ENABLED_THEATERS.length > 0) {
  const unknown = ENABLED_THEATERS
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s && !(ALL_CONFLICT_KEYS as string[]).includes(s));
  if (unknown.length > 0) {
    console.warn(
      `[conflicts] NEXT_PUBLIC_ENABLED_THEATERS names unknown theater(s): ` +
        `${unknown.join(', ')}. Known theaters: ${ALL_CONFLICT_KEYS.join(', ')}.`,
    );
  }
}

export function isConflictKey(v: unknown): v is ConflictKey {
  return typeof v === 'string' && (CONFLICT_KEYS as string[]).includes(v);
}

// Resolve a (possibly untrusted) key to a config, falling back to the default.
// Disabled theaters are treated as unknown, so ?conflict= cannot reach a
// theater this deployment has switched off.
export function getConflict(key: string | null | undefined): ConflictConfig {
  return isConflictKey(key) ? CONFLICTS[key] : CONFLICTS[DEFAULT_CONFLICT];
}

// Server helper: pull the conflict config from a request's ?conflict= param.
export function getConflictFromRequest(req: { url: string }): ConflictConfig {
  try {
    const key = new URL(req.url).searchParams.get('conflict');
    return getConflict(key);
  } catch {
    return CONFLICTS[DEFAULT_CONFLICT];
  }
}
