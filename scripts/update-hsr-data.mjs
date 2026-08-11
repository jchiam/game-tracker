// Auto-update script for Honkai Star Rail character, relic, and light cone data.
// Fetches the latest data from StarRailRes and regenerates:
//   - src/data/honkai-star-rail/characters.ts
//   - src/data/honkai-star-rail/relic_sets.ts
//   - src/data/honkai-star-rail/light_cones.ts
// Downloads character, relic, and light cone images and uploads to ImageKit CDN:
//   - character portraits  → ImageKit: /honkai_star_rail/characters
//   - relic set icons      → ImageKit: /honkai_star_rail/relics
//   - light cone icons     → ImageKit: /honkai_star_rail/light-cones
//
// Usage:
//   node scripts/update-hsr-data.mjs                         # only upload missing assets
//   node scripts/update-hsr-data.mjs --reupload-all          # force reupload all assets
//   node scripts/update-hsr-data.mjs --reupload-relics       # force reupload relic icons only
//   node scripts/update-hsr-data.mjs --reupload-light-cones  # force reupload light cone icons only

import { readFile, writeFile, mkdir } from 'fs/promises';
import { resolve } from 'path';
import {
  ROOT,
  loadLocalEnv,
  initImageKit,
  parseReuploadFlags,
  fetchJSON,
  downloadImage,
  slugify,
  jsStr,
  diffByKey,
  formatDiff,
  generatedHeader,
} from './lib/pipeline.mjs';

const STAR_RAIL_RES_BASE = 'https://raw.githubusercontent.com/Mar-7th/StarRailRes/master';

loadLocalEnv();
const { ensureAsset } = initImageKit();

const { all: reuploadAll, flags: reuploadFlags } = parseReuploadFlags(['relics', 'light-cones']);
const reuploadRelics = reuploadFlags.relics;
const reuploadLightCones = reuploadFlags['light-cones'];

async function loadExistingCharacters() {
  const filePath = resolve(ROOT, 'src/data/honkai-star-rail/characters.ts');
  try {
    const content = await readFile(filePath, 'utf-8');
    const entries = [];
    const idMap = new Map();
    const regex =
      /id:\s*'([^']+)'[^}]*?name:\s*'([^']+)'[^}]*?element:\s*'([^']+)'[^}]*?path:\s*'([^']+)'/gs;
    let match;
    while ((match = regex.exec(content)) !== null) {
      const [, id, name, element, path] = match;
      entries.push({ id, name, element, path });
      idMap.set(name, id);
      idMap.set(`${name}|${path}`, id);
    }
    return { entries, idMap };
  } catch {
    return { entries: [], idMap: new Map() };
  }
}

async function loadExistingLightCones() {
  const filePath = resolve(ROOT, 'src/data/honkai-star-rail/light_cones.ts');
  try {
    const content = await readFile(filePath, 'utf-8');
    const entries = [];
    // Names are emitted via jsStr(), so they may be single- or double-quoted.
    const regex = /id:\s*'([^']+)'[^}]*?name:\s*('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*")/gs;
    let match;
    while ((match = regex.exec(content)) !== null) {
      const raw = match[2];
      const name = raw.startsWith('"')
        ? JSON.parse(raw)
        : raw.slice(1, -1).replace(/\\'/g, "'").replace(/\\\\/g, '\\');
      entries.push({ id: match[1], name });
    }
    return entries;
  } catch {
    return [];
  }
}

async function loadExistingRelicSets() {
  const filePath = resolve(ROOT, 'src/data/honkai-star-rail/relic_sets.ts');
  try {
    const content = await readFile(filePath, 'utf-8');
    const entries = [];
    const regex = /id:\s*'([^']+)'[^}]*?name:\s*([^,\n]+)/gs;
    let match;
    while ((match = regex.exec(content)) !== null) {
      entries.push({ id: match[1], name: JSON.parse(match[2].trim()) });
    }
    return entries;
  } catch {
    return [];
  }
}

// Download a binary asset, write it to the local assets dir, and return the buffer.
async function downloadBinary(url, destPath) {
  const buffer = await downloadImage(url);
  await writeFile(destPath, buffer);
  return buffer;
}

function generateCharactersTs(characters) {
  const fiveStars = characters.filter((c) => c.rarity === 5);
  const fourStars = characters.filter((c) => c.rarity === 4);

  const lines = [
    ...generatedHeader('StarRailRes', 'update-hsr-data.mjs'),
    '',
    'export interface Character {',
    '  id: string;',
    '  name: string;',
    '  element: string;',
    '  path: string;',
    '  imageUrl: string;',
    '}',
    '',
    'export const ALL_CHARACTERS: Character[] = [',
  ];

  const formatEntry = (c) =>
    [
      `  {`,
      `    id: '${c.id}',`,
      `    name: '${c.name}',`,
      `    element: '${c.element}',`,
      `    path: '${c.path}',`,
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
  // Fallback: no rarity grouping possible
  if (fiveStars.length === 0 && fourStars.length === 0) {
    lines.push(...characters.map(formatEntry));
  }

  lines.push('];', '');
  return lines.join('\n');
}

function generateRelicSetsTs(relicSets) {
  const lines = [
    ...generatedHeader('StarRailRes', 'update-hsr-data.mjs'),
    "import { type RelicSet } from './relics';",
    '',
    'export const ALL_RELIC_SETS: RelicSet[] = [',
  ];

  for (const r of relicSets) {
    lines.push(
      `  {`,
      `    id: '${r.id}',`,
      `    name: ${JSON.stringify(r.name)},`,
      `    icon: '${r.icon}',`,
      `  },`,
    );
  }

  lines.push('];', '');
  return lines.join('\n');
}

function generateLightConesTs(lightCones) {
  const lines = [
    ...generatedHeader('StarRailRes', 'update-hsr-data.mjs'),
    '',
    'export interface LightCone {',
    '  id: string;',
    '  name: string;',
    '  rarity: number;',
    '  path: string;',
    '  imageUrl: string;',
    '}',
    '',
    'export const ALL_LIGHT_CONES: LightCone[] = [',
  ];

  let currentRarity = null;
  for (const lc of lightCones) {
    if (lc.rarity !== currentRarity) {
      currentRarity = lc.rarity;
      lines.push(`  // ${currentRarity}-Stars`);
    }
    lines.push(
      `  {`,
      `    id: '${lc.id}',`,
      `    name: ${jsStr(lc.name)},`,
      `    rarity: ${lc.rarity},`,
      `    path: '${lc.path}',`,
      `    imageUrl: '${lc.imageUrl}',`,
      `  },`,
    );
  }

  lines.push('];', '');
  return lines.join('\n');
}

async function main() {
  console.log('Fetching data from StarRailRes...');

  const [
    charData,
    relicData,
    lightConeData,
    pathData,
    existingCharsResult,
    existingRelicEntries,
    existingLightConeEntries,
  ] = await Promise.all([
    fetchJSON(`${STAR_RAIL_RES_BASE}/index_new/en/characters.json`),
    fetchJSON(`${STAR_RAIL_RES_BASE}/index_new/en/relic_sets.json`),
    fetchJSON(`${STAR_RAIL_RES_BASE}/index_new/en/light_cones.json`),
    fetchJSON(`${STAR_RAIL_RES_BASE}/index_new/en/paths.json`),
    loadExistingCharacters(),
    loadExistingRelicSets(),
    loadExistingLightCones(),
  ]);

  // Build path ID -> display name map
  const pathMap = {};
  for (const [id, info] of Object.entries(pathData)) {
    if (info && typeof info === 'object') pathMap[id] = info.name || id;
  }

  // Load existing character IDs to preserve backwards compatibility with Supabase records
  const { entries: existingCharEntries, idMap: existingIds } = existingCharsResult;

  // Ensure output directories exist
  const charImgDir = resolve(ROOT, 'public/assets/honkai-star-rail/characters');
  const relicImgDir = resolve(ROOT, 'public/assets/honkai-star-rail/relics');
  const lightConeImgDir = resolve(ROOT, 'public/assets/honkai-star-rail/light-cones');
  await mkdir(charImgDir, { recursive: true });
  await mkdir(relicImgDir, { recursive: true });
  await mkdir(lightConeImgDir, { recursive: true });

  // Process characters — two passes to handle duplicate names (e.g. alternate versions)
  const characters = [];
  let charImgCount = 0;

  // Pass 1: collect raw entries and count name occurrences to detect duplicates
  const rawCharacters = [];
  for (const [, info] of Object.entries(charData)) {
    if (!info || typeof info !== 'object') continue;
    const i = info;

    // Skip placeholders and non-playable entries (rarity 4 and 5 are playable)
    if (!i.name || i.name.startsWith('#') || i.name.includes('{') || !i.rarity) continue;
    if (i.rarity !== 4 && i.rarity !== 5) continue;

    rawCharacters.push({
      name: i.name,
      element: i.element || 'Unknown',
      path: pathMap[i.path] || i.path || 'Unknown',
      rarity: i.rarity,
      icon: i.icon,
    });
  }

  const nameCounts = new Map();
  for (const c of rawCharacters) nameCounts.set(c.name, (nameCounts.get(c.name) ?? 0) + 1);

  // Pass 2: assign IDs (path-disambiguated for duplicate names) and download images
  for (const c of rawCharacters) {
    const isDuplicate = nameCounts.get(c.name) > 1;
    const fallbackSlug = isDuplicate
      ? `${slugify(c.name, '-')}_${slugify(c.path, '-')}`
      : slugify(c.name, '-');
    // Prefer name|path lookup for duplicates; fall back to name-only for unique characters
    const id =
      existingIds.get(`${c.name}|${c.path}`) ??
      (!isDuplicate ? existingIds.get(c.name) : undefined) ??
      fallbackSlug;

    const imageUrl = `/assets/honkai-star-rail/characters/${id}.webp`;
    const imageLocalPath = resolve(charImgDir, `${id}.webp`);

    const charResult = await ensureAsset({
      localPath: imageLocalPath,
      label: `Image for ${c.name}`,
      reupload: reuploadAll,
      mimeType: 'image/webp',
      fetchBuffer: () => downloadBinary(`${STAR_RAIL_RES_BASE}/${c.icon}`, imageLocalPath),
    });
    if (charResult === 'uploaded') charImgCount++;

    characters.push({
      id,
      name: c.name,
      element: c.element,
      path: c.path,
      imageUrl,
      rarity: c.rarity,
    });
  }

  // Sort: 5-stars first, then alphabetically within each group
  characters.sort((a, b) => {
    if (a.rarity !== b.rarity) return b.rarity - a.rarity;
    return a.name.localeCompare(b.name);
  });

  // Process relic sets
  const relicSets = [];
  let relicImgCount = 0;

  for (const [id, info] of Object.entries(relicData)) {
    if (!info || typeof info !== 'object') continue;
    const i = info;

    const ext = i.icon?.split('.').pop() ?? 'png';
    const iconUrl = `/assets/honkai-star-rail/relics/${id}.${ext}`;
    const iconLocalPath = resolve(relicImgDir, `${id}.${ext}`);

    const relicResult = await ensureAsset({
      localPath: iconLocalPath,
      label: `Relic icon ${id}`,
      reupload: reuploadRelics,
      mimeType: ext === 'png' ? 'image/png' : 'image/webp',
      fetchBuffer: () => downloadBinary(`${STAR_RAIL_RES_BASE}/${i.icon}`, iconLocalPath),
    });
    if (relicResult === 'uploaded') relicImgCount++;

    relicSets.push({ id, name: i.name, icon: iconUrl });
  }

  relicSets.sort((a, b) => a.name.localeCompare(b.name));

  // Process light cones
  const lightCones = [];
  let lightConeImgCount = 0;

  for (const [id, info] of Object.entries(lightConeData)) {
    if (!info || typeof info !== 'object') continue;
    const i = info;

    // Skip placeholders; all rarities 3–5 are legitimate equips
    if (!i.name || i.name.startsWith('#') || i.name.includes('{') || !i.rarity) continue;

    const imageUrl = `/assets/honkai-star-rail/light-cones/${id}.webp`;
    const imageLocalPath = resolve(lightConeImgDir, `${id}.webp`);

    const lightConeResult = await ensureAsset({
      localPath: imageLocalPath,
      label: `Light cone icon ${i.name}`,
      reupload: reuploadLightCones,
      mimeType: 'image/webp',
      fetchBuffer: () => downloadBinary(`${STAR_RAIL_RES_BASE}/${i.icon}`, imageLocalPath),
    });
    if (lightConeResult === 'uploaded') lightConeImgCount++;

    lightCones.push({
      id,
      name: i.name,
      rarity: i.rarity,
      path: pathMap[i.path] || i.path || 'Unknown',
      imageUrl,
    });
  }

  // Sort: rarity descending, then alphabetically within each group
  lightCones.sort((a, b) => {
    if (a.rarity !== b.rarity) return b.rarity - a.rarity;
    return a.name.localeCompare(b.name);
  });

  // Write generated TypeScript files
  const charsFilePath = resolve(ROOT, 'src/data/honkai-star-rail/characters.ts');
  const relicsFilePath = resolve(ROOT, 'src/data/honkai-star-rail/relic_sets.ts');
  const lightConesFilePath = resolve(ROOT, 'src/data/honkai-star-rail/light_cones.ts');

  await writeFile(charsFilePath, generateCharactersTs(characters), 'utf-8');
  await writeFile(relicsFilePath, generateRelicSetsTs(relicSets), 'utf-8');
  await writeFile(lightConesFilePath, generateLightConesTs(lightCones), 'utf-8');

  // Diff and report
  const { added: addedChars, removed: removedChars } = diffByKey(
    existingCharEntries,
    characters,
    (c) => `${c.name}|${c.path}`,
  );
  const { added: addedRelics, removed: removedRelics } = diffByKey(
    existingRelicEntries,
    relicSets,
    (r) => r.id,
  );
  const { added: addedLightCones, removed: removedLightCones } = diffByKey(
    existingLightConeEntries,
    lightCones,
    (lc) => lc.id,
  );
  const charDiff = formatDiff(addedChars, removedChars);
  const relicDiff = formatDiff(addedRelics, removedRelics);
  const lightConeDiff = formatDiff(addedLightCones, removedLightCones);

  console.log('\nDone!');
  console.log(
    `  Characters : ${characters.length} total (${charDiff}) — ${charImgCount} images uploaded`,
  );
  for (const c of addedChars)
    console.log(`    + ${c.name} [${c.rarity}★ ${c.path} · ${c.element}]`);
  for (const c of removedChars) console.log(`    - ${c.name} [${c.path}] (removed from API)`);

  console.log(
    `  Relic sets : ${relicSets.length} total (${relicDiff}) — ${relicImgCount} icons uploaded`,
  );
  for (const r of addedRelics) console.log(`    + ${r.name}`);
  for (const r of removedRelics) console.log(`    - ${r.name} (removed from API)`);

  console.log(
    `  Light cones: ${lightCones.length} total (${lightConeDiff}) — ${lightConeImgCount} icons uploaded`,
  );
  for (const lc of addedLightCones) console.log(`    + ${lc.name} [${lc.rarity}★ ${lc.path}]`);
  for (const lc of removedLightCones) console.log(`    - ${lc.name} (removed from API)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
