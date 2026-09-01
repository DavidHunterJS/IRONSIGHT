import { describe, it, expect } from 'vitest';

import { deriveAlertStatus } from './alertStatus';

describe('deriveAlertStatus', () => {
  it('reports ACTIVE when there are alerts to show', () => {
    expect(deriveAlertStatus({ hasProvider: true, fetchOk: true, activeCount: 2 })).toBe('ACTIVE');
  });

  it('keeps showing ACTIVE when the refresh failed but alerts are still sticky', () => {
    // A siren seen 30 seconds ago outranks a failed poll.
    expect(deriveAlertStatus({ hasProvider: true, fetchOk: false, activeCount: 1 })).toBe('ACTIVE');
  });

  it('reports CLEAR only when the provider actually answered', () => {
    expect(deriveAlertStatus({ hasProvider: true, fetchOk: true, activeCount: 0 })).toBe('CLEAR');
  });

  it('reports UNAVAILABLE when the provider is configured but unreachable', () => {
    // This is the bug this module exists to prevent: an upstream outage used to
    // yield an empty list, which the panel rendered as a green ALL CLEAR.
    expect(deriveAlertStatus({ hasProvider: true, fetchOk: false, activeCount: 0 })).toBe(
      'UNAVAILABLE',
    );
  });

  it('reports NO_SOURCE when the theater has no mirror at all', () => {
    expect(deriveAlertStatus({ hasProvider: false, fetchOk: false, activeCount: 0 })).toBe(
      'NO_SOURCE',
    );
  });

  it('never claims CLEAR without a working provider', () => {
    for (const fetchOk of [true, false]) {
      for (const activeCount of [0, 3]) {
        expect(
          deriveAlertStatus({ hasProvider: false, fetchOk, activeCount }),
          `hasProvider=false fetchOk=${fetchOk} count=${activeCount}`,
        ).toBe('NO_SOURCE');
      }
    }
    expect(deriveAlertStatus({ hasProvider: true, fetchOk: false, activeCount: 0 })).not.toBe(
      'CLEAR',
    );
  });
});
