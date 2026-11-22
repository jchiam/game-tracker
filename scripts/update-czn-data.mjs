// Auto-update script for Chaos Zero Nightmare (CZN) Combatant, Partner, and
// Memory Fragment set data. Regenerates:
//   - src/data/chaos-zero-nightmare/combatants.ts
//   - src/data/chaos-zero-nightmare/partners.ts
//   - src/data/chaos-zero-nightmare/fragment_sets.ts
//
// Combatants: the list and taxonomy come from Game8's character-list
// "collection browser" JSON (/api/tool_structural_mappings/<id>.json, the id
// read each run from the list page's data-react-props; scripts/lib/czn-game8.mjs).
// Only `Released` items are emitted. Ids are the kebab-case slug of the name,
// equal to Prydwen's slugs. A run that would drop a committed combatant id
// aborts unless --allow-removals is passed.
//
// Combatant art comes from CZN Meta Decks (cznmetadecks.com), which serves the
// game's own 804×924 transparent portraits and 124² face icons keyed by the
// game's character id (scripts/lib/czn-metadecks.mjs). Combatants join its
// catalog by name; scripts/seeds/czn-art-overrides.json forces a join
// (`charId`) or a face box (`face`) by hand. Two assets are uploaded per
// combatant: the portrait with its transparent margin trimmed, and a square
// face crop cut from the portrait where the face icon matches it
// (scripts/lib/czn-face-crop.mjs) — the icon itself when the match is weak.
// A unit Meta Decks lacks falls back to Prydwen's card art (Gatsby page-data on
// its CloudFront origin; www.prydwen.gg blocks generic fetchers and the origin
// stopped receiving builds in May 2026), joined by slug on nodes with real
// taxonomy, then to Game8's framed icon; its face is the top square of that art.
//
// Partners: the same split — list and taxonomy from Game8's Partner-list
// collection JSON, 160² icons from Prydwen (below) joined by the id minted from
// Prydwen's name. scripts/seeds/czn-id-pins.json pins a Game8 item id to its
// committed id where Game8 spells a name differently (Lillian → lilian). A run
// that would drop a committed combatant, Partner, or set id aborts unless
// --allow-removals is passed. Memory Fragment sets come from Prydwen only.
//
// Entries the upstream source lacks come from the hand-curated overlay seeds
// scripts/seeds/czn-combatants.json, scripts/seeds/czn-partners.json, and
// scripts/seeds/czn-fragment-sets.json. Each seed entry carries the catalog
// shape plus `imageSource` (an https URL for the art, or null while none is
// sourced) and a free-text `note`. Its `id` is the id the script would mint for
// the entry (the kebab-case name slug), so tracked rows keyed on it survive the
// hand-off: once the id appears upstream the fetched entry wins and the run
// warns to delete the seed entry. Validation failures abort the run before any
// codegen.
//
// Prydwen's Partners have no slug and no per-partner pages: the partners list
// page-data carries taxonomy only, and the icons live in the page's Gatsby
// static query (/page-data/sq/d/<hash>.json → allContentfulChaosPartner.nodes),
// whose hash is read from the page-data's `staticQueryHashes` each run.
//
// Memory Fragment sets have no page-data at all: the list is a hardcoded array
// inside the memory-fragments page's webpack component chunk, located each run
// through webpack.stats.json, and the set icons are Gatsby fixed images inlined
// in the same chunk. The chunk is pattern-matched (scripts/lib/czn-fragments.mjs)
// and never evaluated.
//
// Downloads art and uploads to ImageKit CDN:
//   - combatant portraits → ImageKit: /chaos_zero_nightmare/combatants
//   - combatant faces     → ImageKit: /chaos_zero_nightmare/combatant-faces
//   - partner icons       → ImageKit: /chaos_zero_nightmare/partners
//   - set icons           → ImageKit: /chaos_zero_nightmare/fragment-sets
//
// Image URLs are parsed from each run's freshly fetched catalog, page-data JSON,
// or chunk — the Meta Decks catalog file name and Prydwen's /static/ paths are
// hashed per site build, so they are never hardcoded here. Portraits are
// uploaded at source resolution as webp; the app's default mugshot transform
// top-anchors a square crop, which is why the margin is trimmed first. Partner
// icons are the 160² `smallImage`, uploaded at source size. Set icons are the
// 60² Gatsby image (the largest Prydwen serves), uploaded at source size.
//
// Usage:
//   node scripts/update-czn-data.mjs                          # only upload missing assets
//   node scripts/update-czn-data.mjs --reupload-all           # force reupload all assets
//   node scripts/update-czn-data.mjs --reupload-combatants    # force reupload combatant portraits and faces
//   node scripts/update-czn-data.mjs --reupload-combatant-faces # force reupload combatant faces only
//   node scripts/update-czn-data.mjs --reupload-partners      # force reupload partner icons
//   node scripts/update-czn-data.mjs --reupload-fragment-sets # force reupload set icons
//   node scripts/update-czn-data.mjs --allow-removals         # let a run drop committed combatant ids

import { readFile, writeFile, mkdir } from 'fs/promises';
import { resolve } from 'path';
import sharp from 'sharp';
import {
  ROOT,
  loadLocalEnv,
  initImageKit,
  parseReuploadFlags,
  fetchJSON,
  downloadImage,
  slugify,
  mintId,
  jsStr,
  diffByKey,
  applyOverlay,
  validateOverlaySeed,
  formatDiff,
  generatedHeader,
} from './lib/pipeline.mjs';
import { selectPartnerNodes } from './lib/czn-partners.mjs';
import {
  parseFragmentSetEntries,
  selectFragmentChunkAsset,
  selectFragmentIconPaths,
} from './lib/czn-fragments.mjs';
import { assertMintedSeedIds, validateArtOverrides } from './lib/czn-seeds.mjs';
import {
  METADECKS_CHARACTERS_PAGE,
  METADECKS_PORTRAIT_SIZE,
  extractCatalogUrl,
  parseCatalog,
} from './lib/czn-metadecks.mjs';
import { trimPortrait } from './lib/czn-face-crop.mjs';
import {
  combatantReuploadModes,
  resolveCombatantArt,
  seedCombatantFaces,
} from './lib/czn-combatant-art.mjs';
import {
  GAME8_ORIGIN,
  extractCollectionMapping,
  collectionMappingUrl,
  mapGame8Combatants,
  mapGame8Partners,
  buildIdPins,
  missingIds,
} from './lib/czn-game8.mjs';

// Game8's "List of All Characters" page; its collection browser names the
// mapping whose JSON lists every combatant.
const GAME8_LIST_PAGE = `${GAME8_ORIGIN}/games/Chaos-Zero-Nightmare/archives/558105`;
// Game8's "List of All Partners" page, same collection-browser shape.
const GAME8_PARTNERS_PAGE = `${GAME8_ORIGIN}/games/Chaos-Zero-Nightmare/archives/558133`;

// Prydwen's CloudFront origin serves Gatsby page-data without the Cloudflare
// bot challenge www.prydwen.gg applies, but stopped receiving builds in May
// 2026: it is the fallback card-art source for units CZN Meta Decks lacks, and
// still the Partner-icon and Memory Fragment set source — never the list.
const PRYDWEN_ORIGIN = 'https://d2ankz0m1a0dsp.cloudfront.net';
const GAME_PATH = 'chaos-zero-nightmare';
const LIST_PAGE_DATA = `${PRYDWEN_ORIGIN}/page-data/${GAME_PATH}/characters/page-data.json`;
const detailPageData = (slug) =>
  `${PRYDWEN_ORIGIN}/page-data/${GAME_PATH}/characters/${slug}/page-data.json`;
const PARTNERS_PAGE_DATA = `${PRYDWEN_ORIGIN}/page-data/${GAME_PATH}/partners/page-data.json`;
const staticQueryData = (hash) => `${PRYDWEN_ORIGIN}/page-data/sq/d/${hash}.json`;
// Gatsby's build manifest — maps the stable memory-fragments chunk name to the
// hashed component asset that carries the set array (see czn-fragments.mjs).
const WEBPACK_STATS = `${PRYDWEN_ORIGIN}/webpack.stats.json`;

const DATA_DIR = resolve(ROOT, 'src/data/chaos-zero-nightmare');
const COMBATANTS_TS = resolve(DATA_DIR, 'combatants.ts');
const PARTNERS_TS = resolve(DATA_DIR, 'partners.ts');
const FRAGMENT_SETS_TS = resolve(DATA_DIR, 'fragment_sets.ts');
const PORTRAIT_PATH = (id) => `/assets/chaos-zero-nightmare/combatants/${id}.webp`;
// Derived from the portrait path by getCznCombatantFaceUrl (src/lib/imagekit.ts)
// — the catalog carries no face field.
const FACE_PATH = (id) => `/assets/chaos-zero-nightmare/combatant-faces/${id}.webp`;
const PARTNER_ICON_PATH = (id) => `/assets/chaos-zero-nightmare/partners/${id}.webp`;
const FRAGMENT_SET_ICON_PATH = (id) => `/assets/chaos-zero-nightmare/fragment-sets/${id}.webp`;

// Hand-curated overlays for units the Prydwen origin does not list (see header).
const SEED_PATH = resolve(ROOT, 'scripts/seeds/czn-combatants.json');
const SEED_LABEL = 'scripts/seeds/czn-combatants.json';
const SEED_REQUIRED = ['id', 'name', 'rarity', 'class', 'element'];
const PARTNER_SEED_PATH = resolve(ROOT, 'scripts/seeds/czn-partners.json');
const PARTNER_SEED_LABEL = 'scripts/seeds/czn-partners.json';
const PARTNER_SEED_REQUIRED = ['id', 'name', 'rarity', 'class'];
const FRAGMENT_SET_SEED_PATH = resolve(ROOT, 'scripts/seeds/czn-fragment-sets.json');
const FRAGMENT_SET_SEED_LABEL = 'scripts/seeds/czn-fragment-sets.json';
const FRAGMENT_SET_SEED_REQUIRED = ['id', 'name', 'pieces'];
const ID_PINS_PATH = resolve(ROOT, 'scripts/seeds/czn-id-pins.json');
const ID_PINS_LABEL = 'scripts/seeds/czn-id-pins.json';
// Hand-maintained escape hatch for the Meta Decks art join (see header).
const ART_OVERRIDES_PATH = resolve(ROOT, 'scripts/seeds/czn-art-overrides.json');
const ART_OVERRIDES_LABEL = 'scripts/seeds/czn-art-overrides.json';
// A set activates at exactly one piece count; anything else is a model change.
const FRAGMENT_SET_PIECES = [2, 4];

// Prydwen's placeholder taxonomy for announced-but-unreleased teaser nodes.
const PLACEHOLDER = 'Unknown';

// Partner and set ids are minted from names (no upstream slug) — kebab-case
// like the combatant slugs so one KEBAB_SLUG rule covers every seed.
const MINTED_ID_SEPARATOR = '-';
const mintedId = (name) => slugify(name, MINTED_ID_SEPARATOR);

loadLocalEnv();
const { ensureAsset } = initImageKit();

const { all: reuploadAll, flags: reuploadFlags } = parseReuploadFlags([
  'combatants',
  'combatant-faces',
  'partners',
  'fragment-sets',
]);
// A portrait reupload redoes the faces cut from it; faces can also be redone alone.
const combatantReupload = combatantReuploadModes({ all: reuploadAll, flags: reuploadFlags });
const reuploadCombatants = combatantReupload.portraits;
const reuploadFaces = combatantReupload.faces;
const reuploadPartners = reuploadAll || reuploadFlags.partners;
const reuploadFragmentSets = reuploadAll || reuploadFlags['fragment-sets'];
const allowRemovals = process.argv.slice(2).includes('--allow-removals');

// Reads the id/name pairs out of a previously generated catalog for the diff.
async function loadExistingEntries(tsPath) {
  try {
    const content = await readFile(tsPath, 'utf-8');
    const entries = [];
    // Matches the id (always single-quoted slug) and name (single- or
    // double-quoted, per jsStr's Prettier-stable quoting) formatEntry emits.
    const regex = /id:\s*'([^']+)'[^}]*?name:\s*(['"])((?:\\.|(?!\2)[^\\])*)\2/gs;
    let match;
    while ((match = regex.exec(content)) !== null) {
      entries.push({ id: match[1], name: match[3].replace(/\\(.)/g, '$1') });
    }
    return entries;
  } catch {
    return [];
  }
}

// Reads a seed file. A missing file is an empty overlay; a malformed one aborts
// the run (the catalog is only written from a valid set).
async function readSeed(path) {
  try {
    return JSON.parse(await readFile(path, 'utf-8'));
  } catch (e) {
    if (e?.code === 'ENOENT') return [];
    throw e;
  }
}

// Pins keep a committed id when Game8 spells a name differently from the
// source the id was first minted from (see scripts/seeds/czn-id-pins.json).
async function loadIdPins() {
  const raw = JSON.parse(await readFile(ID_PINS_PATH, 'utf-8'));
  return {
    combatants: buildIdPins(raw.combatants ?? [], { label: `${ID_PINS_LABEL} combatants` }),
    partners: buildIdPins(raw.partners ?? [], { label: `${ID_PINS_LABEL} partners` }),
  };
}
const idPins = await loadIdPins();

function warnUnusedPins(kind, unusedPins) {
  for (const game8Id of unusedPins) {
    console.warn(
      `    Pin for Game8 item ${game8Id} in ${ID_PINS_LABEL} ${kind} matched no released item`,
    );
  }
}

// Unknown taxonomy is emitted as data (neutral badge); say so loudly in case
// it is a Game8 respelling of a known value rather than a new one.
function warnUnknownVocabulary(entries) {
  for (const entry of entries) {
    console.warn(`    New taxonomy value from Game8 — ${entry} (check the spelling)`);
  }
}

// Tracked rows key on catalog ids: an upstream rename must not orphan them.
// Runs before any upload or codegen, so an abort leaves the catalog as it was.
function assertNoRemovals(kind, existing, next) {
  const missing = missingIds(existing, next);
  if (missing.length > 0 && !allowRemovals) {
    throw new Error(
      `${kind} ids would be removed: ${missing.join(', ')} — tracked rows key on these ids. ` +
        `Pin the old id in ${ID_PINS_LABEL}, fix the seed, or re-run with --allow-removals if the removal is deliberate.`,
    );
  }
}

// A missing override file is an empty seed; a malformed one aborts the run.
async function loadArtOverrides() {
  let raw;
  try {
    raw = JSON.parse(await readFile(ART_OVERRIDES_PATH, 'utf-8'));
  } catch (e) {
    if (e?.code !== 'ENOENT') throw e;
    raw = { combatants: [] };
  }
  return validateArtOverrides(raw, {
    label: ART_OVERRIDES_LABEL,
    portrait: METADECKS_PORTRAIT_SIZE,
  });
}

// Combatant seed ids, like the Partner and set ones, must be the id the script
// mints from the Game8 name, or the entry could never hand off.
async function loadCombatantSeed() {
  const seed = validateOverlaySeed(await readSeed(SEED_PATH), {
    label: SEED_LABEL,
    required: SEED_REQUIRED,
    rarities: [4, 5],
  });
  return assertMintedSeedIds(seed, { label: SEED_LABEL, mint: mintedId });
}

// Partner seed ids must be exactly what the script would mint from the name,
// or the entry could never hand off to the fetched one.
async function loadPartnerSeed() {
  const seed = validateOverlaySeed(await readSeed(PARTNER_SEED_PATH), {
    label: PARTNER_SEED_LABEL,
    required: PARTNER_SEED_REQUIRED,
    rarities: [3, 4, 5],
  });
  return assertMintedSeedIds(seed, { label: PARTNER_SEED_LABEL, mint: mintedId });
}

// Set seed entries carry `pieces` instead of `rarity`; the shared validator
// has no slot for it, so the 2-or-4 rule is checked here before the id rule.
async function loadFragmentSetSeed() {
  const seed = validateOverlaySeed(await readSeed(FRAGMENT_SET_SEED_PATH), {
    label: FRAGMENT_SET_SEED_LABEL,
    required: FRAGMENT_SET_SEED_REQUIRED,
  });
  for (const entry of seed) {
    if (!FRAGMENT_SET_PIECES.includes(entry.pieces)) {
      throw new Error(
        `${FRAGMENT_SET_SEED_LABEL} entry ${entry.id}: pieces must be ${FRAGMENT_SET_PIECES.join(' or ')}`,
      );
    }
  }
  return assertMintedSeedIds(seed, { label: FRAGMENT_SET_SEED_LABEL, mint: mintedId });
}

// Pull the largest fallback image path out of a Prydwen gatsby image node.
function gatsbyImagePath(imageNode) {
  const src = imageNode?.localFile?.childImageSharp?.gatsbyImageData?.images?.fallback?.src;
  if (!src) return null;
  return `${PRYDWEN_ORIGIN}${src}`;
}

// Source strings occasionally carry trailing whitespace — normalize. `null`
// stays `null` (faction is nullable in the catalog).
const clean = (s) => (typeof s === 'string' ? s.trim() : (s ?? null));

const toWebp = (raw) => sharp(raw).webp().toBuffer();

// Skip-or-upload one image through the shared ensureAsset skeleton. Art is
// uploaded at source size as webp — the app's transforms crop and scale it.
// `transform` turns the downloaded bytes into the uploaded webp.
async function uploadAsset({ localPath, label, sourceUrl, reupload, transform = toWebp }) {
  return ensureAsset({
    localPath,
    label,
    reupload,
    mimeType: 'image/webp',
    fetchBuffer: async () => transform(await downloadImage(sourceUrl)),
  });
}

// Default catalog order: highest rarity first, then alphabetically within each group.
const byRarityThenName = (a, b) => {
  if (a.rarity !== b.rarity) return b.rarity - a.rarity;
  return a.name.localeCompare(b.name);
};
const byName = (a, b) => a.name.localeCompare(b.name);

// Shared per-entry asset loop: resolves each unit's CDN path, uploads (or
// skips) its art, and returns the catalog entries plus the run counters.
async function seedAssets(units, { localPath, labelFor, reupload, sort = byRarityThenName }) {
  const entries = [];
  const counts = { skipped: 0, uploaded: 0, failed: 0 };
  const missingImages = [];

  // `transform` and `art` are upload-time details, never catalog fields.
  for (const { sourceUrl, missingImageReason, transform, art: _art, ...unit } of units) {
    const { id } = unit;
    // Art lives on ImageKit only — never written into public/assets (the repo
    // stores no game images; imagekit.ts resolves this path to the CDN).
    const imageUrl = localPath(id);

    if (sourceUrl) {
      const result = await uploadAsset({
        localPath: imageUrl,
        label: labelFor(unit),
        sourceUrl,
        reupload,
        transform,
      });
      counts[result]++;
      if (result === 'failed') missingImages.push(id);
    } else {
      console.warn(`    ${missingImageReason} for ${id}`);
      missingImages.push(id);
    }

    entries.push({ ...unit, imageUrl });
  }

  entries.sort(sort);

  return { entries, counts, missingImages };
}

function generateCombatantsTs(combatants) {
  const fiveStars = combatants.filter((c) => c.rarity === 5);
  const fourStars = combatants.filter((c) => c.rarity === 4);

  const lines = [
    ...generatedHeader(
      `Game8 (game8.co/games/Chaos-Zero-Nightmare, list and taxonomy), CZN Meta Decks (cznmetadecks.com, portraits and face icons), Prydwen (prydwen.gg/${GAME_PATH}, fallback card art), plus the hand-curated overlay ${SEED_LABEL}`,
      'update-czn-data.mjs',
    ),
    '',
    'export interface CznCombatant {',
    '  /** Kebab-case name slug (equal to the Prydwen slug) — the stable key tracked rows and the overlay seed use. */',
    '  id: string;',
    '  name: string;',
    '  rarity: 4 | 5;',
    '  /** Source class name, verbatim (Striker, Vanguard, Ranger, Hunter, Psionic, Controller, …). */',
    '  class: string;',
    '  /** Source attribute name, verbatim (Passion, Order, Justice, Void, Instinct, …). */',
    '  element: string;',
    '  /** Raw source faction text; null when the source lists none. Catalog-only in Phase 1. */',
    '  faction: string | null;',
    '  imageUrl: string;',
    '}',
    '',
    'export const ALL_CZN_COMBATANTS: CznCombatant[] = [',
  ];

  // jsStr() keeps the output Prettier-stable (see its definition) — the
  // loadExistingEntries diff on the next run depends on quoting matching
  // exactly what `npm run format` would produce.
  const formatEntry = (c) =>
    [
      `  {`,
      `    id: '${c.id}',`,
      `    name: ${jsStr(c.name)},`,
      `    rarity: ${c.rarity},`,
      `    class: ${jsStr(c.class)},`,
      `    element: ${jsStr(c.element)},`,
      `    faction: ${c.faction === null ? 'null' : jsStr(c.faction)},`,
      `    imageUrl: '${c.imageUrl}',`,
      `  },`,
    ].join('\n');

  if (fiveStars.length > 0) {
    lines.push('  // 5-Stars');
    lines.push(...fiveStars.map(formatEntry));
  }
  if (fourStars.length > 0) {
    lines.push('  // 4-Stars');
    lines.push(...fourStars.map(formatEntry));
  }

  lines.push('];', '');
  return lines.join('\n');
}

function generatePartnersTs(partners) {
  const lines = [
    ...generatedHeader(
      `Game8 (game8.co/games/Chaos-Zero-Nightmare, list and taxonomy), Prydwen (prydwen.gg/${GAME_PATH}/partners, icons), plus the hand-curated overlay ${PARTNER_SEED_LABEL}`,
      'update-czn-data.mjs',
    ),
    '',
    'export interface CznPartner {',
    '  /** Kebab-case slug of the name — the stable key tracked rows and the overlay seed use. */',
    '  id: string;',
    '  name: string;',
    '  rarity: 3 | 4 | 5;',
    '  /** Source class name, verbatim — the same vocabulary as CznCombatant.class (the equip join key). */',
    '  class: string;',
    '  /** Raw source faction text; null when the source lists none. Catalog-only. */',
    '  faction: string | null;',
    '  imageUrl: string;',
    '}',
    '',
    'export const ALL_CZN_PARTNERS: CznPartner[] = [',
  ];

  const formatEntry = (p) =>
    [
      `  {`,
      `    id: '${p.id}',`,
      `    name: ${jsStr(p.name)},`,
      `    rarity: ${p.rarity},`,
      `    class: ${jsStr(p.class)},`,
      `    faction: ${p.faction === null ? 'null' : jsStr(p.faction)},`,
      `    imageUrl: '${p.imageUrl}',`,
      `  },`,
    ].join('\n');

  for (const rarity of [5, 4, 3]) {
    const group = partners.filter((p) => p.rarity === rarity);
    if (group.length > 0) {
      lines.push(`  // ${rarity}-Stars`);
      lines.push(...group.map(formatEntry));
    }
  }

  lines.push('];', '');
  return lines.join('\n');
}

function generateFragmentSetsTs(sets) {
  const lines = [
    ...generatedHeader(
      `Prydwen (prydwen.gg/${GAME_PATH}/memory-fragments) plus the hand-curated overlay ${FRAGMENT_SET_SEED_LABEL}`,
      'update-czn-data.mjs',
    ),
    '',
    'export interface CznFragmentSet {',
    '  /** Kebab-case slug of the name — the stable key equipped rows, picks, and the overlay seed use. */',
    '  id: string;',
    '  name: string;',
    '  /** Piece count the set activates at. A set is either a 2-piece or a 4-piece set, never both. */',
    '  pieces: 2 | 4;',
    '  imageUrl: string;',
    '}',
    '',
    'export const ALL_CZN_FRAGMENT_SETS: CznFragmentSet[] = [',
  ];

  const formatEntry = (s) =>
    [
      `  {`,
      `    id: '${s.id}',`,
      `    name: ${jsStr(s.name)},`,
      `    pieces: ${s.pieces},`,
      `    imageUrl: '${s.imageUrl}',`,
      `  },`,
    ].join('\n');

  lines.push(...sets.map(formatEntry));
  lines.push('];', '');
  return lines.join('\n');
}

// The CZN Meta Decks unit catalog (name → charId). Its file name is hashed per
// build, so the URL is read off the characters page each run.
async function fetchMetaDecksUnits() {
  const res = await fetch(METADECKS_CHARACTERS_PAGE);
  if (!res.ok) throw new Error(`Failed to fetch ${METADECKS_CHARACTERS_PAGE}: ${res.status}`);
  const catalogUrl = extractCatalogUrl(await res.text());
  return parseCatalog(await fetchJSON(catalogUrl), { label: catalogUrl });
}

// Game8 lists every released combatant with taxonomy; Prydwen's frozen origin
// only supplies card art for the units it knows, and is only asked about the
// combatants CZN Meta Decks lacks. Which source wins, and when a failure
// degrades or aborts, is decided in scripts/lib/czn-combatant-art.mjs.
async function fetchPrydwenArtNodes() {
  const listData = await fetchJSON(LIST_PAGE_DATA);
  const nodes = listData?.result?.data?.allCharacters?.nodes;
  if (!Array.isArray(nodes) || nodes.length === 0) {
    throw new Error('Prydwen list page-data shape changed: allCharacters.nodes missing/empty');
  }
  // Teaser placeholders carry "Unknown" taxonomy and no usable art.
  return new Map(
    nodes
      .filter((n) => clean(n.class) !== PLACEHOLDER && clean(n.element) !== PLACEHOLDER)
      .map((n) => [n.slug, n]),
  );
}

async function fetchGame8Combatants() {
  const res = await fetch(GAME8_LIST_PAGE);
  if (!res.ok) throw new Error(`Failed to fetch ${GAME8_LIST_PAGE}: ${res.status}`);
  const mapping = extractCollectionMapping(await res.text(), { label: GAME8_LIST_PAGE });
  return mapGame8Combatants(await fetchJSON(collectionMappingUrl(mapping)), {
    pinned: idPins.combatants,
  });
}

// Card art (262×358) is the portrait crop Prydwen uses; fall back to the square icon.
async function fetchPrydwenCardUrl(slug) {
  const detail = await fetchJSON(detailPageData(slug));
  const unit = detail?.result?.data?.currentUnit?.nodes?.[0];
  if (!unit) throw new Error(`detail page-data for ${slug}: currentUnit missing`);
  return gatsbyImagePath(unit.cardImage) ?? gatsbyImagePath(unit.smallImage);
}

async function processCombatants() {
  console.log('Fetching CZN combatant list from Game8...');

  const [{ combatants: listed, excluded, unusedPins, unknownVocabulary }, existing, seed] =
    await Promise.all([
      fetchGame8Combatants(),
      loadExistingEntries(COMBATANTS_TS),
      loadCombatantSeed(),
    ]);
  console.log(`  ${listed.length} released combatants listed`);
  warnUnusedPins('combatants', unusedPins);
  warnUnknownVocabulary(unknownVocabulary);
  const seeded = new Set(seed.map((c) => c.id));
  for (const name of excluded) {
    const id = slugify(name, MINTED_ID_SEPARATOR);
    const status = seeded.has(id) ? `covered by ${SEED_LABEL}` : 'not released';
    console.log(`    Excluded ${name} — ${status}`);
  }

  // Resolve all art before any codegen so a reupload-mode failure aborts
  // before the catalog is written.
  const art = await resolveCombatantArt(listed, {
    overrides: await loadArtOverrides(),
    overridesLabel: ART_OVERRIDES_LABEL,
    mint: mintedId,
    reupload: combatantReupload,
    fetchMetaDecksUnits,
    fetchPrydwenNodes: fetchPrydwenArtNodes,
    fetchPrydwenCardUrl,
  });
  const from = (kind) => [...art.values()].filter((source) => source.kind === kind).length;
  console.log(
    `  ${from('metadecks')} portraits from CZN Meta Decks, ${from('prydwen')} from Prydwen card art, ` +
      `${from('game8')} from Game8`,
  );

  const fetched = listed.map((c) => {
    const source = art.get(c.id);
    const fromMetaDecks = source.kind === 'metadecks';
    return {
      id: c.id,
      name: c.name,
      rarity: c.rarity,
      class: c.class,
      element: c.element,
      faction: c.faction,
      sourceUrl: source.sourceUrl,
      // Meta Decks cut-outs carry a wide transparent margin; trimming it lets the
      // default top-anchored mugshot crop land on the figure.
      transform: fromMetaDecks ? trimPortrait : undefined,
      art: fromMetaDecks ? { charId: source.charId, faceBox: source.faceBox } : undefined,
      missingImageReason: 'No image on CZN Meta Decks, Prydwen, or Game8',
    };
  });
  const overlay = seed.map((c) => ({
    id: c.id,
    name: clean(c.name),
    rarity: c.rarity,
    class: clean(c.class),
    element: clean(c.element),
    faction: clean(c.faction) || null,
    sourceUrl: c.imageSource,
    missingImageReason: `No imageSource in ${SEED_LABEL}`,
  }));
  const { entries: units, shadowed } = applyOverlay(fetched, overlay, (c) => c.id);
  console.log(`  ${units.length - fetched.length} combatants overlaid from ${SEED_LABEL}`);
  for (const c of shadowed) {
    console.warn(`    Seed entry ${c.id} is now on Game8 — delete it from ${SEED_LABEL}`);
  }

  assertNoRemovals('Combatant', existing, units);

  const {
    entries: combatants,
    counts,
    missingImages,
  } = await seedAssets(units, {
    localPath: PORTRAIT_PATH,
    labelFor: (unit) => `Portrait for ${unit.name}`,
    reupload: reuploadCombatants,
  });

  // One square face crop per combatant, for party slots and picker rows.
  const faces = await seedCombatantFaces(units, {
    ensureAsset,
    download: downloadImage,
    facePath: FACE_PATH,
    reupload: reuploadFaces,
  });

  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(COMBATANTS_TS, generateCombatantsTs(combatants), 'utf-8');

  const { added, removed } = diffByKey(existing, combatants, (c) => c.id);
  console.log('\nDone!');
  console.log(
    `  Combatants: ${combatants.length} total (${formatDiff(added, removed)}) — ` +
      `${excluded.length} unreleased excluded — portraits: ` +
      `${counts.uploaded} uploaded, ${counts.skipped} skipped, ${counts.failed} failed`,
  );
  for (const c of added) console.log(`    + ${c.name} [${c.rarity}★ ${c.class} · ${c.element}]`);
  for (const c of removed) console.log(`    - ${c.name} (removed from source)`);
  if (missingImages.length > 0) {
    console.warn(`  Missing portraits: ${missingImages.join(', ')}`);
  }
  console.log(
    `  Combatant faces: ${faces.counts.uploaded} uploaded, ${faces.counts.skipped} skipped, ` +
      `${faces.counts.failed} failed`,
  );
  if (faces.iconFallbacks.length > 0) {
    console.warn(
      `  Faces using the game icon (weak portrait match — add a face box to ${ART_OVERRIDES_LABEL} for a sharper crop): ${faces.iconFallbacks.join(', ')}`,
    );
  }
  if (faces.missing.length > 0) {
    console.warn(`  Missing faces: ${faces.missing.join(', ')}`);
  }
}

// The partners page-data lists taxonomy only; the icons sit in the page's
// static query. Resolve the hash from the page-data each run and pick the
// payload that carries the partner nodes (see selectPartnerNodes).
async function fetchPartnerNodes() {
  const pageData = await fetchJSON(PARTNERS_PAGE_DATA);
  return selectPartnerNodes(pageData, {
    fetchStaticQuery: (hash) => fetchJSON(staticQueryData(hash)),
  });
}

async function fetchGame8Partners() {
  const res = await fetch(GAME8_PARTNERS_PAGE);
  if (!res.ok) throw new Error(`Failed to fetch ${GAME8_PARTNERS_PAGE}: ${res.status}`);
  const mapping = extractCollectionMapping(await res.text(), { label: GAME8_PARTNERS_PAGE });
  return mapGame8Partners(await fetchJSON(collectionMappingUrl(mapping)), {
    pinned: idPins.partners,
  });
}

// Prydwen's 160² icons for the Partners it knows, keyed by the id minted from
// Prydwen's name (pinned spellings were minted from it, so they join as-is).
// Degrades to Game8 icons unless partner icons are being re-uploaded.
async function resolvePrydwenPartnerIcons() {
  try {
    const nodes = await fetchPartnerNodes();
    const icons = new Map();
    for (const node of nodes) {
      const url = gatsbyImagePath(node.smallImage);
      if (url) icons.set(mintedId(clean(node.name)), url);
    }
    return icons;
  } catch (e) {
    if (reuploadPartners) throw e;
    console.warn(`  Prydwen partner icons unavailable (${e.message}) — using Game8 icons`);
    return new Map();
  }
}

async function processPartners() {
  console.log('\nFetching CZN partner list from Game8...');

  const [{ partners: listed, excluded, unusedPins, unknownVocabulary }, existing, seed] =
    await Promise.all([fetchGame8Partners(), loadExistingEntries(PARTNERS_TS), loadPartnerSeed()]);
  console.log(`  ${listed.length} released partners listed`);
  for (const name of excluded) console.log(`    Excluded ${name} — not released`);
  warnUnusedPins('partners', unusedPins);
  warnUnknownVocabulary(unknownVocabulary);

  const icons = await resolvePrydwenPartnerIcons();
  const fromPrydwen = listed.filter((p) => icons.has(p.id)).length;
  console.log(`  ${fromPrydwen} icons from Prydwen, ${listed.length - fromPrydwen} from Game8`);

  const fetched = listed.map((p) => ({
    id: p.id,
    name: p.name,
    rarity: p.rarity,
    class: p.class,
    faction: p.faction,
    sourceUrl: icons.get(p.id) ?? p.imageSource,
    missingImageReason: 'No icon on Game8 or Prydwen',
  }));
  const overlay = seed.map((p) => ({
    id: p.id,
    name: clean(p.name),
    rarity: p.rarity,
    class: clean(p.class),
    faction: clean(p.faction) || null,
    sourceUrl: p.imageSource,
    missingImageReason: `No imageSource in ${PARTNER_SEED_LABEL}`,
  }));
  const { entries: units, shadowed } = applyOverlay(fetched, overlay, (p) => p.id);
  console.log(`  ${units.length - fetched.length} partners overlaid from ${PARTNER_SEED_LABEL}`);
  for (const p of shadowed) {
    console.warn(`    Seed entry ${p.id} is now on Game8 — delete it from ${PARTNER_SEED_LABEL}`);
  }
  assertNoRemovals('Partner', existing, units);

  const {
    entries: partners,
    counts,
    missingImages,
  } = await seedAssets(units, {
    localPath: PARTNER_ICON_PATH,
    labelFor: (unit) => `Icon for partner ${unit.name}`,
    reupload: reuploadPartners,
  });

  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(PARTNERS_TS, generatePartnersTs(partners), 'utf-8');

  const { added, removed } = diffByKey(existing, partners, (p) => p.id);
  console.log('\nDone!');
  console.log(
    `  Partners: ${partners.length} total (${formatDiff(added, removed)}) — icons: ` +
      `${counts.uploaded} uploaded, ${counts.skipped} skipped, ${counts.failed} failed`,
  );
  for (const p of added) console.log(`    + ${p.name} [${p.rarity}★ ${p.class}]`);
  for (const p of removed) console.log(`    - ${p.name} (removed from source)`);
  if (missingImages.length > 0) {
    console.warn(`  Missing icons: ${missingImages.join(', ')}`);
  }
}

// The set list and icons both live in the memory-fragments page component
// chunk; webpack.stats.json names the current hashed asset (see czn-fragments.mjs).
async function fetchFragmentChunk() {
  const stats = await fetchJSON(WEBPACK_STATS);
  const asset = selectFragmentChunkAsset(stats);
  const res = await fetch(`${PRYDWEN_ORIGIN}/${asset}`);
  if (!res.ok) throw new Error(`Failed to fetch ${asset}: ${res.status}`);
  return { asset, source: await res.text() };
}

async function processFragmentSets() {
  console.log('\nFetching CZN Memory Fragment sets from Prydwen...');

  const [{ asset, source }, existing, seed] = await Promise.all([
    fetchFragmentChunk(),
    loadExistingEntries(FRAGMENT_SETS_TS),
    loadFragmentSetSeed(),
  ]);
  const parsed = parseFragmentSetEntries(source);
  const iconPaths = selectFragmentIconPaths(source);
  console.log(`  ${parsed.length} sets listed in ${asset}`);

  // mintId throws on a collision — two names slugifying alike would make one
  // set unpickable under the parent-row set columns.
  const taken = new Map();
  const fetched = parsed.map((entry) => {
    const name = clean(entry.name);
    const iconPath = iconPaths.get(entry.id);
    return {
      id: mintId({ name, sourceId: entry.id, taken, separator: MINTED_ID_SEPARATOR }),
      name,
      pieces: entry.pieces,
      // 60² Gatsby image — the largest set art Prydwen publishes anywhere.
      sourceUrl: iconPath ? `${PRYDWEN_ORIGIN}${iconPath}` : null,
      missingImageReason: 'No icon binding in the memory-fragments chunk',
    };
  });
  const overlay = seed.map((s) => ({
    id: s.id,
    name: clean(s.name),
    pieces: s.pieces,
    sourceUrl: s.imageSource,
    missingImageReason: `No imageSource in ${FRAGMENT_SET_SEED_LABEL}`,
  }));
  const { entries: units, shadowed } = applyOverlay(fetched, overlay, (s) => s.id);
  console.log(`  ${units.length - fetched.length} sets overlaid from ${FRAGMENT_SET_SEED_LABEL}`);
  for (const s of shadowed) {
    console.warn(
      `    Seed entry ${s.id} is now on Prydwen — delete it from ${FRAGMENT_SET_SEED_LABEL}`,
    );
  }

  assertNoRemovals('Memory Fragment set', existing, units);

  const {
    entries: sets,
    counts,
    missingImages,
  } = await seedAssets(units, {
    localPath: FRAGMENT_SET_ICON_PATH,
    labelFor: (unit) => `Icon for set ${unit.name}`,
    reupload: reuploadFragmentSets,
    sort: byName,
  });

  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(FRAGMENT_SETS_TS, generateFragmentSetsTs(sets), 'utf-8');

  const { added, removed } = diffByKey(existing, sets, (s) => s.id);
  console.log('\nDone!');
  console.log(
    `  Memory Fragment sets: ${sets.length} total (${formatDiff(added, removed)}) — icons: ` +
      `${counts.uploaded} uploaded, ${counts.skipped} skipped, ${counts.failed} failed`,
  );
  for (const s of added) console.log(`    + ${s.name} [${s.pieces}-PC]`);
  for (const s of removed) console.log(`    - ${s.name} (removed from source)`);
  if (missingImages.length > 0) {
    console.warn(`  Missing icons: ${missingImages.join(', ')}`);
  }
}

async function main() {
  await processCombatants();
  await processPartners();
  await processFragmentSets();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
