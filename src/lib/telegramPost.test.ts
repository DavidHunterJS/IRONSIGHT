import { describe, it, expect } from 'vitest';

import { parsePostHtml, latestIdFromPreviewHtml } from './telegramPost';

// Fixtures mirror the three shapes t.me actually serves, confirmed by probing
// real channels: an error widget for a missing id, a post with a <time> and a
// text div, and a post with a <time> and no text div at all.

const missing = '<div class="tgme_widget_message_error">Post not found</div>';

const withText = `
  <div class="tgme_widget_message_bubble">
    <div class="tgme_widget_message_text js-message_text">Convoy reported near the strait</div>
    <time datetime="2026-09-01T10:15:00+00:00"></time>
  </div>`;

const mediaOnly = `
  <div class="tgme_widget_message_bubble">
    <a class="tgme_widget_message_video_player"></a>
    <time datetime="2026-09-01T10:16:00+00:00"></time>
  </div>`;

describe('parsePostHtml', () => {
  it('treats the error widget as a missing post', () => {
    expect(parsePostHtml(missing).exists).toBe(false);
  });

  it('reads a text post', () => {
    const p = parsePostHtml(withText);
    expect(p.exists).toBe(true);
    expect(p.rawText).toContain('Convoy reported');
    expect(p.rawDate).toBe('2026-09-01T10:15:00+00:00');
  });

  it('reports a media post as existing with no text', () => {
    // This is the case the scraper got wrong. Returning "does not exist" here
    // made the id search treat a live channel as an empty one.
    const p = parsePostHtml(mediaOnly);
    expect(p.exists).toBe(true);
    expect(p.rawText).toBeNull();
    expect(p.rawDate).toBe('2026-09-01T10:16:00+00:00');
  });

  it('does not mistake a bodyless page for a post', () => {
    expect(parsePostHtml('<html><body></body></html>').exists).toBe(false);
  });

  it('never reports existence purely because the page mentions a bubble', () => {
    // tgme_widget_message_bubble appears in the page skeleton regardless, so it
    // is not usable as an existence signal.
    expect(parsePostHtml('<div class="tgme_widget_message_bubble"></div>').exists).toBe(false);
  });
});

describe('latestIdFromPreviewHtml', () => {
  const preview = `
    <a href="/scmpnews/100"></a>
    <a href="/scmpnews/103"></a>
    <a href="/scmpnews/98"></a>`;

  it('returns the highest post id linked on the page', () => {
    expect(latestIdFromPreviewHtml('scmpnews', preview)).toBe(103);
  });

  it('ignores links belonging to other channels', () => {
    const mixed = '<a href="/otherchan/9999"></a><a href="/scmpnews/12"></a>';
    expect(latestIdFromPreviewHtml('scmpnews', mixed)).toBe(12);
  });

  it('returns null when the page links no posts', () => {
    expect(latestIdFromPreviewHtml('scmpnews', '<html></html>')).toBeNull();
  });

  it('handles ids that are not contiguous', () => {
    // Channels delete posts. The old binary search assumed contiguity and
    // collapsed into the wrong range when a probe landed in a gap.
    expect(latestIdFromPreviewHtml('c', '<a href="/c/1"></a><a href="/c/21803"></a>')).toBe(21803);
  });
});
