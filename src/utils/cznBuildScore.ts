import type { CznTrackedCombatant } from '../types';
import { calculateFragmentScore } from './fragmentScoring';

// Blend weights when both sides are active; a lone active side takes the
// whole score (active-side renormalization — see czn-build-scoring spec).
const PARTNER_WEIGHT = 0.25;
const FRAGMENT_WEIGHT = 0.75;

// Fixed-step rank decay: #1 → 1.0, each rank down −0.25, floored so any
// listed Partner stays strictly above off-build (0). Length-independent.
const RANK_STEP = 0.25;
const RANK_FLOOR = 0.25;

/** Partner term in [0, 1]: preference-rank match of the equipped Partner. */
function partnerTerm(combatant: CznTrackedCombatant): number {
  if (!combatant.partnerId) return 0;
  const rank = combatant.partnerPreferences.indexOf(combatant.partnerId);
  if (rank === -1) return 0; // off-build
  return Math.max(1 - RANK_STEP * rank, RANK_FLOOR);
}

/**
 * Overall CZN build score in 0–100, or -1 for insufficient data: the fragment
 * score (unchanged, see fragmentScoring) blended with the Partner
 * preference-rank term. An empty Partner preference list is don't-care
 * (fragment side alone); a -1 fragment score drops the fragment side (Partner
 * side alone); -1 only when both sides are inactive. Partner level and
 * Manifest Ego are display-only and never affect the score.
 */
export function calculateCznBuildScore(combatant: CznTrackedCombatant): number {
  const fragmentScore = calculateFragmentScore(combatant);
  const partnerActive = combatant.partnerPreferences.length > 0;
  const fragmentActive = fragmentScore !== -1;

  if (partnerActive && fragmentActive)
    return (
      (PARTNER_WEIGHT * partnerTerm(combatant) + FRAGMENT_WEIGHT * (fragmentScore / 100)) * 100
    );
  if (partnerActive) return partnerTerm(combatant) * 100;
  if (fragmentActive) return fragmentScore;
  return -1;
}

export { getScoreGrade } from './scoring';
