// Saying which sources failed, and why, in words safe to publish.
//
// A panel could report '19/21 sources' but not which two. On 2026-09-10 38
// North failed only from Vercel, at two readings, and nothing could say why:
// the response carried a count and the route logged nothing. Preview
// deployments sit behind Vercel's login, so the only place to see production's
// view of an upstream is production's own response.
//
// Reasons come from a fixed vocabulary, never from error text. Messages can
// carry whatever an upstream sent back, and response headers are public.
//
// Free of imports so any route and any script can share it.

/** A short, fixed-vocabulary reason for one source's failure. */
export function describeFailure(err: unknown): string {
  if (err instanceof Error) {
    // UpstreamError, recognised by shape so this module stays import-free.
    const e = err as Error & { kind?: string; status?: number };
    if (e.name === 'UpstreamError') {
      if (e.kind === 'http' && typeof e.status === 'number') return `http ${e.status}`;
      if (e.kind === 'timeout' || e.kind === 'network' || e.kind === 'breaker' || e.kind === 'too-large') {
        return e.kind;
      }
    }
    // The news route's own failures. A bot wall usually answers 200 with an
    // HTML challenge page, which is what the first of these catches.
    if (err.message.includes('HTML response, not a feed')) return 'html';
    if (err.message.includes('route budget exceeded')) return 'budget';
  }
  return 'error';
}

/** 'Name: reason' for each rejected result, in the order the sources were given. */
export function failedSources(results: PromiseSettledResult<unknown>[], names: string[]): string[] {
  const out: string[] = [];
  results.forEach((r, i) => {
    if (r.status === 'rejected') out.push(`${names[i] ?? `source ${i + 1}`}: ${describeFailure(r.reason)}`);
  });
  return out;
}
