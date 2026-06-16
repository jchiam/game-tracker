// Auto-update script for Neverness to Everness character and arc data.
// Fetches the latest data from everness.info GraphQL API and regenerates:
//   - src/data/neverness-to-everness/characters.ts
//   - src/data/neverness-to-everness/arcs.ts
//
// Downloads images from Waifus-Grace/NTE_Assets GitHub repo and uploads to ImageKit:
//   - character avatars (256px PNG)  → ImageKit: /neverness_to_everness/characters
//   - arc icons (256px PNG)          → ImageKit: /neverness_to_everness/arcs
//
// Data sources:
//   - everness.info/api/graphql: esper list, attributes, arc list
//   - github.com/Waifus-Grace/NTE_Assets: avatar and arc icon images
//
// Usage:
//   node scripts/update-n2e-data.mjs                    # only upload missing assets
//   node scripts/update-n2e-data.mjs --reupload-all     # force reupload all assets
//   node scripts/update-n2e-data.mjs --reupload-arcs    # force reupload arc icons only

import { readFile, writeFile } from 'fs/promises';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import ImageKit, { toFile } from '@imagekit/nodejs';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

try {
  process.loadEnvFile(resolve(ROOT, '.env.local'));
} catch {
  // No .env.local — rely on environment variables already set (e.g. CI secrets)
}

const IMAGEKIT_PRIVATE_KEY =
  process.env.IMAGEKIT_PRIVATE_KEY ?? process.env.VITE_IMAGEKIT_PRIVATE_KEY ?? '';
const IMAGEKIT_PUBLIC_KEY =
  process.env.IMAGEKIT_PUBLIC_KEY ?? process.env.VITE_IMAGEKIT_PUBLIC_KEY ?? '';
const IMAGEKIT_URL_ENDPOINT =
  process.env.IMAGEKIT_URL_ENDPOINT ?? process.env.VITE_IMAGEKIT_URL_ENDPOINT ?? '';

const imagekitClient = IMAGEKIT_PRIVATE_KEY
  ? new ImageKit({
      privateKey: IMAGEKIT_PRIVATE_KEY,
      publicKey: IMAGEKIT_PUBLIC_KEY,
      urlEndpoint: IMAGEKIT_URL_ENDPOINT,
    })
  : null;

if (imagekitClient) {
  console.log('ImageKit uploads enabled');
} else {
  console.log('ImageKit uploads skipped (IMAGEKIT_PRIVATE_KEY not set)');
}

const args = new Set(process.argv.slice(2));
const reuploadAll = args.has('--reupload-all');
const reuploadArcs = reuploadAll || args.has('--reupload-arcs');
if (reuploadAll) console.log('Reupload mode: all assets');
else if (reuploadArcs) console.log('Reupload mode: arcs');

// ─── Constants & Mappings ──────────────────────────────────────────

const GRAPHQL_URL = 'https://everness.info/api/graphql';
const AVATAR_BASE =
  'https://raw.githubusercontent.com/Waifus-Grace/NTE_Assets/main/UI_Icon/AvatarImage/256';
const ARC_ICON_BASE = 'https://raw.githubusercontent.com/Waifus-Grace/NTE_Assets/main/UI_Icon/Fork';

const RARITY_MAP = { 5: 'S', 4: 'A' };
const QUALITY_MAP = { orange: 'S', purple: 'A', blue: 'B' };
const ARC_TYPE_MAP = { 1: 'Solid', 2: 'Liquid', 3: 'Plasma', 4: 'Gas', 5: 'Synthesis' };

// Esper IDs whose avatar filename doesn't follow the player_{suffix}_256.png pattern.
const AVATAR_OVERRIDES = {
  1052: 'player_052_3_256.png', // Hotori
  1070: 'player_haiyue_256.png', // Aurelia
};

// Male/female variants to merge into a single 50:50 composite avatar.
// Key = canonical ID to keep, value = alternate ID to merge and discard.
// Zero: only male avatar (player_046) exists in NTE_Assets — merge disabled until female appears.
const MERGE_IDS = {};

// Combat roles — not available in the API (char_tags is null). Hardcoded per character.
const ROLE_OVERRIDES = {
  Adler: ['Survival', 'Shield', 'DoT'],
  Aurelia: ['Damage', 'Control'],
  Baicang: ['Damage', 'Main DPS', 'DoT'],
  Chiz: ['Damage', 'Main DPS'],
  Daffodill: ['Damage', 'Burst DPS', 'Break Boost'],
  Edgar: ['Survival', 'Healing'],
  Zero: ['Damage', 'Instant Cycle', 'Burst DPS'],
  Fadia: ['Survival', 'DMG Redirection'],
  Haniel: ['Buff', 'DMG Boost'],
  Hathor: ['Damage', 'Burst DPS'],
  Hotori: ['Buff', 'Burst DPS', 'DMG Boost'],
  Jiuyuan: ['Damage', 'Burst DPS', 'Control'],
  Lacrimosa: ['Damage', 'Burst DPS'],
  Mint: ['Damage', 'Main DPS'],
  Nanally: ['Damage', 'Main DPS', 'Follow-up Attack'],
  Sakiri: ['Buff', 'Control', 'DMG Boost'],
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

function esc(str) {
  return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

function avatarFilename(esperId) {
  if (AVATAR_OVERRIDES[esperId]) return AVATAR_OVERRIDES[esperId];
  const suffix = String(esperId).slice(1); // 1003 → 003
  return `player_${suffix}_256.png`;
}

async function loadExistingCharacters() {
  const filePath = resolve(ROOT, 'src/data/neverness-to-everness/characters.ts');
  try {
    const content = await readFile(filePath, 'utf-8');
    const entries = [];
    const idMap = new Map();
    const regex =
      /id:\s*'([^']+)'[^}]*?name:\s*'([^']+)'[^}]*?rarity:\s*'([^']+)'[^}]*?esperType:\s*'([^']+)'[^}]*?arcType:\s*'([^']+)'/gs;
    let match;
    while ((match = regex.exec(content)) !== null) {
      const [, id, name, rarity, esperType, arcType] = match;
      entries.push({ id, name, rarity, esperType, arcType });
      idMap.set(name, id);
    }
    return { entries, idMap };
  } catch {
    return { entries: [], idMap: new Map() };
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

// ─── ImageKit ──────────────────────────────────────────────────────

function toImageKitLocation(localAssetPath) {
  const normalized = localAssetPath.replace(/\\/g, '/');
  const assetsIdx = normalized.indexOf('/assets/');
  if (assetsIdx === -1) return null;
  const segments = normalized
    .slice(assetsIdx)
    .replace(/^\/assets/, '')
    .split('/');
  const mapped = segments.map((seg, i) =>
    i < segments.length - 1 ? seg.replace(/[^a-zA-Z0-9]/g, '_') : seg,
  );
  return {
    fileName: mapped[mapped.length - 1],
    folder: '/' + mapped.slice(0, -1).filter(Boolean).join('/'),
  };
}

async function existsOnImageKit(localAssetPath) {
  if (!imagekitClient) return false;
  const loc = toImageKitLocation(localAssetPath);
  if (!loc) return false;
  try {
    const existing = await imagekitClient.assets.list({
      path: loc.folder,
      searchQuery: `name = "${loc.fileName}"`,
      limit: 1,
    });
    return existing.length > 0;
  } catch {
    return false;
  }
}

async function uploadToImageKit(buffer, localAssetPath) {
  if (!imagekitClient) return;
  const loc = toImageKitLocation(localAssetPath);
  if (!loc) {
    console.warn(`    ImageKit: could not derive asset path from ${localAssetPath}`);
    return;
  }
  try {
    const uploadable = await toFile(buffer, loc.fileName, { type: 'image/webp' });
    await imagekitClient.files.upload({
      file: uploadable,
      fileName: loc.fileName,
      folder: loc.folder,
      useUniqueFileName: false,
    });
    console.log(`    Uploaded to ImageKit: ${loc.folder}/${loc.fileName}`);
  } catch (e) {
    console.warn(`    ImageKit upload failed: ${e?.message ?? String(e)}`);
  }
}

async function downloadImage(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

// Merge two avatar images into a 50:50 left/right composite.
async function mergeAvatars(leftBuffer, rightBuffer) {
  const left = sharp(leftBuffer);
  const right = sharp(rightBuffer);
  const { width, height } = await left.metadata();
  const halfW = Math.floor(width / 2);

  const leftHalf = await left.extract({ left: 0, top: 0, width: halfW, height }).toBuffer();
  const rightHalf = await right
    .extract({ left: halfW, top: 0, width: width - halfW, height })
    .toBuffer();

  return sharp({
    create: { width, height, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([
      { input: leftHalf, left: 0, top: 0 },
      { input: rightHalf, left: halfW, top: 0 },
    ])
    .png()
    .toBuffer();
}

// ─── Code Generation ───────────────────────────────────────────────

function generateCharactersTs(characters) {
  const sRank = characters.filter((c) => c.rarity === 'S');
  const aRank = characters.filter((c) => c.rarity === 'A');

  const lines = [
    '// Auto-generated from everness.info GraphQL API — do not edit manually.',
    '// Run `node scripts/update-n2e-data.mjs` or trigger the GitHub Actions workflow to update.',
    '',
    'export interface N2ECharacter {',
    '  id: string;',
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
    const rolesStr = c.roles.map((r) => `'${esc(r)}'`).join(', ');
    return [
      '  {',
      `    id: '${c.id}',`,
      `    name: '${esc(c.name)}',`,
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
    '// Auto-generated from everness.info GraphQL API — do not edit manually.',
    '// Run `node scripts/update-n2e-data.mjs` or trigger the GitHub Actions workflow to update.',
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
      `    name: '${esc(a.name)}',`,
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

function generateCartridgeStatsTs(mainStats, subStats) {
  const lines = [
    '// Auto-generated from everness.info GraphQL API — do not edit manually.',
    '// Run `node scripts/update-n2e-data.mjs` or trigger the GitHub Actions workflow to update.',
    '',
    'export const CARTRIDGE_MAIN_STATS = [',
    ...mainStats.map((s) => `  '${esc(s)}',`),
    '] as const;',
    '',
    'export const CARTRIDGE_SUB_STATS = [',
    ...subStats.map((s) => `  '${esc(s)}',`),
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
    mainStatData,
    subStatData,
    { entries: existingChars, idMap: existingIds },
    existingArcs,
  ] = await Promise.all([
    fetchGraphQL(`{
      espers {
        id name element rarity
        arcs_tags { name }
        char_tags { name }
      }
    }`),
    fetchGraphQL(`{
      arcs {
        id name quality type_id icon
      }
    }`),
    fetchGraphQL(`{ mainStatCore { name } }`),
    fetchGraphQL(`{ subStats { name } }`),
    loadExistingCharacters(),
    loadExistingArcs(),
  ]);

  const rawEspers = esperData.espers;
  const rawArcs = arcData.arcs;
  const mainStats = mainStatData.mainStatCore.map((s) => s.name);
  const subStats = subStatData.subStats.map((s) => s.name);
  console.log(
    `  Found ${rawEspers.length} espers, ${rawArcs.length} arcs, ${mainStats.length} main stats, ${subStats.length} sub stats`,
  );

  // ── Process Espers ───────────────────────────────────────────────

  // Skip duplicate/alternate IDs (female Zero 1051 is a duplicate of male Zero 1046)
  const skipIds = new Set([...Object.values(MERGE_IDS), '1051']);

  const espers = rawEspers.filter((e) => !skipIds.has(e.id));
  espers.sort((a, b) => {
    if (a.rarity !== b.rarity) return b.rarity - a.rarity; // S first
    return a.name.localeCompare(b.name);
  });

  const characters = [];
  let charImageCount = 0;
  const missingImages = [];

  console.log(`\nProcessing ${espers.length} characters...`);

  for (let idx = 0; idx < espers.length; idx++) {
    const e = espers[idx];
    const id = existingIds.get(e.name) ?? slugify(e.name);
    const rarity = RARITY_MAP[e.rarity] ?? 'Unknown';
    const esperType = e.element ?? 'Unknown';
    const arcType = e.arcs_tags?.name ?? 'Unknown';
    const roles = ROLE_OVERRIDES[e.name] ?? [];
    const imageUrl = `/assets/neverness-to-everness/characters/${id}.webp`;

    console.log(`  [${idx + 1}/${espers.length}] ${e.name} (${e.id})`);

    const localPath = resolve(ROOT, `public/assets/neverness-to-everness/characters/${id}.webp`);
    const onKit = !reuploadAll && (await existsOnImageKit(localPath));

    if (onKit) {
      console.log('    Already on ImageKit, skipping');
    } else {
      try {
        const reason = reuploadAll ? 'reupload requested' : 'missing from ImageKit';
        console.log(`    Image ${reason} — downloading...`);

        let buffer;
        const mergeAltId = MERGE_IDS[e.id];

        if (mergeAltId) {
          // Download both variants and merge 50:50
          const leftUrl = `${AVATAR_BASE}/${avatarFilename(Number(e.id))}`;
          const rightUrl = `${AVATAR_BASE}/${avatarFilename(Number(mergeAltId))}`;
          console.log(`    Merging ${e.id} + ${mergeAltId} into composite`);
          const [leftBuf, rightBuf] = await Promise.all([
            downloadImage(leftUrl),
            downloadImage(rightUrl),
          ]);
          buffer = await mergeAvatars(leftBuf, rightBuf);
        } else {
          const url = `${AVATAR_BASE}/${avatarFilename(Number(e.id))}`;
          buffer = await downloadImage(url);
        }

        charImageCount++;
        await uploadToImageKit(buffer, localPath);
      } catch (err) {
        console.warn(`    Image failed: ${err?.message ?? String(err)}`);
        missingImages.push(e.name);
      }
    }

    characters.push({ id, name: e.name, rarity, esperType, arcType, roles, imageUrl });
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

    const localPath = resolve(ROOT, `public/assets/neverness-to-everness/arcs/${a.id}.webp`);
    const onKit = !reuploadArcs && (await existsOnImageKit(localPath));

    if (onKit) {
      console.log('    Already on ImageKit, skipping');
    } else {
      try {
        const reason = reuploadArcs ? 'reupload requested' : 'missing from ImageKit';
        console.log(`    Image ${reason} — downloading...`);
        const url = `${ARC_ICON_BASE}/${a.id}_256.png`;
        const buffer = await downloadImage(url);
        arcImageCount++;
        await uploadToImageKit(buffer, localPath);
      } catch (err) {
        console.warn(`    Image failed: ${err?.message ?? String(err)}`);
      }
    }

    arcs.push({ id: a.id, name: a.name, rarity, arcType, imageUrl });
  }

  // ── Write generated files ────────────────────────────────────────

  const charPath = resolve(ROOT, 'src/data/neverness-to-everness/characters.ts');
  await writeFile(charPath, generateCharactersTs(characters), 'utf-8');

  const arcPath = resolve(ROOT, 'src/data/neverness-to-everness/arcs.ts');
  await writeFile(arcPath, generateArcsTs(arcs), 'utf-8');

  const statsPath = resolve(ROOT, 'src/data/neverness-to-everness/cartridge-stats.ts');
  await writeFile(statsPath, generateCartridgeStatsTs(mainStats, subStats), 'utf-8');

  // ── Report ───────────────────────────────────────────────────────

  const existingCharNames = new Set(existingChars.map((e) => e.name));
  const newCharNames = new Set(characters.map((c) => c.name));
  const charsAdded = characters.filter((c) => !existingCharNames.has(c.name));
  const charsRemoved = existingChars.filter((e) => !newCharNames.has(e.name));
  const charDiff =
    charsAdded.length || charsRemoved.length
      ? `+${charsAdded.length} added, -${charsRemoved.length} removed`
      : 'no changes';

  const existingArcNames = new Set(existingArcs.map((e) => e.name));
  const newArcNames = new Set(arcs.map((a) => a.name));
  const arcsAdded = arcs.filter((a) => !existingArcNames.has(a.name));
  const arcsRemoved = existingArcs.filter((e) => !newArcNames.has(e.name));
  const arcDiff =
    arcsAdded.length || arcsRemoved.length
      ? `+${arcsAdded.length} added, -${arcsRemoved.length} removed`
      : 'no changes';

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
