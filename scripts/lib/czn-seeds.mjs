// Seed rules shared by every Chaos Zero Nightmare seed. All overlay ids are
// minted from names (combatants, Partners, Memory Fragment sets); the art
// override seed keys on those ids.

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

const isCount = (n) => Number.isInteger(n) && n >= 0;

/**
 * Validates the combatant art override seed (`{ combatants: [] }`, each entry
 * `{ id, charId?, face?, note? }`) and returns `Map<id, { charId?, face? }>`.
 *
 * `charId` forces which Meta Decks unit supplies a combatant's art; `face`
 * (`{ left, top, side }` in pixels of the untrimmed portrait, whose size is
 * passed as `portrait`) replaces the located face region. A malformed entry, a
 * duplicate id, or a box outside the portrait throws naming the seed and entry.
 */
export function validateArtOverrides(raw, { label, portrait }) {
  const entries = raw?.combatants;
  if (!Array.isArray(entries)) {
    throw new Error(`${label}: expected { "combatants": [] }`);
  }
  const overrides = new Map();
  for (const [index, entry] of entries.entries()) {
    const where = `${label} combatants[${index}]`;
    if (!entry || typeof entry !== 'object' || typeof entry.id !== 'string' || !entry.id) {
      throw new Error(`${where}: id must be a non-empty string`);
    }
    const { id, charId, face } = entry;
    if (overrides.has(id)) throw new Error(`${where}: duplicate id "${id}"`);
    if (charId === undefined && face === undefined) {
      throw new Error(`${where} (${id}): needs a charId, a face box, or both`);
    }
    if (charId !== undefined && (typeof charId !== 'string' || !/^\d+$/.test(charId))) {
      throw new Error(`${where} (${id}): charId must be a string of digits`);
    }
    if (face !== undefined) {
      const ok =
        face &&
        typeof face === 'object' &&
        isCount(face.left) &&
        isCount(face.top) &&
        isCount(face.side) &&
        face.side > 0;
      if (!ok) {
        throw new Error(`${where} (${id}): face must be { left, top, side } in whole pixels`);
      }
      if (face.left + face.side > portrait.width || face.top + face.side > portrait.height) {
        throw new Error(
          `${where} (${id}): face box falls outside the ${portrait.width}×${portrait.height} portrait`,
        );
      }
    }
    overrides.set(id, {
      ...(charId !== undefined && { charId }),
      ...(face !== undefined && { face: { left: face.left, top: face.top, side: face.side } }),
    });
  }
  return overrides;
}
