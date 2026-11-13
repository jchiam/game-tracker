import { describe, it, expect } from 'vitest';
import { calculateFragmentScore, getStatMatchScore } from '@/utils/fragmentScoring';
import type { CznFragmentBuildPreferences, CznTrackedCombatant } from '@/types';
import type { CznEquippedFragment } from '@/data/chaos-zero-nightmare/fragments';

const emptyPrefs: CznFragmentBuildPreferences = {
  mainStats: { 4: [], 5: [], 6: [] },
  subStats: [],
  targetSetIds: [],
  comments: '',
};

function chain(...stats: string[]) {
  return stats.map((stat, orderIndex) => ({ stat, operator: null, orderIndex }));
}

function piece(
  setId: string | null,
  mainStat: string | null,
  subStats: string[] = [],
): CznEquippedFragment {
  return { setId, mainStat, subStats };
}

function combatantWith(
  fragments: Partial<CznTrackedCombatant['fragments']>,
  prefs: Partial<CznFragmentBuildPreferences>,
): CznTrackedCombatant {
  return {
    id: 'mei-lin',
    name: 'Mei Lin',
    rarity: 5,
    class: 'Striker',
    element: 'Passion',
    faction: null,
    imageUrl: '/assets/chaos-zero-nightmare/combatants/mei-lin.webp',
    isFavorited: false,
    level: 60,
    ego: 0,
    potentialAttained: false,
    partnerId: null,
    partnerLevel: 1,
    partnerEgo: 0,
    partnerPreferences: [],
    fragments: { 1: null, 2: null, 3: null, 4: null, 5: null, 6: null, ...fragments },
    fragmentPreferences: { ...emptyPrefs, mainStats: { 4: [], 5: [], 6: [] }, ...prefs },
  };
}

const SPARK = 'spark-of-passion'; // 4-PC
const WING = 'black-wing'; // 2-PC
const CORPSE = 'cursed-corpse'; // 2-PC
const SCARAB = 'seth-s-scarab'; // 2-PC

describe('calculateFragmentScore sentinels', () => {
  it('returns -1 when no preferences are set', () => {
    expect(calculateFragmentScore(combatantWith({ 4: piece(SPARK, 'ATK%') }, {}))).toBe(-1);
  });

  it('returns -1 when no pieces are equipped', () => {
    expect(calculateFragmentScore(combatantWith({}, { targetSetIds: [SPARK] }))).toBe(-1);
  });
});

describe('calculateFragmentScore set term', () => {
  it('scores 100 for a perfect 4-PC + 2-PC build with matching mains and subs', () => {
    const subs = ['Critical Chance%', 'Critical Damage%', 'ATK%', 'Flat ATK'];
    const c = combatantWith(
      {
        1: piece(SPARK, 'Flat ATK', ['Critical Chance%', 'Critical Damage%', 'ATK%', 'Flat HP']),
        2: piece(SPARK, 'Flat DEF', subs),
        3: piece(SPARK, 'Flat HP', subs),
        4: piece(SPARK, 'Critical Chance%', ['Critical Damage%', 'ATK%', 'Flat ATK', 'Flat HP']),
        5: piece(WING, 'Passion Damage%', subs),
        6: piece(WING, 'ATK%', ['Critical Chance%', 'Critical Damage%', 'Flat ATK', 'Flat HP']),
      },
      {
        targetSetIds: [SPARK, WING],
        mainStats: {
          4: chain('Critical Chance%'),
          5: chain('Passion Damage%'),
          6: chain('ATK%'),
        },
        subStats: chain('Critical Chance%', 'Critical Damage%', 'ATK%', 'Flat ATK'),
      },
    );
    expect(calculateFragmentScore(c)).toBeCloseTo(100);
  });

  it('surplus pieces of a 4-PC target do not count beyond four (4/6 set term)', () => {
    const six = combatantWith(
      {
        1: piece(SPARK, 'Flat ATK'),
        2: piece(SPARK, 'Flat DEF'),
        3: piece(SPARK, 'Flat HP'),
        4: piece(SPARK, 'ATK%'),
        5: piece(SPARK, 'ATK%'),
        6: piece(SPARK, 'ATK%'),
      },
      { targetSetIds: [SPARK] },
    );
    // Set 4/6 × 0.35 + mains don't-care 0.30 + no sub prefs (achievable 0 → full) 0.35.
    expect(calculateFragmentScore(six)).toBeCloseTo(((4 / 6) * 0.35 + 0.3 + 0.35) * 100);
  });

  it('one piece of a 2-PC target contributes half its share (1/6)', () => {
    // Same occupancy (slots 5 and 6 filled) so only the set term differs: 1/6 vs 2/6.
    const one = combatantWith(
      { 5: piece(WING, 'ATK%'), 6: piece(SPARK, 'ATK%') },
      { targetSetIds: [WING] },
    );
    const two = combatantWith(
      { 5: piece(WING, 'ATK%'), 6: piece(WING, 'ATK%') },
      { targetSetIds: [WING] },
    );
    expect(calculateFragmentScore(two) - calculateFragmentScore(one)).toBeCloseTo(
      (1 / 6) * 0.35 * 100,
    );
  });

  it('a 2+2+2 composition fully worn scores a full set term', () => {
    const triple = combatantWith(
      {
        1: piece(WING, 'Flat ATK'),
        2: piece(WING, 'Flat DEF'),
        3: piece(CORPSE, 'Flat HP'),
        4: piece(CORPSE, 'ATK%'),
        5: piece(SCARAB, 'ATK%'),
        6: piece(SCARAB, 'ATK%'),
      },
      { targetSetIds: [WING, CORPSE, SCARAB] },
    );
    // Set 1.0 × 0.35 + mains don't-care 0.30 + no sub prefs 0.35.
    expect(calculateFragmentScore(triple)).toBeCloseTo(100);
  });

  it('an under-filled 2+2 composition caps the set term at 4/6', () => {
    const pair = combatantWith(
      {
        1: piece(WING, 'Flat ATK'),
        2: piece(WING, 'Flat DEF'),
        3: piece(CORPSE, 'Flat HP'),
        4: piece(CORPSE, 'ATK%'),
        5: piece(SCARAB, 'ATK%'),
        6: piece(SCARAB, 'ATK%'),
      },
      { targetSetIds: [WING, CORPSE] },
    );
    expect(calculateFragmentScore(pair)).toBeCloseTo(((4 / 6) * 0.35 + 0.3 + 0.35) * 100);
  });

  it('composition order does not change the set term', () => {
    const fragments = {
      1: piece(SPARK, 'Flat ATK'),
      2: piece(SPARK, 'Flat DEF'),
      3: piece(SPARK, 'Flat HP'),
      4: piece(SPARK, 'ATK%'),
      5: piece(WING, 'ATK%'),
      6: piece(WING, 'ATK%'),
    };
    expect(calculateFragmentScore(combatantWith(fragments, { targetSetIds: [WING, SPARK] }))).toBe(
      calculateFragmentScore(combatantWith(fragments, { targetSetIds: [SPARK, WING] })),
    );
  });

  it('an id missing from the catalog contributes zero', () => {
    const fragments = { 5: piece(WING, 'ATK%'), 6: piece(WING, 'ATK%') };
    expect(
      calculateFragmentScore(combatantWith(fragments, { targetSetIds: ['no-such-set', WING] })),
    ).toBe(calculateFragmentScore(combatantWith(fragments, { targetSetIds: [WING] })));
  });

  it('a set absent from the composition contributes nothing', () => {
    const only2 = combatantWith(
      { 5: piece(WING, 'ATK%'), 6: piece(WING, 'ATK%') },
      { targetSetIds: [WING] },
    );
    const both = combatantWith(
      {
        1: piece(SPARK, 'Flat ATK'),
        2: piece(SPARK, 'Flat DEF'),
        3: piece(SPARK, 'Flat HP'),
        4: piece(SPARK, 'ATK%'),
        5: piece(WING, 'ATK%'),
        6: piece(WING, 'ATK%'),
      },
      { targetSetIds: [SPARK, WING] },
    );
    expect(calculateFragmentScore(only2)).toBeLessThan(calculateFragmentScore(both));
  });
});

describe('calculateFragmentScore slot mains', () => {
  it('fixed slots 1–3 always contribute a full main match', () => {
    const prefs = { mainStats: { 4: chain('Critical Chance%'), 5: [], 6: [] } };
    const c = combatantWith({ 3: piece(SPARK, 'Flat HP') }, prefs);
    // Set 0; one of six slots occupied with main 1.0 and a vacuous sub term.
    expect(calculateFragmentScore(c)).toBeCloseTo(((0.3 + 0.35) / 6) * 100);
    // The stored main never matters on a fixed slot.
    const odd = combatantWith({ 3: piece(SPARK, 'ATK%') }, prefs);
    expect(calculateFragmentScore(odd)).toBe(calculateFragmentScore(c));
  });

  it('an exact-match-only main scores 0 against a different preferred stat', () => {
    const wrong = combatantWith(
      { 5: piece(SPARK, 'HP%') },
      { mainStats: { 4: [], 5: chain('Void Damage%'), 6: [] } },
    );
    const right = combatantWith(
      { 5: piece(SPARK, 'Void Damage%') },
      { mainStats: { 4: [], 5: chain('Void Damage%'), 6: [] } },
    );
    // One slot of six swings between main 0 and main 1.0.
    expect(calculateFragmentScore(right) - calculateFragmentScore(wrong)).toBeCloseTo(
      (0.3 / 6) * 100,
    );
  });

  it('a chain with no equipped main scores 0 for that slot', () => {
    const c = combatantWith(
      { 4: piece(SPARK, null) },
      { mainStats: { 4: chain('ATK%'), 5: [], 6: [] } },
    );
    // Main 0; the sub term is vacuous (no sub chain) so that slot still earns its sub share.
    expect(calculateFragmentScore(c)).toBeCloseTo((0.35 / 6) * 100);
  });
});

describe('CZN stat shapes', () => {
  it('matches flat and percent forms of one base per the shared rule', () => {
    expect(getStatMatchScore('Flat ATK', 'ATK%')).toBeGreaterThan(0);
    expect(getStatMatchScore('Flat ATK', 'ATK%')).toBe(getStatMatchScore('Flat HP', 'HP%'));
    expect(getStatMatchScore('ATK%', 'ATK%')).toBe(1);
  });

  it('cross-matches Critical Chance% and Critical Damage% partially', () => {
    const cross = getStatMatchScore('Critical Chance%', 'Critical Damage%');
    expect(cross).toBeGreaterThan(0);
    expect(cross).toBeLessThan(1);
  });

  it('exact-matches element Damage%, Ego Recovery, and the special substats only', () => {
    expect(getStatMatchScore('Void Damage%', 'Void Damage%')).toBe(1);
    expect(getStatMatchScore('Void Damage%', 'Passion Damage%')).toBe(0);
    expect(getStatMatchScore('Ego Recovery', 'ATK%')).toBe(0);
    expect(getStatMatchScore('Extra Damage%', 'Damage over Time%')).toBe(0);
  });
});
