import type { TrackedCharacter } from '../types';

export const MAIN_STAT_WEIGHT = 0.4;
export const SUB_STAT_WEIGHT = 0.6;
// 6 slots max score = 100%, each slot = 16.666666%
export const SLOT_WEIGHT = 100 / 6;

// Helper to calculate stat match score between 0 and 1
export function getStatMatchScore(preferredStat: string, equippedStat: string): number {
  if (preferredStat === equippedStat) return 1.0;

  // Partial match: preferred % but equipped flat -> 0.5
  if (preferredStat === 'HP%' && equippedStat === 'HP') return 0.5;
  if (preferredStat === 'ATK%' && equippedStat === 'ATK') return 0.5;
  if (preferredStat === 'DEF%' && equippedStat === 'DEF') return 0.5;

  // As per requirement: "Since the % version always trumps the flat version, the reverse will not result in halving of the percentage."
  if (preferredStat === 'HP' && equippedStat === 'HP%') return 1.0;
  if (preferredStat === 'ATK' && equippedStat === 'ATK%') return 1.0;
  if (preferredStat === 'DEF' && equippedStat === 'DEF%') return 1.0;

  // Crit stats opposite match -> 0.5
  if (preferredStat === 'CRIT Rate' && equippedStat === 'CRIT DMG') return 0.5;
  if (preferredStat === 'CRIT DMG' && equippedStat === 'CRIT Rate') return 0.5;

  return 0.0;
}

export function calculateRelicScore(character: TrackedCharacter): number {
  let totalScore = 0;
  const slots: Array<keyof TrackedCharacter['relics']> = [
    'head',
    'hands',
    'body',
    'feet',
    'sphere',
    'rope',
  ];

  for (const slot of slots) {
    const relic = character.relics[slot];
    if (!relic) continue;

    let slotMainMatch = 0;

    if (slot === 'head' || slot === 'hands') {
      slotMainMatch = 1.0; // Fixed stats are always a 100% correct match
    } else {
      // Body, Feet, Sphere, Rope
      const prefs =
        character.buildPreferences.mainStats[
          slot as keyof typeof character.buildPreferences.mainStats
        ] || [];
      if (relic.mainStat) {
        if (prefs.length === 0) {
          slotMainMatch = 0;
        } else {
          // Find the best match score among preferred main stats
          let bestMatch = 0;
          for (const pref of prefs) {
            const matchScore = getStatMatchScore(pref.stat, relic.mainStat);
            if (matchScore > bestMatch) bestMatch = matchScore;
          }
          slotMainMatch = bestMatch;
        }
      }
    }

    let slotSubScore = 0;
    const subPrefs = character.buildPreferences.subStats || [];

    if (subPrefs.length > 0 && relic.subStats && relic.subStats.length > 0) {
      const maxSubScoreMatchable = 4; // up to 4 sub stats per relic
      let currentSubScore = 0;

      for (const equippedSub of relic.subStats) {
        // Find best match among preferred sub stats
        let bestMatch = 0;
        for (const pref of subPrefs) {
          const matchScore = getStatMatchScore(pref.stat, equippedSub.type);
          if (matchScore > bestMatch) {
            bestMatch = matchScore;
          }
        }
        currentSubScore += bestMatch;
      }

      // Calculate fraction of sub stats out of 4
      slotSubScore = Math.min(maxSubScoreMatchable, currentSubScore) / maxSubScoreMatchable; // e.g. 2.5/4
    }

    // Combine main and sub scores to calculate the score for this slot
    const finalSlotScore = slotMainMatch * MAIN_STAT_WEIGHT + slotSubScore * SUB_STAT_WEIGHT;
    totalScore += finalSlotScore * SLOT_WEIGHT;
  }

  // Math.round to 1 decimal place or similar if needed. For now returning float.
  return Math.min(100, Math.max(0, totalScore));
}
