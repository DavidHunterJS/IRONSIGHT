import { describe, it, expect } from 'vitest';

import { selectRows } from './rowLimit';

// Rows arrive newest first, as the news route sorts them. Each is labelled by
// its source and its position, so a failure says which row went missing.
const rows = (spec: Array<[string, number]>) =>
  spec.flatMap(([source, n]) => Array.from({ length: n }, (_, i) => ({ source, id: `${source}${i + 1}` })));

const ids = (r: Array<{ id: string }>) => r.map(x => x.id);

describe('selectRows', () => {
  it('returns everything, in order, when there is room', () => {
    const r = rows([['Walla', 3], ['BBC', 2]]);
    expect(ids(selectRows(r, { cap: 10, perSource: 3 }))).toEqual(ids(r));
  });

  it('gives a slow source its newest rows even when fast ones would fill the cap', () => {
    // iran-israel on 2026-09-10: by recency alone the 100 rows went to the
    // fastest publishers and BBC, DoD, PressTV and Long War Journal got none.
    const r = rows([['Walla', 6], ['Haaretz', 6], ['BBC', 3]]); // BBC's rows are the oldest
    const out = ids(selectRows(r, { cap: 8, perSource: 2 }));
    expect(out).toContain('BBC1');
    expect(out).toContain('BBC2');
    expect(out).not.toContain('BBC3');
    expect(out).toHaveLength(8);
  });

  it('fills the remaining room by recency and keeps the original order', () => {
    const r = rows([['Walla', 6], ['Haaretz', 6], ['BBC', 3]]);
    // Guaranteed: Walla1-2, Haaretz1-2, BBC1-2. Two slots left go to the next
    // newest rows, Walla3 and Walla4, not to BBC3.
    expect(ids(selectRows(r, { cap: 8, perSource: 2 }))).toEqual(
      ['Walla1', 'Walla2', 'Walla3', 'Walla4', 'Haaretz1', 'Haaretz2', 'BBC1', 'BBC2'],
    );
  });

  it('lets the newest guaranteed rows win when the guarantees alone exceed the cap', () => {
    // Four sources guaranteed two rows each is eight rows; with room for six,
    // the oldest source's guarantee is the one that gives way.
    const r = rows([['A', 2], ['B', 2], ['C', 2], ['D', 2]]);
    expect(ids(selectRows(r, { cap: 6, perSource: 2 }))).toEqual(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']);
  });

  it('never returns more than the cap', () => {
    const r = rows([['Walla', 50], ['Haaretz', 50], ['BBC', 50]]);
    expect(selectRows(r, { cap: 100, perSource: 3 })).toHaveLength(100);
  });
});
