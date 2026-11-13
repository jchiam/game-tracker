import type { CznTrackedCombatant } from '../types';
import { ALL_CZN_FRAGMENT_SETS } from '@/data/chaos-zero-nightmare/fragment_sets';
import {
  CZN_FRAGMENT_SLOTS,
  CZN_FRAGMENT_SUB_STATS,
  CZN_VARIABLE_MAIN_SLOTS,
  type CznVariableMainSlot,
} from '../data/chaos-zero-nightmare/fragments';
import { achievableSubSum, createEquipmentScore, makeStatMatcher, type StatShape } from './scoring';

// Within the set term each targeted set is worth its share of the six slots.
const TOTAL_SLOTS = CZN_FRAGMENT_SLOTS.length;

const FIXED_MAIN_SLOTS = [1, 2, 3] as const;

// CZN stat vocabulary (display strings from fragments.ts) → normalized shape.
// Only the partial-match participants are mapped; everything else (element
// Damage%, Ego Recovery, Extra Damage%, Damage over Time%) falls back to an
// identity shape so non-participants can only exact-match.
const CZN_STAT_SHAPES: Record<string, StatShape> = {
  'Flat HP': { base: 'hp', isPercent: false },
  'HP%': { base: 'hp', isPercent: true },
  'Flat ATK': { base: 'atk', isPercent: false },
  'ATK%': { base: 'atk', isPercent: true },
  'Flat DEF': { base: 'def', isPercent: false },
  'DEF%': { base: 'def', isPercent: true },
  'Critical Chance%': { base: 'crit-rate', isPercent: false },
  'Critical Damage%': { base: 'crit-mult', isPercent: false },
};

const { getStatMatchScore, bestMatch } = makeStatMatcher(CZN_STAT_SHAPES);
export { getStatMatchScore };

/**
 * Graded target-set composition: Σ min(count_i, pieces_i) / 6 over the
 * targeted sets, so a 4-piece set is worth 4/6 and a 2-piece set 2/6 (the same
 * 0.67 / 0.33 split as a fixed 4+2 model, but 2+2+2 also reaches 1.0). Order
 * is irrelevant. A set is either a 4-piece or a 2-piece set and appears at
 * most once in the composition, so no spill rule is needed (unlike ZZZ suits).
 * Ids missing from the catalog contribute 0.
 */
function setTerm(combatant: CznTrackedCombatant): number {
  const countFor = (setId: string) => {
    let count = 0;
    for (const slot of CZN_FRAGMENT_SLOTS) {
      if (combatant.fragments[slot]?.setId === setId) count++;
    }
    return count;
  };

  let matched = 0;
  for (const setId of combatant.fragmentPreferences.targetSetIds) {
    const pieces = ALL_CZN_FRAGMENT_SETS.find((s) => s.id === setId)?.pieces;
    if (!pieces) continue;
    matched += Math.min(countFor(setId), pieces);
  }
  return matched / TOTAL_SLOTS;
}

/**
 * Overall Memory Fragment match score for a combatant, in 0–100, or -1 for
 * insufficient data. Three unified terms via the shared scoring core:
 *   set  0.35 — target-set composition: Σ min(count_i, pieces_i) / 6
 *   main 0.30 — per-slot main match averaged over all six slots
 *               (slots 1–3 fixed = 1.0; empty chain on an occupied slot = don't-care 1.0)
 *   sub  0.35 — per-slot sub match normalized by the achievable sum (best legal piece,
 *               main-excluded pool, top 4), averaged over all six slots
 */
export const calculateFragmentScore = createEquipmentScore<CznTrackedCombatant>({
  hasPreferences: (combatant) => {
    const bp = combatant.fragmentPreferences;
    return (
      bp.targetSetIds.length > 0 ||
      bp.subStats.length > 0 ||
      CZN_VARIABLE_MAIN_SLOTS.some((s) => bp.mainStats[s].length > 0)
    );
  },
  hasEquipment: (combatant) => CZN_FRAGMENT_SLOTS.some((s) => combatant.fragments[s] != null),
  setTerm,
  slots: (combatant) => {
    const bp = combatant.fragmentPreferences;
    return CZN_FRAGMENT_SLOTS.map((slot) => {
      const piece = combatant.fragments[slot];
      if (!piece) return null;

      let mainMatch: number;
      if ((FIXED_MAIN_SLOTS as readonly number[]).includes(slot)) {
        mainMatch = 1.0; // fixed mains always match
      } else {
        const chain = bp.mainStats[slot as CznVariableMainSlot];
        if (chain.length === 0)
          mainMatch = 1.0; // don't-care: no preference expressed
        else mainMatch = piece.mainStat ? bestMatch(chain, piece.mainStat) : 0;
      }

      const subMatches =
        bp.subStats.length > 0 && piece.subStats.length > 0
          ? piece.subStats.map((s) => bestMatch(bp.subStats, s))
          : [];
      const subAchievable = achievableSubSum(
        bestMatch,
        CZN_FRAGMENT_SUB_STATS,
        piece.mainStat ? [piece.mainStat] : [],
        bp.subStats,
      );

      return { mainMatch, subMatches, subAchievable };
    });
  },
});

export { getScoreGrade } from './scoring';
