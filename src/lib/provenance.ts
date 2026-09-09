// Factual provenance for a news outlet.
//
// This is deliberately not a reliability rating. The dashboard's own disclaimer
// says nothing here is verified or authoritative and that any single source may
// be inaccurate or propagandistic — scoring outlets for trustworthiness would
// contradict that, and would substitute this project's judgement for the
// reader's. What follows is a matter of public record instead: who owns the
// outlet. The reader draws the conclusion.
//
// The bar for an entry is that the outlet is owned or editorially controlled by
// a government, by its own description or its government's. Publicly funded
// broadcasters with statutory editorial independence — the BBC, DW, NPR, France
// 24 — are not listed, because lumping them together with a state's own
// mouthpiece would mislead rather than inform. That line is a judgement, which
// is exactly why the list stays short and explicit rather than inferred.
//
// An outlet missing from this file has had nothing recorded about it. That is
// not a statement that it is independent. Most outlets that reach the feed are
// local papers and trade press that will never appear here.
//
// Free of imports so the news route and any script can share it.

/**
 * Outlets a government owns, mapped to the state that owns them.
 *
 * Keys are canonical names (see `canonical`), with alternates listed where an
 * outlet reaches us under more than one spelling.
 */
const STATE_MEDIA: Record<string, string> = {
  // Iran
  'presstv': 'Iran',
  'press tv': 'Iran',
  'irna': 'Iran',
  'islamic republic news agency': 'Iran',
  'tasnim': 'Iran',
  'tasnim news agency': 'Iran',
  'fars news': 'Iran',
  'fars news agency': 'Iran',
  'mehr news': 'Iran',
  'mehr news agency': 'Iran',

  // China
  'xinhua': 'China',
  'xinhua news agency': 'China',
  'global times': 'China',
  'cgtn': 'China',
  'china daily': 'China',
  "people's daily": 'China',
  'peoples daily': 'China',

  // Russia
  'rt': 'Russia',
  'russia today': 'Russia',
  'tass': 'Russia',
  'sputnik': 'Russia',
  'ria novosti': 'Russia',
  'ria': 'Russia',

  // North Korea
  'kcna': 'North Korea',
  'korean central news agency': 'North Korea',
  'rodong sinmun': 'North Korea',
};

export interface Provenance {
  /** The state that owns this outlet. */
  state: string;
}

/**
 * Reduce an outlet name to a comparison key.
 *
 * Case, punctuation and leading articles vary between feeds — 'The Global
 * Times' and 'global times' are one outlet. Nothing else is stripped: the key
 * still has to match a whole name.
 */
function canonical(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9' ]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .filter((w, i) => !(i === 0 && w === 'the'))
    .join(' ');
}

/**
 * What is on record about who publishes this outlet.
 *
 * Matches the whole canonical name and never a fragment. Substring matching
 * would tag The Moscow Times — an exile publication banned in Russia — off the
 * word 'Moscow', and would sweep in every outlet whose name contains 'Times'.
 * Getting this wrong asserts something false about a real organisation, so the
 * failure mode is to say nothing.
 */
export function provenanceOf(publisher: string | undefined): Provenance | undefined {
  if (!publisher) return undefined;
  const key = canonical(publisher);
  // A masthead in a non-Latin script reduces to nothing. Exact matching makes
  // that harmless today, but an empty entry slipping into the table later would
  // tag every such outlet at once, and a false state-media label is the worst
  // thing this module can do. Refuse the empty key outright.
  if (!key) return undefined;
  const state = STATE_MEDIA[key];
  return state ? { state } : undefined;
}
