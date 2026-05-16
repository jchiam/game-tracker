import { describe, it, expect } from 'vitest';
import { getStatMatchScore, calculateCartridgeScore, getScoreGrade } from './cartridgeScoring';
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
    cartridgeRarity: null,
    cartridgeLevel: 0,
    cartridgeMainStat: null,
    cartridgeSubStats: [],
    cartridgePreferences: { mainStats: [], subStats: [] },
    ...overrides,
  };
}

describe('calculateCartridgeScore', () => {
  it('returns -1 when no preferences set', () => {
    expect(calculateCartridgeScore(makeCharacter())).toBe(-1);
  });

  it('returns -1 when no cartridge equipped', () => {
    const char = makeCharacter({
      cartridgePreferences: {
        mainStats: [{ stat: 'CRIT Rate %', operator: null, orderIndex: 0 }],
        subStats: [],
      },
    });
    expect(calculateCartridgeScore(char)).toBe(-1);
  });

  it('returns 40 for perfect main stat only', () => {
    const char = makeCharacter({
      cartridgeMainStat: 'CRIT Rate %',
      cartridgePreferences: {
        mainStats: [{ stat: 'CRIT Rate %', operator: null, orderIndex: 0 }],
        subStats: [],
      },
    });
    expect(calculateCartridgeScore(char)).toBe(40);
  });

  it('returns 100 for perfect main + all 4 sub stats matching', () => {
    const char = makeCharacter({
      cartridgeMainStat: 'CRIT Rate %',
      cartridgeSubStats: ['ATK %', 'CRIT DMG %', 'HP %', 'DEF %'],
      cartridgePreferences: {
        mainStats: [{ stat: 'CRIT Rate %', operator: null, orderIndex: 0 }],
        subStats: [
          { stat: 'ATK %', operator: '>', orderIndex: 0 },
          { stat: 'CRIT DMG %', operator: '>', orderIndex: 1 },
          { stat: 'HP %', operator: '>', orderIndex: 2 },
          { stat: 'DEF %', operator: null, orderIndex: 3 },
        ],
      },
    });
    expect(calculateCartridgeScore(char)).toBe(100);
  });

  it('returns partial score for some matching subs', () => {
    const char = makeCharacter({
      cartridgeMainStat: 'CRIT Rate %',
      cartridgeSubStats: ['ATK %', 'HP', 'Break Intensity', 'Cycle Intensity'],
      cartridgePreferences: {
        mainStats: [{ stat: 'CRIT Rate %', operator: null, orderIndex: 0 }],
        subStats: [
          { stat: 'ATK %', operator: '>', orderIndex: 0 },
          { stat: 'CRIT DMG %', operator: null, orderIndex: 1 },
        ],
      },
    });
    const score = calculateCartridgeScore(char);
    expect(score).toBeGreaterThan(40);
    expect(score).toBeLessThan(100);
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
