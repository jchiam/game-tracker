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

import { readFile, writeFile, mkdir, access } from 'fs/promises';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import ImageKit, { toFile } from '@imagekit/nodejs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const STAR_RAIL_RES_BASE = 'https://raw.githubusercontent.com/Mar-7th/StarRailRes/master';

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
const reuploadRelics = reuploadAll || args.has('--reupload-relics');
if (reuploadAll) console.log('Reupload mode: all assets');
else if (reuploadRelics) console.log('Reupload mode: relics');

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return res.json();
}

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[•·]/g, '-')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

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

async function fileExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function downloadBinary(url, destPath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  await writeFile(destPath, buffer);
  return buffer;
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

async function uploadToImageKit(buffer, localAssetPath, mimeType = 'image/webp') {
  if (!imagekitClient) return;
  const loc = toImageKitLocation(localAssetPath);
  if (!loc) {
    console.warn(`    ImageKit: could not derive asset path from ${localAssetPath}`);
    return;
  }
  try {
    const uploadable = await toFile(buffer, loc.fileName, { type: mimeType });
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

function generateCharactersTs(characters) {
  const fiveStars = characters.filter((c) => c.rarity === 5);
  const fourStars = characters.filter((c) => c.rarity === 4);

  const lines = [
    '// Auto-generated from StarRailRes — do not edit manually.',
    '// Run `node scripts/update-hsr-data.mjs` or trigger the GitHub Actions workflow to update.',
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
    '// Auto-generated from StarRailRes — do not edit manually.',
    '// Run `node scripts/update-hsr-data.mjs` or trigger the GitHub Actions workflow to update.',
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
    const fallbackSlug = isDuplicate ? `${slugify(c.name)}_${slugify(c.path)}` : slugify(c.name);
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

  // Diff characters
  const existingCharKeys = new Set(existingCharEntries.map((c) => `${c.name}|${c.path}`));
  const newCharKeys = new Set(characters.map((c) => `${c.name}|${c.path}`));
  const addedChars = characters.filter((c) => !existingCharKeys.has(`${c.name}|${c.path}`));
  const removedChars = existingCharEntries.filter((c) => !newCharKeys.has(`${c.name}|${c.path}`));

  // Diff relic sets
  const existingRelicIds = new Set(existingRelicEntries.map((r) => r.id));
  const newRelicIds = new Set(relicSets.map((r) => r.id));
  const addedRelics = relicSets.filter((r) => !existingRelicIds.has(r.id));
  const removedRelics = existingRelicEntries.filter((r) => !newRelicIds.has(r.id));

  // Report
  const charDiff =
    addedChars.length || removedChars.length
      ? `+${addedChars.length} added, -${removedChars.length} removed`
      : 'no changes';
  const relicDiff =
    addedRelics.length || removedRelics.length
      ? `+${addedRelics.length} added, -${removedRelics.length} removed`
      : 'no changes';

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
