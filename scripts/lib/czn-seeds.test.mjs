// Unit tests for the shared CZN minted-id seed rule.
import { describe, it, expect } from 'vitest';
import { assertMintedSeedIds } from './czn-seeds.mjs';
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
