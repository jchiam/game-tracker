// Semantic stat ordering for generated stat pools (N2E cartridge stats).
// Order is Offensive → Defensive → Tempo → Supporting (flat before its percent).
// See the openspec spec `shared-ui-components` "Semantic stat-option ordering".
// A stat absent from the ordered list sorts to the end (surfacing it) rather than
// being classified — an explicit list, never keyword inference.

/**
 * everness.info API stat labels → in-game display labels. The API uses a fan-DB
 * convention (spaced ` %`, a "Bonus" suffix on every DMG stat); the game shows a
 * tight `%` only on the flat-stat percentages and drops the trailing `%` from
 * everything else. Not a uniform transform, so it is an explicit map. Labels
 * absent from the map pass through unchanged.
 *
 * IMPORTANT: kept in sync with the runtime back-compat map
 * `N2E_STAT_RENAME` in `src/data/neverness-to-everness/statLabelRename.ts`.
 * `statOrder.test.ts` asserts the TS map covers every pair here.
 */
export const N2E_STAT_RENAME = {
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

/** N2E stat labels (in-game display form) in semantic order. */
export const N2E_STAT_ORDER = [
  // Offensive
  'ATK',
  'ATK%',
  'CRIT Rate',
  'CRIT DMG',
  'DMG%',
  'Cosmos DMG Bonus',
  'Anima DMG Bonus',
  'Incantation DMG Bonus',
  'Psyche DMG Bonus',
  'Chaos DMG Bonus',
  'Lakshana DMG Bonus',
  'Mental DMG Bonus',
  'Break Intensity',
  // Defensive
  'HP',
  'HP%',
  'DEF',
  'DEF%',
  // Tempo
  'Cycle Intensity',
  // Supporting
  'Healing Bonus',
];

/** Labels present in `labels` but absent from `orderList` (would sort to the end). */
export function unlistedStats(labels, orderList) {
  return labels.filter((s) => !orderList.includes(s));
}

/**
 * Order `labels` by their index in `orderList` (stable within a rank). Any label not in
 * `orderList` sorts to the end, so a newly-added stat surfaces for manual placement instead
 * of being silently mis-bucketed.
 */
export function orderByList(labels, orderList) {
  const rank = (s) => {
    const i = orderList.indexOf(s);
    return i === -1 ? Number.POSITIVE_INFINITY : i;
  };
  return [...labels].sort((a, b) => rank(a) - rank(b));
}

/**
 * Order N2E stat labels semantically, warning about any unlisted (appended) stat.
 * Raw API labels are first renamed to their in-game form via `N2E_STAT_RENAME`
 * (identity fallback) so the generated file carries in-game labels.
 */
export function orderN2eStats(labels) {
  const renamed = labels.map((s) => N2E_STAT_RENAME[s] ?? s);
  const unlisted = unlistedStats(renamed, N2E_STAT_ORDER);
  if (unlisted.length > 0) {
    console.warn(
      `  ⚠ stats not in N2E_STAT_ORDER (appended at end — place them): ${unlisted.join(', ')}`,
    );
  }
  return orderByList(renamed, N2E_STAT_ORDER);
}
