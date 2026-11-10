import { describe, it, expect } from 'vitest';
import { calculateCznBuildScore } from '@/utils/cznBuildScore';
import type { CznTrackedCombatant } from '@/types';

const SPARK = 'spark-of-passion';
const WING = 'black-wing';

// Full 4-PC + 2-PC build with picks and no stat chains — fragment score 100
// (set term full, mains don't-care, subAchievable 0; see fragmentScoring tests).
const perfectFragments: CznTrackedCombatant['fragments'] = {
  1: { setId: SPARK, mainStat: 'Flat ATK', subStats: [] },
  2: { setId: SPARK, mainStat: 'Flat DEF', subStats: [] },
  3: { setId: SPARK, mainStat: 'Flat HP', subStats: [] },
  4: { setId: SPARK, mainStat: 'Critical Chance%', subStats: [] },
  5: { setId: WING, mainStat: 'ATK%', subStats: [] },
  6: { setId: WING, mainStat: 'ATK%', subStats: [] },
};

const emptyFragments: CznTrackedCombatant['fragments'] = {
  1: null,
  2: null,
  3: null,
  4: null,
  5: null,
  6: null,
};

function combatant(overrides: Partial<CznTrackedCombatant>): CznTrackedCombatant {
  return {
    id: 'mei-lin',
    name: 'Mei Lin',
    rarity: 5,
    class: 'Striker',
    element: 'Passion',
    faction: null,
    imageUrl: '/assets/chaos-zero-nightmare/combatants/mei-lin.webp',
    isFavorited: false,
    level: 60,
    ego: 0,
    potentialAttained: false,
    partnerId: null,
    partnerLevel: 1,
    partnerEgo: 0,
    partnerPreferences: [],
    fragments: { ...emptyFragments },
    fragmentPreferences: { mainStats: { 4: [], 5: [], 6: [] }, subStats: [] },
    ...overrides,
  };
}

const perfectFragmentCombatant = (overrides: Partial<CznTrackedCombatant>) =>
  combatant({
    fragments: { ...perfectFragments },
    fragmentPreferences: {
      mainStats: { 4: [], 5: [], 6: [] },
      subStats: [],
      set4Id: SPARK,
      set2Id: WING,
    },
    ...overrides,
  });

describe('calculateCznBuildScore', () => {
  it('blends both active sides at 0.25/0.75', () => {
    const c = perfectFragmentCombatant({
      partnerId: 'scarlet',
      partnerPreferences: ['asteria', 'scarlet'], // equipped ranked #2 → term 0.75
    });
    // 0.25 × 0.75 + 0.75 × 1.0 = 0.9375
    expect(calculateCznBuildScore(c)).toBeCloseTo(93.75);
  });

  it('rank #1 Partner on a perfect fragment build scores 100', () => {
    const c = perfectFragmentCombatant({ partnerId: 'scarlet', partnerPreferences: ['scarlet'] });
    expect(calculateCznBuildScore(c)).toBeCloseTo(100);
  });

  it('empty preference list is don’t-care — fragment score passes through', () => {
    expect(calculateCznBuildScore(perfectFragmentCombatant({}))).toBeCloseTo(100);
  });

  it('Partner side alone when the fragment score is the -1 sentinel', () => {
    const c = combatant({ partnerId: 'scarlet', partnerPreferences: ['asteria', 'scarlet'] });
    expect(calculateCznBuildScore(c)).toBeCloseTo(75);
  });

  it('rank decay floors at 0.25 for deep ranks', () => {
    const c = combatant({
      partnerId: 'zeta',
      partnerPreferences: ['a', 'b', 'c', 'd', 'e', 'zeta'], // rank #6
    });
    expect(calculateCznBuildScore(c)).toBeCloseTo(25);
  });

  it('off-build equipped Partner scores 0 on the Partner side', () => {
    const c = combatant({ partnerId: 'unlisted', partnerPreferences: ['scarlet'] });
    expect(calculateCznBuildScore(c)).toBe(0);
  });

  it('unequipped Partner with preferences scores 0 on the Partner side', () => {
    const c = combatant({ partnerPreferences: ['scarlet'] });
    expect(calculateCznBuildScore(c)).toBe(0);
  });

  it('returns -1 when both sides are inactive', () => {
    expect(calculateCznBuildScore(combatant({}))).toBe(-1);
  });

  it('Partner level and Manifest Ego never affect the score', () => {
    const base = perfectFragmentCombatant({
      partnerId: 'scarlet',
      partnerPreferences: ['scarlet'],
    });
    const leveled = { ...base, partnerLevel: 60, partnerEgo: 4 };
    expect(calculateCznBuildScore(leveled)).toBe(calculateCznBuildScore(base));
  });
});
