import type { N2ETrackedCharacter } from '../types';
import { CARTRIDGE_SUB_STATS } from '../data/neverness-to-everness/cartridge-stats';
import { achievableSubSum, createEquipmentScore, makeStatMatcher, type StatShape } from './scoring';

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

// N2E stat-id vocabulary → normalized shape. Only the eight partial-match
// participants are mapped; everything else falls back to an identity shape
// (isPercent false) so non-participants can only exact-match.
const N2E_STAT_SHAPES: Record<string, StatShape> = {
  HP: { base: 'hp', isPercent: false },
  'HP%': { base: 'hp', isPercent: true },
  ATK: { base: 'atk', isPercent: false },
  'ATK%': { base: 'atk', isPercent: true },
  DEF: { base: 'def', isPercent: false },
  'DEF%': { base: 'def', isPercent: true },
  'CRIT Rate': { base: 'crit-rate', isPercent: true },
  'CRIT DMG': { base: 'crit-mult', isPercent: true },
};

const { getStatMatchScore, bestMatch } = makeStatMatcher(N2E_STAT_SHAPES);
export { getStatMatchScore };

export const calculateCartridgeScore = createEquipmentScore<N2ETrackedCharacter>({
  hasPreferences: (c) => {
    const p = c.cartridgePreferences;
    return Boolean(p && (p.cartridgeId != null || p.mainStats.length > 0 || p.subStats.length > 0));
  },
  hasEquipment: (c) =>
    c.cartridgeId != null || c.cartridgeMainStat != null || c.cartridgeSubStats.length > 0,
  setTerm: (c) => {
    const p = c.cartridgePreferences;
    return p?.cartridgeId && c.cartridgeId
      ? getCartridgeIdMatchScore(p.cartridgeId, c.cartridgeId)
      : 0;
  },
  // N2E is a single-cartridge game: one pseudo-slot.
  slots: (c) => {
    const occupied =
      c.cartridgeId != null || c.cartridgeMainStat != null || c.cartridgeSubStats.length > 0;
    if (!occupied) return [null];

    const p = c.cartridgePreferences;
    let mainMatch: number;
    if (p.mainStats.length === 0)
      mainMatch = 1.0; // don't-care: no preference expressed
    else mainMatch = c.cartridgeMainStat ? bestMatch(p.mainStats, c.cartridgeMainStat) : 0;

    const subMatches =
      p.subStats.length > 0 && c.cartridgeSubStats.length > 0
        ? c.cartridgeSubStats.map((s) => bestMatch(p.subStats, s))
        : [];
    const subAchievable = achievableSubSum(
      bestMatch,
      CARTRIDGE_SUB_STATS,
      c.cartridgeMainStat ? [c.cartridgeMainStat] : [],
      p.subStats,
    );

    return [{ mainMatch, subMatches, subAchievable }];
  },
});

export { getScoreGrade } from './scoring';
