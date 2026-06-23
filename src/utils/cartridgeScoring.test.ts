import { describe, it, expect } from 'vitest';
import {
  getStatMatchScore,
  getCartridgeIdMatchScore,
  calculateCartridgeScore,
  getScoreGrade,
} from './cartridgeScoring';
import type { N2ETrackedCharacter } from '../types';

describe('getStatMatchScore', () => {
  it('returns 1.0 for exact match', () => {
    expect(getStatMatchScore('CRIT Rate %', 'CRIT Rate %')).toBe(1.0);
  });

  it('returns 0.5 for % preferred but flat equipped', () => {
    expect(getStatMatchScore('ATK %', 'ATK')).toBe(0.5);
  });

  it('returns 1.0 for flat preferred but % equipped', () => {
    expect(getStatMatchScore('ATK', 'ATK %')).toBe(1.0);
  });

  it('returns 0.5 for cross-crit match', () => {
    expect(getStatMatchScore('CRIT Rate %', 'CRIT DMG %')).toBe(0.5);
  });

  it('returns 0.0 for unrelated stats', () => {
    expect(getStatMatchScore('HP %', 'CRIT Rate %')).toBe(0.0);
  });
});

describe('getCartridgeIdMatchScore', () => {
  it('returns 1.0 for same set and rarity', () => {
    expect(getCartridgeIdMatchScore('Cosmos_orange', 'Cosmos_orange')).toBe(1.0);
  });

  it('returns 1.0 when equipped rarity is higher than preferred', () => {
    // Preferred A, equipped S — meets or exceeds
    expect(getCartridgeIdMatchScore('Cosmos_purple', 'Cosmos_orange')).toBe(1.0);
  });

  it('returns 0.6 for same set, one rarity below preferred', () => {
    // Preferred S, equipped A
    expect(getCartridgeIdMatchScore('Cosmos_orange', 'Cosmos_purple')).toBe(0.6);
  });

  it('returns 0.3 for same set, two rarities below preferred', () => {
    // Preferred S, equipped B
    expect(getCartridgeIdMatchScore('Cosmos_orange', 'Cosmos_blue')).toBe(0.3);
  });

  it('returns 0.0 for wrong set', () => {
    expect(getCartridgeIdMatchScore('Cosmos_orange', 'Attack_orange')).toBe(0.0);
  });

  it('returns 0.0 for wrong set regardless of rarity', () => {
    expect(getCartridgeIdMatchScore('Cosmos_orange', 'Nature_blue')).toBe(0.0);
  });

  it('returns 1.0 when equipped rarity equals preferred (S preferred, S equipped)', () => {
    expect(getCartridgeIdMatchScore('Cosmos_orange', 'Cosmos_orange')).toBe(1.0);
  });
});

function makeCharacter(overrides: Partial<N2ETrackedCharacter> = {}): N2ETrackedCharacter {
  return {
    id: 'test',
    name: 'Test',
    rarity: 'S',
    esperType: 'Cosmos',
    arcType: 'Solid',
    roles: [],
    imageUrl: '',
    isFavorited: false,
    level: 1,
    awakening: [false, false, false, false, false, false],
    resonanceCount: 0,
    arcId: null,
    arcLevel: 1,
    arcTier: 1,
    cartridgeId: null,
    cartridgeRarity: null,
    cartridgeLevel: 0,
    cartridgeMainStat: null,
    cartridgeSubStats: [],
    cartridgePreferences: { cartridgeId: null, mainStats: [], subStats: [] },
    ...overrides,
  };
}

describe('calculateCartridgeScore', () => {
  it('returns -1 when no preferences set', () => {
    expect(calculateCartridgeScore(makeCharacter())).toBe(-1);
  });

  it('returns -1 when preferences set but nothing equipped', () => {
    const char = makeCharacter({
      cartridgePreferences: {
        cartridgeId: null,
        mainStats: [{ stat: 'CRIT Rate %', operator: null, orderIndex: 0 }],
        subStats: [],
      },
    });
    expect(calculateCartridgeScore(char)).toBe(-1);
  });

  it('returns -1 when cartridgeId pref set but no cartridge equipped', () => {
    const char = makeCharacter({
      cartridgeId: null,
      cartridgeMainStat: null,
      cartridgeSubStats: [],
      cartridgePreferences: {
        cartridgeId: 'Cosmos_orange',
        mainStats: [],
        subStats: [],
      },
    });
    expect(calculateCartridgeScore(char)).toBe(-1);
  });

  it('scores using cartridgeId pref alone when cartridgeId equipped and matched', () => {
    // cartridgeId match = 1.0 × 0.35, no stat prefs → score = 35
    const char = makeCharacter({
      cartridgeId: 'Cosmos_orange',
      cartridgePreferences: {
        cartridgeId: 'Cosmos_orange',
        mainStats: [],
        subStats: [],
      },
    });
    expect(calculateCartridgeScore(char)).toBe(35);
  });

  it('caps at 65 for wrong set with perfect stats', () => {
    // id=0, main=1.0×0.30, sub=1.0×0.35 → 65
    const char = makeCharacter({
      cartridgeId: 'Attack_orange',
      cartridgeMainStat: 'CRIT Rate %',
      cartridgeSubStats: ['ATK %', 'CRIT DMG %', 'HP %', 'DEF %'],
      cartridgePreferences: {
        cartridgeId: 'Cosmos_orange',
        mainStats: [{ stat: 'CRIT Rate %', operator: null, orderIndex: 0 }],
        subStats: [
          { stat: 'ATK %', operator: '>', orderIndex: 0 },
          { stat: 'CRIT DMG %', operator: '>', orderIndex: 1 },
          { stat: 'HP %', operator: '>', orderIndex: 2 },
          { stat: 'DEF %', operator: null, orderIndex: 3 },
        ],
      },
    });
    expect(calculateCartridgeScore(char)).toBeCloseTo(65, 5);
  });

  it('returns 100 for perfect set + main + all 4 subs matching', () => {
    const char = makeCharacter({
      cartridgeId: 'Cosmos_orange',
      cartridgeMainStat: 'CRIT Rate %',
      cartridgeSubStats: ['ATK %', 'CRIT DMG %', 'HP %', 'DEF %'],
      cartridgePreferences: {
        cartridgeId: 'Cosmos_orange',
        mainStats: [{ stat: 'CRIT Rate %', operator: null, orderIndex: 0 }],
        subStats: [
          { stat: 'ATK %', operator: '>', orderIndex: 0 },
          { stat: 'CRIT DMG %', operator: '>', orderIndex: 1 },
          { stat: 'HP %', operator: '>', orderIndex: 2 },
          { stat: 'DEF %', operator: null, orderIndex: 3 },
        ],
      },
    });
    expect(calculateCartridgeScore(char)).toBeCloseTo(100, 5);
  });

  it('applies rarity penalty for same set one rarity below', () => {
    // id match = 0.6 × 0.35 = 0.21, main = 1.0 × 0.30 = 0.30, sub = 0 → 51
    const char = makeCharacter({
      cartridgeId: 'Cosmos_purple',
      cartridgeMainStat: 'CRIT Rate %',
      cartridgeSubStats: [],
      cartridgePreferences: {
        cartridgeId: 'Cosmos_orange',
        mainStats: [{ stat: 'CRIT Rate %', operator: null, orderIndex: 0 }],
        subStats: [],
      },
    });
    expect(calculateCartridgeScore(char)).toBeCloseTo(51, 5);
  });

  it('returns partial score for some matching subs', () => {
    const char = makeCharacter({
      cartridgeMainStat: 'CRIT Rate %',
      cartridgeSubStats: ['ATK %', 'HP', 'Break Intensity', 'Cycle Intensity'],
      cartridgePreferences: {
        cartridgeId: null,
        mainStats: [{ stat: 'CRIT Rate %', operator: null, orderIndex: 0 }],
        subStats: [
          { stat: 'ATK %', operator: '>', orderIndex: 0 },
          { stat: 'CRIT DMG %', operator: null, orderIndex: 1 },
        ],
      },
    });
    const score = calculateCartridgeScore(char);
    expect(score).toBeGreaterThan(30);
    expect(score).toBeLessThan(65);
  });
});

describe('getScoreGrade', () => {
  it('returns empty string for -1', () => {
    expect(getScoreGrade(-1)).toBe('');
  });

  it('returns S for 90+', () => {
    expect(getScoreGrade(95)).toBe('S');
  });

  it('returns A for 70-89', () => {
    expect(getScoreGrade(75)).toBe('A');
  });

  it('returns D for below 30', () => {
    expect(getScoreGrade(10)).toBe('D');
  });
});
