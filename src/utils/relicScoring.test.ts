import { describe, it, expect } from 'vitest';
import { calculateRelicScore, getStatMatchScore } from './relicScoring';
import type { HsrTrackedCharacter } from '../types';

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
  const getBaseCharacter = (): HsrTrackedCharacter => ({
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
        rope: [{ stat: 'ATK%', operator: null, orderIndex: 0 }],
      },
      subStats: [
        { stat: 'CRIT Rate', operator: null, orderIndex: 0 },
        { stat: 'CRIT DMG', operator: null, orderIndex: 1 },
        { stat: 'ATK%', operator: null, orderIndex: 2 },
        { stat: 'SPD', operator: null, orderIndex: 3 },
      ],
    },
  });

  it('returns -1 for empty relics (no equipment)', () => {
    const char = getBaseCharacter();
    expect(calculateRelicScore(char)).toBe(-1);
  });

  it('returns -1 when there are no preferences at all', () => {
    const char = getBaseCharacter();
    char.buildPreferences = {
      mainStats: { body: [], feet: [], sphere: [], rope: [] },
      subStats: [],
    };
    char.relics.head = { setId: '101', mainStat: 'HP', subStats: [] };
    expect(calculateRelicScore(char)).toBe(-1);
  });

  it('scores 100 for perfect matches including both set families', () => {
    const char = getBaseCharacter();
    char.buildPreferences.relicSetId = '101';
    char.buildPreferences.planarSetId = '301';
    const allSubs = ['CRIT Rate', 'CRIT DMG', 'ATK%', 'SPD'];
    char.relics = {
      head: { setId: '101', mainStat: 'HP', subStats: allSubs },
      hands: { setId: '101', mainStat: 'ATK', subStats: allSubs },
      body: { setId: '101', mainStat: 'CRIT Rate', subStats: allSubs },
      feet: { setId: '101', mainStat: 'SPD', subStats: allSubs },
      sphere: { setId: '301', mainStat: 'Fire DMG Boost', subStats: allSubs },
      rope: { setId: '301', mainStat: 'ATK%', subStats: allSubs },
    };
    expect(calculateRelicScore(char)).toBeCloseTo(100, 5);
  });

  it('caps at 65 when set preferences are absent but stats are perfect', () => {
    const char = getBaseCharacter();
    // No relicSetId/planarSetId → setTerm 0; perfect mains + subs → 0.30 + 0.35 = 65
    const allSubs = ['CRIT Rate', 'CRIT DMG', 'ATK%', 'SPD'];
    char.relics = {
      head: { setId: '101', mainStat: 'HP', subStats: allSubs },
      hands: { setId: '101', mainStat: 'ATK', subStats: allSubs },
      body: { setId: '101', mainStat: 'CRIT Rate', subStats: allSubs },
      feet: { setId: '101', mainStat: 'SPD', subStats: allSubs },
      sphere: { setId: '301', mainStat: 'Fire DMG Boost', subStats: allSubs },
      rope: { setId: '301', mainStat: 'ATK%', subStats: allSubs },
    };
    expect(calculateRelicScore(char)).toBeCloseTo(65, 5);
  });

  it('grades the relic-set term toward the 4-piece breakpoint', () => {
    const char = getBaseCharacter();
    char.buildPreferences = {
      mainStats: { body: [], feet: [], sphere: [], rope: [] },
      subStats: [],
      relicSetId: '101',
    };
    // 3 of 4 relic-set slots match → relicMatch 0.75 → setTerm 0.75 × 0.67 = 0.5025
    // main term: head + hands fixed (1 each) out of 6 = 0.33333; sub 0
    char.relics = {
      head: { setId: '101', mainStat: 'HP', subStats: [] },
      hands: { setId: '101', mainStat: 'ATK', subStats: [] },
      body: { setId: '101', mainStat: 'CRIT Rate', subStats: [] },
      feet: { setId: '102', mainStat: 'SPD', subStats: [] },
      sphere: null,
      rope: null,
    };
    // (0.5025 × 0.35 + (2/6) × 0.30) × 100 = 27.5875
    expect(calculateRelicScore(char)).toBeCloseTo(27.5875, 3);
  });

  it('scores the planar-set term over its 2-piece breakpoint', () => {
    const char = getBaseCharacter();
    char.buildPreferences = {
      mainStats: { body: [], feet: [], sphere: [], rope: [] },
      subStats: [],
      planarSetId: '301',
    };
    char.relics.sphere = { setId: '301', mainStat: 'Fire DMG Boost', subStats: [] };
    char.relics.rope = { setId: '301', mainStat: 'ATK%', subStats: [] };
    // planarMatch 1.0 → setTerm 0.33; sphere/rope have empty main chains → main 0
    // (0.33 × 0.35) × 100 = 11.55
    expect(calculateRelicScore(char)).toBeCloseTo(11.55, 3);
  });

  it('does not credit the set term when the preference is null even if relics carry sets', () => {
    const char = getBaseCharacter();
    // relicSetId/planarSetId null; only a sub preference keeps the score numeric
    char.buildPreferences = {
      mainStats: { body: [], feet: [], sphere: [], rope: [] },
      subStats: [{ stat: 'CRIT Rate', operator: null, orderIndex: 0 }],
    };
    char.relics.head = { setId: '101', mainStat: 'HP', subStats: ['CRIT Rate', 'DEF', 'HP'] };
    // setTerm 0 (null-guarded); head fixed main 1/6; sub best-1 → 0.25/6
    // ((1/6) × 0.30 + (0.25/6) × 0.35) × 100 = 6.4583
    expect(calculateRelicScore(char)).toBeCloseTo(6.4583, 3);
  });

  it('averages a single equipped slot with partial subs over six slots', () => {
    const char = getBaseCharacter();
    char.buildPreferences.subStats = [{ stat: 'CRIT Rate', operator: null, orderIndex: 0 }];
    char.relics.hands = {
      setId: '101',
      mainStat: 'ATK',
      subStats: [
        'CRIT DMG', // 0.5 (cross-crit vs preferred CRIT Rate)
        'DEF', // 0
      ],
    };
    // setTerm 0 (no set pref); hands fixed main 1/6; sub 0.5/4 = 0.125 → /6
    // ((1/6) × 0.30 + (0.125/6) × 0.35) × 100 = 5.72917
    expect(calculateRelicScore(char)).toBeCloseTo(5.72917, 3);
  });
});
