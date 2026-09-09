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
