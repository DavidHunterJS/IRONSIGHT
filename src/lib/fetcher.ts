import { DOMParser } from '@xmldom/xmldom';
import { UPSTREAM } from '@/lib/config';
import { guardedFetch } from '@/lib/upstream';

/**
 * Timeout-bounded fetch used by the API routes.
 *
 * Kept at its original call signature so existing routes need no changes, but
 * now delegates to the guarded upstream client, which adds:
 *   - the circuit breaker (a dead host is skipped, not retried every poll)
 *   - the per-host concurrency cap
 *   - an identifying User-Agent
 *
 * The response size cap now applies here too: guardedFetch returns a body
 * stream that errors past the limit, so it holds however the caller reads.
 * Pass `maxBytes` to raise it for a specific upstream.
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit & { timeout?: number; maxBytes?: number } = {}
): Promise<Response> {
  const { timeout = UPSTREAM.timeoutMs, maxBytes, ...fetchOptions } = options;
  return guardedFetch(url, { ...fetchOptions, timeout, maxBytes });
}

export function parseXML(text: string): Document {
  const parser = new DOMParser();
  return parser.parseFromString(text, 'text/xml');
}

export function getTextContent(element: Element, tagName: string): string {
  const el = element.getElementsByTagName(tagName)[0];
  return el?.textContent || '';
}

/**
 * Move a feed item's link onto an equivalent host.
 *
 * Publishers sometimes list articles on a hostname whose certificate a browser
 * rejects while an equivalent hostname serves the same page fine. The feed
 * itself parses cleanly in that case, so nothing looks broken until a reader
 * clicks through and lands on a TLS interstitial.
 *
 * Only an exact hostname match is rewritten, so links a feed makes to anywhere
 * else stay pointing where the publisher put them. A link that will not parse
 * is returned untouched for the caller's own validation to reject.
 */
export function rewriteLinkHost(link: string, rule: { from: string; to: string }): string {
  try {
    const url = new URL(link);
    if (url.hostname !== rule.from) return link;
    url.hostname = rule.to;
    return url.toString();
  } catch {
    return link;
  }
}
