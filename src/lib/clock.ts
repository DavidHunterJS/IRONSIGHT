// A one-second tick shared by every component that displays a clock.
//
// Written as an external store rather than a setState-in-effect because the
// current time is exactly what useSyncExternalStore is for: a value that lives
// outside React and changes on its own. Setting it from an effect works, but it
// costs an extra render on mount and trips react-hooks/set-state-in-effect,
// which is a real warning here rather than a false positive — the effect body
// was writing state on every mount.
//
// Server-rendered output has no clock: the server's time is not the viewer's,
// so rendering one would hydrate to a different string. getServerSnapshot
// returns null and callers render a placeholder until the first client
// snapshot arrives.

type Listener = () => void;

const listeners = new Set<Listener>();
let timer: ReturnType<typeof setInterval> | null = null;

// Held as a stable value between ticks. useSyncExternalStore compares snapshots
// with Object.is and re-renders whenever they differ, so returning a fresh
// `new Date()` on every read would loop forever.
let snapshot: number = Date.now();

/**
 * Subscribe to the shared tick.
 *
 * One interval serves every subscriber, and it only runs while something is
 * listening — a dashboard with no clock on screen has no timer running.
 */
export function subscribeToClock(listener: Listener): () => void {
  listeners.add(listener);
  if (timer === null) {
    timer = setInterval(() => {
      snapshot = Date.now();
      for (const l of listeners) l();
    }, 1000);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && timer !== null) {
      clearInterval(timer);
      timer = null;
    }
  };
}

/** Milliseconds since epoch, stable until the next tick. */
export function getClockSnapshot(): number {
  return snapshot;
}

/** No clock on the server: its time is not the viewer's, and would not hydrate. */
export function getClockServerSnapshot(): null {
  return null;
}
