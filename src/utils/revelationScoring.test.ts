import { describe, it, expect } from 'vitest';
import {
  calculateRevelationScore,
  getStatMatchScore,
  getScoreGrade,
} from '@/utils/revelationScoring';
import type { P5xTrackedThief } from '@/types';
import type { EquippedRevelation } from '@/data/persona-5-phantom-x/revelations';

const pref = (stat: string) => ({ stat, operator: null, orderIndex: 0 });

const card = (
  setId: string | null,
  mainStat: string | null = null,
  subStats: string[] = [],
): EquippedRevelation => ({ setId, mainStat, subStats });

type Revs = P5xTrackedThief['revelations'];
type Prefs = P5xTrackedThief['revelationPreferences'];

function makeThief(revelations: Partial<Revs> = {}, prefs: Partial<Prefs> = {}): P5xTrackedThief {
  return {
    id: 'ann-takamaki',
    name: 'Ann Takamaki',
    codename: 'Panther',
    personaName: 'Carmen',
    rarity: 5,
    role: 'Multi-target',
    element: 'Fire',
    imageUrl: '',
    isFavorited: false,
    level: 45,
    awareness: 3,
    skillsLeveled: false,
    roseMaxed: false,
    mindscapeMaxed: false,
    weaponRarity: null,
    weaponLevel: 1,
    weaponForge: 0,
    revelations: { sun: null, moon: null, star: null, sky: null, space: null, ...revelations },
    revelationPreferences: {
      heavensSetId: null,
      spaceSetId: null,
      mainStats: { moon: [], star: [], sky: [] },
      subStats: [],
      ...prefs,
    },
  };
}

describe('getStatMatchScore', () => {
  it('scores an exact match 1.0', () => {
    expect(getStatMatchScore('attack-pct', 'attack-pct')).toBe(1.0);
  });

  it('scores a flat preference met by its percent 1.0 (% trumps flat)', () => {
    expect(getStatMatchScore('attack', 'attack-pct')).toBe(1.0);
    expect(getStatMatchScore('hp', 'hp-pct')).toBe(1.0);
  });

  it('scores a percent preference met by its flat 0.5', () => {
    expect(getStatMatchScore('attack-pct', 'attack')).toBe(0.5);
    expect(getStatMatchScore('defense-pct', 'defense')).toBe(0.5);
  });

  it('scores cross-crit near-misses 0.5 both ways', () => {
    expect(getStatMatchScore('crit-rate', 'crit-mult')).toBe(0.5);
    expect(getStatMatchScore('crit-mult', 'crit-rate')).toBe(0.5);
  });

  it('scores an unrelated pair 0', () => {
    expect(getStatMatchScore('attack-pct', 'defense-pct')).toBe(0);
    expect(getStatMatchScore('hp-recovery', 'hp')).toBe(0);
  });
});

describe('getScoreGrade', () => {
  it('maps scores to N2E-parity letter grades', () => {
    expect(getScoreGrade(95)).toBe('S');
    expect(getScoreGrade(82)).toBe('A');
    expect(getScoreGrade(60)).toBe('B');
    expect(getScoreGrade(40)).toBe('C');
    expect(getScoreGrade(10)).toBe('D');
  });

  it('returns empty string for insufficient data', () => {
    expect(getScoreGrade(-1)).toBe('');
  });

  it('grades exactly on the threshold boundaries (inclusive lower bound)', () => {
    expect(getScoreGrade(90)).toBe('S');
    expect(getScoreGrade(70)).toBe('A');
    expect(getScoreGrade(50)).toBe('B');
    expect(getScoreGrade(30)).toBe('C');
    expect(getScoreGrade(0)).toBe('D');
  });
});

describe('calculateRevelationScore — range & weights', () => {
  it('scores a perfect build 100', () => {
    const thief = makeThief(
      {
        sun: card('power', 'hp', ['attack', 'attack', 'attack', 'attack']),
        moon: card('power', 'attack-pct', ['attack', 'attack', 'attack', 'attack']),
        star: card('power', 'attack-pct', ['attack', 'attack', 'attack', 'attack']),
        sky: card('power', 'attack-pct', ['attack', 'attack', 'attack', 'attack']),
        space: card('meditation', 'attack', ['attack', 'attack', 'attack', 'attack']),
      },
      {
        heavensSetId: 'power',
        spaceSetId: 'meditation',
        mainStats: {
          moon: [pref('attack-pct')],
          star: [pref('attack-pct')],
          sky: [pref('attack-pct')],
        },
        subStats: [pref('attack')],
      },
    );
    expect(calculateRevelationScore(thief)).toBeCloseTo(100, 5);
  });

  it('applies the 0.35/0.30/0.35 weights — set 1, main 1, sub 0.5 → 82.5', () => {
    // Two matching subs per card (of four) → each slot sub match 0.5 → subTerm 0.5
    const two = ['attack', 'attack'];
    const thief = makeThief(
      {
        sun: card('power', 'hp', two),
        moon: card('power', 'attack-pct', two),
        star: card('power', 'attack-pct', two),
        sky: card('power', 'attack-pct', two),
        space: card('meditation', 'attack', two),
      },
      {
        heavensSetId: 'power',
        spaceSetId: 'meditation',
        mainStats: {
          moon: [pref('attack-pct')],
          star: [pref('attack-pct')],
          sky: [pref('attack-pct')],
        },
        subStats: [pref('attack')],
      },
    );
    expect(calculateRevelationScore(thief)).toBeCloseTo(82.5, 5);
  });

  it('caps a stats-only build (no set prefs) with perfect stats at 65', () => {
    const four = ['attack', 'attack', 'attack', 'attack'];
    const thief = makeThief(
      {
        sun: card('x', 'hp', four),
        moon: card('x', 'attack-pct', four),
        star: card('x', 'attack-pct', four),
        sky: card('x', 'attack-pct', four),
        space: card('x', 'attack', four),
      },
      {
        // no heavens/space preference — set term must be 0
        mainStats: {
          moon: [pref('attack-pct')],
          star: [pref('attack-pct')],
          sky: [pref('attack-pct')],
        },
        subStats: [pref('attack')],
      },
    );
    expect(calculateRevelationScore(thief)).toBeCloseTo(65, 5);
  });

  it('floors a matchless build (prefs + cards, nothing matches) at 0', () => {
    // heavens pref set but no matching cards; no main/sub prefs → every term 0.
    const thief = makeThief({ moon: card('other', 'attack-pct') }, { heavensSetId: 'power' });
    expect(calculateRevelationScore(thief)).toBe(0);
  });
});

describe('calculateRevelationScore — insufficient-data sentinel', () => {
  it('returns -1 with no preferences at all, even with cards equipped', () => {
    const thief = makeThief({ moon: card('power', 'attack-pct') });
    expect(calculateRevelationScore(thief)).toBe(-1);
  });

  it('returns -1 with preferences but no cards equipped', () => {
    const thief = makeThief({}, { heavensSetId: 'power', subStats: [pref('attack')] });
    expect(calculateRevelationScore(thief)).toBe(-1);
  });

  it('computes a numeric score for a stats-only thief with cards (not -1)', () => {
    const thief = makeThief(
      { moon: card('x', 'attack-pct') },
      { mainStats: { moon: [pref('attack-pct')], star: [], sky: [] } },
    );
    const score = calculateRevelationScore(thief);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).not.toBe(-1);
  });
});

describe('calculateRevelationScore — set term', () => {
  it('grades Heavens 4-of-4 as full (heavensMatch 1.0)', () => {
    // 4 Heavens power cards, no space. setTerm = 0.75; sun fixed main = 1.0 → mainTerm 0.2.
    // score = (0.75*0.35 + 0.2*0.30) * 100 = 32.25
    const thief = makeThief(
      { sun: card('power'), moon: card('power'), star: card('power'), sky: card('power') },
      { heavensSetId: 'power' },
    );
    expect(calculateRevelationScore(thief)).toBeCloseTo(32.25, 5);
  });

  it('grades Heavens 2-of-4 as half (heavensMatch 0.5)', () => {
    // Only moon+star match; nothing else equipped. setTerm = 0.5*0.75 = 0.375; no main/sub.
    // score = 0.375 * 0.35 * 100 = 13.125
    const thief = makeThief(
      { moon: card('power'), star: card('power') },
      { heavensSetId: 'power' },
    );
    expect(calculateRevelationScore(thief)).toBeCloseTo(13.125, 5);
  });

  it('gives no Heavens credit when heavensSetId is null', () => {
    // space match only. setTerm = 0.25; space fixed main 1.0 → mainTerm 0.2.
    // score = (0.25*0.35 + 0.2*0.30) * 100 = 14.75
    const thief = makeThief({ space: card('meditation') }, { spaceSetId: 'meditation' });
    expect(calculateRevelationScore(thief)).toBeCloseTo(14.75, 5);
  });

  it('does not credit a null Space preference against a null equipped set (no inversion)', () => {
    // moon matches its main pref; space pref null AND no space card. spaceMatch must be 0.
    // If buggy (null === null → 1) setTerm would gain 0.25 and score would rise to 14.75.
    // Correct: setTerm 0; mainTerm = moon 1.0 / 5 = 0.2 → score = 6.
    const thief = makeThief(
      { moon: card('x', 'attack-pct') },
      { mainStats: { moon: [pref('attack-pct')], star: [], sky: [] } },
    );
    expect(calculateRevelationScore(thief)).toBeCloseTo(6, 5);
  });

  it('scores a matching Space card but wrong-set nothing (spaceMatch gated on pref)', () => {
    // space pref meditation, equipped trust → spaceMatch 0; space fixed main 1.0 → 0.2.
    // score = 0.2 * 0.30 * 100 = 6
    const thief = makeThief({ space: card('trust') }, { spaceSetId: 'meditation' });
    expect(calculateRevelationScore(thief)).toBeCloseTo(6, 5);
  });
});

describe('calculateRevelationScore — main & sub terms', () => {
  it('averages main match over all five slots (all variable slots match → mainTerm 1.0)', () => {
    // All 5 equipped; moon/star/sky match; sun/space fixed. mainTerm 1.0 → score 30.
    const thief = makeThief(
      {
        sun: card('x', 'hp'),
        moon: card('x', 'attack-pct'),
        star: card('x', 'attack-pct'),
        sky: card('x', 'attack-pct'),
        space: card('x', 'attack'),
      },
      {
        mainStats: {
          moon: [pref('attack-pct')],
          star: [pref('attack-pct')],
          sky: [pref('attack-pct')],
        },
      },
    );
    expect(calculateRevelationScore(thief)).toBeCloseTo(30, 5);
  });

  it('dilutes main term with empty variable chains (only fixed Sun/Space score → 0.4)', () => {
    // hasPrefs via subStats; cards have no subs so subTerm 0. Sun+Space fixed = 2/5 = 0.4.
    // score = 0.4 * 0.30 * 100 = 12
    const thief = makeThief(
      {
        sun: card('x', 'hp'),
        moon: card('x', 'attack-pct'),
        star: card('x', 'attack-pct'),
        sky: card('x', 'attack-pct'),
        space: card('x', 'attack'),
      },
      { subStats: [pref('attack')] },
    );
    expect(calculateRevelationScore(thief)).toBeCloseTo(12, 5);
  });

  it('averages sub match over five slots (three equipped, all subs match → subTerm 0.6)', () => {
    // moon/star/sky each 4 matching subs = 1.0; sun/space empty. subTerm = 3/5 = 0.6.
    // main chains empty → 0. score = 0.6 * 0.35 * 100 = 21
    const four = ['attack', 'attack', 'attack', 'attack'];
    const thief = makeThief(
      {
        moon: card('x', 'attack-pct', four),
        star: card('x', 'attack-pct', four),
        sky: card('x', 'attack-pct', four),
      },
      { subStats: [pref('attack')] },
    );
    expect(calculateRevelationScore(thief)).toBeCloseTo(21, 5);
  });

  it('scores no sub credit when there are no sub preferences', () => {
    // moon main matches; no sub prefs → subTerm 0. mainTerm = 1/5 = 0.2 → score 6.
    const thief = makeThief(
      { moon: card('x', 'attack-pct', ['attack', 'attack', 'attack', 'attack']) },
      { mainStats: { moon: [pref('attack-pct')], star: [], sky: [] } },
    );
    expect(calculateRevelationScore(thief)).toBeCloseTo(6, 5);
  });

  it('scores a partial sub match in one slot (2 of 4 → slot 0.5 → contributes 0.1)', () => {
    // one slot, two matching subs → 0.5; /5 = 0.1 subTerm; no main. score = 0.1 * 0.35 * 100 = 3.5
    const thief = makeThief(
      { moon: card('x', 'attack-pct', ['attack', 'attack']) },
      { subStats: [pref('attack')] },
    );
    expect(calculateRevelationScore(thief)).toBeCloseTo(3.5, 5);
  });
});
