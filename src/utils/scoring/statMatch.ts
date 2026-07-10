/**
 * Game-agnostic stat matching. Each game maps its own stat-id vocabulary
 * (HSR display strings, N2E spaced strings, P5X kebab ids) to a normalized
 * `StatShape`, then the shared matcher compares shapes. The match rules live
 * here once; the vocabularies stay per-game.
 */

/** A stat reduced to a comparable shape: a canonical base + a percent flag. */
export interface StatShape {
  /** Canonical base id (e.g. 'atk', 'hp', 'crit-rate'); non-participating stats keep their raw id. */
  base: string;
  isPercent: boolean;
}

const CRIT_PAIR = new Set(['crit-rate', 'crit-mult']);

function isCrossCrit(a: string, b: string): boolean {
  return a !== b && CRIT_PAIR.has(a) && CRIT_PAIR.has(b);
}

/**
 * Match score in [0, 1] between a preferred and an equipped stat shape:
 *   exact (same base + same percent)                → 1.0
 *   same base, flat preferred, percent equipped     → 1.0 (percent always satisfies flat)
 *   same base, percent preferred, flat equipped     → 0.5
 *   cross-crit (crit-rate ↔ crit-mult)              → 0.5
 *   otherwise                                        → 0.0
 */
export function matchStatShapes(preferred: StatShape, equipped: StatShape): number {
  if (preferred.base === equipped.base) {
    if (preferred.isPercent === equipped.isPercent) return 1.0;
    // Same base, opposite percent flag: percent trumps flat.
    return preferred.isPercent ? 0.5 : 1.0;
  }
  if (isCrossCrit(preferred.base, equipped.base)) return 0.5;
  return 0.0;
}
