// Auto-update script for Reverse: 1999 arcanist data.
// Fetches the latest data from three sources and regenerates:
//   - src/data/reverse1999/arcanists.ts
//
// Also downloads images and uploads to ImageKit:
//   - arcanist mugshot (CN headicon via ArcanistMap, fallback to kornblume icon)
//                                              → ImageKit: /reverse_1999/arcanists_mugshots
//   - arcanist full-art portrait (kornblume)   → ImageKit: /reverse_1999/arcanists
//   - psychube icon (Fandom wiki CDN)          → ImageKit: /reverse_1999/psychubes
//
// Data sources:
//   - windbow27/kornblume: arcanist list (Name, Rarity, Afflatus, IsReleased, Id for images)
//   - reverse1999.fandom.com: arcanist damage type + psychube list, rarities, and images
//   - myssal/Reverse-1999-CN-Asset (ArcanistMap.json): headicon IDs → primary mugshot source
//
// Usage:
//   node scripts/update-r1999-data.mjs                    # only upload missing assets
//   node scripts/update-r1999-data.mjs --reupload-all     # force reupload all assets
//   node scripts/update-r1999-data.mjs --reupload-mugshots
//   node scripts/update-r1999-data.mjs --reupload-full-art
//   node scripts/update-r1999-data.mjs --reupload-psychubes

import { readFile, writeFile } from 'fs/promises';
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

loadLocalEnv();
const { existsOnImageKit, ensureAsset } = initImageKit();

const { flags: reuploadFlags } = parseReuploadFlags(['mugshots', 'full-art', 'psychubes']);
const reuploadMugshots = reuploadFlags['mugshots'];
const reuploadFullArt = reuploadFlags['full-art'];
const reuploadPsychubes = reuploadFlags['psychubes'];

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

async function loadExistingArcanists() {
  const filePath = resolve(ROOT, 'src/data/reverse1999/arcanists.ts');
  try {
    const content = await readFile(filePath, 'utf-8');
    const entries = [];
    const idMap = new Map();
    const damageMap = new Map();
    const euphoriaMap = new Map();
    const regex =
      /id:\s*'([^']+)'[^}]*?name:\s*'([^']+)'[^}]*?afflatus:\s*'([^']+)'[^}]*?damageType:\s*'([^']+)'[^}]*?hasEuphoria:\s*(true|false)/gs;
    let match;
    while ((match = regex.exec(content)) !== null) {
      const [, id, name, afflatus, damageType, hasEuphoria] = match;
      entries.push({ id, name, afflatus, damageType });
      idMap.set(name, id);
      damageMap.set(name, damageType);
      euphoriaMap.set(name, hasEuphoria === 'true');
    }
    return { entries, idMap, damageMap, euphoriaMap };
  } catch {
    return { entries: [], idMap: new Map(), damageMap: new Map(), euphoriaMap: new Map() };
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

// Batch-fetch damage types and euphoria availability from Fandom wiki (up to 50 titles per request)
async function fetchWikiData(names) {
  const damageMap = new Map();
  const euphoriaMap = new Map();
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
        const name = reverseMap.get(page.title) ?? page.title;
        const dmgMatch = wikitext.match(/\|\s*damage\s*=\s*(\w+)/i);
        if (dmgMatch) damageMap.set(name, dmgMatch[1]);
        euphoriaMap.set(name, /\{\{EuphoriaStats/.test(wikitext));
      }
    } catch (e) {
      console.warn(
        `  Warning: Could not fetch wiki data for batch starting at index ${i}: ${e.message}`,
      );
    }
  }

  return { damageMap, euphoriaMap };
}

function generateArcanistsTs(arcanists) {
  const sixStars = arcanists.filter((a) => a.rarity === 6);
  const fiveStars = arcanists.filter((a) => a.rarity === 5);

  const lines = [
    ...generatedHeader(
      'kornblume, Reverse: 1999 Wiki, and CN ArcanistMap',
      'update-r1999-data.mjs',
    ),
    '// imageUrl resolves to the best available mugshot: CN headicon first, kornblume icon as fallback.',
    '// hasEuphoria: set to true when the game releases Euphoria for this arcanist.',
    '',
    'export interface Arcanist {',
    '  id: string;',
    '  name: string;',
    '  afflatus: string;',
    '  damageType: string;',
    '  imageUrl: string;',
    '  hasEuphoria: boolean;',
    '}',
    '',
    'export const ALL_ARCANISTS: Arcanist[] = [',
  ];

  const formatEntry = (a) => {
    return [
      `  {`,
      `    id: '${a.id}',`,
      `    name: ${jsStr(a.name)},`,
      `    afflatus: '${a.afflatus}',`,
      `    damageType: '${a.damageType}',`,
      `    imageUrl: '${a.imageUrl}',`,
      `    hasEuphoria: ${a.hasEuphoria},`,
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

async function loadExistingPsychubes() {
  const filePath = resolve(ROOT, 'src/data/reverse1999/psychubes.ts');
  try {
    const content = await readFile(filePath, 'utf-8');
    const entries = [];
    const regex = /name:\s*'([^']+)'/gs;
    let match;
    while ((match = regex.exec(content)) !== null) {
      entries.push({ name: match[1] });
    }
    return entries;
  } catch {
    return [];
  }
}

function generatePsychubesTs(psychubes) {
  const sixStars = psychubes.filter((p) => p.rarity === 6);
  const fiveStars = psychubes.filter((p) => p.rarity === 5);
  const fourStars = psychubes.filter((p) => p.rarity === 4);
  const threeStars = psychubes.filter((p) => p.rarity === 3);

  const lines = [
    ...generatedHeader('Reverse: 1999 Fandom Wiki', 'update-r1999-data.mjs'),
    '',
    'export interface Psychube {',
    '  name: string;',
    '  rarity: number;',
    '  tag: string; // Primary combat focus: None / ATK / Heal / Survival / Critical',
    '  imageUrl: string;',
    '}',
    '',
    'export const ALL_PSYCHUBES: Psychube[] = [',
  ];

  const formatEntry = (p) => {
    return [
      '  {',
      `    name: ${jsStr(p.name)},`,
      `    rarity: ${p.rarity},`,
      `    tag: '${p.tag}',`,
      `    imageUrl: '/assets/reverse-1999/psychubes/${slugify(p.name)}.webp',`,
      '  },',
    ].join('\n');
  };

  const addGroup = (label, items) => {
    if (items.length > 0) {
      lines.push(`  // ${label}`);
      lines.push(...items.map(formatEntry));
    }
  };

  addGroup('6-Stars', sixStars);
  addGroup('5-Stars', fiveStars);
  addGroup('4-Stars', fourStars);
  addGroup('3-Stars', threeStars);

  lines.push('];', '');
  return lines.join('\n');
}

// Fetch all psychube page titles from the Fandom wiki category.
async function fetchAllPsychubeNames() {
  const url = `${FANDOM_API}?action=query&list=categorymembers&cmtitle=Category:Psychubes&cmlimit=500&format=json`;
  const data = await fetchJSON(url);
  return (data.query?.categorymembers ?? [])
    .map((m) => m.title)
    .filter((t) => !t.startsWith('Category:'));
}

// Batch-fetch psychube rarities from Fandom wiki wikitext (same pattern as fetchDamageTypes).
async function fetchPsychubeRarities(names) {
  const rarityMap = new Map();
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
        const m = wikitext.match(/\|\s*rarity\s*=\s*(\d)/i);
        if (m) {
          const name = reverseMap.get(page.title) ?? page.title;
          rarityMap.set(name, parseInt(m[1]));
        }
      }
    } catch (e) {
      console.warn(
        `  Warning: Could not fetch psychube rarities for batch starting at index ${i}: ${e.message}`,
      );
    }
  }

  return rarityMap;
}

// Batch-fetch CDN image URLs for all psychubes from the Fandom wiki file API.
// Returns a Map<psychubeName, cdnUrl>. Processes up to 50 files per request.
async function fetchAllPsychubeImageUrls(names) {
  const urlMap = new Map();
  const BATCH_SIZE = 50;

  for (let i = 0; i < names.length; i += BATCH_SIZE) {
    const batch = names.slice(i, i + BATCH_SIZE);
    // Track File:Name.png → original name through normalizations/redirects
    const fileTitleToName = new Map(batch.map((n) => [`File:${n}.png`, n]));
    const titlesParam = batch.map((n) => `File:${encodeURIComponent(n)}.png`).join('|');
    const url = `${FANDOM_API}?action=query&titles=${titlesParam}&prop=imageinfo&iiprop=url&format=json&redirects`;

    try {
      const data = await fetchJSON(url);
      for (const { from, to } of data.query?.normalized ?? []) {
        const name = fileTitleToName.get(from);
        if (name) fileTitleToName.set(to, name);
      }
      for (const { from, to } of data.query?.redirects ?? []) {
        const name = fileTitleToName.get(from);
        if (name) fileTitleToName.set(to, name);
      }
      for (const page of Object.values(data.query?.pages ?? {})) {
        const imgUrl = page.imageinfo?.[0]?.url ?? null;
        const name = fileTitleToName.get(page.title);
        if (imgUrl && name) urlMap.set(name, imgUrl);
      }
    } catch (e) {
      console.warn(
        `  Warning: Could not fetch psychube image URLs for batch at index ${i}: ${e.message}`,
      );
    }
  }

  return urlMap;
}

async function main() {
  console.log('Fetching data from kornblume, Fandom wiki, and CN ArcanistMap...');

  const [
    kornblumeData,
    arcanistMap,
    {
      entries: existingEntries,
      idMap: existingIds,
      damageMap: existingDamage,
      euphoriaMap: existingEuphoria,
    },
    existingPsychubes,
  ] = await Promise.all([
    fetchJSON(`${KORNBLUME_BASE}/data/arcanists.json`),
    fetchJSON(ARCANIST_MAP_URL),
    loadExistingArcanists(),
    loadExistingPsychubes(),
  ]);

  const findHeadiconId = buildHeadiconLookup(arcanistMap);
  console.log(`  ArcanistMap loaded (${arcanistMap.length} entries)`);

  // Filter to released playable characters only (rarity 5 and 6)
  const releasedRaw = kornblumeData.filter(
    (c) => c.IsReleased === true && c.Name && c.Id && (c.Rarity === 5 || c.Rarity === 6),
  );

  console.log(`  Found ${releasedRaw.length} released arcanists in kornblume`);

  const names = releasedRaw.map((c) => c.Name);

  console.log('  Fetching damage types and euphoria data from Fandom wiki...');
  const { damageMap: wikiDamage, euphoriaMap: wikiEuphoria } = await fetchWikiData(names);
  console.log(`  Got damage types for ${wikiDamage.size}/${names.length} arcanists`);
  console.log(
    `  Got euphoria data for ${wikiEuphoria.size}/${names.length} arcanists (${[...wikiEuphoria.values()].filter(Boolean).length} have Euphoria)`,
  );

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
    const mugshotResult = await ensureAsset({
      localPath: resolve(mugshotDir, `${id}.webp`),
      label: 'Mugshot',
      reupload: reuploadMugshots,
      fetchBuffer: async () => {
        if (headiconId) {
          const buffer = await downloadImage(`${HEADICON_BASE}/${headiconId}.png`);
          console.log(`      Source: headicon ${headiconId}`);
          return buffer;
        }
        const buffer = await downloadImage(`${KORNBLUME_BASE}/images/arcanists/icon/${c.Id}.webp`);
        console.log(`      Source: kornblume icon (no headicon matched)`);
        return buffer;
      },
    });
    if (mugshotResult === 'uploaded') mugshotCount++;

    // Full-art portrait (kornblume i2)
    const fullArtResult = await ensureAsset({
      localPath: resolve(fullArtDir, `${id}.webp`),
      label: 'Full-art',
      reupload: reuploadFullArt,
      fetchBuffer: () => downloadImage(`${KORNBLUME_BASE}/images/arcanists/i2/${c.Id}.webp`),
    });
    if (fullArtResult === 'uploaded') fullArtCount++;

    arcanists.push({
      id,
      name: c.Name,
      afflatus,
      damageType,
      rarity: c.Rarity,
      imageUrl,
      hasEuphoria: wikiEuphoria.get(c.Name) ?? existingEuphoria.get(c.Name) ?? false,
    });
  }

  // Write generated TypeScript file
  const filePath = resolve(ROOT, 'src/data/reverse1999/arcanists.ts');
  await writeFile(filePath, generateArcanistsTs(arcanists), 'utf-8');

  // Diff against existing data
  const { added, removed } = diffByKey(existingEntries, arcanists, (a) => a.name);
  const diff = formatDiff(added, removed);

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

  // --- Psychubes (Fandom wiki source) ---
  console.log('\nFetching psychube list from Fandom wiki...');
  const wikiPsychubeNames = await fetchAllPsychubeNames();
  console.log(`  Found ${wikiPsychubeNames.length} psychubes on wiki`);

  console.log('  Fetching psychube rarities from Fandom wiki...');
  const psychubeRarityMap = await fetchPsychubeRarities(wikiPsychubeNames);
  console.log(`  Got rarities for ${psychubeRarityMap.size}/${wikiPsychubeNames.length} psychubes`);

  // Only process psychubes for which we have rarity data
  const validPsychubeNames = wikiPsychubeNames.filter((n) => psychubeRarityMap.has(n));
  const skippedCount = wikiPsychubeNames.length - validPsychubeNames.length;
  if (skippedCount > 0)
    console.warn(`  Skipping ${skippedCount} psychube(s) with no rarity in wikitext`);

  // Sort: highest rarity first, then alphabetical — IDs assigned in this order
  validPsychubeNames.sort((a, b) => {
    const ra = psychubeRarityMap.get(a);
    const rb = psychubeRarityMap.get(b);
    if (ra !== rb) return rb - ra;
    return a.localeCompare(b);
  });

  // Pre-fetch all image URLs in batches (3 API calls instead of 150)
  console.log('  Fetching psychube image URLs from Fandom wiki...');
  const psychubeImageUrlMap = await fetchAllPsychubeImageUrls(validPsychubeNames);
  console.log(
    `  Got image URLs for ${psychubeImageUrlMap.size}/${validPsychubeNames.length} psychubes`,
  );

  // Pre-check ImageKit existence in parallel (one concurrent batch instead of 150 serial calls)
  console.log('  Checking ImageKit for existing psychube images...');
  const localFiles = validPsychubeNames.map((name) =>
    resolve(ROOT, `public/assets/reverse-1999/psychubes/${slugify(name)}.webp`),
  );
  const onKitResults = await Promise.all(
    localFiles.map((f) => (reuploadPsychubes ? Promise.resolve(false) : existsOnImageKit(f))),
  );
  const alreadyOnKitCount = onKitResults.filter(Boolean).length;
  console.log(
    `  ${alreadyOnKitCount} already on ImageKit, ${localFiles.length - alreadyOnKitCount} to upload`,
  );

  const psychubes = [];
  let psychubeImageCount = 0;

  console.log(`\nProcessing images for ${validPsychubeNames.length} psychubes...`);

  for (let idx = 0; idx < validPsychubeNames.length; idx++) {
    const name = validPsychubeNames[idx];
    const rarity = psychubeRarityMap.get(name);
    const localPath = `/assets/reverse-1999/psychubes/${slugify(name)}.webp`;
    const localFile = localFiles[idx];

    console.log(`  [${idx + 1}/${validPsychubeNames.length}] ${name}`);

    const psychubeResult = await ensureAsset({
      localPath: localFile,
      label: 'Image',
      reupload: reuploadPsychubes,
      onKit: onKitResults[idx],
      fetchBuffer: () => {
        const wikiImgUrl = psychubeImageUrlMap.get(name);
        if (!wikiImgUrl) throw new Error('no image found on wiki');
        return downloadImage(wikiImgUrl);
      },
    });
    if (psychubeResult === 'uploaded') psychubeImageCount++;

    psychubes.push({ name, rarity, tag: 'None', imageUrl: localPath });
  }

  const psychubePath = resolve(ROOT, 'src/data/reverse1999/psychubes.ts');
  await writeFile(psychubePath, generatePsychubesTs(psychubes), 'utf-8');

  const { added: psychubeAdded, removed: psychubeRemoved } = diffByKey(
    existingPsychubes,
    psychubes,
    (p) => p.name,
  );
  const psychubeDiff = formatDiff(psychubeAdded, psychubeRemoved);

  console.log(
    `  Psychubes : ${psychubes.length} total (${psychubeDiff}) — ${psychubeImageCount} images uploaded`,
  );
  for (const p of psychubeAdded) console.log(`    + ${p.name} [${p.rarity}★]`);
  for (const p of psychubeRemoved) console.log(`    - ${p.name} (not on wiki)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
