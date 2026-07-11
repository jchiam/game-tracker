/**
 * Shared equipment-scoring core. Owns the three-term weighting, the `-1`
 * insufficient-data sentinel, per-slot main/sub averaging, the achievable-sum
 * sub normalization, and the grade scale. The set term is a per-game plugin —
 * the only game-shaped piece — so HSR relics, N2E cartridges, and P5X
 * revelations are all configuration adapters over `createEquipmentScore`.
 */

/** Unified term weights (set + main + sub = 1.0), shared by every game. */
export const SCORE_WEIGHTS = { set: 0.35, main: 0.3, sub: 0.35 } as const;

/** Per-slot match inputs for an occupied slot; an empty slot is `null`. */
export interface SlotScore {
  /**
   * Best main-stat match in [0, 1], adapter-resolved: 1.0 for a fixed main,
   * 1.0 for an empty preference chain (don't-care), best chain match against
   * the equipped main, 0 when the chain is set but no main is entered.
   */
  mainMatch: number;
  /** Best match per equipped sub stat. */
  subMatches: number[];
  /**
   * What a perfect legal item's subs would sum to (see `achievableSubSum`).
   * `0` means don't-care/vacuous — the core scores the slot's sub 1.0.
   */
  subAchievable: number;
}

export interface EquipmentScoreConfig<T> {
  /** True when the entity has any preference (set, main, or sub). */
  hasPreferences: (entity: T) => boolean;
  /** True when the entity has any equipped item. */
  hasEquipment: (entity: T) => boolean;
  /** Set/composition term in [0, 1] — the per-game plugin. */
  setTerm: (entity: T) => number;
  /** One entry per game slot (fixed length — an empty slot is `null` and dilutes both terms). */
  slots: (entity: T) => (SlotScore | null)[];
}

/**
 * The sub sum a perfect *legal* item would achieve: the substat pool minus the
 * slot's occupied main stat(s), each distinct remaining stat scored via
 * `bestMatch` against the sub-preference chain, top 4 match scores summed.
 * Returns 0 for an empty chain (don't-care — collapses into the
 * `subAchievable: 0` convention on `SlotScore`).
 */
export function achievableSubSum(
  bestMatch: (prefs: { stat: string }[], equipped: string) => number,
  pool: readonly string[],
  excludedStats: readonly string[],
  chain: { stat: string }[],
): number {
  if (chain.length === 0) return 0;
  return [...new Set(pool)]
    .filter((stat) => !excludedStats.includes(stat))
    .map((stat) => bestMatch(chain, stat))
    .sort((a, b) => b - a)
    .slice(0, 4)
    .reduce((a, b) => a + b, 0);
}

/** Builds a scorer returning 0–100, or `-1` when there is no preference or no equipment. */
export function createEquipmentScore<T>(config: EquipmentScoreConfig<T>): (entity: T) => number {
  return (entity: T): number => {
    if (!config.hasPreferences(entity) || !config.hasEquipment(entity)) return -1;

    const slots = config.slots(entity);
    const n = slots.length;
    if (n === 0) return -1;

    let mainSum = 0;
    let subSum = 0;
    for (const s of slots) {
      if (!s) continue; // empty slot: 0 for both terms
      mainSum += s.mainMatch;
      if (s.subAchievable <= 0) {
        // Don't-care (empty sub chain) or vacuous (nothing achievable):
        // a perfect legal item does no better, so the slot is at its optimum.
        subSum += 1;
      } else {
        const total = s.subMatches.reduce((a, b) => a + b, 0);
        subSum += Math.min(total, s.subAchievable) / s.subAchievable;
      }
    }

    const mainTerm = mainSum / n;
    const subTerm = subSum / n;
    const setTerm = config.setTerm(entity);

    const raw =
      (setTerm * SCORE_WEIGHTS.set + mainTerm * SCORE_WEIGHTS.main + subTerm * SCORE_WEIGHTS.sub) *
      100;
    return Math.min(100, Math.max(0, raw));
  };
}

export type Grade = 'S' | 'A' | 'B' | 'C' | 'D' | '';

/** Single grade scale for all games: S≥90, A≥70, B≥50, C≥30, else D; negative → ''. */
export function getScoreGrade(score: number): Grade {
  if (score < 0) return '';
  if (score >= 90) return 'S';
  if (score >= 70) return 'A';
  if (score >= 50) return 'B';
  if (score >= 30) return 'C';
  return 'D';
}
