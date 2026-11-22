// Image work for Chaos Zero Nightmare combatant art. Pure functions over
// buffers — no network, no ImageKit.
//
// Meta Decks portraits are full-body 804×924 cut-outs with a wide transparent
// margin. Two derived images are uploaded:
//   - the portrait, margin trimmed, so the app's default top-anchored square
//     crop lands on the figure without a CZN-specific resolver;
//   - a square face crop for party slots. The game's 124² face icon is a scaled
//     crop of the same portrait, so it is used as a template to find the head,
//     and the crop is then cut from the portrait at full resolution.

import sharp from 'sharp';

/** Largest face crop uploaded; smaller sources are never upscaled. */
export const FACE_MAX_SIZE = 256;

// Template side used for the search — the icon downscaled 4×. Large enough to
// tell faces apart, small enough to slide over the whole portrait quickly.
const TEMPLATE_SIDE = 31;

// Candidate sizes, in portrait pixels, of the square the icon was cut from.
// Observed crops are 156–198 px; the range leaves room on both sides.
const SEARCH = { minSide: 90, maxSide: 420, step: 6 };

/**
 * A match is trusted below this mean absolute error per channel (0–255).
 * Measured over the 40 combatants of November 2026: every correct match scored
 * 6.1–23.2, and the best region for a face icon in a DIFFERENT unit's portrait
 * scored 29.0 at the lowest (36 or more for the other 39). 26 sits between the
 * two; above it the caller uploads the icon itself, which is always the right
 * face.
 */
export const FACE_MATCH_MAX_ERROR = 26;

/** Trims the fully transparent margin off a portrait cut-out. Returns webp. */
export async function trimPortrait(buffer) {
  return sharp(buffer).trim({ threshold: 0 }).webp({ quality: 92 }).toBuffer();
}

// RGB premultiplied onto black, so transparent pixels compare equal whatever
// colour hides under their zero alpha.
async function premultiplied(input, width, height) {
  const data = await sharp(input)
    .resize(width, height, { fit: 'fill' })
    .ensureAlpha()
    .raw()
    .toBuffer();
  const out = new Float32Array(width * height * 3);
  for (let i = 0; i < width * height; i++) {
    const alpha = data[i * 4 + 3] / 255;
    out[i * 3] = data[i * 4] * alpha;
    out[i * 3 + 1] = data[i * 4 + 1] * alpha;
    out[i * 3 + 2] = data[i * 4 + 2] * alpha;
  }
  return out;
}

/**
 * Finds the square region of `portrait` that `icon` was cut from.
 *
 * Returns `{ left, top, side, error, confident }` in portrait pixels, where
 * `error` is the mean absolute difference per channel of the best region and
 * `confident` is `error < FACE_MATCH_MAX_ERROR`.
 */
export async function locateFace(portrait, icon, search = SEARCH) {
  const { width, height } = await sharp(portrait).metadata();
  const T = TEMPLATE_SIDE;
  const template = await premultiplied(icon, T, T);
  const row = T * 3;

  let best = { sum: Infinity, left: 0, top: 0, side: 0 };
  for (let side = search.minSide; side <= search.maxSide; side += search.step) {
    const scale = T / side;
    const w = Math.round(width * scale);
    const h = Math.round(height * scale);
    if (w < T || h < T) continue;
    const image = await premultiplied(portrait, w, h);
    for (let y = 0; y <= h - T; y++) {
      for (let x = 0; x <= w - T; x++) {
        let sum = 0;
        // Bail out of a candidate as soon as it is worse than the best so far.
        for (let ty = 0; ty < T && sum < best.sum; ty++) {
          let p = ((y + ty) * w + x) * 3;
          let q = ty * row;
          for (let n = 0; n < row; n++) sum += Math.abs(image[p++] - template[q++]);
        }
        if (sum < best.sum) best = { sum, left: x / scale, top: y / scale, side };
      }
    }
  }

  const error = best.sum / (T * T * 3);
  const left = Math.max(0, Math.min(width - 1, Math.round(best.left)));
  const top = Math.max(0, Math.min(height - 1, Math.round(best.top)));
  const side = Math.min(best.side, width - left, height - top);
  return { left, top, side, error, confident: error < FACE_MATCH_MAX_ERROR };
}

/**
 * Cuts the square `{ left, top, side }` out of an image and returns it as webp,
 * capped at FACE_MAX_SIZE and never upscaled. Throws when the box does not fit.
 */
export async function cutFace(buffer, { left, top, side }) {
  const { width, height } = await sharp(buffer).metadata();
  if (side <= 0 || left < 0 || top < 0 || left + side > width || top + side > height) {
    throw new Error(`face box ${left},${top}+${side} falls outside the ${width}×${height} image`);
  }
  const size = Math.min(side, FACE_MAX_SIZE);
  return sharp(buffer)
    .extract({ left, top, width: side, height: side })
    .resize(size, size)
    .webp({ quality: 92 })
    .toBuffer();
}

/**
 * Face crop for art that has no face icon (Prydwen card art, a Game8 icon, an
 * overlay image): the top-anchored, horizontally centred square.
 */
export async function topSquareFace(buffer) {
  const { width, height } = await sharp(buffer).metadata();
  const side = Math.min(width, height);
  return cutFace(buffer, { left: Math.floor((width - side) / 2), top: 0, side });
}

/**
 * Builds the face crop for a Meta Decks unit.
 *
 * A manual `box` wins and skips matching. Otherwise the icon locates the face;
 * a confident match is cut from the portrait, and a weak one returns the icon
 * itself. Returns `{ buffer, source: 'manual' | 'match' | 'icon', error? }`.
 */
export async function buildFace({ portrait, icon, box }) {
  if (box) return { buffer: await cutFace(portrait, box), source: 'manual' };
  const match = await locateFace(portrait, icon);
  if (match.confident) {
    return { buffer: await cutFace(portrait, match), source: 'match', error: match.error };
  }
  return {
    buffer: await sharp(icon).webp({ quality: 92 }).toBuffer(),
    source: 'icon',
    error: match.error,
  };
}
