// Auto-update script for Honkai Star Rail character and relic data.
// Fetches the latest data from StarRailRes and regenerates:
//   - src/data/honkai-star-rail/characters.ts
//   - src/data/honkai-star-rail/relic_sets.ts
// Downloads character and relic images and uploads to ImageKit CDN:
//   - character portraits  → ImageKit: /honkai_star_rail/characters
//   - relic set icons      → ImageKit: /honkai_star_rail/relics
//
// Usage:
//   node scripts/update-hsr-data.mjs                    # only upload missing assets
//   node scripts/update-hsr-data.mjs --reupload-all     # force reupload all assets
//   node scripts/update-hsr-data.mjs --reupload-relics  # force reupload relic icons only

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
  diffByKey,
  formatDiff,
  generatedHeader,
} from './lib/pipeline.mjs';

const STAR_RAIL_RES_BASE = 'https://raw.githubusercontent.com/Mar-7th/StarRailRes/master';

loadLocalEnv();
const { existsOnImageKit, uploadToImageKit } = initImageKit();

const { all: reuploadAll, flags: reuploadFlags } = parseReuploadFlags(['relics']);
const reuploadRelics = reuploadFlags.relics;

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

async function main() {
  console.log('Fetching data from StarRailRes...');

  const [charData, relicData, pathData, existingCharsResult, existingRelicEntries] =
    await Promise.all([
      fetchJSON(`${STAR_RAIL_RES_BASE}/index_new/en/characters.json`),
      fetchJSON(`${STAR_RAIL_RES_BASE}/index_new/en/relic_sets.json`),
      fetchJSON(`${STAR_RAIL_RES_BASE}/index_new/en/paths.json`),
      loadExistingCharacters(),
      loadExistingRelicSets(),
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
  await mkdir(charImgDir, { recursive: true });
  await mkdir(relicImgDir, { recursive: true });

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

    const onKit = !reuploadAll && (await existsOnImageKit(imageLocalPath));
    if (onKit) {
      console.log(`  [${characters.length + 1}] ${c.name} — already on ImageKit, skipping`);
    } else {
      try {
        const reason = reuploadAll ? 'reupload requested' : 'missing from ImageKit';
        console.log(`  Downloading image for ${c.name} (${reason})...`);
        const buffer = await downloadBinary(`${STAR_RAIL_RES_BASE}/${c.icon}`, imageLocalPath);
        charImgCount++;
        await uploadToImageKit(buffer, imageLocalPath, 'image/webp');
      } catch (e) {
        console.warn(`  Warning: Could not download image for ${c.name}: ${e.message}`);
      }
    }

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

    const onKit = !reuploadRelics && (await existsOnImageKit(iconLocalPath));
    if (onKit) {
      console.log(`  Relic ${id} — already on ImageKit, skipping`);
    } else {
      try {
        const reason = reuploadRelics ? 'reupload requested' : 'missing from ImageKit';
        console.log(`  Downloading relic icon ${id} (${reason})...`);
        const mimeType = ext === 'png' ? 'image/png' : 'image/webp';
        const buffer = await downloadBinary(`${STAR_RAIL_RES_BASE}/${i.icon}`, iconLocalPath);
        relicImgCount++;
        await uploadToImageKit(buffer, iconLocalPath, mimeType);
      } catch (e) {
        console.warn(`  Warning: Could not download relic icon ${id}: ${e.message}`);
      }
    }

    relicSets.push({ id, name: i.name, icon: iconUrl });
  }

  relicSets.sort((a, b) => a.name.localeCompare(b.name));

  // Write generated TypeScript files
  const charsFilePath = resolve(ROOT, 'src/data/honkai-star-rail/characters.ts');
  const relicsFilePath = resolve(ROOT, 'src/data/honkai-star-rail/relic_sets.ts');

  await writeFile(charsFilePath, generateCharactersTs(characters), 'utf-8');
  await writeFile(relicsFilePath, generateRelicSetsTs(relicSets), 'utf-8');

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
  const charDiff = formatDiff(addedChars, removedChars);
  const relicDiff = formatDiff(addedRelics, removedRelics);

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
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
