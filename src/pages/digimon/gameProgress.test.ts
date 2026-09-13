import { describe, it, expect } from 'vitest';
import type { DgmProgressGuide } from '@/data/digimon/products';
import { computeProgress, toggleProgressItem } from '@/pages/digimon/gameProgress';

const guide: DgmProgressGuide = {
  overall: 'track-mean',
  tracks: [
    {
      id: 'partners',
      label: 'Partners',
      groups: [
        {
          id: 'taichi',
          label: 'Taichi',
          items: [
            { id: 'partners:koromon', label: 'Koromon' },
            { id: 'partners:agumon', label: 'Agumon', requires: ['partners:koromon'] },
            { id: 'partners:greymon', label: 'Greymon', requires: ['partners:agumon'] },
            { id: 'partners:metalgreymon', label: 'MetalGreymon', requires: ['partners:greymon'] },
            { id: 'partners:skullgreymon', label: 'SkullGreymon', requires: ['partners:greymon'] },
          ],
        },
      ],
    },
    {
      id: 'friends',
      label: 'Friends',
      groups: [
        {
          id: 'iv',
          label: 'Stage IV',
          items: [
            { id: 'friends:a', label: 'A' },
            { id: 'friends:b', label: 'B' },
            { id: 'friends:c', label: 'C' },
            { id: 'friends:d', label: 'D' },
          ],
        },
      ],
    },
    { id: 'empty', label: 'Empty', groups: [] },
  ],
};

describe('computeProgress', () => {
  it('reports done / total / percent per track and ignores unknown ids', () => {
    const { tracks } = computeProgress(guide, [
      'partners:koromon',
      'partners:agumon',
      'friends:a',
      'nope:x',
    ]);
    expect(tracks).toEqual([
      { id: 'partners', label: 'Partners', done: 2, total: 5, percent: 40 },
      { id: 'friends', label: 'Friends', done: 1, total: 4, percent: 25 },
      { id: 'empty', label: 'Empty', done: 0, total: 0, percent: 0 },
    ]);
  });

  it('track-mean averages track percentages', () => {
    const tracked: DgmProgressGuide = {
      ...guide,
      tracks: [mk('a', 100), mk('b', 100), mk('c', 100)],
    };
    // 45% + 26% + 51% → mean 40.67 → 41
    const done = [...ids('a', 45), ...ids('b', 26), ...ids('c', 51)];
    expect(computeProgress(tracked, done).overall).toBe(41);
  });

  it('item-weighted uses the ratio over all items', () => {
    const tracked: DgmProgressGuide = {
      ...guide,
      overall: 'item-weighted',
      tracks: [mk('a', 40), mk('b', 82), mk('c', 37)],
    };
    // 58 done of 159 → 36.47 → 36
    const done = [...ids('a', 18), ...ids('b', 21), ...ids('c', 19)];
    expect(computeProgress(tracked, done).overall).toBe(36);
  });

  it('a guide with no tracks reads 0%', () => {
    expect(computeProgress({ ...guide, tracks: [] }, []).overall).toBe(0);
  });
});

describe('toggleProgressItem', () => {
  it('checking pulls prerequisites transitively', () => {
    expect(toggleProgressItem(guide, [], 'partners:greymon')).toEqual([
      'partners:koromon',
      'partners:agumon',
      'partners:greymon',
    ]);
  });

  it('unchecking drops dependents transitively', () => {
    const before = [
      'partners:koromon',
      'partners:agumon',
      'partners:greymon',
      'partners:metalgreymon',
      'partners:skullgreymon',
      'friends:a',
    ];
    expect(toggleProgressItem(guide, before, 'partners:agumon')).toEqual([
      'partners:koromon',
      'friends:a',
    ]);
  });

  it('toggling an independent item only affects that item', () => {
    expect(toggleProgressItem(guide, ['friends:a'], 'friends:b')).toEqual([
      'friends:a',
      'friends:b',
    ]);
    expect(toggleProgressItem(guide, ['friends:a', 'friends:b'], 'friends:a')).toEqual([
      'friends:b',
    ]);
  });

  it('drops unknown ids and returns catalog order', () => {
    expect(toggleProgressItem(guide, ['stale:id', 'friends:b'], 'friends:a')).toEqual([
      'friends:a',
      'friends:b',
    ]);
  });

  it('toggling an unknown id is a no-op apart from cleanup', () => {
    expect(toggleProgressItem(guide, ['friends:a', 'stale:id'], 'nope:x')).toEqual(['friends:a']);
  });
});

// Builds a one-group track with `n` plain items `${id}:0..n-1`.
function mk(id: string, n: number) {
  return {
    id,
    label: id,
    groups: [
      {
        id: 'g',
        label: 'g',
        items: Array.from({ length: n }, (_, i) => ({ id: `${id}:${i}`, label: `${id} ${i}` })),
      },
    ],
  };
}
function ids(id: string, n: number) {
  return Array.from({ length: n }, (_, i) => `${id}:${i}`);
}
