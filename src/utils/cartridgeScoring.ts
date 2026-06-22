import type { N2ETrackedCharacter } from '../types';

export const CARTRIDGE_ID_WEIGHT = 0.35;
export const MAIN_STAT_WEIGHT = 0.3;
export const SUB_STAT_WEIGHT = 0.35;

const RARITY_ORDER: Record<string, number> = { B: 0, A: 1, S: 2 };
const RARITY_PENALTIES = [1.0, 0.6, 0.3]; // index = rarity delta (0, 1, 2)

function extractBase(cartridgeId: string): string {
  return cartridgeId.replace(/_(?:blue|purple|orange)$/, '');
}

function extractRarity(cartridgeId: string): string {
  if (cartridgeId.endsWith('_orange')) return 'S';
  if (cartridgeId.endsWith('_purple')) return 'A';
  return 'B';
}

export function getCartridgeIdMatchScore(preferredId: string, equippedId: string): number {
  if (extractBase(preferredId) !== extractBase(equippedId)) return 0.0;
  const prefRarityOrder = RARITY_ORDER[extractRarity(preferredId)] ?? 0;
  const equippedRarityOrder = RARITY_ORDER[extractRarity(equippedId)] ?? 0;
  const delta = prefRarityOrder - equippedRarityOrder;
  if (delta <= 0) return 1.0;
  return RARITY_PENALTIES[delta] ?? 0.0;
}

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
  const {
    cartridgePreferences: prefs,
    cartridgeId,
    cartridgeMainStat,
    cartridgeSubStats,
  } = character;

  const hasPrefs =
    prefs && (prefs.cartridgeId != null || prefs.mainStats.length > 0 || prefs.subStats.length > 0);
  if (!hasPrefs) return -1;

  const hasEquipped =
    cartridgeId != null || cartridgeMainStat != null || cartridgeSubStats.length > 0;
  if (!hasEquipped) return -1;

  let idScore = 0;
  if (prefs.cartridgeId && cartridgeId) {
    idScore = getCartridgeIdMatchScore(prefs.cartridgeId, cartridgeId);
  }

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
    Math.max(
      0,
      (idScore * CARTRIDGE_ID_WEIGHT + mainScore * MAIN_STAT_WEIGHT + subScore * SUB_STAT_WEIGHT) *
        100,
    ),
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
