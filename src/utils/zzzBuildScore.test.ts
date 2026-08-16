import { describe, it, expect } from 'vitest';
import { calculateZzzBuildScore } from '@/utils/zzzBuildScore';
import type { ZzzTrackedAgent } from '@/types';

// Full 6-piece 31000 build with suit picks and no stat chains — disc score 100
// (set term full, mains don't-care, subAchievable 0; see discScoring tests).
const perfectDiscs: ZzzTrackedAgent['discs'] = {
  1: { suitId: '31000', mainStat: 'HP', subStats: [] },
  2: { suitId: '31000', mainStat: 'ATK', subStats: [] },
  3: { suitId: '31000', mainStat: 'DEF', subStats: [] },
  4: { suitId: '31000', mainStat: 'CRIT Rate', subStats: [] },
  5: { suitId: '31000', mainStat: 'ATK%', subStats: [] },
  6: { suitId: '31000', mainStat: 'ATK%', subStats: [] },
};

const emptyDiscs: ZzzTrackedAgent['discs'] = {
  1: null,
  2: null,
  3: null,
  4: null,
  5: null,
  6: null,
};

function agent(overrides: Partial<ZzzTrackedAgent>): ZzzTrackedAgent {
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
    discs: { ...emptyDiscs },
    buildPreferences: { mainStats: { 4: [], 5: [], 6: [] }, subStats: [] },
    wEngineId: null,
    wEngineLevel: 0,
    wEnginePhase: 1,
    wEnginePreferences: [],
    ...overrides,
  };
}

const perfectDiscAgent = (overrides: Partial<ZzzTrackedAgent>) =>
  agent({
    discs: { ...perfectDiscs },
    buildPreferences: {
      mainStats: { 4: [], 5: [], 6: [] },
      subStats: [],
      discSuit4Id: '31000',
      discSuit2Id: '31000',
    },
    ...overrides,
  });

describe('calculateZzzBuildScore', () => {
  it('blends both active sides at 0.25/0.75', () => {
    const a = perfectDiscAgent({
      wEngineId: '14110',
      wEnginePreferences: ['13005', '14110'], // equipped ranked #2 → term 0.75
    });
    // 0.25 × 0.75 + 0.75 × 1.0 = 0.9375
    expect(calculateZzzBuildScore(a)).toBeCloseTo(93.75);
  });

  it('rank #1 engine on a perfect disc build scores 100', () => {
    const a = perfectDiscAgent({ wEngineId: '14110', wEnginePreferences: ['14110'] });
    expect(calculateZzzBuildScore(a)).toBeCloseTo(100);
  });

  it('empty preference list is don’t-care — disc score passes through', () => {
    const a = perfectDiscAgent({});
    expect(calculateZzzBuildScore(a)).toBeCloseTo(calculateZzzBuildScore(perfectDiscAgent({})));
    expect(calculateZzzBuildScore(a)).toBeCloseTo(100);
  });

  it('engine side alone when disc score is the -1 sentinel', () => {
    const a = agent({ wEngineId: '13005', wEnginePreferences: ['14110', '13005'] });
    expect(calculateZzzBuildScore(a)).toBeCloseTo(75);
  });

  it('rank decay floors at 0.25 for deep ranks', () => {
    const a = agent({
      wEngineId: '13010',
      wEnginePreferences: ['a', 'b', 'c', 'd', 'e', '13010'], // rank #6
    });
    expect(calculateZzzBuildScore(a)).toBeCloseTo(25);
  });

  it('off-build equipped engine scores 0 on the engine side', () => {
    const a = agent({ wEngineId: 'unlisted', wEnginePreferences: ['14110'] });
    expect(calculateZzzBuildScore(a)).toBe(0);
  });

  it('unequipped engine with preferences scores 0 on the engine side', () => {
    const a = agent({ wEnginePreferences: ['14110'] });
    expect(calculateZzzBuildScore(a)).toBe(0);
  });

  it('returns -1 when both sides are inactive', () => {
    expect(calculateZzzBuildScore(agent({}))).toBe(-1);
  });

  it('engine level and Phase never affect the score', () => {
    const base = perfectDiscAgent({ wEngineId: '14110', wEnginePreferences: ['14110'] });
    const leveled = { ...base, wEngineLevel: 60, wEnginePhase: 5 };
    expect(calculateZzzBuildScore(leveled)).toBe(calculateZzzBuildScore(base));
  });
});
