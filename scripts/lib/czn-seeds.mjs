// Seed rules shared by every Chaos Zero Nightmare overlay seed whose ids are
// minted from names (Partners, Memory Fragment sets). Combatant ids are
// Prydwen slugs and skip this check.

/**
 * A minted-id seed entry's `id` must be exactly what the script mints from
 * the entry's name, or the entry could never hand off to the fetched one.
 * Throws on the first mismatch, naming the seed and entry; returns the seed
 * unchanged otherwise.
 */
export function assertMintedSeedIds(seed, { label, mint }) {
  for (const entry of seed) {
    const expected = mint(entry.name);
    if (entry.id !== expected) {
      throw new Error(
        `${label} entry ${entry.id}: id must be the kebab-case slug of its name ("${expected}")`,
      );
    }
  }
  return seed;
}
