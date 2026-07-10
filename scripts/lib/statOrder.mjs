// Semantic stat ordering for generated stat pools (N2E cartridge stats).
// Order is Offensive → Defensive → Tempo → Supporting (flat before its percent).
// See the openspec spec `shared-ui-components` "Semantic stat-option ordering".
// A stat absent from the ordered list sorts to the end (surfacing it) rather than
// being classified — an explicit list, never keyword inference.

/** N2E stat labels in semantic order. */
export const N2E_STAT_ORDER = [
  // Offensive
  'ATK',
  'ATK %',
  'CRIT Rate %',
  'CRIT DMG %',
  'Universal DMG Bonus %',
  'Cosmos DMG Bonus %',
  'Anima DMG Bonus %',
  'Incantation DMG Bonus %',
  'Psyche DMG Bonus %',
  'Chaos DMG Bonus %',
  'Lakshana DMG Bonus %',
  'Mental DMG Bonus %',
  'Break Intensity',
  // Defensive
  'HP',
  'HP %',
  'DEF',
  'DEF %',
  // Tempo
  'Cycle Intensity',
  // Supporting
  'Healing Bonus %',
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

/** Order N2E stat labels semantically, warning about any unlisted (appended) stat. */
export function orderN2eStats(labels) {
  const unlisted = unlistedStats(labels, N2E_STAT_ORDER);
  if (unlisted.length > 0) {
    console.warn(
      `  ⚠ stats not in N2E_STAT_ORDER (appended at end — place them): ${unlisted.join(', ')}`,
    );
  }
  return orderByList(labels, N2E_STAT_ORDER);
}
