import { describe, it, expect } from 'vitest';
import type { DgmCopyCounts, DgmTrackedProduct, DgmTrackedVariant } from '@/types';
import {
  copyCount,
  deriveOwnership,
  isPlayable,
  ownedVariantCount,
  representativeVariant,
  variantOwned,
  variantPlayable,
} from './ownership';

const base: DgmTrackedProduct = {
  id: 'dv-25th-color-evolution',
  name: 'Digivice -25th COLOR EVOLUTION-',
  line: 'Digivice',
  series: '-25th COLOR EVOLUTION-',
  releaseYear: 2024,
  variants: [
    { id: 'a', colorway: 'Anime', releaseYear: 2024, region: 'JP', imageUrl: '/a.webp' },
    { id: 'b', colorway: 'Taichi', releaseYear: 2024, region: 'JP', imageUrl: '/b.webp' },
    { id: 'c', colorway: 'Yamato', releaseYear: 2024, region: 'JP', imageUrl: '/c.webp' },
  ],
  dbId: 'db-1',
  isFavorited: false,
  notes: '',
  progress: [],
  variantState: {},
};

const state = (copies: Partial<DgmCopyCounts>, wishlist = false): DgmTrackedVariant => ({
  wishlist,
  copies: { sealed: 0, boxed: 0, loose: 0, ...copies },
});

describe('ownership', () => {
  it('is interested with no variant state and pictures the first variant', () => {
    expect(deriveOwnership(base)).toBe('interested');
    expect(isPlayable(base)).toBe(false);
    expect(ownedVariantCount(base)).toBe(0);
    expect(copyCount(base)).toBe(0);
    expect(representativeVariant(base).id).toBe('a');
  });

  it('is wishlist when only wishlisted variants exist', () => {
    const t = { ...base, variantState: { b: state({}, true) } };
    expect(deriveOwnership(t)).toBe('wishlist');
    expect(isPlayable(t)).toBe(false);
    expect(ownedVariantCount(t)).toBe(0);
    expect(representativeVariant(t).id).toBe('a');
  });

  it('is owned when any variant has a copy, counts them, and pictures the first owned one', () => {
    const t = { ...base, variantState: { b: state({}, true), c: state({ boxed: 1 }) } };
    expect(deriveOwnership(t)).toBe('owned');
    expect(ownedVariantCount(t)).toBe(1);
    expect(copyCount(t)).toBe(1);
    expect(representativeVariant(t).id).toBe('c');
  });

  it('stays owned, not playable, when the only copy is sealed even if wishlisted', () => {
    const t = { ...base, variantState: { a: state({ sealed: 1 }, true) } };
    expect(deriveOwnership(t)).toBe('owned');
    expect(isPlayable(t)).toBe(false);
    expect(ownedVariantCount(t)).toBe(1);
    expect(copyCount(t)).toBe(1);
  });

  it('is playable with mixed copies and sums every counter', () => {
    const t = { ...base, variantState: { a: state({ sealed: 1, loose: 2 }) } };
    expect(isPlayable(t)).toBe(true);
    expect(copyCount(t)).toBe(3);
    expect(ownedVariantCount(t)).toBe(1);
  });

  it('exposes the per-variant predicates', () => {
    expect(variantOwned(undefined)).toBe(false);
    expect(variantOwned(state({}, true))).toBe(false);
    expect(variantOwned(state({ sealed: 1 }))).toBe(true);
    expect(variantPlayable(state({ sealed: 1 }))).toBe(false);
    expect(variantPlayable(state({ loose: 1 }))).toBe(true);
  });
});
