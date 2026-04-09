// Auto-update script for Reverse: 1999 arcanist data.
// Fetches the latest data from three sources and regenerates:
//   - src/data/reverse1999/arcanists.ts
//
// Also downloads mugshot and full-art images and uploads to ImageKit:
//   - mugshot (CN headicon via ArcanistMap, fallback to kornblume icon)
//                                              → ImageKit: /reverse_1999/arcanists_mugshots
//   - i2 (full-art portraits from kornblume)  → ImageKit: /reverse_1999/arcanists
//
// Data sources:
//   - windbow27/kornblume: arcanist list (Name, Rarity, Afflatus, IsReleased, Id for images)
//   - reverse1999.fandom.com: damage type (Mental / Reality) via wikitext batch API
//   - myssal/Reverse-1999-CN-Asset (ArcanistMap.json): headicon IDs → primary mugshot source
//
// Usage:
//   node scripts/update-r1999-data.mjs                   # only upload missing assets
//   node scripts/update-r1999-data.mjs --reupload-all    # force reupload all assets
//   node scripts/update-r1999-data.mjs --reupload-mugshots
//   node scripts/update-r1999-data.mjs --reupload-full-art

import { readFile, writeFile } from 'fs/promises';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import ImageKit from 'imagekit';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// Load .env.local if present (Node 22+ built-in)
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
const reuploadMugshots = args.has('--reupload-all') || args.has('--reupload-mugshots');
const reuploadFullArt = args.has('--reupload-all') || args.has('--reupload-full-art');
if (reuploadMugshots || reuploadFullArt) {
  const targets = [reuploadMugshots && 'mugshots', reuploadFullArt && 'full-art']
    .filter(Boolean)
    .join(' + ');
  console.log(`Reupload mode: ${targets}`);
}

const KORNBLUME_BASE = 'https://raw.githubusercontent.com/windbow27/kornblume/main/public';
const FANDOM_API = 'https://reverse1999.fandom.com/api.php';
const HEADICON_BASE =
  'https://raw.githubusercontent.com/myssal/Reverse-1999-CN-Asset/master/singlebg/headicon_img';
const ARCANIST_MAP_URL =
  'https://raw.githubusercontent.com/myssal/Reverse-1999-CN-Asset/master/mappings/ArcanistMap.json';

// Kornblume names that cannot be auto-matched to ArcanistMap entries.
// nameEng differs fundamentally (different English name or Cyrillic script).
const NAME_OVERRIDES = {
  Jessica: 3056, // nameEng: 'Changeling' — different English name (CN: 洁西卡)
  Vila: 3087, // nameEng: 'Вила' — Cyrillic
  Yenisei: 3082, // nameEng: 'Енисей' — Cyrillic
};

// Build a lookup function from ArcanistMap entries: kornblumeName → headiconId string.
// Uses four strategies in priority order before falling back to NAME_OVERRIDES.
function buildHeadiconLookup(arcanistMap) {
  const byNameEng = new Map(); // nameEng.toLowerCase() → characterId
  const byCNName = new Map(); // CN name (exact) → characterId

  for (const entry of arcanistMap) {
    const eng = (entry.nameEng ?? '').toLowerCase().trim();
    const cn = (entry.name ?? '').trim();
    if (eng) byNameEng.set(eng, entry.id);
    if (cn) byCNName.set(cn, entry.id);
  }

  return function findHeadiconId(kornblumeName) {
    // Manual overrides for unmatchable names
    if (NAME_OVERRIDES[kornblumeName] !== undefined) {
      return String(NAME_OVERRIDES[kornblumeName]) + '01';
    }

    const key = kornblumeName.toLowerCase();

    // Strategy 1: exact nameEng match (covers most characters)
    if (byNameEng.has(key)) return String(byNameEng.get(key)) + '01';

    // Strategy 2: exact CN name match (covers '37' → CN '37', '6' → CN '6', 'J' → CN 'J')
    if (byCNName.has(kornblumeName)) return String(byCNName.get(kornblumeName)) + '01';

    // Strategy 3: kornblumeName starts with nameEng ('Liang Yue' starts with 'Liang')
    for (const [eng, id] of byNameEng.entries()) {
      if (eng.length > 3 && key.startsWith(eng)) return String(id) + '01';
    }

    // Strategy 4: nameEng starts with kornblumeName ('Matilda Bouanich' starts with 'Matilda')
    for (const [eng, id] of byNameEng.entries()) {
      if (key.length > 3 && eng.startsWith(key)) return String(id) + '01';
    }

    return null;
  };
}

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return res.json();
}

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

async function loadExistingArcanists() {
  const filePath = resolve(ROOT, 'src/data/reverse1999/arcanists.ts');
  try {
    const content = await readFile(filePath, 'utf-8');
    const entries = [];
    const idMap = new Map();
    const damageMap = new Map();
    const regex =
      /id:\s*'([^']+)'[^}]*?name:\s*'([^']+)'[^}]*?afflatus:\s*'([^']+)'[^}]*?damageType:\s*'([^']+)'/gs;
    let match;
    while ((match = regex.exec(content)) !== null) {
      const [, id, name, afflatus, damageType] = match;
      entries.push({ id, name, afflatus, damageType });
      idMap.set(name, id);
      damageMap.set(name, damageType);
    }
    return { entries, idMap, damageMap };
  } catch {
    return { entries: [], idMap: new Map(), damageMap: new Map() };
  }
}

// Download a raw image and return the buffer.
async function downloadImage(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

// Derive ImageKit folder and fileName from a local asset path.
// Path mapping mirrors toImageKitPath() from src/lib/imagekit.ts.
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

// Check whether a file already exists on ImageKit. Returns false if ImageKit is not configured.
async function existsOnImageKit(localAssetPath) {
  if (!imagekitClient) return false;
  const loc = toImageKitLocation(localAssetPath);
  if (!loc) return false;
  try {
    const existing = await imagekitClient.listFiles({
      path: loc.folder,
      name: loc.fileName,
      limit: 1,
    });
    return existing.length > 0;
  } catch {
    return false;
  }
}

// Upload a buffer to ImageKit using the path derived from a local asset path.
async function uploadToImageKit(buffer, localAssetPath) {
  if (!imagekitClient) return;
  const loc = toImageKitLocation(localAssetPath);
  if (!loc) {
    console.warn(`    ImageKit: could not derive asset path from ${localAssetPath}`);
    return;
  }
  try {
    await imagekitClient.upload({
      file: buffer,
      fileName: loc.fileName,
      folder: loc.folder,
      useUniqueFileName: false,
    });
    console.log(`    Uploaded to ImageKit: ${loc.folder}/${loc.fileName}`);
  } catch (e) {
    console.warn(`    ImageKit upload failed: ${e?.message ?? String(e)}`);
  }
}

// Build a reverse lookup from resolved wiki title → original kornblume name,
// using the redirects and normalized arrays returned by the MediaWiki API.
function buildReverseMap(query) {
  const reverse = new Map();
  for (const { from, to } of query?.redirects ?? []) {
    reverse.set(to, from);
  }
  for (const { from, to } of query?.normalized ?? []) {
    const original = reverse.get(from) ?? from;
    reverse.set(to, original);
  }
  return reverse;
}

// Batch-fetch damage types from Fandom wiki (up to 50 titles per request)
async function fetchDamageTypes(names) {
  const damageMap = new Map();
  const BATCH_SIZE = 50;

  for (let i = 0; i < names.length; i += BATCH_SIZE) {
    const batch = names.slice(i, i + BATCH_SIZE);
    const titlesParam = batch.map((n) => encodeURIComponent(n)).join('|');
    const url = `${FANDOM_API}?action=query&prop=revisions&titles=${titlesParam}&rvprop=content&rvslots=main&format=json&redirects`;

    try {
      const data = await fetchJSON(url);
      const reverseMap = buildReverseMap(data.query);
      const pages = data.query?.pages ?? {};
      for (const page of Object.values(pages)) {
        const wikitext =
          page.revisions?.[0]?.slots?.main?.['*'] ?? page.revisions?.[0]?.['*'] ?? '';
        const dmgMatch = wikitext.match(/\|\s*damage\s*=\s*(\w+)/i);
        if (dmgMatch) {
          const name = reverseMap.get(page.title) ?? page.title;
          damageMap.set(name, dmgMatch[1]);
        }
      }
    } catch (e) {
      console.warn(
        `  Warning: Could not fetch damage types for batch starting at index ${i}: ${e.message}`,
      );
    }
  }

  return damageMap;
}

function generateArcanistsTs(arcanists) {
  const sixStars = arcanists.filter((a) => a.rarity === 6);
  const fiveStars = arcanists.filter((a) => a.rarity === 5);

  const lines = [
    '// Auto-generated from kornblume, Reverse: 1999 Wiki, and CN ArcanistMap — do not edit manually.',
    '// Run `node scripts/update-r1999-data.mjs` or trigger the GitHub Actions workflow to update.',
    '// imageUrl resolves to the best available mugshot: CN headicon first, kornblume icon as fallback.',
    '',
    'export interface Arcanist {',
    '  id: string;',
    '  name: string;',
    '  afflatus: string;',
    '  damageType: string;',
    '  imageUrl: string;',
    '}',
    '',
    'export const ALL_ARCANISTS: Arcanist[] = [',
  ];

  const formatEntry = (a) => {
    return [
      `  {`,
      `    id: '${a.id}',`,
      `    name: '${a.name}',`,
      `    afflatus: '${a.afflatus}',`,
      `    damageType: '${a.damageType}',`,
      `    imageUrl: '${a.imageUrl}',`,
      `  },`,
    ].join('\n');
  };

  if (sixStars.length > 0) {
    lines.push('  // 6-Stars');
    lines.push(...sixStars.map(formatEntry));
  }
  if (fiveStars.length > 0) {
    lines.push('  // 5-Stars');
    lines.push(...fiveStars.map(formatEntry));
  }
  if (sixStars.length === 0 && fiveStars.length === 0) {
    lines.push(...arcanists.map(formatEntry));
  }

  lines.push('];', '');
  return lines.join('\n');
}

async function main() {
  console.log('Fetching data from kornblume, Fandom wiki, and CN ArcanistMap...');

  const [
    kornblumeData,
    arcanistMap,
    { entries: existingEntries, idMap: existingIds, damageMap: existingDamage },
  ] = await Promise.all([
    fetchJSON(`${KORNBLUME_BASE}/data/arcanists.json`),
    fetchJSON(ARCANIST_MAP_URL),
    loadExistingArcanists(),
  ]);

  const findHeadiconId = buildHeadiconLookup(arcanistMap);
  console.log(`  ArcanistMap loaded (${arcanistMap.length} entries)`);

  // Filter to released playable characters only (rarity 5 and 6)
  const releasedRaw = kornblumeData.filter(
    (c) => c.IsReleased === true && c.Name && c.Id && (c.Rarity === 5 || c.Rarity === 6),
  );

  console.log(`  Found ${releasedRaw.length} released arcanists in kornblume`);

  const names = releasedRaw.map((c) => c.Name);

  console.log('  Fetching damage types from Fandom wiki...');
  const wikiDamage = await fetchDamageTypes(names);
  console.log(`  Got damage types for ${wikiDamage.size}/${names.length} arcanists`);

  // These paths are used only to derive ImageKit folder/filename — images are not stored locally.
  const mugshotDir = resolve(ROOT, 'public/assets/reverse-1999/arcanists-mugshots');
  const fullArtDir = resolve(ROOT, 'public/assets/reverse-1999/arcanists');

  // Sort: 6-stars first, then alphabetically within each group
  releasedRaw.sort((a, b) => {
    if (a.Rarity !== b.Rarity) return b.Rarity - a.Rarity;
    return a.Name.localeCompare(b.Name);
  });

  const arcanists = [];
  let mugshotCount = 0;
  let fullArtCount = 0;
  const unknownDamage = [];
  const unmatchedHeadicons = [];
  const total = releasedRaw.length;

  console.log(`\nProcessing images for ${total} arcanists...`);

  for (let idx = 0; idx < releasedRaw.length; idx++) {
    const c = releasedRaw[idx];
    const id = existingIds.get(c.Name) ?? slugify(c.Name);
    const afflatus = c.Afflatus ?? 'Unknown';
    const damageType = wikiDamage.get(c.Name) ?? existingDamage.get(c.Name) ?? 'Unknown';

    if (damageType === 'Unknown') unknownDamage.push(c.Name);

    const headiconId = findHeadiconId(c.Name);
    if (!headiconId) unmatchedHeadicons.push(c.Name);

    const imageUrl = `/assets/reverse-1999/arcanists-mugshots/${id}.webp`;

    console.log(`  [${idx + 1}/${total}] ${c.Name}`);

    // Mugshot: headicon (primary) or kornblume icon (fallback) → unified mugshot folder
    const mugshotLocalPath = resolve(mugshotDir, `${id}.webp`);
    const mugshotOnKit = !reuploadMugshots && (await existsOnImageKit(mugshotLocalPath));
    if (mugshotOnKit) {
      console.log(`    Mugshot already on ImageKit, skipping`);
    } else {
      try {
        const reason = reuploadMugshots ? 'reupload requested' : 'missing from ImageKit';
        console.log(`    Mugshot ${reason} — downloading...`);
        let buffer;
        if (headiconId) {
          buffer = await downloadImage(`${HEADICON_BASE}/${headiconId}.png`);
          console.log(`      Source: headicon ${headiconId}`);
        } else {
          buffer = await downloadImage(`${KORNBLUME_BASE}/images/arcanists/icon/${c.Id}.webp`);
          console.log(`      Source: kornblume icon (no headicon matched)`);
        }
        mugshotCount++;
        await uploadToImageKit(buffer, mugshotLocalPath);
      } catch (e) {
        console.warn(`    Warning: Could not process mugshot: ${e?.message ?? String(e)}`);
      }
    }

    // Full-art portrait (kornblume i2)
    const fullArtLocalPath = resolve(fullArtDir, `${id}.webp`);
    const fullArtOnKit = !reuploadFullArt && (await existsOnImageKit(fullArtLocalPath));
    if (fullArtOnKit) {
      console.log(`    Full-art already on ImageKit, skipping`);
    } else {
      try {
        const reason = reuploadFullArt ? 'reupload requested' : 'missing from ImageKit';
        console.log(`    Full-art ${reason} — downloading and uploading...`);
        const fullArtBuffer = await downloadImage(
          `${KORNBLUME_BASE}/images/arcanists/i2/${c.Id}.webp`,
        );
        fullArtCount++;
        await uploadToImageKit(fullArtBuffer, fullArtLocalPath);
      } catch (e) {
        console.warn(`    Warning: Could not process full-art: ${e?.message ?? String(e)}`);
      }
    }

    arcanists.push({
      id,
      name: c.Name,
      afflatus,
      damageType,
      rarity: c.Rarity,
      imageUrl,
    });
  }

  // Write generated TypeScript file
  const filePath = resolve(ROOT, 'src/data/reverse1999/arcanists.ts');
  await writeFile(filePath, generateArcanistsTs(arcanists), 'utf-8');

  // Diff against existing data
  const existingNames = new Set(existingEntries.map((e) => e.name));
  const newNames = new Set(arcanists.map((a) => a.name));
  const added = arcanists.filter((a) => !existingNames.has(a.name));
  const removed = existingEntries.filter((e) => !newNames.has(e.name));

  const diff =
    added.length || removed.length
      ? `+${added.length} added, -${removed.length} removed`
      : 'no changes';

  console.log('\nDone!');
  console.log(
    `  Arcanists : ${arcanists.length} total (${diff}) — ${mugshotCount} mugshots, ${fullArtCount} full-art images downloaded`,
  );
  for (const a of added)
    console.log(`    + ${a.name} [${a.rarity}★ ${a.afflatus} · ${a.damageType}]`);
  for (const a of removed) console.log(`    - ${a.name} (removed from source)`);

  if (unmatchedHeadicons.length > 0) {
    console.warn(
      `\n  Warning: No headicon match for ${unmatchedHeadicons.length} arcanist(s) — kornblume icon used as fallback:`,
    );
    for (const name of unmatchedHeadicons) console.warn(`    ? ${name}`);
  }

  if (unknownDamage.length > 0) {
    console.warn(
      `\n  Warning: Could not resolve damage type for ${unknownDamage.length} arcanist(s):`,
    );
    for (const name of unknownDamage) console.warn(`    ? ${name}`);
    console.warn('  Update these manually in src/data/reverse1999/arcanists.ts.');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
