// @vitest-environment node
// Unit tests for the CZN portrait trim and face-crop helpers. Fixtures are
// synthetic cut-outs drawn in-test — no game art is committed to the repo.
import { describe, it, expect, beforeAll } from 'vitest';
import sharp from 'sharp';
import {
  FACE_MAX_SIZE,
  FACE_MATCH_MAX_ERROR,
  trimPortrait,
  locateFace,
  cutFace,
  topSquareFace,
  buildFace,
} from './czn-face-crop.mjs';

const WIDTH = 804;
const HEIGHT = 924;
// The figure occupies this box; everything else is transparent margin.
const FIGURE = { left: 180, top: 170, width: 440, height: 754 };
// Where the "face" is, and so where the icon is cut from.
const FACE = { left: 316, top: 196, side: 180 };

// Deterministic pseudo-random generator, so every run draws the same figure.
function rng(seed) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

// A cut-out "figure": overlapping coloured shapes on a transparent canvas.
async function drawPortrait(seed) {
  const next = rng(seed);
  const shapes = [];
  for (let i = 0; i < 90; i++) {
    const cx = FIGURE.left + next() * FIGURE.width;
    const cy = FIGURE.top + next() * FIGURE.height;
    const r = 12 + next() * 46;
    const fill = `rgb(${Math.floor(next() * 256)},${Math.floor(next() * 256)},${Math.floor(next() * 256)})`;
    shapes.push(
      `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r.toFixed(1)}" fill="${fill}"/>`,
    );
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}"><clipPath id="c"><rect x="${FIGURE.left}" y="${FIGURE.top}" width="${FIGURE.width}" height="${FIGURE.height}"/></clipPath><g clip-path="url(#c)">${shapes.join('')}</g></svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

// The game's face icon: the face region downscaled to 124².
const drawIcon = (portrait) =>
  sharp(portrait)
    .extract({ left: FACE.left, top: FACE.top, width: FACE.side, height: FACE.side })
    .resize(124, 124)
    .webp({ quality: 90 })
    .toBuffer();

const sizeOf = async (buffer) => {
  const { width, height, format } = await sharp(buffer).metadata();
  return { width, height, format };
};

let portrait;
let icon;
let otherIcon;

beforeAll(async () => {
  portrait = await drawPortrait(7);
  icon = await drawIcon(portrait);
  otherIcon = await drawIcon(await drawPortrait(99));
});

describe('trimPortrait', () => {
  it('removes the transparent margin and returns webp', async () => {
    const { width, height, format } = await sizeOf(await trimPortrait(portrait));
    expect(format).toBe('webp');
    expect(width).toBeLessThanOrEqual(FIGURE.width);
    expect(width).toBeGreaterThan(FIGURE.width - 40);
    expect(height).toBeLessThanOrEqual(FIGURE.height);
    expect(height).toBeGreaterThan(FIGURE.height - 40);
  });
});

describe('locateFace', () => {
  it('finds the region the icon was cut from', async () => {
    const match = await locateFace(portrait, icon);
    expect(match.confident).toBe(true);
    expect(Math.abs(match.left - FACE.left)).toBeLessThanOrEqual(8);
    expect(Math.abs(match.top - FACE.top)).toBeLessThanOrEqual(8);
    expect(Math.abs(match.side - FACE.side)).toBeLessThanOrEqual(8);
  }, 60_000);

  it("reports low confidence for another unit's icon", async () => {
    const match = await locateFace(portrait, otherIcon);
    expect(match.confident).toBe(false);
    expect(match.error).toBeGreaterThanOrEqual(FACE_MATCH_MAX_ERROR);
  }, 60_000);
});

describe('cutFace', () => {
  it('cuts the box and caps the result at FACE_MAX_SIZE', async () => {
    const face = await cutFace(portrait, { left: 200, top: 200, side: 400 });
    expect(await sizeOf(face)).toEqual({
      width: FACE_MAX_SIZE,
      height: FACE_MAX_SIZE,
      format: 'webp',
    });
  });

  it('never upscales a small box', async () => {
    const face = await cutFace(portrait, FACE);
    expect(await sizeOf(face)).toEqual({ width: FACE.side, height: FACE.side, format: 'webp' });
  });

  it('throws when the box falls outside the image', async () => {
    await expect(cutFace(portrait, { left: 700, top: 0, side: 200 })).rejects.toThrow(
      'face box 700,0+200 falls outside the 804×924 image',
    );
  });
});

describe('topSquareFace', () => {
  it('takes the top-anchored square of a tall opaque image', async () => {
    const card = await sharp({
      create: { width: 262, height: 358, channels: 3, background: '#336699' },
    })
      .jpeg()
      .toBuffer();
    expect(await sizeOf(await topSquareFace(card))).toEqual({
      width: FACE_MAX_SIZE,
      height: FACE_MAX_SIZE,
      format: 'webp',
    });
  });

  it('keeps a small square icon at its own size', async () => {
    const small = await sharp({
      create: { width: 150, height: 150, channels: 4, background: '#33669980' },
    })
      .png()
      .toBuffer();
    expect(await sizeOf(await topSquareFace(small))).toEqual({
      width: 150,
      height: 150,
      format: 'webp',
    });
  });
});

describe('buildFace', () => {
  it('uses a manual box without matching', async () => {
    const result = await buildFace({
      portrait,
      icon: otherIcon,
      box: { left: 10, top: 20, side: 100 },
    });
    expect(result.source).toBe('manual');
    expect(await sizeOf(result.buffer)).toEqual({ width: 100, height: 100, format: 'webp' });
  });

  it('cuts the matched region from the portrait', async () => {
    const result = await buildFace({ portrait, icon });
    expect(result.source).toBe('match');
    const { width } = await sizeOf(result.buffer);
    expect(Math.abs(width - FACE.side)).toBeLessThanOrEqual(8);
  }, 60_000);

  it('falls back to the icon on a weak match', async () => {
    const result = await buildFace({ portrait, icon: otherIcon });
    expect(result.source).toBe('icon');
    expect(await sizeOf(result.buffer)).toEqual({ width: 124, height: 124, format: 'webp' });
  }, 60_000);
});
