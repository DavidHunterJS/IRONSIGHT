/**
 * Feed link checker — finds sources whose articles a reader cannot open.
 *
 * The failure this exists for is invisible from inside the app: PressTV moved
 * to a host serving a certificate for the wrong domain, expired two years
 * earlier. The feed still parsed, items still rendered, and nothing looked
 * wrong until someone clicked a headline and hit a TLS interstitial. Any of the
 * ~50 sources can do the same tomorrow.
 *
 * So this checks what a reader actually clicks, not just whether a feed
 * responds: it resolves item links exactly as the news route does — including
 * each feed's rewriteLinkHost rule — and then opens them.
 *
 * Run: npm run check:links
 *      npm run check:links -- --conflict=iran-israel --links=15
 *      npm run check:links -- --json
 *
 * Exits 1 when any source is serving links a reader cannot open, so it can gate
 * a release. Feeds are read-only public endpoints; nothing here writes.
 */

import { pathToFileURL } from 'node:url';

import { DOMParser } from '@xmldom/xmldom';

import { rewriteLinkHost } from '../src/lib/links.ts';
import type { ConflictConfig, NewsFeedSource } from '../src/lib/conflicts/types.ts';
import { iranIsrael } from '../src/lib/conflicts/iran-israel.ts';
import { russiaUkraine } from '../src/lib/conflicts/russia-ukraine.ts';
import { taiwanChina } from '../src/lib/conflicts/taiwan-china.ts';
import { northKorea } from '../src/lib/conflicts/north-korea.ts';
import { redSea } from '../src/lib/conflicts/red-sea.ts';
import { global as globalTheater } from '../src/lib/conflicts/global.ts';

// Imported directly rather than through src/lib/conflicts, because that module
// reads env config through the '@' path alias, which plain node cannot resolve.
// Each theater module is type-imports only, so it loads as-is.
const THEATERS: Record<string, ConflictConfig> = {
  'iran-israel': iranIsrael,
  'russia-ukraine': russiaUkraine,
  'taiwan-china': taiwanChina,
  'north-korea': northKorea,
  'red-sea': redSea,
  global: globalTheater,
};

// ---------------------------------------------------------------- options

interface Options {
  conflict: string | null;
  linksPerFeed: number;
  concurrency: number;
  timeoutMs: number;
  json: boolean;
}

function parseArgs(argv: string[]): Options {
  const opts: Options = {
    conflict: null,
    // The news route slices each feed to 15 items, so 15 is the whole of what a
    // reader can ever click. Lower it for a faster sweep.
    linksPerFeed: 15,
    concurrency: 8,
    timeoutMs: 20_000,
    json: false,
  };
  for (const arg of argv) {
    const [key, value] = arg.replace(/^--/, '').split('=');
    switch (key) {
      case 'conflict': opts.conflict = value ?? null; break;
      case 'links': opts.linksPerFeed = Number(value); break;
      case 'concurrency': opts.concurrency = Number(value); break;
      case 'timeout': opts.timeoutMs = Number(value); break;
      case 'json': opts.json = true; break;
      case 'help':
        console.log('usage: npm run check:links -- [--conflict=KEY] [--links=N] [--concurrency=N] [--timeout=MS] [--json]');
        process.exit(0);
        break;
      default:
        console.error(`unknown option: ${arg}`);
        process.exit(2);
    }
  }
  if (!Number.isFinite(opts.linksPerFeed) || opts.linksPerFeed < 1) {
    console.error('--links must be a positive number');
    process.exit(2);
  }
  return opts;
}

// Identify the script rather than arriving as a bare node fetch; some
// publishers reject unlabelled clients outright, which would otherwise read as
// a broken link.
const USER_AGENT = 'IRONSIGHT-link-check/1.0 (+https://github.com/DavidHunterJS/IRONSIGHT)';

// ---------------------------------------------------------------- diagnosis

/**
 * Turn a fetch rejection into something a reader would recognise.
 *
 * Certificate failures are the whole point of this script, so they are named
 * individually instead of collapsing into "fetch failed" — knowing a cert
 * expired versus a host not resolving is the difference between emailing the
 * publisher and dropping the source.
 */
const TLS_CODES: Record<string, string> = {
  CERT_HAS_EXPIRED: 'certificate expired',
  ERR_TLS_CERT_ALTNAME_INVALID: 'certificate is for a different domain',
  UNABLE_TO_VERIFY_LEAF_SIGNATURE: 'certificate chain cannot be verified',
  DEPTH_ZERO_SELF_SIGNED_CERT: 'self-signed certificate',
  SELF_SIGNED_CERT_IN_CHAIN: 'self-signed certificate in chain',
  CERT_NOT_YET_VALID: 'certificate not yet valid',
  ERR_SSL_WRONG_VERSION_NUMBER: 'not a TLS endpoint',
};

/**
 * How a link failed, and — the part that matters — whether a *reader* would
 * notice.
 *
 * Plenty of publishers answer an automated client with 401/403/429 or a 5xx
 * while serving the same URL perfectly to a browser: NYT, WSJ, CENTCOM and
 * Breaking Defense all do. Counting those as breakage produces a report that is
 * mostly false alarms, and a checker nobody trusts is a checker nobody runs.
 * So only failures a browser would also hit are treated as real:
 *
 *   tls      browser shows a certificate interstitial       — real
 *   network  host does not resolve / refuses / times out    — real
 *   gone     404 or 410, the article is not there           — real
 *   blocked  publisher refuses automated clients            — inconclusive
 */
type FailureKind = 'tls' | 'network' | 'gone' | 'blocked';

interface Failure { kind: FailureKind; detail: string }

/** A reader hits this too. `blocked` is the only kind that stays advisory. */
const isReaderVisible = (kind: FailureKind) => kind !== 'blocked';

export function diagnose(err: unknown): Failure {
  const cause = (err as { cause?: { code?: string; message?: string } } | undefined)?.cause;
  const code = cause?.code ?? (err as { code?: string })?.code;
  if (code && TLS_CODES[code]) return { kind: 'tls', detail: TLS_CODES[code] };
  if (code === 'ENOTFOUND') return { kind: 'network', detail: 'host does not resolve' };
  if (code === 'ECONNREFUSED') return { kind: 'network', detail: 'connection refused' };
  if ((err as Error)?.name === 'AbortError' || code === 'ETIMEDOUT') {
    return { kind: 'network', detail: 'timed out' };
  }
  // An unrecognised TLS failure is still a TLS failure; Node buries the reason
  // in the message when there is no code for it.
  const message = cause?.message ?? (err as Error)?.message ?? String(err);
  if (/certificate|ssl|tls/i.test(message)) return { kind: 'tls', detail: message };
  return { kind: 'network', detail: message };
}

/**
 * A 404 means the article is gone and a reader would see that too. Everything
 * else in the 4xx/5xx range is far more often a publisher turning away a client
 * that is not a browser, so it is reported but not counted against the source.
 */
export function classifyStatus(status: number): Failure {
  if (status === 404 || status === 410) return { kind: 'gone', detail: `HTTP ${status} — not found` };
  return { kind: 'blocked', detail: `HTTP ${status} — refuses automated clients` };
}

type Attempt = { ok: true; status: number } | { ok: false; failure: Failure };

/**
 * Retry once on a network-class failure.
 *
 * A connection reset or a timeout is usually the network between here and the
 * publisher, not the publisher being broken — a full sweep saw three sources
 * fail with ECONNRESET on one run and all 77 pass on the next. Reporting that
 * as breakage is the same cry-wolf failure the blocked/broken split exists to
 * avoid, except worse, because it is not reproducible.
 *
 * Only `network` is retried. A certificate error is deterministic: the same
 * chain fails the same way every time, so a second attempt costs a round trip
 * and tells us nothing. HTTP statuses are not retried either — those answers
 * came from the server, which means it is reachable and has decided.
 */
export async function withNetworkRetry(
  attempt: () => Promise<Attempt>,
  delayMs = 750,
): Promise<Attempt> {
  const first = await attempt();
  if (first.ok || first.failure.kind !== 'network') return first;
  await new Promise(resolve => setTimeout(resolve, delayMs));
  return attempt();
}

async function openOnce(url: string, timeoutMs: number): Promise<Attempt> {
  // A fresh signal per attempt: an AbortSignal that has already fired stays
  // fired, so reusing one would make every retry abort instantly.
  const signal = AbortSignal.timeout(timeoutMs);
  try {
    const headers = { 'User-Agent': USER_AGENT };
    let res = await fetch(url, { method: 'HEAD', redirect: 'follow', signal, headers });
    // Plenty of CDNs refuse HEAD but serve GET fine. Only a GET distinguishes
    // "this article is gone" from "this server dislikes HEAD".
    if (res.status >= 400 && res.status !== 404 && res.status !== 410) {
      res = await fetch(url, { method: 'GET', redirect: 'follow', signal, headers });
    }
    if (!res.ok) return { ok: false, failure: classifyStatus(res.status) };
    return { ok: true, status: res.status };
  } catch (err) {
    return { ok: false, failure: diagnose(err) };
  }
}

const open = (url: string, timeoutMs: number) => withNetworkRetry(() => openOnce(url, timeoutMs));

/** Run tasks with a fixed number in flight, so a sweep stays polite to publishers. */
async function pooled<T, R>(items: T[], limit: number, worker: (item: T) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const i = next++;
      results[i] = await worker(items[i]);
    }
  });
  await Promise.all(runners);
  return results;
}

// ---------------------------------------------------------------- feed reading

/**
 * Pull item links out of a feed the way the news route does.
 *
 * Mirrors the route's shape deliberately: RSS <item> or Atom <entry>, the <link>
 * element or an Atom href attribute, the same 15-item slice, and the feed's own
 * rewriteLinkHost rule. Checking links the route would never serve — or missing
 * the rewrite — would make the report describe a page nobody visits.
 */
function extractLinks(xml: string, feed: NewsFeedSource, limit: number): string[] {
  // Matches src/lib/fetcher.ts: a bare parser, warnings and all. Feeds in the
  // wild are frequently malformed, and xmldom recovers rather than throwing —
  // silencing the handler here would only diverge from what the route sees.
  const doc = new DOMParser().parseFromString(xml, 'text/xml');
  const items = doc.getElementsByTagName('item');
  const entries = doc.getElementsByTagName('entry');
  const elements = items.length > 0 ? items : entries;

  const links: string[] = [];
  for (let i = 0; i < Math.min(elements.length, limit); i++) {
    const linkEl = elements[i].getElementsByTagName('link')[0];
    if (!linkEl) continue;
    const raw = (linkEl.textContent || linkEl.getAttribute('href') || '').trim();
    if (!raw) continue;
    const link = feed.rewriteLinkHost ? rewriteLinkHost(raw, feed.rewriteLinkHost) : raw;
    if (/^https?:\/\//i.test(link)) links.push(link);
  }
  return links;
}

interface FeedReport {
  name: string;
  url: string;
  theaters: string[];
  // Classified like a link failure, and for the same reason: a feed answering
  // 403 to this script is usually a bot challenge — Arab News returns 200 to
  // curl under every User-Agent while challenging node's fetch — whereas a 404
  // is a feed URL that has genuinely moved.
  feedError?: Failure;
  itemCount: number;
  checked: number;
  broken: { url: string; kind: FailureKind; detail: string }[];
}

async function checkFeed(feed: NewsFeedSource, theaters: string[], opts: Options): Promise<FeedReport> {
  const report: FeedReport = { name: feed.name, url: feed.url, theaters, itemCount: 0, checked: 0, broken: [] };

  // Same retry as the links: a reset fetching the feed is no more meaningful
  // than a reset fetching an article.
  let xml = '';
  const fetched = await withNetworkRetry(async () => {
    try {
      const res = await fetch(feed.url, {
        redirect: 'follow',
        signal: AbortSignal.timeout(opts.timeoutMs),
        headers: {
          Accept: 'application/rss+xml, application/xml, text/xml, */*',
          'User-Agent': USER_AGENT,
        },
      });
      if (!res.ok) return { ok: false, failure: classifyStatus(res.status) };
      xml = await res.text();
      return { ok: true, status: res.status };
    } catch (err) {
      return { ok: false, failure: diagnose(err) };
    }
  });
  if (!fetched.ok) {
    report.feedError = fetched.failure;
    return report;
  }

  const links = extractLinks(xml, feed, opts.linksPerFeed);
  report.itemCount = links.length;
  if (links.length === 0) {
    // A feed that parses to nothing is broken for a reader too: the source
    // silently contributes no items and the dashboard looks merely quiet.
    report.feedError = { kind: 'gone', detail: 'feed parsed but yielded no item links' };
    return report;
  }

  const results = await pooled(links, opts.concurrency, url => open(url, opts.timeoutMs));
  report.checked = links.length;
  results.forEach((result, i) => {
    if (!result.ok) report.broken.push({ url: links[i], ...result.failure });
  });
  return report;
}

// ---------------------------------------------------------------- reporting

const BOLD = '\x1b[1m', DIM = '\x1b[2m', RED = '\x1b[31m', GREEN = '\x1b[32m', YELLOW = '\x1b[33m', RESET = '\x1b[0m';
const colour = process.stdout.isTTY && !process.env.NO_COLOR;
const c = (code: string, text: string) => (colour ? `${code}${text}${RESET}` : text);

/** A source is only "broken" if a reader would hit it; blocked is advisory. */
const readerVisible = (r: FeedReport) => r.broken.filter(b => isReaderVisible(b.kind));
const isBroken = (r: FeedReport) =>
  (r.feedError !== undefined && isReaderVisible(r.feedError.kind)) || readerVisible(r).length > 0;
const isAdvisory = (r: FeedReport) =>
  !isBroken(r) && (r.feedError !== undefined || r.broken.length > 0);

function render(reports: FeedReport[]): void {
  const broken = reports.filter(isBroken);
  const advisory = reports.filter(isAdvisory);
  const healthy = reports.filter(r => !isBroken(r) && !isAdvisory(r));

  for (const r of broken) {
    console.log(`${c(BOLD, r.name.padEnd(16))} ${c(DIM, r.url)}`);
    if (r.feedError) {
      console.log(`  ${c(RED, '✗')} feed: ${r.feedError.detail}`);
    } else {
      const visible = readerVisible(r);
      console.log(`  feed  ok   ${r.itemCount} items`);
      console.log(`  links ${c(RED, `${r.checked - visible.length}/${r.checked} open`)}`);
      for (const b of visible) {
        const tag = b.kind === 'tls' ? c(RED, 'TLS ') : b.kind === 'gone' ? c(YELLOW, 'GONE') : c(YELLOW, 'NET ');
        console.log(`  ${c(RED, '✗')} ${tag} ${b.detail}  ${c(DIM, b.url)}`);
      }
    }
    console.log();
  }

  if (broken.length === 0) {
    console.log(c(GREEN, `All ${healthy.length + advisory.length} sources serve links a reader can open`));
  } else {
    // A TLS failure is the class of bug this script exists for: the feed looks
    // healthy from inside the app and only fails on click. Name those sources.
    const tls = broken.filter(r => r.broken.some(b => b.kind === 'tls'));
    console.log(c(BOLD, `${broken.length} source${broken.length === 1 ? '' : 's'} serving links a reader cannot open`));
    if (tls.length > 0) {
      console.log(c(RED, `  certificate errors (browser will refuse): ${[...new Set(tls.map(r => r.name))].join(', ')}`));
    }
  }

  if (advisory.length > 0) {
    // Reported rather than hidden — a source that starts refusing automated
    // clients is worth knowing about — but it is not breakage, so it does not
    // fail the run.
    console.log(
      c(DIM, `${advisory.length} source${advisory.length === 1 ? '' : 's'} refuse automated checks ` +
      `(fine in a browser, unverifiable here): ${[...new Set(advisory.map(r => r.name))].join(', ')}`),
    );
  }
}

// ---------------------------------------------------------------- main

async function main(): Promise<void> {
  const opts = parseArgs(process.argv.slice(2));

  const keys = opts.conflict ? [opts.conflict] : Object.keys(THEATERS);
  for (const key of keys) {
    if (!THEATERS[key]) {
      console.error(`unknown conflict '${key}'. known: ${Object.keys(THEATERS).join(', ')}`);
      process.exit(2);
    }
  }

  // The same feed is often listed by several theaters. Check each once and
  // record where it is used, so a broken source is reported once with the full
  // blast radius rather than up to six times.
  const byUrl = new Map<string, { feed: NewsFeedSource; theaters: string[] }>();
  for (const key of keys) {
    for (const feed of THEATERS[key].server.newsFeeds) {
      const existing = byUrl.get(feed.url);
      if (existing) existing.theaters.push(key);
      else byUrl.set(feed.url, { feed, theaters: [key] });
    }
  }

  const targets = [...byUrl.values()];
  if (!opts.json) {
    console.log(
      `Checking ${targets.length} feeds across ${keys.length} theater${keys.length === 1 ? '' : 's'}, ` +
      `up to ${opts.linksPerFeed} links each\n`,
    );
  }

  // Feeds run a few at a time as well; the inner pool bounds links per feed, so
  // an unbounded outer loop would multiply into hundreds of open sockets.
  const reports = await pooled(targets, 4, ({ feed, theaters }) => checkFeed(feed, theaters, opts));
  reports.sort((a, b) => a.name.localeCompare(b.name));

  if (opts.json) {
    console.log(JSON.stringify({ checkedAt: new Date().toISOString(), reports }, null, 2));
  } else {
    render(reports);
  }

  process.exit(reports.some(isBroken) ? 1 : 0);
}

// Only sweep when run as a command. Without this, importing the module for a
// test would start a few hundred live requests and then call process.exit.
const invokedDirectly =
  process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;

if (invokedDirectly) {
  main().catch(err => {
    console.error(err);
    process.exit(2);
  });
}
