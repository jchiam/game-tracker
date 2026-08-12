import type { HsrTrackedCharacter } from '../types';
import { calculateRelicScore } from './relicScoring';

// Blend weights when both sides are active; a lone active side takes the
// whole score (active-side renormalization — see hsr-build-scoring spec).
const CONE_WEIGHT = 0.25;
const RELIC_WEIGHT = 0.75;

// Fixed-step rank decay: #1 → 1.0, each rank down −0.25, floored so any
// listed cone stays strictly above off-build (0). Length-independent.
const RANK_STEP = 0.25;
const RANK_FLOOR = 0.25;

/** Cone term in [0, 1]: preference-rank match of the equipped Light Cone. */
function coneTerm(char: HsrTrackedCharacter): number {
  if (!char.lightConeId) return 0;
  const rank = char.lightConePreferences.indexOf(char.lightConeId);
  if (rank === -1) return 0; // off-build
  return Math.max(1 - RANK_STEP * rank, RANK_FLOOR);
}

/**
 * Overall HSR build score in 0–100, or -1 for insufficient data: the relic
 * score (unchanged, see relicScoring) blended with the Light Cone
 * preference-rank term. An empty cone preference list is don't-care (relic
 * side alone); a -1 relic score drops the relic side (cone side alone);
 * -1 only when both sides are inactive. Cone level and superimposition are
 * display-only and never affect the score.
 */
export function calculateBuildScore(char: HsrTrackedCharacter): number {
  const relicScore = calculateRelicScore(char);
  const coneActive = char.lightConePreferences.length > 0;
  const relicActive = relicScore !== -1;

  if (coneActive && relicActive)
    return (CONE_WEIGHT * coneTerm(char) + RELIC_WEIGHT * (relicScore / 100)) * 100;
  if (coneActive) return coneTerm(char) * 100;
  if (relicActive) return relicScore;
  return -1;
}

export { getScoreGrade } from './scoring';
