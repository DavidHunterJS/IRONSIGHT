import { describe, it, expect } from 'vitest';

import { provenanceOf } from './provenance';

// These labels assert something about real organisations, so the tests that
// matter most are the ones proving what does NOT get labelled.

describe('provenanceOf', () => {
  it('labels an outlet its own government owns', () => {
    expect(provenanceOf('PressTV')?.state).toBe('Iran');
    expect(provenanceOf('Xinhua')?.state).toBe('China');
    expect(provenanceOf('RT')?.state).toBe('Russia');
    expect(provenanceOf('KCNA')?.state).toBe('North Korea');
  });

  it('does not label an independent outlet with a state-adjacent name', () => {
    // The Moscow Times is an exile publication banned in Russia — the opposite
    // of state media. Substring matching on 'Moscow' would tag it.
    expect(provenanceOf('The Moscow Times')).toBeUndefined();
    expect(provenanceOf('Moscow Times')).toBeUndefined();
  });

  it('does not label a private newspaper as state media', () => {
    // Chosun Ilbo is a privately owned South Korean daily. I misfiled it as
    // state media once while sketching this; the dashboard must not.
    expect(provenanceOf('조선일보')).toBeUndefined();
    expect(provenanceOf('Chosun Ilbo')).toBeUndefined();
    expect(provenanceOf('巴士的報')).toBeUndefined();
  });

  it('matches whole names, not fragments', () => {
    // 'Global Times' is Chinese state media; 'Times' is not, and neither are
    // the many outlets containing it.
    expect(provenanceOf('Global Times')?.state).toBe('China');
    expect(provenanceOf('Times')).toBeUndefined();
    expect(provenanceOf('Times of Israel')).toBeUndefined();
    expect(provenanceOf('Japan Times')).toBeUndefined();
    expect(provenanceOf('Taipei Times')).toBeUndefined();
    expect(provenanceOf('New York Times')).toBeUndefined();
  });

  it('ignores articles and case so one outlet is not missed on spelling', () => {
    expect(provenanceOf('the global times')?.state).toBe('China');
    expect(provenanceOf('Press TV')?.state).toBe('Iran');
  });

  it('never matches on an empty key', () => {
    // A masthead written in a non-Latin script reduces to nothing here. Exact
    // matching makes that harmless today, but an empty or whitespace entry
    // slipping into the table later would otherwise tag every such outlet at
    // once — and a false state-media label is the worst thing this can do.
    expect(provenanceOf('조선일보')).toBeUndefined();
    expect(provenanceOf('اسلام تايمز')).toBeUndefined();
    expect(provenanceOf('  ')).toBeUndefined();
    expect(provenanceOf('،')).toBeUndefined();
  });

  it('records nothing for outlets it has never heard of', () => {
    // The common case: 133 of 155 outlets seen live match nothing here, and an
    // absent label means nothing recorded — never a clean bill of health.
    expect(provenanceOf('Ottumwa Courier')).toBeUndefined();
    expect(provenanceOf('38 North')).toBeUndefined();
    expect(provenanceOf('Reuters')).toBeUndefined();
    expect(provenanceOf('BBC')).toBeUndefined();
    expect(provenanceOf('')).toBeUndefined();
  });
});
