import { describe, it, expect, vi } from 'vitest';

import { withNetworkRetry, classifyStatus, diagnose } from './check-feed-links.mts';

// These three functions decide what the checker calls breakage. Getting them
// wrong is worse than having no checker: a report full of false alarms is one
// nobody reads, and the failure it was built for hides in the noise.

const netFail = { ok: false as const, failure: { kind: 'network' as const, detail: 'reset' } };
const tlsFail = { ok: false as const, failure: { kind: 'tls' as const, detail: 'certificate expired' } };
const blocked = { ok: false as const, failure: { kind: 'blocked' as const, detail: 'HTTP 403' } };
const success = { ok: true as const, status: 200 };

describe('withNetworkRetry', () => {
  it('does not retry a call that succeeds', async () => {
    const attempt = vi.fn().mockResolvedValue(success);
    await expect(withNetworkRetry(attempt, 0)).resolves.toEqual(success);
    expect(attempt).toHaveBeenCalledTimes(1);
  });

  it('retries a network failure and takes the second answer', async () => {
    // The bug this fixes: one sweep saw three sources fail with ECONNRESET and
    // the very next run saw all 77 pass.
    const attempt = vi.fn()
      .mockResolvedValueOnce(netFail)
      .mockResolvedValueOnce(success);

    await expect(withNetworkRetry(attempt, 0)).resolves.toEqual(success);
    expect(attempt).toHaveBeenCalledTimes(2);
  });

  it('reports a network failure that repeats', async () => {
    // Retrying must not paper over a host that is genuinely gone.
    const attempt = vi.fn().mockResolvedValue(netFail);
    await expect(withNetworkRetry(attempt, 0)).resolves.toEqual(netFail);
    expect(attempt).toHaveBeenCalledTimes(2);
  });

  it('does not retry a certificate failure', async () => {
    // Deterministic: the same chain fails the same way, so a retry buys a round
    // trip and no information.
    const attempt = vi.fn().mockResolvedValue(tlsFail);
    await expect(withNetworkRetry(attempt, 0)).resolves.toEqual(tlsFail);
    expect(attempt).toHaveBeenCalledTimes(1);
  });

  it('does not retry a server that answered', async () => {
    // A 403 came from the server, so it is reachable and has decided.
    const attempt = vi.fn().mockResolvedValue(blocked);
    await expect(withNetworkRetry(attempt, 0)).resolves.toEqual(blocked);
    expect(attempt).toHaveBeenCalledTimes(1);
  });

  it('waits between attempts', async () => {
    vi.useFakeTimers();
    try {
      const attempt = vi.fn().mockResolvedValueOnce(netFail).mockResolvedValueOnce(success);
      const pending = withNetworkRetry(attempt, 750);

      await vi.advanceTimersByTimeAsync(0);
      expect(attempt).toHaveBeenCalledTimes(1); // still waiting

      await vi.advanceTimersByTimeAsync(750);
      await expect(pending).resolves.toEqual(success);
      expect(attempt).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('classifyStatus', () => {
  it('treats 404 and 410 as genuinely gone', () => {
    expect(classifyStatus(404).kind).toBe('gone');
    expect(classifyStatus(410).kind).toBe('gone');
  });

  it('treats bot-blocking statuses as inconclusive, not breakage', () => {
    // NYT and WSJ answer 401/403 to an automated client and serve browsers
    // fine; Breaking Defense answers 500. Counting these as broken made the
    // first version of this script flag 5 of 26 sources, all false alarms.
    for (const status of [401, 403, 405, 429, 500, 503]) {
      expect(classifyStatus(status).kind, `HTTP ${status}`).toBe('blocked');
    }
  });
});

describe('diagnose', () => {
  const withCause = (code: string) => Object.assign(new Error('fetch failed'), { cause: { code } });

  it('names certificate failures individually', () => {
    // Knowing a cert expired versus a host not resolving is the difference
    // between emailing the publisher and dropping the source.
    expect(diagnose(withCause('CERT_HAS_EXPIRED'))).toEqual({
      kind: 'tls', detail: 'certificate expired',
    });
    expect(diagnose(withCause('ERR_TLS_CERT_ALTNAME_INVALID'))).toEqual({
      kind: 'tls', detail: 'certificate is for a different domain',
    });
  });

  it('separates a dead host from a reset', () => {
    expect(diagnose(withCause('ENOTFOUND'))).toEqual({ kind: 'network', detail: 'host does not resolve' });
    expect(diagnose(withCause('ECONNREFUSED'))).toEqual({ kind: 'network', detail: 'connection refused' });
  });

  it('reads a timeout as network, so it earns a retry', () => {
    expect(diagnose(Object.assign(new Error('aborted'), { name: 'AbortError' })).kind).toBe('network');
    expect(diagnose(withCause('ETIMEDOUT')).kind).toBe('network');
  });

  it('still calls an uncoded certificate error a certificate error', () => {
    // Node buries the reason in the message when it has no code for it.
    // Misfiling one as `network` would hand it a retry it can never pass.
    expect(diagnose(new Error('unable to get local issuer certificate')).kind).toBe('tls');
  });
});
