import { describe, it, expect } from 'vitest';
import { ALL_PRODUCTS, DGM_LINES } from '@/data/digimon/products';

describe('product catalog', () => {
  it('has unique product ids and unique variant ids across the catalog', () => {
    const productIds = ALL_PRODUCTS.map((p) => p.id);
    expect(new Set(productIds).size).toBe(productIds.length);
    const variantIds = ALL_PRODUCTS.flatMap((p) => p.variants.map((v) => v.id));
    expect(new Set(variantIds).size).toBe(variantIds.length);
  });

  it('gives every product at least one variant and a year no later than its variants', () => {
    for (const p of ALL_PRODUCTS) {
      expect(p.variants.length).toBeGreaterThan(0);
      expect(p.releaseYear).toBe(Math.min(...p.variants.map((v) => v.releaseYear)));
      for (const v of p.variants) {
        expect(v.imageUrl).toBe(`/assets/digimon/devices/${v.id}.webp`);
      }
    }
  });

  it('lists every product line in DGM_LINES in first-appearance order', () => {
    const seen: string[] = [];
    for (const p of ALL_PRODUCTS) if (!seen.includes(p.line)) seen.push(p.line);
    expect(DGM_LINES).toEqual(seen);
  });

  it('keeps guide item ids prefixed by their track and every requires resolvable', () => {
    for (const p of ALL_PRODUCTS) {
      if (!p.guide) continue;
      const ids = new Set<string>();
      for (const track of p.guide.tracks) {
        for (const group of track.groups) {
          for (const item of group.items) {
            expect(item.id.startsWith(`${track.id}:`)).toBe(true);
            expect(ids.has(item.id)).toBe(false);
            ids.add(item.id);
          }
        }
      }
      for (const track of p.guide.tracks) {
        for (const group of track.groups) {
          for (const item of group.items) {
            for (const req of item.requires ?? []) expect(ids.has(req)).toBe(true);
          }
        }
      }
    }
  });

  it('describes the Digivice -25th COLOR EVOLUTION- with three variants and a two-track guide', () => {
    const dvc = ALL_PRODUCTS.find((p) => p.id === 'dv-25th-color-evolution');
    expect(dvc).toBeDefined();
    expect(dvc?.variants).toHaveLength(3);
    expect(dvc?.guide?.overall).toBe('track-mean');
    expect(dvc?.guide?.tracks.map((t) => t.id)).toEqual(['partners', 'map']);
    const count = (i: number) =>
      dvc?.guide?.tracks[i].groups.reduce((n, g) => n + g.items.length, 0);
    expect(count(0)).toBe(22);
    expect(count(1)).toBe(69);

    // Secret areas sit directly under their location; Digital Forest has none.
    const fileIsland = dvc?.guide?.tracks[1].groups[0].items.map((i) => i.label) ?? [];
    expect(fileIsland.slice(0, 4)).toEqual([
      'Tropical Jungle',
      'Tropical Jungle · secret area',
      'Lake',
      'Lake · secret area',
    ]);
    const spiral = dvc?.guide?.tracks[1].groups.find((g) => g.label === 'Spiral Mountain')!;
    const forestIdx = spiral.items.findIndex((i) => i.label === 'Digital Forest');
    expect(spiral.items[forestIdx + 1].label).toBe('Digital City');
    for (const group of dvc?.guide?.tracks[1].groups ?? []) {
      for (const item of group.items) {
        if (item.id.endsWith('-secret')) {
          expect(item.hint?.startsWith('Secret · ')).toBe(true);
          expect(item.requires).toBeUndefined();
        }
      }
    }
    const omegamon = dvc?.guide?.tracks[0].groups
      .flatMap((g) => g.items)
      .find((i) => i.id === 'partners:omegamon');
    expect(omegamon?.requires).toEqual(
      expect.arrayContaining([
        'partners:taichi-war-greymon',
        'partners:yamato-metal-garurumon',
        'map:subspace',
      ]),
    );
  });
});
