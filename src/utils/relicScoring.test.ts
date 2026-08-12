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
    lightConeId: null,
    lightConeLevel: 1,
    lightConeSuperimposition: 1,
    lightConePreferences: [],
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
    // Empty main chains and an empty sub chain are don't-care on the 4 occupied slots:
    // main term 4/6, sub term 4/6 (the two empty slots dilute both).
    char.relics = {
      head: { setId: '101', mainStat: 'HP', subStats: [] },
      hands: { setId: '101', mainStat: 'ATK', subStats: [] },
      body: { setId: '101', mainStat: 'CRIT Rate', subStats: [] },
      feet: { setId: '102', mainStat: 'SPD', subStats: [] },
      sphere: null,
      rope: null,
    };
    // (0.5025 × 0.35 + (4/6) × 0.30 + (4/6) × 0.35) × 100 = 60.92083
    expect(calculateRelicScore(char)).toBeCloseTo(60.92083, 3);
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
    // planarMatch 1.0 → setTerm 0.33; empty chains are don't-care on the 2 occupied
    // slots → main 2/6, sub 2/6; the 4 empty slots dilute both.
    // (0.33 × 0.35 + (2/6) × 0.30 + (2/6) × 0.35) × 100 = 33.21667
    expect(calculateRelicScore(char)).toBeCloseTo(33.21667, 3);
  });

  it('does not credit the set term when the preference is null even if relics carry sets', () => {
    const char = getBaseCharacter();
    // relicSetId/planarSetId null; only a sub preference keeps the score numeric
    char.buildPreferences = {
      mainStats: { body: [], feet: [], sphere: [], rope: [] },
      subStats: [{ stat: 'CRIT Rate', operator: null, orderIndex: 0 }],
    };
    char.relics.head = { setId: '101', mainStat: 'HP', subStats: ['CRIT Rate', 'DEF', 'HP'] };
    // setTerm 0 (null-guarded); head fixed main 1/6. Sub achievable (pool minus main
    // HP) = CRIT Rate 1.0 + cross-crit CRIT DMG 0.5 = 1.5; equipped sum 1.0 → 2/3 per
    // slot → /6. ((1/6) × 0.30 + ((1/1.5)/6) × 0.35) × 100 = 8.88889
    expect(calculateRelicScore(char)).toBeCloseTo(8.88889, 3);
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
    // setTerm 0 (no set pref); hands fixed main 1/6. Sub achievable (pool minus main
    // ATK) = CRIT Rate 1.0 + CRIT DMG 0.5 = 1.5; equipped sum 0.5 → 1/3 per slot → /6.
    // ((1/6) × 0.30 + ((0.5/1.5)/6) × 0.35) × 100 = 6.94444
    expect(calculateRelicScore(char)).toBeCloseTo(6.94444, 3);
  });

  it('maxes the stat terms for the best legal all-HP gear (canonical achievability case)', () => {
    const char = getBaseCharacter();
    // Only wish: HP. No set prefs, no main chains — don't-care.
    char.buildPreferences = {
      mainStats: { body: [], feet: [], sphere: [], rope: [] },
      subStats: [{ stat: 'HP', operator: null, orderIndex: 0 }],
    };
    // Best legal item per slot: every HP-family substat the slot's main allows.
    char.relics = {
      head: { setId: '101', mainStat: 'HP', subStats: ['HP%'] }, // main HP excludes flat HP
      hands: { setId: '101', mainStat: 'ATK', subStats: ['HP', 'HP%'] },
      body: { setId: '101', mainStat: 'HP%', subStats: ['HP'] }, // main HP% excludes HP%
      feet: { setId: '101', mainStat: 'SPD', subStats: ['HP', 'HP%'] },
      sphere: { setId: '301', mainStat: 'HP%', subStats: ['HP'] },
      rope: { setId: '301', mainStat: 'ATK%', subStats: ['HP', 'HP%'] },
    };
    // main term 1.0 (fixed + don't-care), sub term 1.0 (achievable fully covered),
    // set term 0 → (0.30 + 0.35) × 100 = 65
    expect(calculateRelicScore(char)).toBeCloseTo(65, 5);
  });

  it("scores main 0 when the chain is set but the item has no main entered (not don't-care)", () => {
    const char = getBaseCharacter();
    // Body chain is [CRIT Rate] (non-empty) but the equipped body has no main stat.
    char.relics.body = { setId: '101', mainStat: '', subStats: ['CRIT Rate'] };
    // main term 0 — a don't-care regression here would add (1/6) × 0.30 = 5.
    // Sub achievable (no main to exclude): CRIT Rate/CRIT DMG/ATK%/SPD all 1.0 → top-4
    // = 4.0; equipped sum 1.0 → 0.25 per slot → /6.
    // ((0.25/6) × 0.35) × 100 = 1.45833
    expect(calculateRelicScore(char)).toBeCloseTo(1.45833, 3);
  });
});
