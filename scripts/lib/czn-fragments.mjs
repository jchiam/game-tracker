// Pure helpers for the Chaos Zero Nightmare Memory Fragment set section of
// scripts/update-czn-data.mjs, split out so the chunk-parsing rules are
// unit-testable against a captured fixture without the script's top-level
// env/ImageKit side effects.
//
// Prydwen publishes no page-data or static query for Memory Fragment sets:
// the list is a hardcoded array inside the memory-fragments page's webpack
// component chunk, and each set's icon is a Gatsby fixed image inlined in the
// same chunk. Everything here is pattern matching over the chunk source —
// the downloaded JavaScript is never evaluated.

/** Stable webpack chunk name of the Memory Fragments page component. */
export const FRAGMENT_CHUNK_NAME =
  'component---src-pages-chaos-zero-nightmare-memory-fragments-tsx';

/**
 * Pick the hashed component asset for the Memory Fragments page out of a
 * Gatsby `webpack.stats.json` payload. The chunk's asset list also carries
 * the shared framework/app chunks; the component asset is the one whose
 * filename starts with the chunk name. Throws naming the chunk when the stats
 * list no such chunk or no component asset.
 */
export function selectFragmentChunkAsset(webpackStats) {
  const assets = webpackStats?.assetsByChunkName?.[FRAGMENT_CHUNK_NAME];
  if (!Array.isArray(assets)) {
    throw new Error(
      `Prydwen webpack.stats.json shape changed: no assetsByChunkName entry for ${FRAGMENT_CHUNK_NAME}`,
    );
  }
  const asset = assets.find(
    (a) => typeof a === 'string' && a.startsWith(`${FRAGMENT_CHUNK_NAME}-`),
  );
  if (!asset) {
    throw new Error(
      `Prydwen webpack.stats.json shape changed: ${FRAGMENT_CHUNK_NAME} lists no component asset`,
    );
  }
  return asset;
}

// One hardcoded set entry as the minified chunk spells it. `Effect` is quoted
// with whichever quote kind avoids escaping (Prettier-style), so both are
// matched; its text is captured only to keep the match anchored and is not
// emitted. `Type` is the piece count the set activates at.
const SET_ENTRY =
  /\{ID:(\d+),Name:"((?:[^"\\]|\\.)*)",Effect:(?:"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'),Type:"([^"]*)"\}/g;

const PIECES_BY_TYPE = { '4-PC': 4, '2-PC': 2 };

/**
 * Extract the set list from the chunk source: `[{ id, name, pieces }]` in
 * source order, where `id` is Prydwen's numeric set ID and `pieces` is 4 or 2.
 * Throws when no entry parses (the array moved or changed shape) or when a
 * `Type` falls outside the two known piece counts — a new composition kind
 * needs a model decision, not a silent drop.
 */
export function parseFragmentSetEntries(chunkSource) {
  const entries = [];
  for (const m of String(chunkSource).matchAll(SET_ENTRY)) {
    const [, id, rawName, type] = m;
    const pieces = PIECES_BY_TYPE[type];
    if (!pieces) {
      throw new Error(
        `Memory Fragment set ${id} has unknown Type "${type}" (expected 4-PC or 2-PC)`,
      );
    }
    entries.push({ id: Number(id), name: rawName.replace(/\\(.)/g, '$1'), pieces });
  }
  if (entries.length === 0) {
    throw new Error(
      `Prydwen memory-fragments chunk shape changed: no {ID,Name,Effect,Type} entries parsed`,
    );
  }
  return entries;
}

// The icon component renders one Gatsby image per set ID through a chain of
// `<ID>===t&&createElement(Img,{src:"…/<file>.webp",…})` conditionals. The
// file bound to an ID is positional, not derived from the ID (IDs 7–12 use
// set_small_1..6; 13 uses set_full_8), so the binding must be read, never
// guessed.
const ICON_BINDING = /(\d+)===t&&\w+\.createElement\([^,]+,\{src:"[^"]*\/([^"/]+\.webp)"/g;

// Each bound image's srcSet lists hashed /static/ paths with their widths.
const SRCSET = /"srcSet":"((?:[^"\\]|\\.)*)"/g;
const SRCSET_CANDIDATE = /(\/static\/[^\s,]+\/([^\s,/]+\.webp))\s+(\d+)w/g;

/**
 * Map each set ID to the largest-width hashed `/static/…` path of the icon
 * the chunk binds to it. IDs with no binding, or whose bound file has no
 * srcSet in the chunk, are absent from the result (the caller reports them
 * as missing icons). The hashed directories change per site build, so this
 * is re-read every run.
 */
export function selectFragmentIconPaths(chunkSource) {
  const source = String(chunkSource);

  const largestByFile = new Map();
  for (const m of source.matchAll(SRCSET)) {
    const srcset = m[1].replace(/\\n/g, ' ');
    for (const c of srcset.matchAll(SRCSET_CANDIDATE)) {
      const [, path, file, width] = c;
      const prev = largestByFile.get(file);
      if (!prev || Number(width) > prev.width) {
        largestByFile.set(file, { path, width: Number(width) });
      }
    }
  }

  const paths = new Map();
  for (const m of source.matchAll(ICON_BINDING)) {
    const [, id, file] = m;
    const best = largestByFile.get(file);
    if (best) paths.set(Number(id), best.path);
  }
  return paths;
}
