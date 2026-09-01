import { describe, it, expect } from 'vitest';

import { capResponseBody, UpstreamError } from './upstream';

// The cap used to live inside fetchUpstreamText/Json, which covered two of the
// twelve fetching routes. The other ten called guardedFetch and read the body
// themselves, so the limit never applied — including to the largest download in
// the app. These tests pin the cap to the response body itself, where it holds
// regardless of how the caller reads it.

function streamOf(chunks: Uint8Array[]): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      for (const c of chunks) controller.enqueue(c);
      controller.close();
    },
  });
}

const kb = (n: number) => new Uint8Array(n * 1024).fill(65);

describe('capResponseBody', () => {
  it('passes a body through unchanged when it is under the cap', async () => {
    const res = capResponseBody(new Response(streamOf([kb(1)])), 10 * 1024, 'example.test');
    expect((await res.text()).length).toBe(1024);
  });

  it('rejects mid-stream once the running total passes the cap', async () => {
    // Chunks are individually small; only the total exceeds. A naive
    // per-chunk check would let this through.
    const res = capResponseBody(new Response(streamOf([kb(4), kb(4), kb(4)])), 10 * 1024, 'example.test');
    await expect(res.text()).rejects.toThrow(/exceeded 10240 byte cap/);
  });

  it('rejects up front when content-length declares too much', async () => {
    // No bytes should be transferred at all in this case.
    const res = new Response('x', { headers: { 'content-length': '99999999' } });
    expect(() => capResponseBody(res, 4_000_000, 'example.test')).toThrow(UpstreamError);
    expect(() => capResponseBody(res, 4_000_000, 'example.test')).toThrow(/Response too large/);
  });

  it('reports the failure as an UpstreamError, not a generic stream error', async () => {
    // Routes catch UpstreamError to degrade gracefully; a bare TypeError would
    // surface as an unhandled 500 instead of a feed-unavailable state.
    const res = capResponseBody(new Response(streamOf([kb(20)])), 1024, 'example.test');
    await expect(res.text()).rejects.toBeInstanceOf(UpstreamError);
  });

  it('preserves status and headers', () => {
    const res = capResponseBody(
      new Response(streamOf([kb(1)]), { status: 207, headers: { 'x-test': 'kept' } }),
      10 * 1024,
      'example.test',
    );
    expect(res.status).toBe(207);
    expect(res.headers.get('x-test')).toBe('kept');
  });

  it('leaves bodyless responses alone', () => {
    // Constructing a Response with a body for these statuses throws.
    for (const status of [204, 304]) {
      const res = new Response(null, { status });
      expect(() => capResponseBody(res, 1024, 'example.test')).not.toThrow();
    }
  });

  it('allows a large body when the caller opts into a larger cap', async () => {
    // The FIRMS global CSV is ~17MB and is the reason maxBytesBulk exists.
    const res = capResponseBody(new Response(streamOf([kb(500)])), 1_000_000, 'example.test');
    expect((await res.text()).length).toBe(500 * 1024);
  });
});
