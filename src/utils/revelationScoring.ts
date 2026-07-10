import type { P5xTrackedThief } from '../types';
import { HEAVENS_SLOTS, type RevelationSlot } from '../data/persona-5-phantom-x/revelations';

// N2E-parity term weights. Set (emergent composition) and sub are the heavier terms.
export const SET_WEIGHT = 0.35;
export const MAIN_STAT_WEIGHT = 0.3;
export const SUB_STAT_WEIGHT = 0.35;

// Within the set term: four Heavens cards vs one Space card.
const HEAVENS_SUBWEIGHT = 0.75;
const SPACE_SUBWEIGHT = 0.25;

const ALL_SLOTS: RevelationSlot[] = ['sun', 'moon', 'star', 'sky', 'space'];
const VARIABLE_MAIN_SLOTS = ['moon', 'star', 'sky'] as const;

// Flat stat id → its percent variant. `%` always trumps flat, so a flat
// preference is fully satisfied by the percent stat, but not vice-versa.
const PCT_OF: Record<string, string> = {
  attack: 'attack-pct',
  defense: 'defense-pct',
  hp: 'hp-pct',
};

/**
 * Stat-match score in [0, 1] between a preferred stat id and an equipped stat id.
 * Exact = 1.0; flat-pref satisfied by its percent = 1.0; percent-pref satisfied by
 * its flat = 0.5; cross-crit (rate ↔ mult) = 0.5; otherwise 0. Mirrors the HSR/N2E
 * partial-match shape, adapted to P5X stat ids.
 */
export function getStatMatchScore(preferredStat: string, equippedStat: string): number {
  if (preferredStat === equippedStat) return 1.0;
  // Preferred flat, equipped its percent → 1.0 (% trumps flat)
  if (PCT_OF[preferredStat] === equippedStat) return 1.0;
  // Preferred percent, equipped its flat → 0.5
  if (PCT_OF[equippedStat] === preferredStat) return 0.5;
  // Cross-crit near-miss → 0.5
  if (preferredStat === 'crit-rate' && equippedStat === 'crit-mult') return 0.5;
  if (preferredStat === 'crit-mult' && equippedStat === 'crit-rate') return 0.5;
  return 0.0;
}

/**
 * Overall revelation match score for a Thief, in 0–100, or -1 for insufficient data
 * (no preferences at all, or no cards equipped). Three N2E-parity terms:
 *   set  0.35 — emergent composition: graded Heavens (min(matching,4)/4) + gated Space
 *   main 0.30 — per-slot main match averaged over all five slots (Sun/Space fixed = 1.0)
 *   sub  0.35 — per-slot sub match (best-per-sub, /4) averaged over all five slots
 * Absent preference fields zero their own term (zero-and-cap) rather than voiding the score.
 */
export function calculateRevelationScore(thief: P5xTrackedThief): number {
  const { revelations } = thief;
  const prefs = thief.revelationPreferences;
  const mainPrefs = prefs.mainStats;

  const hasPreferences =
    prefs.heavensSetId != null ||
    prefs.spaceSetId != null ||
    prefs.subStats.length > 0 ||
    VARIABLE_MAIN_SLOTS.some((s) => mainPrefs[s].length > 0);
  if (!hasPreferences) return -1;

  const hasCards = ALL_SLOTS.some((s) => revelations[s] != null);
  if (!hasCards) return -1;

  // --- Set term: whole-hand composition ---
  let heavensMatchCount = 0;
  if (prefs.heavensSetId) {
    for (const slot of HEAVENS_SLOTS) {
      if (revelations[slot]?.setId === prefs.heavensSetId) heavensMatchCount++;
    }
  }
  const heavensMatch = prefs.heavensSetId ? Math.min(heavensMatchCount, 4) / 4 : 0;
  // Guard the preference first so a null pref never scores via null === null.
  const spaceMatch = prefs.spaceSetId && revelations.space?.setId === prefs.spaceSetId ? 1 : 0;
  const setTerm = heavensMatch * HEAVENS_SUBWEIGHT + spaceMatch * SPACE_SUBWEIGHT;

  // --- Main term: averaged over all five slots (empty slot = 0) ---
  let mainSum = 0;
  for (const slot of ALL_SLOTS) {
    const card = revelations[slot];
    if (!card) continue;
    if (slot === 'sun' || slot === 'space') {
      mainSum += 1.0; // fixed mains always match
      continue;
    }
    const chain = mainPrefs[slot as (typeof VARIABLE_MAIN_SLOTS)[number]];
    if (card.mainStat && chain.length > 0) {
      let best = 0;
      for (const pref of chain) {
        const match = getStatMatchScore(pref.stat, card.mainStat);
        if (match > best) best = match;
      }
      mainSum += best;
    }
  }
  const mainTerm = mainSum / ALL_SLOTS.length;

  // --- Sub term: averaged over all five slots (empty slot = 0) ---
  let subSum = 0;
  for (const slot of ALL_SLOTS) {
    const card = revelations[slot];
    if (!card || card.subStats.length === 0 || prefs.subStats.length === 0) continue;
    let total = 0;
    for (const equipped of card.subStats) {
      let best = 0;
      for (const pref of prefs.subStats) {
        const match = getStatMatchScore(pref.stat, equipped);
        if (match > best) best = match;
      }
      total += best;
    }
    subSum += Math.min(4, total) / 4;
  }
  const subTerm = subSum / ALL_SLOTS.length;

  return Math.min(
    100,
    Math.max(
      0,
      (setTerm * SET_WEIGHT + mainTerm * MAIN_STAT_WEIGHT + subTerm * SUB_STAT_WEIGHT) * 100,
    ),
  );
}

/**
 * Map a score to a letter grade. Matches N2E's `getScoreGrade` scale (duplicated pending
 * the cross-game scoring-alignment change). A negative score (insufficient data) → ''.
 */
export function getScoreGrade(score: number): string {
  if (score < 0) return '';
  if (score >= 90) return 'S';
  if (score >= 70) return 'A';
  if (score >= 50) return 'B';
  if (score >= 30) return 'C';
  return 'D';
}
