import type { ZzzTrackedAgent } from '../types';
import { calculateDiscScore } from './discScoring';

// Blend weights when both sides are active; a lone active side takes the
// whole score (active-side renormalization — see zzz-build-scoring spec).
const ENGINE_WEIGHT = 0.25;
const DISC_WEIGHT = 0.75;

// Fixed-step rank decay: #1 → 1.0, each rank down −0.25, floored so any
// listed engine stays strictly above off-build (0). Length-independent.
const RANK_STEP = 0.25;
const RANK_FLOOR = 0.25;

/** Engine term in [0, 1]: preference-rank match of the equipped W-Engine. */
function engineTerm(agent: ZzzTrackedAgent): number {
  if (!agent.wEngineId) return 0;
  const rank = agent.wEnginePreferences.indexOf(agent.wEngineId);
  if (rank === -1) return 0; // off-build
  return Math.max(1 - RANK_STEP * rank, RANK_FLOOR);
}

/**
 * Overall ZZZ build score in 0–100, or -1 for insufficient data: the disc
 * score (unchanged, see discScoring) blended with the W-Engine
 * preference-rank term. An empty engine preference list is don't-care (disc
 * side alone); a -1 disc score drops the disc side (engine side alone);
 * -1 only when both sides are inactive. Engine level and Phase are
 * display-only and never affect the score.
 */
export function calculateZzzBuildScore(agent: ZzzTrackedAgent): number {
  const discScore = calculateDiscScore(agent);
  const engineActive = agent.wEnginePreferences.length > 0;
  const discActive = discScore !== -1;

  if (engineActive && discActive)
    return (ENGINE_WEIGHT * engineTerm(agent) + DISC_WEIGHT * (discScore / 100)) * 100;
  if (engineActive) return engineTerm(agent) * 100;
  if (discActive) return discScore;
  return -1;
}

export { getScoreGrade } from './scoring';
