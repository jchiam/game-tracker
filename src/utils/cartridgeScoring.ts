import type { N2ETrackedCharacter } from '../types';

export const MAIN_STAT_WEIGHT = 0.4;
export const SUB_STAT_WEIGHT = 0.6;

export function getStatMatchScore(preferredStat: string, equippedStat: string): number {
  if (preferredStat === equippedStat) return 1.0;

  // Partial match: % preferred but flat equipped → 0.5
  if (preferredStat === 'HP %' && equippedStat === 'HP') return 0.5;
  if (preferredStat === 'ATK %' && equippedStat === 'ATK') return 0.5;
  if (preferredStat === 'DEF %' && equippedStat === 'DEF') return 0.5;

  // Flat preferred but % equipped → 1.0 (% always trumps flat)
  if (preferredStat === 'HP' && equippedStat === 'HP %') return 1.0;
  if (preferredStat === 'ATK' && equippedStat === 'ATK %') return 1.0;
  if (preferredStat === 'DEF' && equippedStat === 'DEF %') return 1.0;

  // Cross-crit match → 0.5
  if (preferredStat === 'CRIT Rate %' && equippedStat === 'CRIT DMG %') return 0.5;
  if (preferredStat === 'CRIT DMG %' && equippedStat === 'CRIT Rate %') return 0.5;

  return 0.0;
}

export function calculateCartridgeScore(character: N2ETrackedCharacter): number {
  const { cartridgePreferences: prefs, cartridgeMainStat, cartridgeSubStats } = character;
  if (!prefs || (prefs.mainStats.length === 0 && prefs.subStats.length === 0)) return -1;
  if (!cartridgeMainStat && cartridgeSubStats.length === 0) return -1;

  let mainScore = 0;
  if (cartridgeMainStat && prefs.mainStats.length > 0) {
    let bestMatch = 0;
    for (const pref of prefs.mainStats) {
      const match = getStatMatchScore(pref.stat, cartridgeMainStat);
      if (match > bestMatch) bestMatch = match;
    }
    mainScore = bestMatch;
  }

  let subScore = 0;
  if (prefs.subStats.length > 0 && cartridgeSubStats.length > 0) {
    let totalMatch = 0;
    for (const equipped of cartridgeSubStats) {
      let bestMatch = 0;
      for (const pref of prefs.subStats) {
        const match = getStatMatchScore(pref.stat, equipped);
        if (match > bestMatch) bestMatch = match;
      }
      totalMatch += bestMatch;
    }
    subScore = Math.min(4, totalMatch) / 4;
  }

  return Math.min(
    100,
    Math.max(0, (mainScore * MAIN_STAT_WEIGHT + subScore * SUB_STAT_WEIGHT) * 100),
  );
}

export function getScoreGrade(score: number): string {
  if (score < 0) return '';
  if (score >= 90) return 'S';
  if (score >= 70) return 'A';
  if (score >= 50) return 'B';
  if (score >= 30) return 'C';
  return 'D';
}
