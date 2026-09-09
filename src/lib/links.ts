// Link handling shared by the news route and scripts/check-feed-links.mts.
//
// Deliberately free of imports so the checker can load it directly under
// `node --experimental-strip-types`, without a bundler or path-alias
// resolution. Keeping one copy of the rule is the point: a checker that
// evaluated different links than the route serves would report on links no
// reader ever sees.
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
