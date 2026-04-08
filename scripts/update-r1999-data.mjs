// Auto-update script for Reverse: 1999 arcanist data.
// Fetches the latest data from two sources and regenerates:
//   - src/data/reverse1999/arcanists.ts
//
// Also downloads two image sets from kornblume and uploads new ones to ImageKit:
//   - i0 (cropped square mugshots) → local: arcanists-mugshots/  ImageKit: /reverse_1999/arcanists_mugshots
//   - i2 (full-art portraits)      → local: arcanists/           ImageKit: /reverse_1999/arcanists
//
// Data sources:
//   - windbow27/kornblume: arcanist list (Name, Rarity, Afflatus, IsReleased, Id for images)
//   - reverse1999.fandom.com: damage type (Mental / Reality) via wikitext batch API
//
// Usage: node scripts/update-r1999-data.mjs

import { readFile, writeFile, mkdir, access } from 'fs/promises';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import ImageKit from 'imagekit';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const imagekitClient = process.env.IMAGEKIT_PRIVATE_KEY
  ? new ImageKit({
      privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
      publicKey: process.env.IMAGEKIT_PUBLIC_KEY ?? '',
      urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT ?? '',
    })
  : null;

if (imagekitClient) {
  console.log('ImageKit uploads enabled');
} else {
  console.log('ImageKit uploads skipped (IMAGEKIT_PRIVATE_KEY not set)');
}

const KORNBLUME_BASE = 'https://raw.githubusercontent.com/windbow27/kornblume/main/public';
const FANDOM_API = 'https://reverse1999.fandom.com/api.php';

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

async function fileExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

// Download a raw image and save it to disk, returning the buffer.
async function downloadImage(url, destPath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  await writeFile(destPath, buffer);
  return buffer;
}

// Download a kornblume i0 image, crop a square from the top, save as WebP, and return the buffer.
async function downloadAndCropArcanistImage(url, destPath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());

  const sharp = (await import('sharp')).default;
  const { width } = await sharp(buffer).metadata();

  const processed = await sharp(buffer)
    .extract({ left: 0, top: 0, width, height: width })
    .webp({ quality: 85 })
    .toBuffer();

  await writeFile(destPath, processed);
  return processed;
}

// Upload a processed image buffer to ImageKit, mirroring the local asset path structure.
// Path mapping mirrors toImageKitPath() from src/lib/imagekit.ts.
async function uploadToImageKit(buffer, destPath, overrideFolder = null) {
  if (!imagekitClient) return;

  const normalized = destPath.replace(/\\/g, '/');
  const assetsIdx = normalized.indexOf('/assets/');
  if (assetsIdx === -1) {
    console.warn(`  ImageKit: could not derive asset path from ${destPath}`);
    return;
  }
  const localPath = normalized.slice(assetsIdx);

  const segments = localPath.replace(/^\/assets/, '').split('/');
  const mapped = segments.map((seg, i) =>
    i < segments.length - 1 ? seg.replace(/[^a-zA-Z0-9]/g, '_') : seg,
  );
  const fileName = mapped[mapped.length - 1];
  const folder = overrideFolder ?? '/' + mapped.slice(0, -1).filter(Boolean).join('/');

  try {
    const existing = await imagekitClient.listFiles({ path: folder, name: fileName, limit: 1 });
    if (existing.length > 0) {
      console.log(`  ImageKit: skipped ${fileName} (already exists)`);
      return;
    }
    await imagekitClient.upload({ file: buffer, fileName, folder, useUniqueFileName: false });
    console.log(`  ImageKit: uploaded ${fileName}`);
  } catch (e) {
    console.warn(`  ImageKit upload failed for ${fileName}: ${e?.message ?? String(e)}`);
  }
}

// Build a reverse lookup from resolved wiki title → original kornblume name,
// using the redirects and normalized arrays returned by the MediaWiki API.
// This handles cases where the kornblume name differs from the wiki page title
// (e.g. "Ezra Theodore" in kornblume → "Ezra" on the wiki).
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
    '// Auto-generated from kornblume and Reverse: 1999 Wiki — do not edit manually.',
    '// Run `node scripts/update-r1999-data.mjs` or trigger the GitHub Actions workflow to update.',
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

  const formatEntry = (a) =>
    [
      `  {`,
      `    id: '${a.id}',`,
      `    name: '${a.name}',`,
      `    afflatus: '${a.afflatus}',`,
      `    damageType: '${a.damageType}',`,
      `    imageUrl: '${a.imageUrl}',`,
      `  },`,
    ].join('\n');

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
  console.log('Fetching data from kornblume and Fandom wiki...');

  const [
    kornblumeData,
    { entries: existingEntries, idMap: existingIds, damageMap: existingDamage },
  ] = await Promise.all([
    fetchJSON(`${KORNBLUME_BASE}/data/arcanists.json`),
    loadExistingArcanists(),
  ]);

  // Filter to released playable characters only (rarity 5 and 6)
  const releasedRaw = kornblumeData.filter(
    (c) => c.IsReleased === true && c.Name && c.Id && (c.Rarity === 5 || c.Rarity === 6),
  );

  console.log(`  Found ${releasedRaw.length} released arcanists in kornblume`);

  const names = releasedRaw.map((c) => c.Name);

  console.log('  Fetching damage types from Fandom wiki...');
  const wikiDamage = await fetchDamageTypes(names);
  console.log(`  Got damage types for ${wikiDamage.size}/${names.length} arcanists`);

  // Ensure output directories exist
  const mugshotDir = resolve(ROOT, 'public/assets/reverse-1999/arcanists-mugshots');
  const fullArtDir = resolve(ROOT, 'public/assets/reverse-1999/arcanists');
  await Promise.all([
    mkdir(mugshotDir, { recursive: true }),
    mkdir(fullArtDir, { recursive: true }),
  ]);

  // Sort: 6-stars first, then alphabetically within each group
  releasedRaw.sort((a, b) => {
    if (a.Rarity !== b.Rarity) return b.Rarity - a.Rarity;
    return a.Name.localeCompare(b.Name);
  });

  const arcanists = [];
  let mugshotCount = 0;
  let fullArtCount = 0;
  const unknownDamage = [];

  for (const c of releasedRaw) {
    const id = existingIds.get(c.Name) ?? slugify(c.Name);
    const afflatus = c.Afflatus ?? 'Unknown';
    const damageType = wikiDamage.get(c.Name) ?? existingDamage.get(c.Name) ?? 'Unknown';

    if (damageType === 'Unknown') unknownDamage.push(c.Name);

    const imageUrl = `/assets/reverse-1999/arcanists-mugshots/${id}.webp`;

    const mugshotLocalPath = resolve(mugshotDir, `${id}.webp`);
    if (!(await fileExists(mugshotLocalPath))) {
      try {
        const mugshotBuffer = await downloadAndCropArcanistImage(
          `${KORNBLUME_BASE}/images/arcanists/i0/${c.Id}.webp`,
          mugshotLocalPath,
        );
        mugshotCount++;
        await uploadToImageKit(mugshotBuffer, mugshotLocalPath);
      } catch (e) {
        console.warn(
          `  Warning: Could not download mugshot for ${c.Name}: ${e?.message ?? String(e)}`,
        );
      }
    }

    const fullArtLocalPath = resolve(fullArtDir, `${id}.webp`);
    if (!(await fileExists(fullArtLocalPath))) {
      try {
        const fullArtBuffer = await downloadImage(
          `${KORNBLUME_BASE}/images/arcanists/i2/${c.Id}.webp`,
          fullArtLocalPath,
        );
        fullArtCount++;
        await uploadToImageKit(fullArtBuffer, fullArtLocalPath);
      } catch (e) {
        console.warn(
          `  Warning: Could not download full-art image for ${c.Name}: ${e?.message ?? String(e)}`,
        );
      }
    }

    arcanists.push({ id, name: c.Name, afflatus, damageType, rarity: c.Rarity, imageUrl });
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
