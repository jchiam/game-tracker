// Art-source rules for Chaos Zero Nightmare combatants: which source supplies
// each portrait, when a source failure degrades and when it aborts, and when a
// face crop is rebuilt. Network and ImageKit access are injected, so the rules
// are testable without either.
//
// Portrait order per combatant: CZN Meta Decks → Prydwen card art → Game8 icon.

import { joinCombatantArt, portraitUrl, faceIconUrl } from './czn-metadecks.mjs';
import { buildFace, topSquareFace } from './czn-face-crop.mjs';

/**
 * Turns the parsed `--reupload-*` flags into the two combatant modes. A
 * portrait reupload redoes the faces cut from it; faces can be redone alone.
 */
export function combatantReuploadModes({ all = false, flags = {} }) {
  const portraits = all || !!flags.combatants;
  return { portraits, faces: portraits || !!flags['combatant-faces'] };
}

/**
 * Resolves each listed combatant's portrait source.
 *
 * - `fetchMetaDecksUnits()` → `[{ charId, name }]`. A failure warns and leaves
 *   every combatant on the fallback chain, unless portraits or faces are being
 *   re-uploaded, where good art would be replaced by worse: then it throws.
 * - `fetchPrydwenNodes()` → `Map<slug, node>` and `fetchPrydwenCardUrl(id)` →
 *   url or null. Asked only about combatants Meta Decks lacks. A failure warns
 *   and leaves the affected combatants on their Game8 icon, unless portraits
 *   are being re-uploaded: then it throws.
 *
 * Returns `Map<id, source>` where source is
 * `{ kind: 'metadecks', sourceUrl, charId, faceBox? }`,
 * `{ kind: 'prydwen', sourceUrl }`, or `{ kind: 'game8', sourceUrl | null }`.
 */
export async function resolveCombatantArt(
  combatants,
  {
    overrides = new Map(),
    overridesLabel = 'art overrides',
    mint,
    reupload = { portraits: false, faces: false },
    fetchMetaDecksUnits,
    fetchPrydwenNodes,
    fetchPrydwenCardUrl,
    warn = console.warn,
  },
) {
  let joined = new Map();
  try {
    const units = await fetchMetaDecksUnits();
    const join = joinCombatantArt(combatants, units, { overrides, mint });
    joined = join.joined;
    for (const warning of join.warnings) warn(`    ${overridesLabel}: ${warning}`);
    for (const id of join.unjoined) {
      warn(
        `    ${id} joins no CZN Meta Decks unit — using Prydwen or Game8 art (add a charId to ${overridesLabel} if it is listed under another name)`,
      );
    }
  } catch (e) {
    if (reupload.portraits || reupload.faces) throw e;
    warn(`  CZN Meta Decks art unavailable (${e.message}) — using Prydwen and Game8`);
  }

  const lacking = combatants.filter((c) => !joined.has(c.id));
  const prydwen = await resolvePrydwenArt(lacking, {
    abortOnFailure: reupload.portraits,
    fetchPrydwenNodes,
    fetchPrydwenCardUrl,
    warn,
  });

  const sources = new Map();
  for (const c of combatants) {
    const charId = joined.get(c.id);
    if (charId) {
      sources.set(c.id, {
        kind: 'metadecks',
        sourceUrl: portraitUrl(charId),
        charId,
        faceBox: overrides.get(c.id)?.face,
      });
    } else if (prydwen.has(c.id)) {
      sources.set(c.id, { kind: 'prydwen', sourceUrl: prydwen.get(c.id) });
    } else {
      sources.set(c.id, { kind: 'game8', sourceUrl: c.imageSource ?? null });
    }
  }
  return sources;
}

// Prydwen's frozen origin only knows the units it listed before May 2026, and
// costs one detail fetch per unit — so it is not touched when nothing needs it.
async function resolvePrydwenArt(
  combatants,
  { abortOnFailure, fetchPrydwenNodes, fetchPrydwenCardUrl, warn },
) {
  const art = new Map();
  if (combatants.length === 0) return art;
  let nodes;
  try {
    nodes = await fetchPrydwenNodes();
  } catch (e) {
    if (abortOnFailure) throw e;
    warn(`  Prydwen card art unavailable (${e.message}) — using Game8 icons`);
    return art;
  }
  for (const c of combatants) {
    if (!nodes.has(c.id)) continue;
    try {
      const url = await fetchPrydwenCardUrl(c.id);
      if (url) art.set(c.id, url);
    } catch (e) {
      if (abortOnFailure) throw e;
      warn(`  Prydwen card art for ${c.id} unavailable (${e.message}) — using Game8 icon`);
    }
  }
  return art;
}

/**
 * Uploads one square face crop per unit through the injected `ensureAsset`.
 *
 * `units` are `{ id, name, sourceUrl, art? }` where `art` is
 * `{ charId, faceBox? }` for a Meta Decks portrait and absent for fallback or
 * overlay art. The portrait and face icon are downloaded, and the match run,
 * only inside the fetch closure — a face `ensureAsset` skips costs nothing.
 *
 * Returns `{ counts, iconFallbacks, missing }`.
 */
export async function seedCombatantFaces(
  units,
  {
    ensureAsset,
    download,
    facePath,
    reupload = false,
    build = buildFace,
    topSquare = topSquareFace,
  },
) {
  const counts = { skipped: 0, uploaded: 0, failed: 0 };
  const iconFallbacks = [];
  const missing = [];

  for (const { id, name, sourceUrl, art } of units) {
    if (!sourceUrl) {
      missing.push(id);
      continue;
    }
    const result = await ensureAsset({
      localPath: facePath(id),
      label: `Face for ${name}`,
      reupload,
      mimeType: 'image/webp',
      fetchBuffer: async () => {
        const portrait = await download(sourceUrl);
        // Fallback art (Prydwen card, Game8 icon, overlay image) has no face icon.
        if (!art) return topSquare(portrait);
        // The face is cut from the untrimmed portrait, so override boxes stay
        // in the source's 804×924 coordinates.
        const icon = art.faceBox ? null : await download(faceIconUrl(art.charId));
        const face = await build({ portrait, icon, box: art.faceBox });
        if (face.source === 'icon') iconFallbacks.push(id);
        return face.buffer;
      },
    });
    counts[result]++;
    if (result === 'failed') missing.push(id);
  }

  return { counts, iconFallbacks, missing };
}
