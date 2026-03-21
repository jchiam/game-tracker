// Auto-update script for Reverse: 1999 arcanist data.
// Fetches the latest data from two sources and regenerates:
//   - src/data/reverse1999/arcanists.ts
// Also downloads all character images to public/assets/reverse-1999/arcanists/.
//
// Data sources:
//   - windbow27/kornblume: arcanist list (Name, Rarity, Afflatus, IsReleased, Id for images)
//   - reverse1999.fandom.com: damage type (Mental / Reality) via wikitext batch API
//
// Usage: node scripts/update-r1999-data.mjs

import { readFile, writeFile, mkdir, access } from 'fs/promises';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

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

async function downloadBinary(url, destPath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  await writeFile(destPath, buffer);
}

// Batch-fetch damage types from Fandom wiki (up to 50 titles per request)
async function fetchDamageTypes(names) {
  const damageMap = new Map();
  const BATCH_SIZE = 50;

  for (let i = 0; i < names.length; i += BATCH_SIZE) {
    const batch = names.slice(i, i + BATCH_SIZE);
    const titlesParam = batch.map((n) => encodeURIComponent(n)).join('|');
    const url = `${FANDOM_API}?action=query&prop=revisions&titles=${titlesParam}&rvprop=content&rvslots=main&format=json`;

    try {
      const data = await fetchJSON(url);
      const pages = data.query?.pages ?? {};
      for (const page of Object.values(pages)) {
        const wikitext =
          page.revisions?.[0]?.slots?.main?.['*'] ?? page.revisions?.[0]?.['*'] ?? '';
        const dmgMatch = wikitext.match(/\|\s*damage\s*=\s*(\w+)/i);
        if (dmgMatch) {
          damageMap.set(page.title, dmgMatch[1]);
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

  // Batch-fetch damage types from Fandom wiki
  const names = releasedRaw.map((c) => c.Name);
  console.log('  Fetching damage types from Fandom wiki...');
  const wikiDamage = await fetchDamageTypes(names);
  console.log(`  Got damage types for ${wikiDamage.size}/${names.length} arcanists`);

  // Ensure output directory exists
  const imgDir = resolve(ROOT, 'public/assets/reverse-1999/arcanists');
  await mkdir(imgDir, { recursive: true });

  // Sort: 6-stars first, then alphabetically within each group
  releasedRaw.sort((a, b) => {
    if (a.Rarity !== b.Rarity) return b.Rarity - a.Rarity;
    return a.Name.localeCompare(b.Name);
  });

  const arcanists = [];
  let imgCount = 0;
  const unknownDamage = [];

  for (const c of releasedRaw) {
    const id = existingIds.get(c.Name) ?? slugify(c.Name);
    const afflatus = c.Afflatus ?? 'Unknown';
    const damageType = wikiDamage.get(c.Name) ?? existingDamage.get(c.Name) ?? 'Unknown';

    if (damageType === 'Unknown') unknownDamage.push(c.Name);

    const imageUrl = `/assets/reverse-1999/arcanists/${id}.webp`;
    const imageLocalPath = resolve(imgDir, `${id}.webp`);

    if (!(await fileExists(imageLocalPath))) {
      try {
        await downloadBinary(
          `${KORNBLUME_BASE}/images/arcanists/icon/${c.Id}.webp`,
          imageLocalPath,
        );
        imgCount++;
      } catch (e) {
        console.warn(`  Warning: Could not download image for ${c.Name}: ${e.message}`);
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
  console.log(`  Arcanists : ${arcanists.length} total (${diff}) — ${imgCount} images downloaded`);
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
