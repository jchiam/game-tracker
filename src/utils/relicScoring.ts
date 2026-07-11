import type { HsrTrackedCharacter } from '../types';
import { createEquipmentScore, makeStatMatcher, type StatShape } from './scoring';

// Within the set term: a 4-piece relic (cavern) set vs a 2-piece planar set.
const RELIC_SUBWEIGHT = 0.67;
const PLANAR_SUBWEIGHT = 0.33;

type Slot = keyof HsrTrackedCharacter['relics'];
const ALL_SLOTS: Slot[] = ['head', 'hands', 'body', 'feet', 'sphere', 'rope'];
const FIXED_MAIN_SLOTS: Slot[] = ['head', 'hands'];
const RELIC_SET_SLOTS: Slot[] = ['head', 'hands', 'body', 'feet'];
const PLANAR_SET_SLOTS: Slot[] = ['sphere', 'rope'];
const VARIABLE_MAIN_SLOTS = ['body', 'feet', 'sphere', 'rope'] as const;

// HSR stat-id vocabulary (display strings) → normalized shape. Only the
// partial-match participants are mapped; everything else falls back to an
// identity shape (isPercent false) so non-participants can only exact-match.
const HSR_STAT_SHAPES: Record<string, StatShape> = {
  HP: { base: 'hp', isPercent: false },
  'HP%': { base: 'hp', isPercent: true },
  ATK: { base: 'atk', isPercent: false },
  'ATK%': { base: 'atk', isPercent: true },
  DEF: { base: 'def', isPercent: false },
  'DEF%': { base: 'def', isPercent: true },
  'CRIT Rate': { base: 'crit-rate', isPercent: false },
  'CRIT DMG': { base: 'crit-mult', isPercent: false },
};

const { getStatMatchScore, bestMatch } = makeStatMatcher(HSR_STAT_SHAPES);
export { getStatMatchScore };

/** Graded count of equipped pieces in `slots` whose set equals `preferredSetId`, over `denom`. */
function familyMatch(
  char: HsrTrackedCharacter,
  slots: Slot[],
  preferredSetId: string | null | undefined,
  denom: number,
): number {
  // Guard the preference first so a null preference never scores against a null equipped set.
  if (!preferredSetId) return 0;
  let count = 0;
  for (const slot of slots) {
    if (char.relics[slot]?.setId === preferredSetId) count++;
  }
  return Math.min(count, denom) / denom;
}

/**
 * Overall relic match score for a character, in 0–100, or -1 for insufficient data.
 * Three unified terms via the shared scoring core:
 *   set  0.35 — two-family composition: relic (4pc, graded /4) + planar (2pc, graded /2)
 *   main 0.30 — per-slot main match averaged over all six slots (head/hands fixed = 1.0)
 *   sub  0.35 — per-slot sub match (best-per-sub, /4) averaged over all six slots
 */
export const calculateRelicScore = createEquipmentScore<HsrTrackedCharacter>({
  hasPreferences: (char) => {
    const bp = char.buildPreferences;
    return (
      bp.relicSetId != null ||
      bp.planarSetId != null ||
      bp.subStats.length > 0 ||
      VARIABLE_MAIN_SLOTS.some((s) => bp.mainStats[s].length > 0)
    );
  },
  hasEquipment: (char) => ALL_SLOTS.some((s) => char.relics[s] != null),
  setTerm: (char) => {
    const relicMatch = familyMatch(char, RELIC_SET_SLOTS, char.buildPreferences.relicSetId, 4);
    const planarMatch = familyMatch(char, PLANAR_SET_SLOTS, char.buildPreferences.planarSetId, 2);
    return relicMatch * RELIC_SUBWEIGHT + planarMatch * PLANAR_SUBWEIGHT;
  },
  slots: (char) => {
    const bp = char.buildPreferences;
    return ALL_SLOTS.map((slot) => {
      const relic = char.relics[slot];
      if (!relic) return { mainMatch: 0, subMatches: [] };

      let mainMatch = 0;
      if (FIXED_MAIN_SLOTS.includes(slot)) {
        mainMatch = 1.0; // fixed mains always match
      } else {
        const chain = bp.mainStats[slot as (typeof VARIABLE_MAIN_SLOTS)[number]];
        if (relic.mainStat && chain.length > 0) mainMatch = bestMatch(chain, relic.mainStat);
      }

      const subMatches =
        bp.subStats.length > 0 && relic.subStats && relic.subStats.length > 0
          ? relic.subStats.map((s) => bestMatch(bp.subStats, s))
          : [];

      return { mainMatch, subMatches };
    });
  },
});

export { getScoreGrade } from './scoring';
