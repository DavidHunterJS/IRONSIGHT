import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { subscribeToClock, getClockSnapshot, getClockServerSnapshot } from './clock';

// The store backs a live clock, so everything here runs on fake timers.
beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('clock store', () => {
  it('has no clock on the server', () => {
    // Rendering the server's time would hydrate to a different string.
    expect(getClockServerSnapshot()).toBeNull();
  });

  it('notifies subscribers once a second', () => {
    const listener = vi.fn();
    const unsubscribe = subscribeToClock(listener);

    expect(listener).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1000);
    expect(listener).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(2000);
    expect(listener).toHaveBeenCalledTimes(3);

    unsubscribe();
  });

  it('holds the snapshot stable between ticks', () => {
    // useSyncExternalStore compares with Object.is and re-renders on any
    // difference, so a snapshot reading the wall clock directly would loop
    // forever. Moving system time *without* advancing timers is what separates
    // the two: a cached snapshot ignores it, `Date.now()` does not. Simply
    // reading twice in a row proves nothing here, because fake timers freeze
    // the clock and even a broken implementation returns the same value.
    const unsubscribe = subscribeToClock(() => {});

    const first = getClockSnapshot();
    vi.setSystemTime(Date.now() + 500);
    expect(getClockSnapshot()).toBe(first);
    vi.setSystemTime(Date.now() + 499);
    expect(getClockSnapshot()).toBe(first);

    // A tick, and only a tick, moves it.
    vi.advanceTimersByTime(1000);
    expect(getClockSnapshot()).not.toBe(first);

    unsubscribe();
  });

  it('shares one interval across subscribers', () => {
    const a = vi.fn(), b = vi.fn();
    const unsubA = subscribeToClock(a);
    const unsubB = subscribeToClock(b);

    vi.advanceTimersByTime(1000);
    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(1);

    // One leaving must not stop the other's clock.
    unsubA();
    vi.advanceTimersByTime(1000);
    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(2);

    unsubB();
  });

  it('stops ticking once nothing is listening', () => {
    const listener = vi.fn();
    subscribeToClock(listener)();

    expect(vi.getTimerCount()).toBe(0);
    vi.advanceTimersByTime(5000);
    expect(listener).not.toHaveBeenCalled();
  });

  it('restarts after the last subscriber leaves and a new one arrives', () => {
    subscribeToClock(() => {})();

    const listener = vi.fn();
    const unsubscribe = subscribeToClock(listener);
    vi.advanceTimersByTime(1000);
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
  });
});
