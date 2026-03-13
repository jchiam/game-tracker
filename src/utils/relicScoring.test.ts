import { describe, it, expect } from 'vitest';
import { calculateRelicScore, getStatMatchScore } from './relicScoring';
import type { TrackedCharacter } from '../types';

describe('getStatMatchScore', () => {
  it('returns 1.0 for exact matches', () => {
    expect(getStatMatchScore('HP', 'HP')).toBe(1.0);
    expect(getStatMatchScore('CRIT Rate', 'CRIT Rate')).toBe(1.0);
  });

  it('returns 0.5 for % preferred and flat equipped', () => {
    expect(getStatMatchScore('HP%', 'HP')).toBe(0.5);
    expect(getStatMatchScore('ATK%', 'ATK')).toBe(0.5);
    expect(getStatMatchScore('DEF%', 'DEF')).toBe(0.5);
  });

  it('returns 1.0 for flat preferred and % equipped', () => {
    expect(getStatMatchScore('HP', 'HP%')).toBe(1.0);
    expect(getStatMatchScore('ATK', 'ATK%')).toBe(1.0);
    expect(getStatMatchScore('DEF', 'DEF%')).toBe(1.0);
  });

  it('returns 0.5 for opposite Crit stats', () => {
    expect(getStatMatchScore('CRIT Rate', 'CRIT DMG')).toBe(0.5);
    expect(getStatMatchScore('CRIT DMG', 'CRIT Rate')).toBe(0.5);
  });

  it('returns 0.0 for unrelated stats', () => {
    expect(getStatMatchScore('HP', 'ATK')).toBe(0.0);
    expect(getStatMatchScore('CRIT Rate', 'ATK%')).toBe(0.0);
  });
});

describe('calculateRelicScore', () => {
  const getBaseCharacter = (): TrackedCharacter => ({
    id: 'test',
    name: 'Test Character',
    element: 'Fire',
    path: 'Destruction',
    imageUrl: '',
    isFavorited: false,
    level: 80,
    tracesAttained: true,
    relics: { head: null, hands: null, body: null, feet: null, sphere: null, rope: null },
    buildPreferences: {
      mainStats: {
        body: [{ stat: 'CRIT Rate', operator: null, orderIndex: 0 }],
        feet: [{ stat: 'SPD', operator: null, orderIndex: 0 }],
        sphere: [{ stat: 'Fire DMG Boost', operator: null, orderIndex: 0 }],
        rope: [{ stat: 'ATK%', operator: null, orderIndex: 0 }]
      },
      subStats: [
        { stat: 'CRIT Rate', operator: null, orderIndex: 0 },
        { stat: 'CRIT DMG', operator: null, orderIndex: 1 },
        { stat: 'ATK%', operator: null, orderIndex: 2 },
        { stat: 'SPD', operator: null, orderIndex: 3 }
      ]
    }
  });

  it('returns 0 for empty relics', () => {
    const char = getBaseCharacter();
    expect(calculateRelicScore(char)).toBe(0);
  });

  it('calculates score correctly for perfect matches', () => {
    const char = getBaseCharacter();
    char.relics = {
      head: { setId: null, mainStat: 'HP', subStats: [{ type: 'CRIT Rate', value: '1' }, { type: 'CRIT DMG', value: '1' }, { type: 'ATK%', value: '1' }, { type: 'SPD', value: '1' }] },
      hands: { setId: null, mainStat: 'ATK', subStats: [{ type: 'CRIT Rate', value: '1' }, { type: 'CRIT DMG', value: '1' }, { type: 'ATK%', value: '1' }, { type: 'SPD', value: '1' }] },
      body: { setId: null, mainStat: 'CRIT Rate', subStats: [{ type: 'CRIT Rate', value: '1' }, { type: 'CRIT DMG', value: '1' }, { type: 'ATK%', value: '1' }, { type: 'SPD', value: '1' }] },
      feet: { setId: null, mainStat: 'SPD', subStats: [{ type: 'CRIT Rate', value: '1' }, { type: 'CRIT DMG', value: '1' }, { type: 'ATK%', value: '1' }, { type: 'SPD', value: '1' }] },
      sphere: { setId: null, mainStat: 'Fire DMG Boost', subStats: [{ type: 'CRIT Rate', value: '1' }, { type: 'CRIT DMG', value: '1' }, { type: 'ATK%', value: '1' }, { type: 'SPD', value: '1' }] },
      rope: { setId: null, mainStat: 'ATK%', subStats: [{ type: 'CRIT Rate', value: '1' }, { type: 'CRIT DMG', value: '1' }, { type: 'ATK%', value: '1' }, { type: 'SPD', value: '1' }] }
    };
    // Should be very close to 100
    expect(Math.round(calculateRelicScore(char))).toBe(100);
  });

  it('calculates partial score correctly', () => {
    const char = getBaseCharacter();
    // Head with only 1 correct sub stat => main match 1.0 (40%), sub match 0.25 (1/4 of 60% = 15%) => total slot score = 55%
    // Only 1 slot equipped out of 6 => final score = 55% / 6 = 9.1666%
    char.relics.head = {
      setId: null,
      mainStat: 'HP',
      subStats: [
        { type: 'CRIT Rate', value: '1' }, // Match 1.0
        { type: 'DEF', value: '1' },       // Match 0
        { type: 'HP', value: '1' },        // Match 0
        { type: 'Effect Hit Rate', value: '1' } // Match 0
      ]
    };
    const score = calculateRelicScore(char);
    // 16.666 * (1.0 * 0.4 + 0.25 * 0.6) = 16.666 * (0.4 + 0.15) = 16.666 * 0.55 = 9.1666...
    expect(score).toBeCloseTo(9.16666, 3);
  });

  it('calculates partial sub stat matching like Crit Rate/DMG', () => {
    const char = getBaseCharacter();
    // Prefer: CRIT Rate, CRIT DMG, ATK%, SPD
    // Equip: CRIT DMG (is preffered, but let's test a mismatch by replacing build prefs to only one)
    char.buildPreferences.subStats = [{ stat: 'CRIT Rate', operator: null, orderIndex: 0 }];
    
    char.relics.hands = {
      setId: null,
      mainStat: 'ATK',
      subStats: [
        { type: 'CRIT DMG', value: '1' },  // Match 0.5 because Pref is CRIT Rate
        { type: 'DEF', value: '1' }
      ]
    };

    const score = calculateRelicScore(char);
    // Main match: 1.0 (40%)
    // Sub match: 0.5 / 4 = 0.125 (0.125 * 60% = 7.5%)
    // Total slot = 47.5%
    // Final score = 47.5% / 6 = 7.9166%
    expect(score).toBeCloseTo(7.9166, 3);
  });
});
