// Back-compat remap for N2E cartridge stat labels persisted under the old
// everness.info convention (spaced ` %`, "Bonus" suffix). Applied when loading
// tracked characters so saved builds match the current in-game option labels,
// the scorer vocabulary, and the Target Build readout. New saves already write
// in-game labels, so the legacy set is bounded and shrinks over time.
//
// IMPORTANT: kept in sync with the generation-time map `N2E_STAT_RENAME` in
// `scripts/lib/statOrder.mjs`. `statOrder.test.ts` asserts this map covers every
// pair there, so the two cannot silently diverge.

/** Old everness.info label → in-game display label. Unlisted labels pass through unchanged. */
export const N2E_STAT_RENAME: Record<string, string> = {
  'ATK %': 'ATK%',
  'HP %': 'HP%',
  'DEF %': 'DEF%',
  'CRIT Rate %': 'CRIT Rate',
  'CRIT DMG %': 'CRIT DMG',
  'Cosmos DMG Bonus %': 'Cosmos DMG Bonus',
  'Anima DMG Bonus %': 'Anima DMG Bonus',
  'Incantation DMG Bonus %': 'Incantation DMG Bonus',
  'Psyche DMG Bonus %': 'Psyche DMG Bonus',
  'Chaos DMG Bonus %': 'Chaos DMG Bonus',
  'Lakshana DMG Bonus %': 'Lakshana DMG Bonus',
  'Mental DMG Bonus %': 'Mental DMG Bonus',
  'Universal DMG Bonus %': 'DMG%',
  'Healing Bonus %': 'Healing Bonus',
};

/** Remap a single stat label to its in-game form (identity fallback for already-current labels). */
export function renameN2EStatLabel(label: string): string {
  return N2E_STAT_RENAME[label] ?? label;
}
