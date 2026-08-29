// Auto-update script for Neverness to Everness character and arc data.
// Fetches the latest data from everness.info GraphQL API and regenerates:
//   - src/data/neverness-to-everness/characters.ts
//   - src/data/neverness-to-everness/arcs.ts
//
// Downloads images and uploads to ImageKit:
//   - character busts (from gacha splash art)  → ImageKit: /neverness_to_everness/characters
//   - arc icons (256px)                        → ImageKit: /neverness_to_everness/arcs
//
// Data sources:
//   - everness.info/api/graphql: esper list, attributes, arc list, gacha art path (iconGacha)
//   - api.everness.info/data/assets: character gacha splash art (cropped to a head+shoulders bust)
//   - github.com/Waifus-Grace/NTE_Assets: arc icon images
//
// Usage:
//   node scripts/update-n2e-data.mjs                       # only upload missing assets
//   node scripts/update-n2e-data.mjs --reupload-all        # force reupload all assets
//   node scripts/update-n2e-data.mjs --reupload-characters # force reupload character busts only
//   node scripts/update-n2e-data.mjs --reupload-arcs       # force reupload arc icons only

import { readFile, writeFile } from 'fs/promises';
import { resolve } from 'path';
import sharp from 'sharp';
import {
  ROOT,
  loadLocalEnv,
  initImageKit,
  parseReuploadFlags,
  downloadImage,
  mintId,
  jsStr,
  diffByKey,
  formatDiff,
  generatedHeader,
} from './lib/pipeline.mjs';
import { orderN2eStats } from './lib/statOrder.mjs';

loadLocalEnv();
const { ensureAsset } = initImageKit();

const { all: reuploadAll, flags: reuploadFlags } = parseReuploadFlags(['arcs', 'characters']);
const reuploadArcs = reuploadFlags.arcs;
const reuploadCharacters = reuploadFlags.characters;

// ─── Constants & Mappings ──────────────────────────────────────────

const GRAPHQL_URL = 'https://everness.info/api/graphql';
// everness.info serves game assets from this CDN; the site maps internal `/Game/UI[_Icon]/...`
// asset paths to `${ASSET_BASE}/{path}.{ext}` (see `assetUrl` below). Character portraits are
// only exposed as full-body gacha splash art (esper.iconGacha) — cropped to a bust before upload.
const ASSET_BASE = 'https://api.everness.info/data/assets';
const ARC_ICON_BASE = 'https://raw.githubusercontent.com/Waifus-Grace/NTE_Assets/main/UI_Icon/Fork';

const RARITY_MAP = { 5: 'S', 4: 'A' };
const QUALITY_MAP = { orange: 'S', purple: 'A', blue: 'B' };
const ARC_TYPE_MAP = { 1: 'Solid', 2: 'Liquid', 3: 'Plasma', 4: 'Gas', 5: 'Synthesis' };

// Bust crop applied to the 1024×1024 gacha splash art: a square covering `side` of the width,
// horizontally centred on `cx`, offset `top` down from the top, then downscaled to `size`px.
// The default (centred, zoomed-out) suits the majority whose head sits high and centre-frame.
const BUST_CROP = { side: 0.6, cx: 0.5, top: 0.04, size: 256 };

// Per-character crop overrides (keyed by slug id) for off-centre or reclining poses the default
// crop frames poorly — tighter zoom + a horizontal shift onto the face. Verified visually.
const CROP_OVERRIDES = {
  jiuyuan: { side: 0.5, cx: 0.54, top: 0.14 }, // wide hat pushes the default crop too far out
  hathor: { side: 0.46, cx: 0.55, top: 0.12 }, // reclining pose, face high-right
};

// Alternate art variants: extra busts saved under their own slug but NOT emitted as separate
// catalog entries (their esper id is in `skipIds`). The app decides which variant to display via
// src/data/neverness-to-everness/characterOverrides.ts. Crop overrides key off the variant slug.
const ALT_VARIANTS = [
  { slug: 'zero-female', esperId: '1051' }, // female Zero — preferred art (see characterOverrides.ts)
];

// Combat roles — not available in the API (char_tags is null). Hardcoded per character.
const ROLE_OVERRIDES = {
  Adler: ['Survival', 'Shield', 'DoT'],
  Aurelia: ['Damage', 'Control'],
  Baicang: ['Damage', 'Main DPS', 'DoT'],
  Chaos: ['Damage', 'Main DPS', 'DMG Boost'],
  Chiz: ['Damage', 'Main DPS'],
  Daffodill: ['Damage', 'Burst DPS', 'Break Boost'],
  Edgar: ['Survival', 'Healing'],
  Zero: ['Damage', 'Instant Cycle', 'Burst DPS'],
  Fadia: ['Survival', 'DMG Redirection'],
  Haniel: ['Buff', 'DMG Boost'],
  Hathor: ['Damage', 'Burst DPS'],
  Hotori: ['Buff', 'Burst DPS', 'DMG Boost'],
  Iroi: ['Survival', 'Healing', 'Buff'],
  Jiuyuan: ['Damage', 'Burst DPS', 'Control'],
  Lacrimosa: ['Damage', 'Burst DPS'],
  Mint: ['Damage', 'Main DPS'],
  Nanally: ['Damage', 'Main DPS', 'Follow-up Attack'],
  Sakiri: ['Buff', 'Control', 'DMG Boost'],
  Shinku: ['Damage', 'Main DPS', 'Burst DPS'],
  Skia: ['Damage', 'Main DPS'],
};

// ─── Helpers ───────────────────────────────────────────────────────

async function fetchGraphQL(query) {
  const res = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'game-tracker-update-script/1.0',
    },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) throw new Error(`GraphQL fetch failed: ${res.status}`);
  const json = await res.json();
  if (json.errors) throw new Error(`GraphQL errors: ${JSON.stringify(json.errors)}`);
  return json.data;
}

// Resolve an internal everness asset path (e.g. `/Game/UI/UI/Gacha/YH_lihui_...`) to a CDN URL.
// Mirrors the site's own transform: strip the `/Game/UI[_Icon]/` prefix, append the extension.
function assetUrl(path, ext = 'webp') {
  const rel = path
    .replace(/^\/Game\/UI_Icon\//, '')
    .replace(/^\/Game\/UI\//, '')
    .replace(/^\//, '');
  return `${ASSET_BASE}/${rel}.${ext}`;
}

// Crop full-body gacha splash art down to a head+shoulders bust (see BUST_CROP / CROP_OVERRIDES).
async function cropBust(buffer, override = {}) {
  const { side, cx, top, size } = { ...BUST_CROP, ...override };
  const img = sharp(buffer);
  const { width, height } = await img.metadata();
  const sidePx = Math.round(width * side);
  const left = Math.max(0, Math.min(Math.round(width * cx - sidePx / 2), width - sidePx));
  const topPx = Math.round(height * top);
  return img
    .extract({ left, top: topPx, width: sidePx, height: Math.min(sidePx, height - topPx) })
    .resize(size, size)
    .webp({ quality: 90 })
    .toBuffer();
}

async function loadExistingCharacters() {
  const filePath = resolve(ROOT, 'src/data/neverness-to-everness/characters.ts');
  try {
    const content = await readFile(filePath, 'utf-8');
    const entries = [];
    const idMap = new Map();
    const idBySourceId = new Map();
    // `sourceId` is optional in the pattern so a catalog generated before it existed still parses —
    // those entries fall back to the name-keyed `idMap` for one run (see design D4).
    // `name` must accept either quote style: jsStr emits double quotes for names containing an
    // apostrophe, and a single-quote-only pattern would skip those entries — losing their `sourceId`
    // pin and re-minting their id, the exact failure this pinning exists to prevent.
    const regex =
      /id:\s*'([^']+)',(?:\s*sourceId:\s*'([^']+)',)?[^}]*?name:\s*(['"])((?:\\.|(?!\3)[^\\])*)\3[^}]*?rarity:\s*'([^']+)'[^}]*?esperType:\s*'([^']+)'[^}]*?arcType:\s*'([^']+)'/gs;
    let match;
    while ((match = regex.exec(content)) !== null) {
      const [, id, sourceId, , rawName, rarity, esperType, arcType] = match;
      const name = rawName.replace(/\\(.)/g, '$1');
      entries.push({ id, sourceId, name, rarity, esperType, arcType });
      idMap.set(name, id);
      if (sourceId) idBySourceId.set(sourceId, id);
    }
    return { entries, idMap, idBySourceId };
  } catch {
    return { entries: [], idMap: new Map(), idBySourceId: new Map() };
  }
}

async function loadExistingArcs() {
  const filePath = resolve(ROOT, 'src/data/neverness-to-everness/arcs.ts');
  try {
    const content = await readFile(filePath, 'utf-8');
    const entries = [];
    const regex = /id:\s*'([^']+)'[^}]*?name:\s*'([^']+)'/gs;
    let match;
    while ((match = regex.exec(content)) !== null) {
      entries.push({ id: match[1], name: match[2] });
    }
    return entries;
  } catch {
    return [];
  }
}

async function loadExistingCartridges() {
  const filePath = resolve(ROOT, 'src/data/neverness-to-everness/cartridges.ts');
  try {
    const content = await readFile(filePath, 'utf-8');
    const entries = [];
    const regex = /id:\s*'([^']+)'[^}]*?name:\s*'([^']+)'/gs;
    let match;
    while ((match = regex.exec(content)) !== null) {
      entries.push({ id: match[1], name: match[2] });
    }
    return entries;
  } catch {
    return [];
  }
}

// ─── Code Generation ───────────────────────────────────────────────

function generateCharactersTs(characters) {
  const sRank = characters.filter((c) => c.rarity === 'S');
  const aRank = characters.filter((c) => c.rarity === 'A');

  const lines = [
    ...generatedHeader('everness.info GraphQL API', 'update-n2e-data.mjs'),
    '',
    'export interface N2ECharacter {',
    '  id: string;',
    '  /** Upstream esper id. Pins `id` across renames — see mintId in scripts/lib/pipeline.mjs. */',
    '  sourceId: string;',
    '  name: string;',
    '  rarity: string;',
    '  esperType: string;',
    '  arcType: string;',
    '  roles: string[];',
    '  imageUrl: string;',
    '}',
    '',
    'export const ALL_CHARACTERS: N2ECharacter[] = [',
  ];

  const formatEntry = (c) => {
    const rolesStr = c.roles.map((r) => jsStr(r)).join(', ');
    return [
      '  {',
      `    id: '${c.id}',`,
      `    sourceId: '${c.sourceId}',`,
      `    name: ${jsStr(c.name)},`,
      `    rarity: '${c.rarity}',`,
      `    esperType: '${c.esperType}',`,
      `    arcType: '${c.arcType}',`,
      `    roles: [${rolesStr}],`,
      `    imageUrl: '${c.imageUrl}',`,
      '  },',
    ].join('\n');
  };

  if (sRank.length > 0) {
    lines.push('  // S-Rank');
    lines.push(...sRank.map(formatEntry));
  }
  if (aRank.length > 0) {
    lines.push('  // A-Rank');
    lines.push(...aRank.map(formatEntry));
  }

  lines.push('];', '');
  return lines.join('\n');
}

function generateArcsTs(arcs) {
  const sRank = arcs.filter((a) => a.rarity === 'S');
  const aRank = arcs.filter((a) => a.rarity === 'A');
  const bRank = arcs.filter((a) => a.rarity === 'B');

  const lines = [
    ...generatedHeader('everness.info GraphQL API', 'update-n2e-data.mjs'),
    '',
    'export interface N2EArc {',
    '  id: string;',
    '  name: string;',
    '  rarity: string;',
    '  arcType: string;',
    '  imageUrl: string;',
    '}',
    '',
    'export const ALL_ARCS: N2EArc[] = [',
  ];

  const formatEntry = (a) =>
    [
      '  {',
      `    id: '${a.id}',`,
      `    name: ${jsStr(a.name)},`,
      `    rarity: '${a.rarity}',`,
      `    arcType: '${a.arcType}',`,
      `    imageUrl: '${a.imageUrl}',`,
      '  },',
    ].join('\n');

  const addGroup = (label, items) => {
    if (items.length > 0) {
      lines.push(`  // ${label}`);
      lines.push(...items.map(formatEntry));
    }
  };

  addGroup('S-Rank', sRank);
  addGroup('A-Rank', aRank);
  addGroup('B-Rank', bRank);

  lines.push('];', '');
  return lines.join('\n');
}

const QUALITY_TO_RARITY = { orange: 'S', purple: 'A', blue: 'B' };

function generateCartridgesTs(cartridges) {
  const sRank = cartridges.filter((c) => c.rarity === 'S');
  const aRank = cartridges.filter((c) => c.rarity === 'A');
  const bRank = cartridges.filter((c) => c.rarity === 'B');

  const lines = [
    ...generatedHeader('everness.info GraphQL API', 'update-n2e-data.mjs'),
    '',
    'export interface N2ECartridge {',
    '  id: string;',
    '  name: string;',
    '  rarity: string;',
    '}',
    '',
    'export const ALL_CARTRIDGES: N2ECartridge[] = [',
  ];

  const formatEntry = (c) =>
    [
      '  {',
      `    id: '${c.id}',`,
      `    name: ${jsStr(c.name)},`,
      `    rarity: '${c.rarity}',`,
      '  },',
    ].join('\n');

  const addGroup = (label, items) => {
    if (items.length > 0) {
      lines.push(`  // ${label}`);
      lines.push(...items.map(formatEntry));
    }
  };

  addGroup('S-Rank', sRank);
  addGroup('A-Rank', aRank);
  addGroup('B-Rank', bRank);

  lines.push('];', '');
  return lines.join('\n');
}

function generateCartridgeStatsTs(mainStats, subStats) {
  const lines = [
    ...generatedHeader('everness.info GraphQL API', 'update-n2e-data.mjs'),
    '',
    'export const CARTRIDGE_MAIN_STATS = [',
    ...mainStats.map((s) => `  ${jsStr(s)},`),
    '] as const;',
    '',
    'export const CARTRIDGE_SUB_STATS = [',
    ...subStats.map((s) => `  ${jsStr(s)},`),
    '] as const;',
    '',
    "export const CARTRIDGE_RARITIES = ['B', 'A', 'S'] as const;",
    '',
    'export type CartridgeMainStat = (typeof CARTRIDGE_MAIN_STATS)[number];',
    'export type CartridgeSubStat = (typeof CARTRIDGE_SUB_STATS)[number];',
    'export type CartridgeRarity = (typeof CARTRIDGE_RARITIES)[number];',
    '',
  ];
  return lines.join('\n');
}

// ─── Main ──────────────────────────────────────────────────────────

async function main() {
  console.log('Fetching data from everness.info GraphQL API...');

  const [
    esperData,
    arcData,
    shardData,
    mainStatData,
    subStatData,
    { entries: existingChars, idMap: existingIdsByName, idBySourceId: existingIdsBySourceId },
    existingArcs,
    existingCartridges,
  ] = await Promise.all([
    fetchGraphQL(`{
      espers {
        id name element rarity iconGacha
        arcs_tags { name }
        char_tags { name }
      }
    }`),
    fetchGraphQL(`{
      arcs {
        id name quality type_id icon
      }
    }`),
    fetchGraphQL(`{ shards { id name quality type_id } }`),
    fetchGraphQL(`{ mainStatCore { name } }`),
    fetchGraphQL(`{ subStats { name } }`),
    loadExistingCharacters(),
    loadExistingArcs(),
    loadExistingCartridges(),
  ]);

  const rawEspers = esperData.espers;
  const rawArcs = arcData.arcs;
  const rawShards = shardData.shards;
  const mainStats = orderN2eStats(mainStatData.mainStatCore.map((s) => s.name));
  const subStats = orderN2eStats(subStatData.subStats.map((s) => s.name));
  console.log(
    `  Found ${rawEspers.length} espers, ${rawArcs.length} arcs, ${mainStats.length} main stats, ${subStats.length} sub stats`,
  );

  // ── Process Espers ───────────────────────────────────────────────

  // Skip duplicate/alternate IDs from the catalog (female Zero 1051 is an alternate of male Zero
  // 1046). Only one Zero catalog entry is emitted; both busts are still saved (see ALT_VARIANTS) so
  // the app can pick which art to show (src/data/neverness-to-everness/characterOverrides.ts).
  const skipIds = new Set(['1051']);

  const espers = rawEspers.filter((e) => !skipIds.has(e.id));
  espers.sort((a, b) => {
    if (a.rarity !== b.rarity) return b.rarity - a.rarity; // S first
    return a.name.localeCompare(b.name);
  });

  // Pin map: esper id → already-minted catalog id. Bootstrapped by name for entries generated
  // before `sourceId` existed, so the first run after that field landed re-pins them in place
  // instead of re-minting from the current name (design D4).
  const pinnedIds = new Map(existingIdsBySourceId);
  for (const e of espers) {
    if (!pinnedIds.has(e.id) && existingIdsByName.has(e.name)) {
      pinnedIds.set(e.id, existingIdsByName.get(e.name));
    }
  }
  const takenIds = new Map();

  const characters = [];
  let charImageCount = 0;
  const missingImages = [];

  console.log(`\nProcessing ${espers.length} characters...`);

  for (let idx = 0; idx < espers.length; idx++) {
    const e = espers[idx];
    const id = mintId({ name: e.name, sourceId: e.id, pinned: pinnedIds, taken: takenIds });
    const rarity = RARITY_MAP[e.rarity] ?? 'Unknown';
    const esperType = e.element ?? 'Unknown';
    const arcType = e.arcs_tags?.name ?? 'Unknown';
    const roles = ROLE_OVERRIDES[e.name] ?? [];
    const imageUrl = `/assets/neverness-to-everness/characters/${id}.webp`;

    console.log(`  [${idx + 1}/${espers.length}] ${e.name} (${e.id})`);

    if (!e.iconGacha) {
      console.warn(`    No gacha art (iconGacha) for ${e.name} — skipping image`);
      missingImages.push(e.name);
      characters.push({
        id,
        sourceId: e.id,
        name: e.name,
        rarity,
        esperType,
        arcType,
        roles,
        imageUrl,
      });
      continue;
    }

    const charResult = await ensureAsset({
      localPath: resolve(ROOT, `public/assets/neverness-to-everness/characters/${id}.webp`),
      label: 'Image',
      reupload: reuploadCharacters,
      mimeType: 'image/webp',
      fetchBuffer: async () =>
        cropBust(await downloadImage(assetUrl(e.iconGacha)), CROP_OVERRIDES[id]),
    });
    if (charResult === 'uploaded') charImageCount++;
    if (charResult === 'failed') missingImages.push(e.name);

    characters.push({
      id,
      sourceId: e.id,
      name: e.name,
      rarity,
      esperType,
      arcType,
      roles,
      imageUrl,
    });
  }

  // ── Process alternate art variants ───────────────────────────────
  // Saved as extra busts only — not added to the catalog. See ALT_VARIANTS / characterOverrides.ts.

  for (const { slug, esperId } of ALT_VARIANTS) {
    const e = rawEspers.find((esper) => esper.id === esperId);
    if (!e) {
      console.warn(`  Alt variant ${slug}: esper ${esperId} not found — skipping`);
      continue;
    }
    if (!e.iconGacha) {
      console.warn(`  Alt variant ${slug}: no gacha art (iconGacha) for ${e.name} — skipping`);
      missingImages.push(slug);
      continue;
    }
    console.log(`  [alt] ${slug} (${e.name} ${esperId})`);
    const altResult = await ensureAsset({
      localPath: resolve(ROOT, `public/assets/neverness-to-everness/characters/${slug}.webp`),
      label: 'Image',
      reupload: reuploadCharacters,
      mimeType: 'image/webp',
      fetchBuffer: async () =>
        cropBust(await downloadImage(assetUrl(e.iconGacha)), CROP_OVERRIDES[slug]),
    });
    if (altResult === 'uploaded') charImageCount++;
    if (altResult === 'failed') missingImages.push(slug);
  }

  // ── Process Arcs ─────────────────────────────────────────────────

  rawArcs.sort((a, b) => {
    const qa = { orange: 0, purple: 1, blue: 2 }[a.quality] ?? 3;
    const qb = { orange: 0, purple: 1, blue: 2 }[b.quality] ?? 3;
    if (qa !== qb) return qa - qb;
    return a.name.localeCompare(b.name);
  });

  const arcs = [];
  let arcImageCount = 0;

  console.log(`\nProcessing ${rawArcs.length} arcs...`);

  for (let idx = 0; idx < rawArcs.length; idx++) {
    const a = rawArcs[idx];
    const rarity = QUALITY_MAP[a.quality] ?? 'Unknown';
    const arcType = ARC_TYPE_MAP[a.type_id] ?? 'Unknown';
    const imageUrl = `/assets/neverness-to-everness/arcs/${a.id}.webp`;

    console.log(`  [${idx + 1}/${rawArcs.length}] ${a.name}`);

    const arcResult = await ensureAsset({
      localPath: resolve(ROOT, `public/assets/neverness-to-everness/arcs/${a.id}.webp`),
      label: 'Image',
      reupload: reuploadArcs,
      fetchBuffer: () => downloadImage(`${ARC_ICON_BASE}/${a.id}_256.png`),
    });
    if (arcResult === 'uploaded') arcImageCount++;

    arcs.push({ id: a.id, name: a.name, rarity, arcType, imageUrl });
  }

  // ── Process Cartridges ───────────────────────────────────────────

  const rawCartridgeCores = rawShards.filter((s) => s.type_id === 'core');
  rawCartridgeCores.sort((a, b) => {
    const qa = { orange: 0, purple: 1, blue: 2 }[a.quality] ?? 3;
    const qb = { orange: 0, purple: 1, blue: 2 }[b.quality] ?? 3;
    if (qa !== qb) return qa - qb;
    return a.name.localeCompare(b.name);
  });

  const cartridges = rawCartridgeCores.map((s) => ({
    id: s.id,
    name: s.name,
    rarity: QUALITY_TO_RARITY[s.quality] ?? 'B',
  }));

  console.log(`\nProcessing ${cartridges.length} cartridges...`);

  // ── Write generated files ────────────────────────────────────────

  const charPath = resolve(ROOT, 'src/data/neverness-to-everness/characters.ts');
  await writeFile(charPath, generateCharactersTs(characters), 'utf-8');

  const arcPath = resolve(ROOT, 'src/data/neverness-to-everness/arcs.ts');
  await writeFile(arcPath, generateArcsTs(arcs), 'utf-8');

  const cartridgesPath = resolve(ROOT, 'src/data/neverness-to-everness/cartridges.ts');
  await writeFile(cartridgesPath, generateCartridgesTs(cartridges), 'utf-8');

  const statsPath = resolve(ROOT, 'src/data/neverness-to-everness/cartridge-stats.ts');
  await writeFile(statsPath, generateCartridgeStatsTs(mainStats, subStats), 'utf-8');

  // ── Report ───────────────────────────────────────────────────────

  const { added: charsAdded, removed: charsRemoved } = diffByKey(
    existingChars,
    characters,
    (c) => c.name,
  );
  const charDiff = formatDiff(charsAdded, charsRemoved);

  const { added: arcsAdded, removed: arcsRemoved } = diffByKey(existingArcs, arcs, (a) => a.name);
  const arcDiff = formatDiff(arcsAdded, arcsRemoved);

  console.log('\nDone!');
  console.log(
    `  Characters: ${characters.length} total (${charDiff}) — ${charImageCount} images uploaded`,
  );
  for (const c of charsAdded)
    console.log(`    + ${c.name} [${c.rarity}-Rank ${c.esperType} · ${c.arcType}]`);
  for (const c of charsRemoved) console.log(`    - ${c.name} (removed from source)`);

  console.log(`  Arcs: ${arcs.length} total (${arcDiff}) — ${arcImageCount} images uploaded`);
  for (const a of arcsAdded) console.log(`    + ${a.name} [${a.rarity} ${a.arcType}]`);
  for (const a of arcsRemoved) console.log(`    - ${a.name} (removed from source)`);

  const { added: cartridgesAdded, removed: cartridgesRemoved } = diffByKey(
    existingCartridges,
    cartridges,
    (c) => c.id,
  );
  const cartridgeDiff = formatDiff(cartridgesAdded, cartridgesRemoved);
  console.log(`  Cartridges: ${cartridges.length} total (${cartridgeDiff})`);
  for (const c of cartridgesAdded) console.log(`    + ${c.name} [${c.rarity}]`);
  for (const c of cartridgesRemoved) console.log(`    - ${c.name} (removed from source)`);

  if (missingImages.length > 0) {
    console.warn(`\n  Warning: ${missingImages.length} character(s) with missing avatar images:`);
    for (const name of missingImages) console.warn(`    ? ${name}`);
    console.warn('  These will show ui-avatars.com placeholder in the UI.');
  }

  const missingRoles = characters.filter((c) => c.roles.length === 0);
  if (missingRoles.length > 0) {
    console.warn(
      `\n  Warning: ${missingRoles.length} character(s) without roles — add to ROLE_OVERRIDES:`,
    );
    for (const c of missingRoles) console.warn(`    ? ${c.name}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
