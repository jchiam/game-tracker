import { describe, it, expect } from 'vitest';
import {
  matchStatShapes,
  makeStatMatcher,
  createEquipmentScore,
  getScoreGrade,
  SCORE_WEIGHTS,
  type StatShape,
  type SlotScore,
} from './index';

const shape = (base: string, isPercent = false): StatShape => ({ base, isPercent });

describe('matchStatShapes', () => {
  it('scores an exact match 1.0', () => {
    expect(matchStatShapes(shape('atk', true), shape('atk', true))).toBe(1.0);
    expect(matchStatShapes(shape('hp'), shape('hp'))).toBe(1.0);
  });

  it('scores a flat preference met by its percent 1.0 (% trumps flat)', () => {
    expect(matchStatShapes(shape('atk', false), shape('atk', true))).toBe(1.0);
  });

  it('scores a percent preference met by its flat 0.5', () => {
    expect(matchStatShapes(shape('atk', true), shape('atk', false))).toBe(0.5);
  });

  it('scores cross-crit 0.5 in either direction', () => {
    expect(matchStatShapes(shape('crit-rate'), shape('crit-mult'))).toBe(0.5);
    expect(matchStatShapes(shape('crit-mult'), shape('crit-rate'))).toBe(0.5);
    expect(matchStatShapes(shape('crit-rate', true), shape('crit-mult', true))).toBe(0.5);
  });

  it('scores unrelated stats 0.0', () => {
    expect(matchStatShapes(shape('hp', true), shape('crit-rate', true))).toBe(0.0);
    expect(matchStatShapes(shape('spd'), shape('def'))).toBe(0.0);
  });

  it('never cross-matches non-crit bases that happen to differ', () => {
    expect(matchStatShapes(shape('break-effect'), shape('effect-res'))).toBe(0.0);
  });
});

describe('makeStatMatcher', () => {
  // Toy vocabulary — the adapter supplies only this map, no matching code.
  const { getStatMatchScore, bestMatch } = makeStatMatcher({
    PWR: { base: 'power', isPercent: false },
    'PWR%': { base: 'power', isPercent: true },
    'C-Rate': { base: 'crit-rate', isPercent: false },
    'C-Dmg': { base: 'crit-mult', isPercent: false },
  });

  it('applies the shared match rules over the supplied vocabulary', () => {
    expect(getStatMatchScore('PWR', 'PWR')).toBe(1.0);
    expect(getStatMatchScore('PWR', 'PWR%')).toBe(1.0); // % trumps flat
    expect(getStatMatchScore('PWR%', 'PWR')).toBe(0.5);
    expect(getStatMatchScore('C-Rate', 'C-Dmg')).toBe(0.5); // cross-crit
    expect(getStatMatchScore('PWR', 'C-Rate')).toBe(0.0);
  });

  it('lets an unmapped id exact-match only', () => {
    expect(getStatMatchScore('speed', 'speed')).toBe(1.0);
    expect(getStatMatchScore('speed', 'anchor')).toBe(0.0);
    expect(getStatMatchScore('speed', 'PWR')).toBe(0.0);
  });

  it('returns the best match over a preference chain', () => {
    const prefs = [{ stat: 'PWR%' }, { stat: 'PWR' }];
    expect(bestMatch(prefs, 'PWR%')).toBe(1.0); // exact beats the 0.5 partial
    expect(bestMatch(prefs, 'PWR')).toBe(1.0);
    expect(bestMatch([{ stat: 'PWR%' }], 'PWR')).toBe(0.5);
  });

  it('returns 0 for an empty chain', () => {
    expect(bestMatch([], 'PWR')).toBe(0);
  });
});

interface FakeEntity {
  prefs: boolean;
  equip: boolean;
  set: number;
  slots: SlotScore[];
}

const score = createEquipmentScore<FakeEntity>({
  hasPreferences: (e) => e.prefs,
  hasEquipment: (e) => e.equip,
  setTerm: (e) => e.set,
  slots: (e) => e.slots,
});

const slot = (mainMatch: number, subMatches: number[] = []): SlotScore => ({
  mainMatch,
  subMatches,
});

describe('createEquipmentScore', () => {
  it('returns -1 when there are no preferences', () => {
    expect(score({ prefs: false, equip: true, set: 1, slots: [slot(1)] })).toBe(-1);
  });

  it('returns -1 when there is no equipment', () => {
    expect(score({ prefs: true, equip: false, set: 1, slots: [slot(1)] })).toBe(-1);
  });

  it('scores a perfect single-slot entity 100', () => {
    const e: FakeEntity = { prefs: true, equip: true, set: 1, slots: [slot(1, [1, 1, 1, 1])] };
    expect(score(e)).toBeCloseTo(100, 5);
  });

  it('applies the shared weights', () => {
    // set 1.0, main 1.0, sub 0.5 → 82.5
    const e: FakeEntity = { prefs: true, equip: true, set: 1, slots: [slot(1, [1, 1])] };
    expect(score(e)).toBeCloseTo(82.5, 5);
  });

  it('caps below 100 when the set term is absent but stats are perfect', () => {
    const e: FakeEntity = { prefs: true, equip: true, set: 0, slots: [slot(1, [1, 1, 1, 1])] };
    expect(score(e)).toBeCloseTo(65, 5);
  });

  it('averages main and sub over the fixed slot count (empties dilute)', () => {
    // 5 slots, only one perfect: main 1/5 = 0.2, sub (1)/5 = 0.2, set 0
    const slots = [slot(1, [1, 1, 1, 1]), slot(0), slot(0), slot(0), slot(0)];
    const e: FakeEntity = { prefs: true, equip: true, set: 0, slots };
    // (0*.35 + 0.2*.30 + 0.2*.35)*100 = 13
    expect(score(e)).toBeCloseTo(13, 5);
  });

  it('caps a slot sub sum at 4 before dividing', () => {
    // subMatches sum to 5 but cap at 4 → 4/4 = 1.0
    const e: FakeEntity = { prefs: true, equip: true, set: 0, slots: [slot(0, [1, 1, 1, 1, 1])] };
    // (0 + 0 + 1.0*.35)*100 = 35
    expect(score(e)).toBeCloseTo(35, 5);
  });

  it('floors at 0', () => {
    const e: FakeEntity = { prefs: true, equip: true, set: 0, slots: [slot(0)] };
    expect(score(e)).toBe(0);
  });
});

describe('SCORE_WEIGHTS', () => {
  it('sums to 1.0', () => {
    expect(SCORE_WEIGHTS.set + SCORE_WEIGHTS.main + SCORE_WEIGHTS.sub).toBeCloseTo(1.0, 5);
  });
});

describe('getScoreGrade', () => {
  it('maps boundaries', () => {
    expect(getScoreGrade(90)).toBe('S');
    expect(getScoreGrade(70)).toBe('A');
    expect(getScoreGrade(50)).toBe('B');
    expect(getScoreGrade(30)).toBe('C');
    expect(getScoreGrade(29.9)).toBe('D');
  });

  it('maps negative to empty', () => {
    expect(getScoreGrade(-1)).toBe('');
  });
});
