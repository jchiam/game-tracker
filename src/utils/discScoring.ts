import type { ZzzTrackedAgent } from '../types';
import {
  ZZZ_DISC_SLOTS,
  ZZZ_DISC_SUB_STATS,
  ZZZ_VARIABLE_MAIN_SLOTS,
  type ZzzVariableMainSlot,
} from '../data/zenless-zone-zero/discs';
import { achievableSubSum, createEquipmentScore, makeStatMatcher, type StatShape } from './scoring';

// Within the set term: the 4-piece suit pick vs the 2-piece suit pick.
const SUIT4_SUBWEIGHT = 0.67;
const SUIT2_SUBWEIGHT = 0.33;

const FIXED_MAIN_SLOTS = [1, 2, 3] as const;

// ZZZ stat-id vocabulary (display strings) → normalized shape. Only the
// partial-match participants are mapped; everything else (element DMG bonuses,
// Impact, Energy Regen, Anomaly Mastery, PEN Ratio-only mains) falls back to
// an identity shape so non-participants can only exact-match.
const ZZZ_STAT_SHAPES: Record<string, StatShape> = {
  HP: { base: 'hp', isPercent: false },
  'HP%': { base: 'hp', isPercent: true },
  ATK: { base: 'atk', isPercent: false },
  'ATK%': { base: 'atk', isPercent: true },
  DEF: { base: 'def', isPercent: false },
  'DEF%': { base: 'def', isPercent: true },
  PEN: { base: 'pen', isPercent: false },
  'PEN Ratio': { base: 'pen', isPercent: true },
  'CRIT Rate': { base: 'crit-rate', isPercent: false },
  'CRIT DMG': { base: 'crit-mult', isPercent: false },
};

const { getStatMatchScore, bestMatch } = makeStatMatcher(ZZZ_STAT_SHAPES);
export { getStatMatchScore };

/**
 * Graded suit composition: pieces matching the 4pc pick over /4, pieces
 * matching the 2pc pick over /2. When both picks are the same suit, pieces
 * beyond the first four spill into the 2pc count instead of double-counting —
 * six pieces of one targeted suit score a full set term.
 */
function suitTerm(agent: ZzzTrackedAgent): number {
  const { discSuit4Id, discSuit2Id } = agent.buildPreferences;
  const countFor = (suitId: string | null | undefined) => {
    if (!suitId) return 0;
    let count = 0;
    for (const slot of ZZZ_DISC_SLOTS) {
      if (agent.discs[slot]?.suitId === suitId) count++;
    }
    return count;
  };

  const count4 = discSuit4Id ? Math.min(countFor(discSuit4Id), 4) : 0;
  let count2: number;
  if (!discSuit2Id) {
    count2 = 0;
  } else if (discSuit2Id === discSuit4Id) {
    count2 = Math.min(Math.max(countFor(discSuit2Id) - 4, 0), 2);
  } else {
    count2 = Math.min(countFor(discSuit2Id), 2);
  }

  return (count4 / 4) * SUIT4_SUBWEIGHT + (count2 / 2) * SUIT2_SUBWEIGHT;
}

/**
 * Overall Drive Disc match score for an agent, in 0–100, or -1 for
 * insufficient data. Three unified terms via the shared scoring core:
 *   set  0.35 — suit composition: 4pc pick (graded /4) + 2pc pick (graded /2)
 *   main 0.30 — per-slot main match averaged over all six slots
 *               (slots 1–3 fixed = 1.0; empty chain on an occupied slot = don't-care 1.0)
 *   sub  0.35 — per-slot sub match normalized by the achievable sum (best legal disc,
 *               main-excluded pool, top 4), averaged over all six slots
 */
export const calculateDiscScore = createEquipmentScore<ZzzTrackedAgent>({
  hasPreferences: (agent) => {
    const bp = agent.buildPreferences;
    return (
      bp.discSuit4Id != null ||
      bp.discSuit2Id != null ||
      bp.subStats.length > 0 ||
      ZZZ_VARIABLE_MAIN_SLOTS.some((s) => bp.mainStats[s].length > 0)
    );
  },
  hasEquipment: (agent) => ZZZ_DISC_SLOTS.some((s) => agent.discs[s] != null),
  setTerm: suitTerm,
  slots: (agent) => {
    const bp = agent.buildPreferences;
    return ZZZ_DISC_SLOTS.map((slot) => {
      const disc = agent.discs[slot];
      if (!disc) return null;

      let mainMatch: number;
      if ((FIXED_MAIN_SLOTS as readonly number[]).includes(slot)) {
        mainMatch = 1.0; // fixed mains always match
      } else {
        const chain = bp.mainStats[slot as ZzzVariableMainSlot];
        if (chain.length === 0)
          mainMatch = 1.0; // don't-care: no preference expressed
        else mainMatch = disc.mainStat ? bestMatch(chain, disc.mainStat) : 0;
      }

      const subMatches =
        bp.subStats.length > 0 && disc.subStats.length > 0
          ? disc.subStats.map((s) => bestMatch(bp.subStats, s))
          : [];
      const subAchievable = achievableSubSum(
        bestMatch,
        ZZZ_DISC_SUB_STATS,
        disc.mainStat ? [disc.mainStat] : [],
        bp.subStats,
      );

      return { mainMatch, subMatches, subAchievable };
    });
  },
});

export { getScoreGrade } from './scoring';
