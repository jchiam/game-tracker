import { describe, it, expect } from 'vitest';
import { calculateDiscScore, getStatMatchScore } from '@/utils/discScoring';
import type { ZzzDiscBuildPreferences, ZzzTrackedAgent } from '@/types';
import type { ZzzEquippedDisc } from '@/data/zenless-zone-zero/discs';

const emptyPrefs: ZzzDiscBuildPreferences = {
  mainStats: { 4: [], 5: [], 6: [] },
  subStats: [],
  discSuit4Id: null,
  discSuit2Id: null,
  comments: '',
};

function chain(...stats: string[]) {
  return stats.map((stat, orderIndex) => ({ stat, operator: null, orderIndex }));
}

function disc(suitId: string | null, mainStat: string | null, subStats: string[] = []): ZzzEquippedDisc {
  return { suitId, mainStat, subStats };
}

function agentWith(
  discs: Partial<ZzzTrackedAgent['discs']>,
  prefs: Partial<ZzzDiscBuildPreferences>,
): ZzzTrackedAgent {
  return {
    id: '1011',
    name: 'Anby',
    rarity: 3,
    specialty: 'Stun',
    element: 'Elec',
    imageUrl: '/assets/zenless-zone-zero/agents/1011.png',
    isFavorited: false,
    level: 60,
    mindscape: 0,
    coreSkill: 6,
    discs: { 1: null, 2: null, 3: null, 4: null, 5: null, 6: null, ...discs },
    buildPreferences: { ...emptyPrefs, mainStats: { 4: [], 5: [], 6: [] }, ...prefs },
  };
}

describe('calculateDiscScore sentinels', () => {
  it('returns -1 when no preferences are set', () => {
    const agent = agentWith({ 4: disc('31000', 'CRIT Rate') }, {});
    expect(calculateDiscScore(agent)).toBe(-1);
  });

  it('returns -1 when no discs are equipped', () => {
    const agent = agentWith({}, { discSuit4Id: '31000' });
    expect(calculateDiscScore(agent)).toBe(-1);
  });
});

describe('calculateDiscScore suit term', () => {
  it('scores 100 for a perfect distinct-suit 4pc+2pc build', () => {
    const agent = agentWith(
      {
        1: disc('31000', 'HP', ['CRIT Rate', 'CRIT DMG', 'ATK%', 'PEN']),
        2: disc('31000', 'ATK', ['CRIT Rate', 'CRIT DMG', 'ATK%', 'PEN']),
        3: disc('31000', 'DEF', ['CRIT Rate', 'CRIT DMG', 'ATK%', 'PEN']),
        4: disc('31000', 'CRIT Rate', ['CRIT DMG', 'ATK%', 'PEN', 'ATK']),
        5: disc('31600', 'ATK%', ['CRIT Rate', 'CRIT DMG', 'PEN', 'ATK']),
        6: disc('31600', 'ATK%', ['CRIT Rate', 'CRIT DMG', 'PEN', 'ATK']),
      },
      {
        discSuit4Id: '31000',
        discSuit2Id: '31600',
        mainStats: { 4: chain('CRIT Rate'), 5: chain('ATK%'), 6: chain('ATK%') },
        subStats: chain('CRIT Rate', 'CRIT DMG', 'ATK%', 'PEN'),
      },
    );
    expect(calculateDiscScore(agent)).toBeCloseTo(100);
  });

  it('same suit in both picks with 6 pieces spills surplus into the 2pc count', () => {
    const sixOfOne = agentWith(
      {
        1: disc('31000', 'HP'),
        2: disc('31000', 'ATK'),
        3: disc('31000', 'DEF'),
        4: disc('31000', 'CRIT Rate'),
        5: disc('31000', 'ATK%'),
        6: disc('31000', 'ATK%'),
      },
      { discSuit4Id: '31000', discSuit2Id: '31000' },
    );
    // Full set term (0.35) + all mains don't-care (0.30) + no sub prefs → subAchievable 0 → 0.35.
    expect(calculateDiscScore(sixOfOne)).toBeCloseTo(100);
  });

  it('same suit in both picks with only 4 pieces earns no 2pc credit', () => {
    const fourOfOne = agentWith(
      {
        1: disc('31000', 'HP'),
        2: disc('31000', 'ATK'),
        3: disc('31000', 'DEF'),
        4: disc('31000', 'CRIT Rate'),
      },
      { discSuit4Id: '31000', discSuit2Id: '31000' },
    );
    const distinctFull = agentWith(
      {
        1: disc('31000', 'HP'),
        2: disc('31000', 'ATK'),
        3: disc('31000', 'DEF'),
        4: disc('31000', 'CRIT Rate'),
        5: disc('31600', 'ATK%'),
        6: disc('31600', 'ATK%'),
      },
      { discSuit4Id: '31000', discSuit2Id: '31600' },
    );
    expect(calculateDiscScore(fourOfOne)).toBeLessThan(calculateDiscScore(distinctFull));
  });

  it('a missing suit pick contributes zero to its term', () => {
    const only2pc = agentWith(
      { 5: disc('31600', 'ATK%'), 6: disc('31600', 'ATK%') },
      { discSuit2Id: '31600' },
    );
    const both = agentWith(
      {
        1: disc('31000', 'HP'),
        2: disc('31000', 'ATK'),
        3: disc('31000', 'DEF'),
        4: disc('31000', 'CRIT Rate'),
        5: disc('31600', 'ATK%'),
        6: disc('31600', 'ATK%'),
      },
      { discSuit4Id: '31000', discSuit2Id: '31600' },
    );
    expect(calculateDiscScore(only2pc)).toBeLessThan(calculateDiscScore(both));
  });
});

describe('calculateDiscScore slot mains', () => {
  it('fixed slots 1-3 always contribute a full main match', () => {
    const agent = agentWith(
      { 1: disc('31000', 'HP') },
      { discSuit4Id: null, discSuit2Id: null, mainStats: { 4: [], 5: [], 6: [] }, subStats: chain('CRIT Rate') },
    );
    // One slot equipped of six, sub chain set but disc has no subs: the slot's
    // mainMatch is the fixed 1.0, averaged over all six slots — main term
    // contributes 0.30 × 1/6; set and sub terms are 0. Score = 5.
    expect(calculateDiscScore(agent)).toBe(5);
  });

  it('a chain on an empty-main disc scores zero for that slot main', () => {
    const noMain = agentWith(
      { 4: disc('31000', null) },
      { mainStats: { 4: chain('CRIT Rate'), 5: [], 6: [] } },
    );
    const withMain = agentWith(
      { 4: disc('31000', 'CRIT Rate') },
      { mainStats: { 4: chain('CRIT Rate'), 5: [], 6: [] } },
    );
    expect(calculateDiscScore(noMain)).toBeLessThan(calculateDiscScore(withMain));
  });

  it('an exact-match-only stat does not partial-match a different main', () => {
    const wrongMain = agentWith(
      { 5: disc('31000', 'DEF%') },
      { mainStats: { 4: [], 5: chain('Electric DMG Bonus'), 6: [] } },
    );
    const rightMain = agentWith(
      { 5: disc('31000', 'Electric DMG Bonus') },
      { mainStats: { 4: [], 5: chain('Electric DMG Bonus'), 6: [] } },
    );
    expect(calculateDiscScore(wrongMain)).toBeLessThan(calculateDiscScore(rightMain));
  });
});

describe('ZZZ stat shapes', () => {
  it('flat preference fully matched by percent form', () => {
    expect(getStatMatchScore('ATK', 'ATK%')).toBe(1.0);
    expect(getStatMatchScore('PEN', 'PEN Ratio')).toBe(1.0);
  });

  it('percent preference half-matched by flat form', () => {
    expect(getStatMatchScore('ATK%', 'ATK')).toBe(0.5);
    expect(getStatMatchScore('PEN Ratio', 'PEN')).toBe(0.5);
  });

  it('crit stats cross-match at half credit', () => {
    expect(getStatMatchScore('CRIT Rate', 'CRIT DMG')).toBe(0.5);
  });

  it('unmapped stats only exact-match', () => {
    expect(getStatMatchScore('Impact', 'Impact')).toBe(1.0);
    expect(getStatMatchScore('Impact', 'Energy Regen')).toBe(0);
    expect(getStatMatchScore('Fire DMG Bonus', 'Ice DMG Bonus')).toBe(0);
  });
});
