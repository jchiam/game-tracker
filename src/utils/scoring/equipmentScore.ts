/**
 * Shared equipment-scoring core. Owns the three-term weighting, the `-1`
 * insufficient-data sentinel, per-slot main/sub averaging, the sub-score
 * denominator, and the grade scale. The set term is a per-game plugin — the
 * only game-shaped piece — so HSR relics, N2E cartridges, and P5X revelations
 * are all configuration adapters over `createEquipmentScore`.
 */

/** Unified term weights (set + main + sub = 1.0), shared by every game. */
export const SCORE_WEIGHTS = { set: 0.35, main: 0.3, sub: 0.35 } as const;

/** Per-slot match inputs: the slot's best main match and its per-sub best matches. */
export interface SlotScore {
  /** Best main-stat match for the slot in [0, 1]; empty/absent → 0. */
  mainMatch: number;
  /** Best match per equipped sub stat; empty slot → []. Summed, capped at 4, /4 by the core. */
  subMatches: number[];
}

export interface EquipmentScoreConfig<T> {
  /** True when the entity has any preference (set, main, or sub). */
  hasPreferences: (entity: T) => boolean;
  /** True when the entity has any equipped item. */
  hasEquipment: (entity: T) => boolean;
  /** Set/composition term in [0, 1] — the per-game plugin. */
  setTerm: (entity: T) => number;
  /** One entry per game slot (fixed length — empty slots included as zero-contributors). */
  slots: (entity: T) => SlotScore[];
}

/** Builds a scorer returning 0–100, or `-1` when there is no preference or no equipment. */
export function createEquipmentScore<T>(config: EquipmentScoreConfig<T>): (entity: T) => number {
  return (entity: T): number => {
    if (!config.hasPreferences(entity) || !config.hasEquipment(entity)) return -1;

    const slots = config.slots(entity);
    const n = slots.length;
    if (n === 0) return -1;

    const mainSum = slots.reduce((acc, s) => acc + s.mainMatch, 0);
    const subSum = slots.reduce((acc, s) => {
      const total = s.subMatches.reduce((a, b) => a + b, 0);
      return acc + Math.min(4, total) / 4;
    }, 0);

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
