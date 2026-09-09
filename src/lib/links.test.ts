import { describe, it, expect } from 'vitest';

import { rewriteLinkHost } from './links';

// PressTV's feed lists articles on the bare apex, which serves a certificate
// for a different domain that expired in December 2024. The www host carries a
// valid cert for the same articles. Nothing about the feed looks broken — the
// failure only shows up when a reader clicks through.
const PRESSTV = { from: 'presstv.co.uk', to: 'www.presstv.co.uk' };

describe('rewriteLinkHost', () => {
  it('moves a matching host onto the replacement', () => {
    expect(
      rewriteLinkHost('https://presstv.co.uk/Detail/2026/09/09/775982/iran-iaea', PRESSTV),
    ).toBe('https://www.presstv.co.uk/Detail/2026/09/09/775982/iran-iaea');
  });

  it('keeps the path, query and fragment intact', () => {
    expect(rewriteLinkHost('https://presstv.co.uk/a/b?x=1&y=2#z', PRESSTV)).toBe(
      'https://www.presstv.co.uk/a/b?x=1&y=2#z',
    );
  });

  it('leaves a host that does not match exactly', () => {
    // Already correct — rewriting again would produce www.www.presstv.co.uk.
    const done = 'https://www.presstv.co.uk/Detail/1';
    expect(rewriteLinkHost(done, PRESSTV)).toBe(done);
  });

  it('does not rewrite a lookalike suffix', () => {
    // Substring matching would capture this; hostname equality must not.
    const evil = 'https://evil-presstv.co.uk/Detail/1';
    expect(rewriteLinkHost(evil, PRESSTV)).toBe(evil);
  });

  it('leaves links to other publishers alone', () => {
    const other = 'https://www.reuters.com/world/middle-east/';
    expect(rewriteLinkHost(other, PRESSTV)).toBe(other);
  });

  it('returns unparseable input untouched for the caller to reject', () => {
    expect(rewriteLinkHost('not a url', PRESSTV)).toBe('not a url');
    expect(rewriteLinkHost('', PRESSTV)).toBe('');
  });
});
