import { describe, it, expect } from 'vitest';
import { getProgressStyle, getPreviewStyle, COLOR_STOPS } from './progressGradient';

/** Pull the numeric alpha out of an `rgba(r, g, b, a)` string. */
function alphaOf(rgba: string): number {
  return Number(rgba.slice(rgba.lastIndexOf(',') + 1, -1).trim());
}

describe('getProgressStyle', () => {
  it('returns the rust anchor at the minimum value', () => {
    expect(getProgressStyle(0, 0, 100).color).toBe('rgb(138, 96, 80)');
    expect(getProgressStyle(1, 1, 60).color).toBe('rgb(138, 96, 80)');
  });

  it('returns the teal anchor at the maximum value', () => {
    expect(getProgressStyle(100, 0, 100).color).toBe('rgb(64, 200, 160)');
    expect(getProgressStyle(60, 1, 60).color).toBe('rgb(64, 200, 160)');
  });

  it('interpolates linearly between adjacent stops', () => {
    // Midpoint between rust (0) and amber (0.33): t = 0.5
    // r: 138 + 0.5*(200-138) = 169, g: 96 + 0.5*(128-96) = 112, b: 80 + 0.5*(64-80) = 72
    expect(getProgressStyle(0.165, 0, 1).color).toBe('rgb(169, 112, 72)');
  });

  it('lands exactly on intermediate anchors', () => {
    expect(getProgressStyle(0.33, 0, 1).color).toBe('rgb(200, 128, 64)'); // amber
    expect(getProgressStyle(0.67, 0, 1).color).toBe('rgb(212, 175, 55)'); // gold
  });

  it('clamps out-of-range values to the anchors', () => {
    expect(getProgressStyle(-50, 0, 100).color).toBe('rgb(138, 96, 80)');
    expect(getProgressStyle(150, 0, 100).color).toBe('rgb(64, 200, 160)');
  });

  it('treats a degenerate range (min === max) as complete', () => {
    expect(getProgressStyle(5, 5, 5).color).toBe('rgb(64, 200, 160)');
  });

  it('derives all four style fields from the same interpolated hue', () => {
    const style = getProgressStyle(0, 0, 100); // rust
    expect(style.color).toBe('rgb(138, 96, 80)');
    expect(style.borderColor).toBe('rgba(138, 96, 80, 0.5)');
    expect(style.glowColor).toBe('rgba(138, 96, 80, 0.25)');
    expect(style.activeBg).toBe('rgba(138, 96, 80, 0.12)');
  });

  it('exposes the canonical anchor stops', () => {
    expect(COLOR_STOPS).toHaveLength(4);
    expect(COLOR_STOPS[0]).toMatchObject({ pct: 0, r: 138, g: 96, b: 80 });
    expect(COLOR_STOPS[3]).toMatchObject({ pct: 1, r: 64, g: 200, b: 160 });
  });
});

describe('getPreviewStyle', () => {
  it('shares the committed hue for the same value and range', () => {
    for (const value of [0, 1, 3, 5, 6]) {
      expect(getPreviewStyle(value, 0, 6).color).toBe(getProgressStyle(value, 0, 6).color);
    }
  });

  it('is weaker than the committed style at every value', () => {
    for (const value of [0, 2, 4, 6]) {
      const preview = getPreviewStyle(value, 0, 6);
      const committed = getProgressStyle(value, 0, 6);
      expect(alphaOf(preview.borderColor)).toBeLessThan(alphaOf(committed.borderColor));
      expect(alphaOf(preview.activeBg)).toBeLessThan(alphaOf(committed.activeBg));
      expect(alphaOf(preview.glowColor)).toBeLessThan(alphaOf(committed.glowColor));
    }
  });

  it('clamps out-of-range values exactly as the committed style does', () => {
    expect(getPreviewStyle(-50, 0, 100).color).toBe(getProgressStyle(-50, 0, 100).color);
    expect(getPreviewStyle(150, 0, 100).color).toBe(getProgressStyle(150, 0, 100).color);
  });

  it('treats a degenerate range as complete, like the committed style', () => {
    expect(getPreviewStyle(5, 5, 5).color).toBe(getProgressStyle(5, 5, 5).color);
    expect(getPreviewStyle(5, 5, 5).color).toBe('rgb(64, 200, 160)');
  });
});
