// Unit tests for the shared CZN minted-id seed rule.
import { describe, it, expect } from 'vitest';
import { assertMintedSeedIds, validateArtOverrides } from './czn-seeds.mjs';
import { slugify } from './pipeline.mjs';

describe('assertMintedSeedIds', () => {
  const mint = (name) => slugify(name, '-');
  const label = 'scripts/seeds/czn-partners.json';

  it('returns the seed when every id is the kebab-case slug of its name', () => {
    const seed = [
      { id: 'sig', name: 'Sig' },
      { id: 'mei-lin', name: 'Mei Lin' },
    ];
    expect(assertMintedSeedIds(seed, { label, mint })).toBe(seed);
  });

  it('throws naming the entry and the expected slug on a mismatch', () => {
    const seed = [
      { id: 'sig', name: 'Sig' },
      { id: 'emily', name: 'Emilie' },
    ];
    expect(() => assertMintedSeedIds(seed, { label, mint })).toThrow(
      `${label} entry emily: id must be the kebab-case slug of its name ("emilie")`,
    );
  });

  it('applies to any minted-id seed, not only partners', () => {
    const seed = [{ id: 'sanguine-thorn', name: 'Sanguine Thorn' }];
    expect(assertMintedSeedIds(seed, { label: 'scripts/seeds/czn-fragment-sets.json', mint })).toBe(
      seed,
    );
  });
});

describe('validateArtOverrides', () => {
  const label = 'scripts/seeds/czn-art-overrides.json';
  const portrait = { width: 804, height: 924 };
  const run = (combatants) => validateArtOverrides({ combatants }, { label, portrait });

  it('returns an empty map for an empty seed', () => {
    expect(run([]).size).toBe(0);
  });

  it('maps each id to its charId and face box, dropping the note', () => {
    const overrides = run([
      { id: 'tiphera', charId: '30084', note: 'respelled' },
      { id: 'haru', face: { left: 310, top: 150, side: 190 } },
    ]);
    expect(overrides.get('tiphera')).toEqual({ charId: '30084' });
    expect(overrides.get('haru')).toEqual({ face: { left: 310, top: 150, side: 190 } });
  });

  it('throws when the seed is not { combatants: [] }', () => {
    expect(() => validateArtOverrides([], { label, portrait })).toThrow(
      `${label}: expected { "combatants": [] }`,
    );
  });

  it('throws on an entry without an id', () => {
    expect(() => run([{ charId: '1062' }])).toThrow('combatants[0]: id must be a non-empty string');
  });

  it('throws on a duplicate id', () => {
    expect(() =>
      run([
        { id: 'haru', charId: '1062' },
        { id: 'haru', charId: '1063' },
      ]),
    ).toThrow('combatants[1]: duplicate id "haru"');
  });

  it('throws on an entry that overrides nothing', () => {
    expect(() => run([{ id: 'haru', note: 'todo' }])).toThrow(
      'combatants[0] (haru): needs a charId, a face box, or both',
    );
  });

  it('throws on a charId that is not a string of digits', () => {
    expect(() => run([{ id: 'haru', charId: 1062 }])).toThrow('charId must be a string of digits');
  });

  it('throws on a malformed face box', () => {
    expect(() => run([{ id: 'haru', face: { left: 10, top: 10 } }])).toThrow(
      'face must be { left, top, side } in whole pixels',
    );
    expect(() => run([{ id: 'haru', face: { left: -1, top: 0, side: 10 } }])).toThrow(
      'face must be',
    );
    expect(() => run([{ id: 'haru', face: { left: 0, top: 0, side: 0 } }])).toThrow('face must be');
  });

  it('throws on a face box outside the portrait', () => {
    expect(() => run([{ id: 'haru', face: { left: 700, top: 0, side: 200 } }])).toThrow(
      'face box falls outside the 804×924 portrait',
    );
    expect(() => run([{ id: 'haru', face: { left: 0, top: 800, side: 200 } }])).toThrow(
      'falls outside',
    );
  });
});
