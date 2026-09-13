import { describe, it, expect } from 'vitest';
import type { DgmTrackedProduct } from '@/types';
import { deriveOwnership, ownedVariantCount, representativeVariant } from './ownership';

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

describe('ownership', () => {
  it('is interested with no variant state and pictures the first variant', () => {
    expect(deriveOwnership(base)).toBe('interested');
    expect(ownedVariantCount(base)).toBe(0);
    expect(representativeVariant(base).id).toBe('a');
  });

  it('is wishlist when only wishlisted variants exist', () => {
    const t = { ...base, variantState: { b: { status: 'wishlist' as const, condition: null } } };
    expect(deriveOwnership(t)).toBe('wishlist');
    expect(ownedVariantCount(t)).toBe(0);
    expect(representativeVariant(t).id).toBe('a');
  });

  it('is owned when any variant is owned, counts them, and pictures the first owned one', () => {
    const t = {
      ...base,
      variantState: {
        b: { status: 'wishlist' as const, condition: null },
        c: { status: 'owned' as const, condition: 'boxed' as const },
      },
    };
    expect(deriveOwnership(t)).toBe('owned');
    expect(ownedVariantCount(t)).toBe(1);
    expect(representativeVariant(t).id).toBe('c');
  });
});
