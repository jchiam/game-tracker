import { describe, it, expect, vi } from 'vitest';
import {
  N2E_STAT_ORDER,
  N2E_STAT_RENAME,
  orderByList,
  unlistedStats,
  orderN2eStats,
} from './statOrder.mjs';
import { N2E_STAT_RENAME as RUNTIME_RENAME } from '../../src/data/neverness-to-everness/statLabelRename';

describe('orderByList', () => {
  it('sorts labels by their index in the order list', () => {
    const order = ['a', 'b', 'c', 'd'];
    expect(orderByList(['c', 'a', 'd', 'b'], order)).toEqual(['a', 'b', 'c', 'd']);
  });

  it('appends unlisted labels at the end, preserving their relative order (stable)', () => {
    const order = ['a', 'b'];
    expect(orderByList(['x', 'b', 'y', 'a'], order)).toEqual(['a', 'b', 'x', 'y']);
  });

  it('does not mutate the input', () => {
    const input = ['b', 'a'];
    orderByList(input, ['a', 'b']);
    expect(input).toEqual(['b', 'a']);
  });
});

describe('unlistedStats', () => {
  it('returns only labels absent from the order list', () => {
    expect(unlistedStats(['a', 'x', 'b', 'y'], ['a', 'b'])).toEqual(['x', 'y']);
  });

  it('returns empty when all are listed', () => {
    expect(unlistedStats(['a', 'b'], ['a', 'b', 'c'])).toEqual([]);
  });
});

describe('orderN2eStats', () => {
  it('renames raw API sub-stat labels to in-game form and orders them semantically', () => {
    const rawSub = [
      'ATK',
      'ATK %',
      'HP',
      'HP %',
      'DEF',
      'DEF %',
      'CRIT Rate %',
      'CRIT DMG %',
      'Universal DMG Bonus %',
      'Cycle Intensity',
      'Break Intensity',
    ];
    expect(orderN2eStats(rawSub)).toEqual([
      'ATK',
      'ATK%',
      'CRIT Rate',
      'CRIT DMG',
      'DMG%',
      'Break Intensity',
      'HP',
      'HP%',
      'DEF',
      'DEF%',
      'Cycle Intensity',
    ]);
  });

  it('renames raw API main-stat labels to in-game form and orders them semantically', () => {
    const rawMain = [
      'ATK %',
      'HP %',
      'DEF %',
      'CRIT Rate %',
      'CRIT DMG %',
      'Healing Bonus %',
      'Cosmos DMG Bonus %',
      'Anima DMG Bonus %',
      'Incantation DMG Bonus %',
      'Psyche DMG Bonus %',
      'Chaos DMG Bonus %',
      'Lakshana DMG Bonus %',
      'Mental DMG Bonus %',
      'Cycle Intensity',
      'Break Intensity',
    ];
    expect(orderN2eStats(rawMain)).toEqual([
      'ATK%',
      'CRIT Rate',
      'CRIT DMG',
      'Cosmos DMG Bonus',
      'Anima DMG Bonus',
      'Incantation DMG Bonus',
      'Psyche DMG Bonus',
      'Chaos DMG Bonus',
      'Lakshana DMG Bonus',
      'Mental DMG Bonus',
      'Break Intensity',
      'HP%',
      'DEF%',
      'Cycle Intensity',
      'Healing Bonus',
    ]);
  });

  it('appends an unknown stat at the end and warns (surfaces it, never drops it)', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const result = orderN2eStats(['New DMG Bonus %', 'ATK', 'HP']);
    expect(result).toEqual(['ATK', 'HP', 'New DMG Bonus %']);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('New DMG Bonus %'));
    warn.mockRestore();
  });

  it('N2E_STAT_ORDER has no duplicates', () => {
    expect(new Set(N2E_STAT_ORDER).size).toBe(N2E_STAT_ORDER.length);
  });

  it('runtime back-compat rename map covers every generation-time pair (no silent divergence)', () => {
    for (const [oldLabel, newLabel] of Object.entries(N2E_STAT_RENAME)) {
      expect(RUNTIME_RENAME[oldLabel]).toBe(newLabel);
    }
  });
});
