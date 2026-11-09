// Auto-update script for Chaos Zero Nightmare (CZN) Combatant and Partner data.
// Fetches structured data from Prydwen's Gatsby page-data endpoints (via the
// CloudFront origin — www.prydwen.gg blocks generic fetchers) and regenerates:
//   - src/data/chaos-zero-nightmare/combatants.ts
//   - src/data/chaos-zero-nightmare/partners.ts
//
// Prydwen publishes teaser nodes for announced-but-unreleased combatants with
// `class` / `element` set to "Unknown"; those are dropped at generation and
// reported as excluded so they never reach the Add modal with placeholder
// taxonomy. They appear in the diff as `added` the week they get real data.
//
// Units Prydwen lacks (added after the origin's last build) come from the
// hand-curated overlay seeds scripts/seeds/czn-combatants.json and
// scripts/seeds/czn-partners.json. Each seed entry carries the catalog shape
// plus `imageSource` (an https URL for the art, or null while none is sourced)
// and a free-text `note`. Its `id` is the id the script would mint for the unit
// (the Prydwen slug for combatants; the kebab-case name slug for partners), so
// tracked rows keyed on it survive the hand-off: once the id appears upstream
// the fetched entry wins and the run warns to delete the seed entry. Validation
// failures abort the run before any codegen.
//
// Partners have no Prydwen slug and no per-partner pages: the partners list
// page-data carries taxonomy only, and the icons live in the page's Gatsby
// static query (/page-data/sq/d/<hash>.json → allContentfulChaosPartner.nodes),
// whose hash is read from the page-data's `staticQueryHashes` each run.
//
// Downloads art and uploads to ImageKit CDN:
//   - combatant portraits → ImageKit: /chaos_zero_nightmare/combatants
//   - partner icons       → ImageKit: /chaos_zero_nightmare/partners
//
// Image URLs are parsed from each run's freshly fetched page-data JSON —
// Prydwen's hashed /static/ paths change per site build, so they are never
// hardcoded here. Portraits are uploaded at the source card-art size (262×358,
// webp); the app's default mugshot transform top-anchors a square crop. Partner
// icons are the 160² `smallImage`, uploaded at source size.
//
// Usage:
//   node scripts/update-czn-data.mjs                       # only upload missing assets
//   node scripts/update-czn-data.mjs --reupload-all        # force reupload all assets
//   node scripts/update-czn-data.mjs --reupload-combatants # force reupload combatant portraits
//   node scripts/update-czn-data.mjs --reupload-partners   # force reupload partner icons

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
import { selectPartnerNodes, assertPartnerSeedIds } from './lib/czn-partners.mjs';

// Prydwen's CloudFront origin serves the same page-data JSON as www.prydwen.gg
// without the Cloudflare bot challenge the main domain applies.
const PRYDWEN_ORIGIN = 'https://d2ankz0m1a0dsp.cloudfront.net';
const GAME_PATH = 'chaos-zero-nightmare';
const LIST_PAGE_DATA = `${PRYDWEN_ORIGIN}/page-data/${GAME_PATH}/characters/page-data.json`;
const detailPageData = (slug) =>
  `${PRYDWEN_ORIGIN}/page-data/${GAME_PATH}/characters/${slug}/page-data.json`;
const PARTNERS_PAGE_DATA = `${PRYDWEN_ORIGIN}/page-data/${GAME_PATH}/partners/page-data.json`;
const staticQueryData = (hash) => `${PRYDWEN_ORIGIN}/page-data/sq/d/${hash}.json`;

const DATA_DIR = resolve(ROOT, 'src/data/chaos-zero-nightmare');
const COMBATANTS_TS = resolve(DATA_DIR, 'combatants.ts');
const PARTNERS_TS = resolve(DATA_DIR, 'partners.ts');
const PORTRAIT_PATH = (id) => `/assets/chaos-zero-nightmare/combatants/${id}.webp`;
const PARTNER_ICON_PATH = (id) => `/assets/chaos-zero-nightmare/partners/${id}.webp`;

// Hand-curated overlays for units the Prydwen origin does not list (see header).
const SEED_PATH = resolve(ROOT, 'scripts/seeds/czn-combatants.json');
const SEED_LABEL = 'scripts/seeds/czn-combatants.json';
const SEED_REQUIRED = ['id', 'name', 'rarity', 'class', 'element'];
const PARTNER_SEED_PATH = resolve(ROOT, 'scripts/seeds/czn-partners.json');
const PARTNER_SEED_LABEL = 'scripts/seeds/czn-partners.json';
const PARTNER_SEED_REQUIRED = ['id', 'name', 'rarity', 'class'];

// Prydwen's placeholder taxonomy for announced-but-unreleased teaser nodes.
const PLACEHOLDER = 'Unknown';

// Partner ids are minted from names (no upstream slug) — kebab-case like the
// combatant slugs so one KEBAB_SLUG rule covers both seeds.
const PARTNER_ID_SEPARATOR = '-';
const partnerId = (name) => slugify(name, PARTNER_ID_SEPARATOR);

loadLocalEnv();
const { ensureAsset } = initImageKit();

const { all: reuploadAll, flags: reuploadFlags } = parseReuploadFlags(['combatants', 'partners']);
const reuploadCombatants = reuploadAll || reuploadFlags.combatants;
const reuploadPartners = reuploadAll || reuploadFlags.partners;

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

async function loadCombatantSeed() {
  return validateOverlaySeed(await readSeed(SEED_PATH), {
    label: SEED_LABEL,
    required: SEED_REQUIRED,
    rarities: [4, 5],
  });
}

// Partner seed ids must be exactly what the script would mint from the name,
// or the entry could never hand off to the fetched one.
async function loadPartnerSeed() {
  const seed = validateOverlaySeed(await readSeed(PARTNER_SEED_PATH), {
    label: PARTNER_SEED_LABEL,
    required: PARTNER_SEED_REQUIRED,
    rarities: [3, 4, 5],
  });
  return assertPartnerSeedIds(seed, { label: PARTNER_SEED_LABEL, mint: partnerId });
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

// Skip-or-upload one image through the shared ensureAsset skeleton. Art is
// uploaded at source size as webp — the app's transforms crop and scale it.
async function uploadAsset({ localPath, label, sourceUrl, reupload }) {
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

// Shared per-entry asset loop: resolves each unit's CDN path, uploads (or
// skips) its art, and returns the catalog entries plus the run counters.
async function seedAssets(units, { localPath, labelFor, reupload }) {
  const entries = [];
  const counts = { skipped: 0, uploaded: 0, failed: 0 };
  const missingImages = [];

  for (const { sourceUrl, missingImageReason, ...unit } of units) {
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
      });
      counts[result]++;
      if (result === 'failed') missingImages.push(id);
    } else {
      console.warn(`    ${missingImageReason} for ${id}`);
      missingImages.push(id);
    }

    entries.push({ ...unit, imageUrl });
  }

  // Sort: highest rarity first, then alphabetically within each group
  entries.sort((a, b) => {
    if (a.rarity !== b.rarity) return b.rarity - a.rarity;
    return a.name.localeCompare(b.name);
  });

  return { entries, counts, missingImages };
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
      `Prydwen (prydwen.gg/${GAME_PATH}/partners) plus the hand-curated overlay ${PARTNER_SEED_LABEL}`,
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

async function processCombatants() {
  console.log('Fetching CZN combatant list from Prydwen...');

  const [listData, existing, seed] = await Promise.all([
    fetchJSON(LIST_PAGE_DATA),
    loadExistingEntries(COMBATANTS_TS),
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

  const {
    entries: combatants,
    counts,
    missingImages,
  } = await seedAssets(units, {
    localPath: PORTRAIT_PATH,
    labelFor: (unit) => `Portrait for ${unit.name}`,
    reupload: reuploadCombatants,
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

// The partners page-data lists taxonomy only; the icons sit in the page's
// static query. Resolve the hash from the page-data each run and pick the
// payload that carries the partner nodes (see selectPartnerNodes).
async function fetchPartnerNodes() {
  const pageData = await fetchJSON(PARTNERS_PAGE_DATA);
  return selectPartnerNodes(pageData, {
    fetchStaticQuery: (hash) => fetchJSON(staticQueryData(hash)),
  });
}

async function processPartners() {
  console.log('\nFetching CZN partner list from Prydwen...');

  const [nodes, existing, seed] = await Promise.all([
    fetchPartnerNodes(),
    loadExistingEntries(PARTNERS_TS),
    loadPartnerSeed(),
  ]);
  console.log(`  ${nodes.length} partners listed`);

  // mintId throws on a collision — two names slugifying alike would make one
  // partner untrackable under the equip column.
  const taken = new Map();
  const fetched = nodes.map((node) => {
    const name = clean(node.name);
    const rarity = Number(node.rarity);
    if (![3, 4, 5].includes(rarity)) {
      throw new Error(`Unexpected rarity "${node.rarity}" for partner ${name}`);
    }
    return {
      id: mintId({ name, sourceId: node.unitId, taken, separator: PARTNER_ID_SEPARATOR }),
      name,
      rarity,
      class: clean(node.class),
      faction: clean(node.faction) || null,
      // 160² icon — the only square art Prydwen publishes for partners.
      sourceUrl: gatsbyImagePath(node.smallImage),
      missingImageReason: 'No smallImage node in static query',
    };
  });
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
    console.warn(`    Seed entry ${p.id} is now on Prydwen — delete it from ${PARTNER_SEED_LABEL}`);
  }

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

async function main() {
  await processCombatants();
  await processPartners();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
