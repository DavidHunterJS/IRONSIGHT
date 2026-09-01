// Sanitization for externally sourced content.
//
// Everything this app displays comes from third parties: RSS/Atom titles,
// scraped Telegram HTML, GDELT records, market APIs. None of it is trusted.
//
// Policy: we never render third-party HTML. Every string is reduced to plain
// text before it leaves the API route, and every third-party URL is validated
// before it can end up in an href. That makes the rendering layer inherently
// safe regardless of what an upstream feed serves us.

/** Named + numeric HTML entities we decode after tag removal. */
const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  hellip: '…',
  mdash: '—',
  ndash: '–',
  lsquo: '\u2018',
  rsquo: '\u2019',
  ldquo: '\u201C',
  rdquo: '\u201D',
  laquo: '«',
  raquo: '»',
  deg: '°',
  eacute: 'é',
  egrave: 'è',
  uuml: 'ü',
  ouml: 'ö',
  auml: 'ä',
  szlig: 'ß',
};

function decodeEntities(input: string): string {
  return input.replace(/&(#x?[0-9a-f]+|[a-z][a-z0-9]*);?/gi, (match, body: string) => {
    if (body[0] === '#') {
      const isHex = body[1] === 'x' || body[1] === 'X';
      const code = Number.parseInt(isHex ? body.slice(2) : body.slice(1), isHex ? 16 : 10);
      // Reject invalid, surrogate, and out-of-range code points.
      if (!Number.isFinite(code) || code <= 0 || code > 0x10ffff) return '';
      if (code >= 0xd800 && code <= 0xdfff) return '';
      try {
        return String.fromCodePoint(code);
      } catch {
        return '';
      }
    }
    const named = NAMED_ENTITIES[body.toLowerCase()];
    return named ?? match;
  });
}

/** Control characters, zero-width joiners, and bidi overrides used for spoofing. */
const DANGEROUS_CHARS =
  /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u200B-\u200F\u2028\u2029\u202A-\u202E\u2066-\u2069\uFEFF]/g;

export interface SanitizeOptions {
  /** Truncate to this many characters (default 2000). */
  maxLength?: number;
  /** Collapse all whitespace runs to a single space (default true). */
  collapseWhitespace?: boolean;
}

/**
 * Convert an untrusted HTML or text fragment into safe plain text.
 *
 * Removes script/style bodies and comments entirely (so their contents don't
 * survive as visible text), strips remaining tags, decodes entities once, then
 * strips any tags the decode may have revealed. Finally removes control and
 * bidi-override characters and clamps the length.
 */
export function sanitizeText(input: unknown, options: SanitizeOptions = {}): string {
  const { maxLength = 2000, collapseWhitespace = true } = options;
  if (typeof input !== 'string' || input.length === 0) return '';

  // Guard against pathological inputs before running regexes over them.
  let text = input.length > 100_000 ? input.slice(0, 100_000) : input;

  text = text
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<(script|style|iframe|object|embed|svg|math)\b[\s\S]*?<\/\1\s*>/gi, ' ')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/(p|div|li|tr|h[1-6])\s*>/gi, ' ')
    .replace(/<[^>]*>/g, '');

  text = decodeEntities(text);

  // Decoding can reveal markup that was entity-encoded upstream. Strip again,
  // but do NOT decode a second time (that's how double-encoding bypasses work).
  text = text.replace(/<[^>]*>/g, '');

  text = text.replace(DANGEROUS_CHARS, '');

  if (collapseWhitespace) text = text.replace(/\s+/g, ' ');

  text = text.trim();

  if (text.length > maxLength) {
    text = text.slice(0, maxLength).replace(/\s+\S*$/, '') + '…';
  }

  return text;
}

const ALLOWED_PROTOCOLS = new Set(['http:', 'https:']);

/**
 * Validate an untrusted URL for use in an href.
 * Returns null for anything that isn't a plain http(s) absolute URL —
 * javascript:, data:, vbscript:, blob:, file:, relative paths, and garbage.
 */
export function sanitizeUrl(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  const raw = input.replace(DANGEROUS_CHARS, '').trim();
  if (!raw || raw.length > 2048) return null;
  try {
    const url = new URL(raw);
    if (!ALLOWED_PROTOCOLS.has(url.protocol)) return null;
    if (!url.hostname) return null;
    return url.toString();
  } catch {
    return null;
  }
}

/**
 * Sanitize a feed item's display fields in one call.
 * Fields that fail validation come back as '' / null rather than throwing, so a
 * single malformed item never takes down a whole feed.
 */
export function sanitizeFeedItem<T extends Record<string, unknown>>(
  item: T,
  fields: {
    text?: (keyof T)[];
    urls?: (keyof T)[];
    maxLength?: number;
  },
): T {
  const out = { ...item };
  for (const key of fields.text ?? []) {
    out[key] = sanitizeText(out[key], { maxLength: fields.maxLength }) as T[keyof T];
  }
  for (const key of fields.urls ?? []) {
    out[key] = (sanitizeUrl(out[key]) ?? '') as T[keyof T];
  }
  return out;
}

/** Clamp an untrusted numeric value into a known-safe range. */
export function sanitizeNumber(
  input: unknown,
  { min, max, fallback = 0 }: { min: number; max: number; fallback?: number },
): number {
  const n = typeof input === 'number' ? input : Number.parseFloat(String(input ?? ''));
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

/** Validate an untrusted [lat, lon] pair. Returns null if out of range. */
export function sanitizeCoords(lat: unknown, lon: unknown): [number, number] | null {
  const la = typeof lat === 'number' ? lat : Number.parseFloat(String(lat ?? ''));
  const lo = typeof lon === 'number' ? lon : Number.parseFloat(String(lon ?? ''));
  if (!Number.isFinite(la) || !Number.isFinite(lo)) return null;
  if (la < -90 || la > 90 || lo < -180 || lo > 180) return null;
  return [la, lo];
}
