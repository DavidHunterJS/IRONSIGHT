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
 * Prefer `fetchUpstreamText` / `fetchUpstreamJson` in new code: those also
 * enforce the response size cap, which needs to wrap body reading.
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit & { timeout?: number } = {}
): Promise<Response> {
  const { timeout = UPSTREAM.timeoutMs, ...fetchOptions } = options;
  return guardedFetch(url, { ...fetchOptions, timeout });
}

export function parseXML(text: string): Document {
  const parser = new DOMParser();
  return parser.parseFromString(text, 'text/xml');
}

export function getTextContent(element: Element, tagName: string): string {
  const el = element.getElementsByTagName(tagName)[0];
  return el?.textContent || '';
}
