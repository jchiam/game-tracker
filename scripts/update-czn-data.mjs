// Auto-update script for Chaos Zero Nightmare (CZN) Combatant data.
// Fetches structured character data from Prydwen's Gatsby page-data endpoints
// (via the CloudFront origin — www.prydwen.gg blocks generic fetchers) and
// regenerates:
//   - src/data/chaos-zero-nightmare/combatants.ts
//
// Prydwen publishes teaser nodes for announced-but-unreleased combatants with
// `class` / `element` set to "Unknown"; those are dropped at generation and
// reported as excluded so they never reach the Add modal with placeholder
// taxonomy. They appear in the diff as `added` the week they get real data.
//
// Combatants Prydwen lacks (units added after the origin's last build) come
// from the hand-curated overlay seed scripts/seeds/czn-combatants.json. Each
// seed entry carries the CznCombatant shape plus `imageSource` (an https URL
// for the card art, or null while none is sourced) and a free-text `note`.
// Its `id` is the slug Prydwen will give the unit, so tracked rows keyed on it
// survive the hand-off: once the slug appears upstream the fetched entry wins
// and the run warns to delete the seed entry. Validation failures abort the
// run before any codegen.
//
// Downloads card art and uploads to ImageKit CDN:
//   - combatant portraits → ImageKit: /chaos_zero_nightmare/combatants
//
// Image URLs are parsed from each run's freshly fetched page-data JSON —
// Prydwen's hashed /static/ paths change per site build, so they are never
// hardcoded here. Portraits are uploaded at the source card-art size (262×358,
// webp); the app's default mugshot transform top-anchors a square crop.
//
// Phase 2 adds the Partner catalog from the sibling
// /page-data/chaos-zero-nightmare/partners/page-data.json endpoint as another
// process*() section beside processCombatants(), reusing PRYDWEN_ORIGIN,
// gatsbyImagePath, and uploadPortrait.
//
// Usage:
//   node scripts/update-czn-data.mjs                       # only upload missing assets
//   node scripts/update-czn-data.mjs --reupload-all        # force reupload all assets
//   node scripts/update-czn-data.mjs --reupload-combatants # force reupload combatant portraits

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
  jsStr,
  diffByKey,
  applyOverlay,
  validateOverlaySeed,
  formatDiff,
  generatedHeader,
} from './lib/pipeline.mjs';

// Prydwen's CloudFront origin serves the same page-data JSON as www.prydwen.gg
// without the Cloudflare bot challenge the main domain applies.
const PRYDWEN_ORIGIN = 'https://d2ankz0m1a0dsp.cloudfront.net';
const GAME_PATH = 'chaos-zero-nightmare';
const LIST_PAGE_DATA = `${PRYDWEN_ORIGIN}/page-data/${GAME_PATH}/characters/page-data.json`;
const detailPageData = (slug) =>
  `${PRYDWEN_ORIGIN}/page-data/${GAME_PATH}/characters/${slug}/page-data.json`;

const DATA_DIR = resolve(ROOT, 'src/data/chaos-zero-nightmare');
const COMBATANTS_TS = resolve(DATA_DIR, 'combatants.ts');
const PORTRAIT_PATH = (id) => `/assets/chaos-zero-nightmare/combatants/${id}.webp`;

// Hand-curated overlay for combatants the Prydwen origin does not list (see header).
const SEED_PATH = resolve(ROOT, 'scripts/seeds/czn-combatants.json');
const SEED_LABEL = 'scripts/seeds/czn-combatants.json';
const SEED_REQUIRED = ['id', 'name', 'rarity', 'class', 'element'];

// Prydwen's placeholder taxonomy for announced-but-unreleased teaser nodes.
const PLACEHOLDER = 'Unknown';

loadLocalEnv();
const { ensureAsset } = initImageKit();

const { all: reuploadAll, flags: reuploadFlags } = parseReuploadFlags(['combatants']);
const reuploadCombatants = reuploadAll || reuploadFlags.combatants;

async function loadExistingCombatants() {
  try {
    const content = await readFile(COMBATANTS_TS, 'utf-8');
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

// Reads and validates the overlay seed. A missing file is an empty overlay;
// a malformed one aborts the run (the catalog is only written from a valid set).
async function loadCombatantSeed() {
  let raw;
  try {
    raw = await readFile(SEED_PATH, 'utf-8');
  } catch (e) {
    if (e?.code === 'ENOENT') return [];
    throw e;
  }
  return validateOverlaySeed(JSON.parse(raw), {
    label: SEED_LABEL,
    required: SEED_REQUIRED,
    rarities: [4, 5],
  });
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

// Skip-or-upload one portrait through the shared ensureAsset skeleton. Card art
// is uploaded at source size as webp — the app's mugshot transform crops it.
async function uploadPortrait({ localPath, label, sourceUrl, reupload }) {
  return ensureAsset({
    localPath,
    label,
    reupload,
    mimeType: 'image/webp',
    fetchBuffer: async () => {
      const raw = await downloadImage(sourceUrl);
      return sharp(raw).webp().toBuffer();
    },
  });
}

function generateCombatantsTs(combatants) {
  const fiveStars = combatants.filter((c) => c.rarity === 5);
  const fourStars = combatants.filter((c) => c.rarity === 4);

  const lines = [
    ...generatedHeader(
      `Prydwen (prydwen.gg/${GAME_PATH}) plus the hand-curated overlay ${SEED_LABEL}`,
      'update-czn-data.mjs',
    ),
    '',
    'export interface CznCombatant {',
    '  /** Prydwen slug — the stable key tracked rows and the overlay seed use. */',
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
  // loadExistingCombatants diff on the next run depends on quoting matching
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

async function processCombatants() {
  console.log('Fetching CZN combatant list from Prydwen...');

  const [listData, existing, seed] = await Promise.all([
    fetchJSON(LIST_PAGE_DATA),
    loadExistingCombatants(),
    loadCombatantSeed(),
  ]);

  const listNodes = listData?.result?.data?.allCharacters?.nodes;
  if (!Array.isArray(listNodes) || listNodes.length === 0) {
    throw new Error('Prydwen list page-data shape changed: allCharacters.nodes missing/empty');
  }
  console.log(`  ${listNodes.length} combatants listed`);

  // Teaser placeholders carry "Unknown" taxonomy — drop them before the detail
  // fetch so the catalog never gains an unpickable badge.
  const excluded = listNodes.filter(
    (n) => clean(n.class) === PLACEHOLDER || clean(n.element) === PLACEHOLDER,
  );
  const released = listNodes.filter((n) => !excluded.includes(n));
  // A placeholder the seed already covers is not a gap: the seed entry is added
  // below because applyOverlay only sees the released list. Once Prydwen gives
  // the node real taxonomy it moves to `released` and the seed entry is shadowed.
  const seeded = new Set(seed.map((c) => c.id));
  for (const n of excluded) {
    const status = seeded.has(n.slug) ? `covered by ${SEED_LABEL}` : `class/element Unknown`;
    console.log(`    Excluded placeholder ${n.slug} (${n.name}) — ${status}`);
  }

  // Fetch every detail page first so a mid-run source failure aborts before
  // any codegen — the catalog is only written from a complete dataset.
  const details = [];
  for (const node of released) {
    const detail = await fetchJSON(detailPageData(node.slug));
    const unit = detail?.result?.data?.currentUnit?.nodes?.[0];
    if (!unit) {
      throw new Error(
        `Prydwen detail page-data shape changed for ${node.slug}: currentUnit missing`,
      );
    }
    const rarity = Number(unit.rarity);
    if (rarity !== 4 && rarity !== 5) {
      throw new Error(`Unexpected rarity "${unit.rarity}" for ${node.slug}`);
    }
    details.push({ node, unit, rarity });
  }

  const fetched = details.map(({ node, unit, rarity }) => ({
    id: node.slug,
    name: clean(unit.name),
    rarity,
    class: clean(unit.class),
    element: clean(unit.element),
    faction: clean(unit.faction) || null,
    // Card art (262×358) is the portrait crop Prydwen uses; fall back to the square icon.
    sourceUrl: gatsbyImagePath(unit.cardImage) ?? gatsbyImagePath(unit.smallImage),
    missingImageReason: 'No image node in page-data',
  }));
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
    console.warn(`    Seed entry ${c.id} is now on Prydwen — delete it from ${SEED_LABEL}`);
  }

  const combatants = [];
  const counts = { skipped: 0, uploaded: 0, failed: 0 };
  const missingImages = [];

  for (const { sourceUrl, missingImageReason, ...unit } of units) {
    const { id } = unit;
    // Portraits live on ImageKit only — never written into public/assets
    // (the repo stores no game images; imagekit.ts resolves this path to the CDN).
    const imageUrl = PORTRAIT_PATH(id);

    if (sourceUrl) {
      const result = await uploadPortrait({
        localPath: imageUrl,
        label: `Portrait for ${unit.name}`,
        sourceUrl,
        reupload: reuploadCombatants,
      });
      counts[result]++;
      if (result === 'failed') missingImages.push(id);
    } else {
      console.warn(`    ${missingImageReason} for ${id}`);
      missingImages.push(id);
    }

    combatants.push({ ...unit, imageUrl });
  }

  // Sort: 5-stars first, then alphabetically within each group
  combatants.sort((a, b) => {
    if (a.rarity !== b.rarity) return b.rarity - a.rarity;
    return a.name.localeCompare(b.name);
  });

  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(COMBATANTS_TS, generateCombatantsTs(combatants), 'utf-8');

  const { added, removed } = diffByKey(existing, combatants, (c) => c.id);
  console.log('\nDone!');
  console.log(
    `  Combatants: ${combatants.length} total (${formatDiff(added, removed)}) — ` +
      `${excluded.length} placeholders excluded — portraits: ` +
      `${counts.uploaded} uploaded, ${counts.skipped} skipped, ${counts.failed} failed`,
  );
  for (const c of added) console.log(`    + ${c.name} [${c.rarity}★ ${c.class} · ${c.element}]`);
  for (const c of removed) console.log(`    - ${c.name} (removed from source)`);
  if (missingImages.length > 0) {
    console.warn(`  Missing portraits: ${missingImages.join(', ')}`);
  }
}

async function main() {
  await processCombatants();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
