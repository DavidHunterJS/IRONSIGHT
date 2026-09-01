import { describe, it, expect, vi, afterEach } from 'vitest';

import {
  ALL_CONFLICT_KEYS,
  CONFLICT_KEYS,
  DEFAULT_CONFLICT,
  getConflict,
  isConflictKey,
  resolveDefaultKey,
  resolveEnabledKeys,
} from './index';

// The registry as shipped. These tests are about the filtering seam, not about
// any particular theater, so they derive expectations from ALL_CONFLICT_KEYS
// rather than hardcoding theater names wherever that is possible.
const ALL = ALL_CONFLICT_KEYS as readonly string[];

describe('resolveEnabledKeys', () => {
  it('returns every registered theater when the filter is empty', () => {
    expect(resolveEnabledKeys(ALL, [])).toEqual([...ALL]);
  });

  it('returns only the named theaters when the filter is a subset', () => {
    expect(resolveEnabledKeys(ALL, ['russia-ukraine'])).toEqual(['russia-ukraine']);
  });

  it('preserves registry order, not the order given in the filter', () => {
    // The env var is a filter, not a display-order control. Keeping registry
    // order means DEFAULT_CONFLICT and the theater picker stay deterministic
    // no matter how the operator happens to type the list.
    const reversed = [...ALL].reverse();
    expect(resolveEnabledKeys(ALL, reversed)).toEqual([...ALL]);
  });

  it('ignores unknown entries but keeps the valid ones', () => {
    expect(resolveEnabledKeys(ALL, ['russia-ukraine', 'not-a-theater'])).toEqual([
      'russia-ukraine',
    ]);
  });

  it('falls open to every theater when no entry is valid', () => {
    // A typo or a stale name after a rename must not brick the dashboard into
    // rendering zero theaters. Ignoring a bad filter beats an empty screen.
    expect(resolveEnabledKeys(ALL, ['nope', 'also-nope'])).toEqual([...ALL]);
  });

  it('tolerates surrounding whitespace and case', () => {
    expect(resolveEnabledKeys(ALL, ['  RUSSIA-UKRAINE  '])).toEqual(['russia-ukraine']);
  });

  it('de-duplicates repeated entries', () => {
    expect(resolveEnabledKeys(ALL, ['russia-ukraine', 'russia-ukraine'])).toEqual([
      'russia-ukraine',
    ]);
  });
});

describe('resolveDefaultKey', () => {
  it('keeps the preferred theater when it is enabled', () => {
    expect(resolveDefaultKey(['iran-israel', 'russia-ukraine'], 'iran-israel')).toBe(
      'iran-israel',
    );
  });

  it('falls back to the first enabled theater when the preferred one is filtered out', () => {
    expect(resolveDefaultKey(['russia-ukraine'], 'iran-israel')).toBe('russia-ukraine');
  });
});

describe('registry defaults (no filter configured)', () => {
  it('exposes every registered theater', () => {
    expect(CONFLICT_KEYS).toEqual([...ALL]);
  });

  it('has a default that is itself an enabled theater', () => {
    expect(CONFLICT_KEYS).toContain(DEFAULT_CONFLICT);
  });

  it('resolves an unknown key to the default config', () => {
    expect(getConflict('not-a-theater').key).toBe(DEFAULT_CONFLICT);
  });

  it('resolves null and undefined to the default config', () => {
    expect(getConflict(null).key).toBe(DEFAULT_CONFLICT);
    expect(getConflict(undefined).key).toBe(DEFAULT_CONFLICT);
  });

  it('accepts a registered key', () => {
    expect(isConflictKey('russia-ukraine')).toBe(true);
    expect(getConflict('russia-ukraine').key).toBe('russia-ukraine');
  });

  it('rejects non-string input', () => {
    expect(isConflictKey(42)).toBe(false);
    expect(isConflictKey(null)).toBe(false);
  });

  it('gives every registered config a key matching its registry slot', () => {
    // ConflictConfig.key is a plain string, so nothing at the type level stops a
    // config from disagreeing with the slot it is registered under. That
    // mismatch would make getConflict() return a config whose .key routes API
    // caches and sticky-alert buckets to the wrong theater.
    for (const k of ALL) {
      expect(getConflict(k).key).toBe(k);
    }
  });
});

describe('filtering applied through the env var', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  async function loadWith(value: string) {
    vi.stubEnv('NEXT_PUBLIC_ENABLED_THEATERS', value);
    vi.resetModules();
    return import('./index');
  }

  it('hides a disabled theater from the picker', async () => {
    const m = await loadWith('russia-ukraine');
    expect(m.CONFLICT_KEYS).toEqual(['russia-ukraine']);
  });

  it('refuses a disabled key on the server and falls back to the default', async () => {
    // ?conflict= must not reach a theater the deployment has switched off,
    // otherwise the env var means one thing in the UI and another in the API.
    const m = await loadWith('russia-ukraine');
    expect(m.isConflictKey('iran-israel')).toBe(false);
    expect(m.getConflict('iran-israel').key).toBe('russia-ukraine');
  });

  it('moves the default when the preferred theater is filtered out', async () => {
    const m = await loadWith('russia-ukraine');
    expect(m.DEFAULT_CONFLICT).toBe('russia-ukraine');
  });

  it('still exposes the full registry separately from the enabled set', async () => {
    const m = await loadWith('russia-ukraine');
    expect(m.ALL_CONFLICT_KEYS.length).toBeGreaterThan(m.CONFLICT_KEYS.length);
  });
});
