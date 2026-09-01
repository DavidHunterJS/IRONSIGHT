import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { createServer, type Server } from 'node:http';
import { AddressInfo } from 'node:net';

import { fetchWithTimeout } from './fetcher';
import { USER_AGENT } from './upstream';

// Six API routes used to hardcode 'User-Agent: IronSight/1.0', which overrode
// the configured identity because guardedFetch spreads caller headers over its
// own. The deployment therefore introduced itself to upstream providers under
// two different names. These tests pin the header to what actually goes out on
// the wire, rather than to what the source appears to say.

let server: Server;
let base: string;
const seen: { ua?: string; accept?: string }[] = [];

beforeAll(async () => {
  server = createServer((req, res) => {
    seen.push({ ua: req.headers['user-agent'], accept: req.headers['accept'] });
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end('{"ok":true}');
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

describe('outbound User-Agent', () => {
  it('sends the configured identity by default', async () => {
    await fetchWithTimeout(`${base}/default`);
    expect(seen.at(-1)?.ua).toBe(USER_AGENT);
  });

  it('is never the bare hardcoded string the routes used to send', async () => {
    // The literal was 'IronSight/1.0' with no contact hint. The configured
    // identity always carries one, whatever the brand resolves to — with no
    // brand env set it legitimately falls back to the upstream project name.
    await fetchWithTimeout(`${base}/rename`);
    expect(seen.at(-1)?.ua).not.toBe('IronSight/1.0');
  });

  it('honours UPSTREAM_USER_AGENT', async () => {
    // The deployment sets this in its environment. Six routes were discarding
    // it, so the variable appeared to do nothing for the busiest upstreams.
    vi.stubEnv('UPSTREAM_USER_AGENT', 'WATCHFLOOR/9.9 (+https://example.test/about)');
    vi.resetModules();
    const { fetchWithTimeout: freshFetch } = await import('./fetcher');
    await freshFetch(`${base}/env`);
    expect(seen.at(-1)?.ua).toBe('WATCHFLOOR/9.9 (+https://example.test/about)');
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('keeps the identity when a route sets other headers', async () => {
    // This is the case the six routes got wrong: they set Accept and User-Agent
    // together, and only meant to set Accept.
    await fetchWithTimeout(`${base}/accept`, {
      headers: { Accept: 'application/json' },
    });
    expect(seen.at(-1)?.ua).toBe(USER_AGENT);
    expect(seen.at(-1)?.accept).toBe('application/json');
  });

  it('carries a contact hint so a provider can reach us before blocking us', async () => {
    // Either the configured UPSTREAM_USER_AGENT or the built-in fallback.
    expect(USER_AGENT).toMatch(/\(\+/);
  });
});
