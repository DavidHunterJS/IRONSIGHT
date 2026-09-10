import { describe, it, expect } from 'vitest';

import { UpstreamError } from '../upstream';
import { describeFailure, failedSources } from './failures';
import { feedResponse } from './respond';

// 38 North failed only from Vercel on 2026-09-10, twice, and nothing could say
// why: the response carried a count ('19/21') and the route logged nothing.

describe('describeFailure', () => {
  it('names the HTTP status an upstream answered with', () => {
    expect(describeFailure(new UpstreamError('HTTP 403 from www.38north.org', 'http', 'www.38north.org', 403))).toBe('http 403');
  });

  it('names the other upstream failure kinds', () => {
    expect(describeFailure(new UpstreamError('Timeout after 8000ms: x', 'timeout', 'x'))).toBe('timeout');
    expect(describeFailure(new UpstreamError('fetch failed', 'network', 'x'))).toBe('network');
    expect(describeFailure(new UpstreamError('Circuit open for x', 'breaker', 'x'))).toBe('breaker');
  });

  it("recognises the news route's own failures", () => {
    // A block page served with 200 is the likeliest shape of a bot wall.
    expect(describeFailure(new Error('38 North: HTML response, not a feed'))).toBe('html');
    expect(describeFailure(new Error('route budget exceeded'))).toBe('budget');
  });

  it('never passes raw error text through', () => {
    // Messages can carry anything an upstream sent back; the header is public.
    expect(describeFailure(new Error('Unexpected token < in JSON at position 0 <script>'))).toBe('error');
    expect(describeFailure('a string')).toBe('error');
  });
});

describe('failedSources', () => {
  it('pairs each failed feed with its reason, in feed order', () => {
    const results: PromiseSettledResult<unknown>[] = [
      { status: 'fulfilled', value: [] },
      { status: 'rejected', reason: new UpstreamError('HTTP 403', 'http', 'www.38north.org', 403) },
      { status: 'rejected', reason: new UpstreamError('Timeout', 'timeout', 'www.koreaherald.com') },
    ];
    expect(failedSources(results, ['NK News', '38 North', 'Korea Herald'])).toEqual([
      '38 North: http 403',
      'Korea Herald: timeout',
    ]);
  });
});

describe('feedResponse', () => {
  it('reports failed sources in a header', () => {
    const res = feedResponse([], { status: 'degraded', sourcesOk: 19, sourcesTotal: 21, failed: ['38 North: http 403', 'Korea Herald: timeout'] });
    expect(res.headers.get('X-Feed-Failed')).toBe('38 North: http 403; Korea Herald: timeout');
  });

  it('omits the header when nothing failed', () => {
    expect(feedResponse([], { failed: [] }).headers.get('X-Feed-Failed')).toBeNull();
    expect(feedResponse([]).headers.get('X-Feed-Failed')).toBeNull();
  });

  it('keeps the header short', () => {
    const many = Array.from({ length: 40 }, (_, i) => `Source ${i}: timeout`);
    expect(feedResponse([], { failed: many }).headers.get('X-Feed-Failed')!.length).toBeLessThanOrEqual(300);
  });

  it('keeps the header ASCII', () => {
    // First in the list, so the length cap cannot hide it: an earlier version
    // of this test put it last, and the cap cut it off before the filter was
    // ever exercised.
    const header = feedResponse([], { failed: ['Walla — וואלה: http 500', 'Ynet: timeout'] }).headers.get('X-Feed-Failed')!;
    expect(/^[\x20-\x7E]*$/.test(header)).toBe(true);
    expect(header).toContain('Ynet: timeout');
  });
});
