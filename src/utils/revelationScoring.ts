import type { P5xTrackedThief } from '../types';
import {
  HEAVENS_SLOTS,
  MAIN_STATS,
  SUB_STATS,
  type RevelationSlot,
} from '../data/persona-5-phantom-x/revelations';
import { achievableSubSum, createEquipmentScore, makeStatMatcher, type StatShape } from './scoring';

// Within the set term: four Heavens cards vs one Space card.
const HEAVENS_SUBWEIGHT = 0.75;
const SPACE_SUBWEIGHT = 0.25;

const ALL_SLOTS: RevelationSlot[] = ['sun', 'moon', 'star', 'sky', 'space'];
const VARIABLE_MAIN_SLOTS = ['moon', 'star', 'sky'] as const;

// P5X stat-id vocabulary → normalized shape. Only the partial-match
// participants are mapped; everything else falls back to an identity shape
// (isPercent false) so non-participants can only exact-match.
const P5X_STAT_SHAPES: Record<string, StatShape> = {
  attack: { base: 'atk', isPercent: false },
  'attack-pct': { base: 'atk', isPercent: true },
  defense: { base: 'def', isPercent: false },
  'defense-pct': { base: 'def', isPercent: true },
  hp: { base: 'hp', isPercent: false },
  'hp-pct': { base: 'hp', isPercent: true },
  'crit-rate': { base: 'crit-rate', isPercent: false },
  'crit-mult': { base: 'crit-mult', isPercent: false },
};

const { getStatMatchScore, bestMatch } = makeStatMatcher(P5X_STAT_SHAPES);
export { getStatMatchScore };

function setTerm(thief: P5xTrackedThief): number {
  const { revelations } = thief;
  const prefs = thief.revelationPreferences;

  let heavensMatchCount = 0;
  if (prefs.heavensSetId) {
    for (const slot of HEAVENS_SLOTS) {
      if (revelations[slot]?.setId === prefs.heavensSetId) heavensMatchCount++;
    }
  }
  const heavensMatch = prefs.heavensSetId ? Math.min(heavensMatchCount, 4) / 4 : 0;
  // Guard the preference first so a null pref never scores via null === null.
  const spaceMatch = prefs.spaceSetId && revelations.space?.setId === prefs.spaceSetId ? 1 : 0;
  return heavensMatch * HEAVENS_SUBWEIGHT + spaceMatch * SPACE_SUBWEIGHT;
}

/**
 * Overall revelation match score for a Thief, in 0–100, or -1 for insufficient data.
 * Three N2E-parity terms via the shared scoring core:
 *   set  0.35 — emergent composition: graded Heavens (min(matching,4)/4) + gated Space
 *   main 0.30 — per-slot main match averaged over all five slots (Sun/Space fixed = 1.0;
 *               empty chain on an occupied slot = don't-care 1.0)
 *   sub  0.35 — per-slot sub match normalized by the achievable sum (best legal card,
 *               occupied-main-excluded pool incl. Space's dual fixed mains, top 4),
 *               averaged over all five slots
 */
export const calculateRevelationScore = createEquipmentScore<P5xTrackedThief>({
  hasPreferences: (thief) => {
    const prefs = thief.revelationPreferences;
    return (
      prefs.heavensSetId != null ||
      prefs.spaceSetId != null ||
      prefs.subStats.length > 0 ||
      VARIABLE_MAIN_SLOTS.some((s) => prefs.mainStats[s].length > 0)
    );
  },
  hasEquipment: (thief) => ALL_SLOTS.some((s) => thief.revelations[s] != null),
  setTerm,
  slots: (thief) => {
    const { revelations } = thief;
    const prefs = thief.revelationPreferences;
    return ALL_SLOTS.map((slot) => {
      const card = revelations[slot];
      if (!card) return null;

      const isFixed = slot === 'sun' || slot === 'space';
      let mainMatch: number;
      if (isFixed) {
        mainMatch = 1.0; // fixed mains always match
      } else {
        const chain = prefs.mainStats[slot as (typeof VARIABLE_MAIN_SLOTS)[number]];
        if (chain.length === 0)
          mainMatch = 1.0; // don't-care: no preference expressed
        else mainMatch = card.mainStat ? bestMatch(chain, card.mainStat) : 0;
      }

      const subMatches =
        card.subStats.length > 0 && prefs.subStats.length > 0
          ? card.subStats.map((s) => bestMatch(prefs.subStats, s))
          : [];
      // Space's dual fixed mains (attack + defense) are derived, not stored — take
      // fixed-slot exclusions from the catalog, variable-slot ones from the card.
      const occupiedMains = isFixed
        ? MAIN_STATS[slot.toUpperCase() as Uppercase<RevelationSlot>]
        : card.mainStat
          ? [card.mainStat]
          : [];
      const subAchievable = achievableSubSum(bestMatch, SUB_STATS, occupiedMains, prefs.subStats);

      return { mainMatch, subMatches, subAchievable };
    });
  },
});

export { getScoreGrade } from './scoring';
