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
    skillProgress: 0,
    mindscapeProgress: 0,
    weaponRarity: 2,
    weaponLevel: 1,
    weaponForge: 0,
    revelations: { sun: null, moon: null, star: null, sky: null, space: null, ...revelations },
    revelationPreferences: {
      heavensSetId: null,
      spaceSetId: null,
      mainStats: { moon: [], star: [], sky: [] },
      subStats: [],
      comments: '',
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
    // Per-slot sub vs achievable: sun [attack] over achievable 2.0 (attack + attack-pct,
    // main hp excluded) = 0.5; space [attack-pct] over 1.0 (only attack-pct survives the
    // dual attack+defense exclusion) = 1.0; moon [attack] over 1.0 (attack-pct is the
    // main) = 1.0; star/sky no subs = 0. subTerm (0.5+1+1+0+0)/5 = 0.5.
    const thief = makeThief(
      {
        sun: card('power', 'hp', ['attack']),
        moon: card('power', 'attack-pct', ['attack']),
        star: card('power', 'attack-pct', []),
        sky: card('power', 'attack-pct', []),
        space: card('meditation', 'attack', ['attack-pct']),
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

  it('floors a matchless build (every preference expressed and missed) at 0', () => {
    // Wrong set, wrong main, sub pref achievable (speed 1.0) but not equipped → all 0.
    const thief = makeThief(
      { moon: card('other', 'attack-pct') },
      {
        heavensSetId: 'power',
        mainStats: { moon: [pref('hp-pct')], star: [], sky: [] },
        subStats: [pref('speed')],
      },
    );
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
    // 4 Heavens power cards, no space. setTerm = 0.75. Empty chains are don't-care on
    // the 4 occupied slots → mainTerm 0.8, subTerm 0.8 (empty space slot dilutes both).
    // score = (0.75*0.35 + 0.8*0.30 + 0.8*0.35) * 100 = 78.25
    const thief = makeThief(
      { sun: card('power'), moon: card('power'), star: card('power'), sky: card('power') },
      { heavensSetId: 'power' },
    );
    expect(calculateRevelationScore(thief)).toBeCloseTo(78.25, 5);
  });

  it('grades Heavens 2-of-4 as half (heavensMatch 0.5)', () => {
    // Only moon+star equipped. setTerm = 0.5*0.75 = 0.375; don't-care main/sub on the
    // 2 occupied slots → 0.4 each. score = (0.375*0.35 + 0.4*0.65) * 100 = 39.125
    const thief = makeThief(
      { moon: card('power'), star: card('power') },
      { heavensSetId: 'power' },
    );
    expect(calculateRevelationScore(thief)).toBeCloseTo(39.125, 5);
  });

  it('gives no Heavens credit when heavensSetId is null', () => {
    // space match only. setTerm = 0.25; space fixed main + don't-care sub → 0.2 each.
    // score = (0.25*0.35 + 0.2*0.30 + 0.2*0.35) * 100 = 21.75
    const thief = makeThief({ space: card('meditation') }, { spaceSetId: 'meditation' });
    expect(calculateRevelationScore(thief)).toBeCloseTo(21.75, 5);
  });

  it('does not credit a null Space preference against a null equipped set (no inversion)', () => {
    // moon matches its main pref; space pref null AND no space card. spaceMatch must be 0.
    // If buggy (null === null → 1) setTerm would gain 0.25 and score would rise to 21.75.
    // Correct: setTerm 0; main 0.2, sub don't-care 0.2 → (0.2*0.65) * 100 = 13.
    const thief = makeThief(
      { moon: card('x', 'attack-pct') },
      { mainStats: { moon: [pref('attack-pct')], star: [], sky: [] } },
    );
    expect(calculateRevelationScore(thief)).toBeCloseTo(13, 5);
  });

  it('scores a matching Space card but wrong-set nothing (spaceMatch gated on pref)', () => {
    // space pref meditation, equipped trust → spaceMatch 0; fixed main + don't-care sub.
    // score = (0.2*0.30 + 0.2*0.35) * 100 = 13
    const thief = makeThief({ space: card('trust') }, { spaceSetId: 'meditation' });
    expect(calculateRevelationScore(thief)).toBeCloseTo(13, 5);
  });
});

describe('calculateRevelationScore — main & sub terms', () => {
  it('averages main match over all five slots (all variable slots match → mainTerm 1.0)', () => {
    // All 5 equipped; moon/star/sky match; sun/space fixed. mainTerm 1.0; empty sub
    // chain is don't-care → subTerm 1.0. score = (0.30 + 0.35) * 100 = 65.
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
    expect(calculateRevelationScore(thief)).toBeCloseTo(65, 5);
  });

  it("treats empty variable main chains as don't-care (mainTerm 1.0)", () => {
    // hasPrefs via subStats; all 5 occupied with no sub rolls → subTerm 0 (achievable
    // positive, nothing equipped). Empty main chains max the main term instead of
    // diluting it. score = 1.0 * 0.30 * 100 = 30.
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
    expect(calculateRevelationScore(thief)).toBeCloseTo(30, 5);
  });

  it('averages sub match over five slots (three equipped and maxed → subTerm 0.6)', () => {
    // moon/star/sky subs cover their achievable sums (clamped) = 1.0 each; sun/space
    // empty slots → 0. subTerm 3/5. Main don't-care on the 3 occupied → mainTerm 3/5.
    // score = (0.6*0.30 + 0.6*0.35) * 100 = 39
    const four = ['attack', 'attack', 'attack', 'attack'];
    const thief = makeThief(
      {
        moon: card('x', 'attack-pct', four),
        star: card('x', 'attack-pct', four),
        sky: card('x', 'attack-pct', four),
      },
      { subStats: [pref('attack')] },
    );
    expect(calculateRevelationScore(thief)).toBeCloseTo(39, 5);
  });

  it("treats an empty sub chain as don't-care on the occupied slot", () => {
    // moon main matches; no sub prefs → moon's sub is don't-care 1.0 → subTerm 1/5.
    // score = ((1/5)*0.30 + (1/5)*0.35) * 100 = 13.
    const thief = makeThief(
      { moon: card('x', 'attack-pct', ['attack', 'attack', 'attack', 'attack']) },
      { mainStats: { moon: [pref('attack-pct')], star: [], sky: [] } },
    );
    expect(calculateRevelationScore(thief)).toBeCloseTo(13, 5);
  });

  it('scores a partial cross-crit sub against the crit-pair achievable sum', () => {
    // moon sub pref [crit-rate]: achievable 1.5 (crit-rate 1.0 + crit-mult 0.5, main
    // attack-pct not a crit). Equipped [crit-mult] = 0.5 → slot 1/3 → subTerm (1/3)/5.
    // Main chain empty → don't-care → mainTerm 1/5.
    // score = ((1/5)*0.30 + ((1/3)/5)*0.35) * 100 = 8.33333
    const thief = makeThief(
      { moon: card('x', 'attack-pct', ['crit-mult']) },
      { subStats: [pref('crit-rate')] },
    );
    expect(calculateRevelationScore(thief)).toBeCloseTo(8.33333, 4);
  });
});
