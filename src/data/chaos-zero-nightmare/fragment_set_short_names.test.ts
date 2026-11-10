import { describe, it, expect } from 'vitest';
import { ALL_CZN_FRAGMENT_SETS } from '@/data/chaos-zero-nightmare/fragment_sets';
import { CZN_FRAGMENT_SET_SHORT_NAMES } from '@/data/chaos-zero-nightmare/fragment_set_short_names';
import {
  CZN_FRAGMENT_FIXED_MAINS,
  CZN_FRAGMENT_MAIN_STATS,
  CZN_FRAGMENT_SUB_STATS,
} from '@/data/chaos-zero-nightmare/fragments';

describe('CZN_FRAGMENT_SET_SHORT_NAMES', () => {
  it('keys only ids that exist in the generated set catalog', () => {
    const ids = new Set(ALL_CZN_FRAGMENT_SETS.map((s) => s.id));
    for (const key of Object.keys(CZN_FRAGMENT_SET_SHORT_NAMES)) {
      expect(ids.has(key), `short name key ${key} is not a catalog id`).toBe(true);
    }
  });

  it('covers every catalog set', () => {
    for (const set of ALL_CZN_FRAGMENT_SETS) {
      expect(CZN_FRAGMENT_SET_SHORT_NAMES[set.id], `no short name for ${set.id}`).toBeTruthy();
    }
  });
});

describe('CZN fragment slot model', () => {
  it('every set is a 2-piece or 4-piece set', () => {
    for (const set of ALL_CZN_FRAGMENT_SETS) {
      expect([2, 4]).toContain(set.pieces);
    }
  });

  it('fixed mains are not offered as mains elsewhere but are valid substats', () => {
    const fixed = Object.values(CZN_FRAGMENT_FIXED_MAINS);
    for (const pool of Object.values(CZN_FRAGMENT_MAIN_STATS)) {
      for (const stat of fixed) expect(pool).not.toContain(stat);
    }
    for (const stat of fixed) expect(CZN_FRAGMENT_SUB_STATS).toContain(stat);
  });

  it('substat pool has no duplicates', () => {
    expect(new Set(CZN_FRAGMENT_SUB_STATS).size).toBe(CZN_FRAGMENT_SUB_STATS.length);
  });
});
