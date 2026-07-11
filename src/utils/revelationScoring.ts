import type { P5xTrackedThief } from '../types';
import { HEAVENS_SLOTS, type RevelationSlot } from '../data/persona-5-phantom-x/revelations';
import { createEquipmentScore, makeStatMatcher, type StatShape } from './scoring';

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
 *   main 0.30 — per-slot main match averaged over all five slots (Sun/Space fixed = 1.0)
 *   sub  0.35 — per-slot sub match (best-per-sub, /4) averaged over all five slots
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
      if (!card) return { mainMatch: 0, subMatches: [] };

      let mainMatch = 0;
      if (slot === 'sun' || slot === 'space') {
        mainMatch = 1.0; // fixed mains always match
      } else {
        const chain = prefs.mainStats[slot as (typeof VARIABLE_MAIN_SLOTS)[number]];
        if (card.mainStat && chain.length > 0) mainMatch = bestMatch(chain, card.mainStat);
      }

      const subMatches =
        card.subStats.length > 0 && prefs.subStats.length > 0
          ? card.subStats.map((s) => bestMatch(prefs.subStats, s))
          : [];

      return { mainMatch, subMatches };
    });
  },
});

export { getScoreGrade } from './scoring';
