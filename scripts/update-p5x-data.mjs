// Auto-update script for Persona 5: The Phantom X (P5X) Thief and Persona data.
// Fetches structured character data from Prydwen's Gatsby page-data endpoints
// (via the CloudFront origin — www.prydwen.gg blocks generic fetchers) and
// regenerates:
//   - src/data/persona-5-phantom-x/thieves.ts
//   - src/data/persona-5-phantom-x/personas.ts
// Downloads card art / icons and uploads to ImageKit CDN:
//   - thief portraits → ImageKit: /persona_5_phantom_x/thieves
//   - persona icons   → ImageKit: /persona_5_phantom_x/personas
//
// Image URLs are parsed from each run's freshly fetched page-data JSON (thieves)
// or rendered HTML (personas) — Prydwen's hashed /static/ paths change per site
// build, so they are never hardcoded here.
//
// Usage:
//   node scripts/update-p5x-data.mjs                     # only upload missing assets
//   node scripts/update-p5x-data.mjs --reupload-all      # force reupload all assets
//   node scripts/update-p5x-data.mjs --reupload-thieves  # force reupload thief portraits
//   node scripts/update-p5x-data.mjs --reupload-personas # force reupload persona icons

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
  mintId,
  jsStr,
  diffByKey,
  formatDiff,
  generatedHeader,
} from './lib/pipeline.mjs';

// Prydwen's CloudFront origin serves the same page-data JSON as www.prydwen.gg
// without the Cloudflare bot challenge the main domain applies.
const PRYDWEN_ORIGIN = 'https://d2ankz0m1a0dsp.cloudfront.net';
const LIST_PAGE_DATA = `${PRYDWEN_ORIGIN}/page-data/persona-5x/characters/page-data.json`;
const detailPageData = (slug) =>
  `${PRYDWEN_ORIGIN}/page-data/persona-5x/characters/${slug}/page-data.json`;
// Personas: metadata from page-data, image URLs scraped from the rendered grid.
const PERSONA_LIST_PAGE_DATA = `${PRYDWEN_ORIGIN}/page-data/persona-5x/personas/page-data.json`;
const PERSONA_PAGE_HTML = `${PRYDWEN_ORIGIN}/persona-5x/personas/`;

loadLocalEnv();
const { ensureAsset } = initImageKit();

const { all: reuploadAll, flags: reuploadFlags } = parseReuploadFlags(['thieves', 'personas']);
const reuploadThieves = reuploadAll || reuploadFlags.thieves;
const reuploadPersonas = reuploadAll || reuploadFlags.personas;

async function loadExistingThieves() {
  const filePath = resolve(ROOT, 'src/data/persona-5-phantom-x/thieves.ts');
  try {
    const content = await readFile(filePath, 'utf-8');
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

// Pull the largest fallback image path out of a Prydwen gatsby image node.
function gatsbyImagePath(imageNode) {
  const src = imageNode?.localFile?.childImageSharp?.gatsbyImageData?.images?.fallback?.src;
  if (!src) return null;
  return `${PRYDWEN_ORIGIN}${src}`;
}

function generateThievesTs(thieves) {
  const fiveStars = thieves.filter((t) => t.rarity === 5);
  const fourStars = thieves.filter((t) => t.rarity === 4);

  const lines = [
    ...generatedHeader('Prydwen (prydwen.gg/persona-5x)', 'update-p5x-data.mjs'),
    '',
    'export interface P5xThief {',
    '  id: string;',
    '  name: string;',
    '  codename: string;',
    '  personaName: string;',
    '  rarity: 4 | 5;',
    '  role: string;',
    '  element: string;',
    '  imageUrl: string;',
    '}',
    '',
    'export const ALL_THIEVES: P5xThief[] = [',
  ];

  // jsStr() keeps the output Prettier-stable (see its definition) — the
  // loadExistingThieves diff on the next run depends on quoting matching
  // exactly what `npm run format` would produce.
  const formatEntry = (t) =>
    [
      `  {`,
      `    id: '${t.id}',`,
      `    name: ${jsStr(t.name)},`,
      `    codename: ${jsStr(t.codename)},`,
      `    personaName: ${jsStr(t.personaName)},`,
      `    rarity: ${t.rarity},`,
      `    role: ${jsStr(t.role)},`,
      `    element: ${jsStr(t.element)},`,
      `    imageUrl: '${t.imageUrl}',`,
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

async function loadExistingPersonas() {
  const filePath = resolve(ROOT, 'src/data/persona-5-phantom-x/personas.ts');
  try {
    const content = await readFile(filePath, 'utf-8');
    const entries = [];
    const idByName = new Map();
    const idBySourceId = new Map();
    // `sourceId` is optional so a catalog generated before it existed still parses — those entries
    // fall back to the name-keyed map for one run (see design D4).
    const regex =
      /id:\s*'([^']+)',(?:\s*sourceId:\s*'([^']+)',)?[^}]*?name:\s*(['"])((?:\\.|(?!\3)[^\\])*)\3/gs;
    let match;
    while ((match = regex.exec(content)) !== null) {
      const [, id, sourceId] = match;
      const name = match[4].replace(/\\(.)/g, '$1');
      entries.push({ id, sourceId, name });
      idByName.set(name, id);
      if (sourceId) idBySourceId.set(sourceId, id);
    }
    return { entries, idByName, idBySourceId };
  } catch {
    return { entries: [], idByName: new Map(), idBySourceId: new Map() };
  }
}

// Persona icons render as gatsby <img> with srcset entries like
// `/static/{hash}/{size}/{unitId}.webp {width}w`. Build a unitId → largest-URL
// map, keeping only the unitIds present in the metadata set (filters page chrome).
function parsePersonaImages(html, unitIds) {
  const re = /\/static\/[a-f0-9]+\/[a-z0-9]+\/(\d+)\.webp\s+(\d+)w/g;
  const best = new Map();
  let m;
  while ((m = re.exec(html)) !== null) {
    const unitId = m[1];
    const width = Number(m[2]);
    if (!unitIds.has(unitId)) continue;
    const prev = best.get(unitId);
    if (!prev || width > prev.width) {
      best.set(unitId, { width, path: m[0].split(/\s+/)[0] });
    }
  }
  return best;
}

function generatePersonasTs(personas) {
  const lines = [
    ...generatedHeader('Prydwen (prydwen.gg/persona-5x)', 'update-p5x-data.mjs'),
    '',
    'export interface P5xPersona {',
    '  id: string;',
    '  /** Upstream Prydwen unitId. Pins `id` across renames — see mintId in scripts/lib/pipeline.mjs. */',
    '  sourceId: string;',
    '  name: string;',
    '  rarity: number;',
    '  role: string;',
    '  element: string;',
    '  imageUrl: string;',
    '}',
    '',
    'export const ALL_PERSONAS: P5xPersona[] = [',
  ];

  const formatEntry = (p) =>
    [
      `  {`,
      `    id: '${p.id}',`,
      `    sourceId: '${p.sourceId}',`,
      `    name: ${jsStr(p.name)},`,
      `    rarity: ${p.rarity},`,
      `    role: ${jsStr(p.role)},`,
      `    element: ${jsStr(p.element)},`,
      `    imageUrl: '${p.imageUrl}',`,
      `  },`,
    ].join('\n');

  lines.push(...personas.map(formatEntry));
  lines.push('];', '');
  return lines.join('\n');
}

async function processPersonas() {
  console.log('\nFetching P5X persona list from Prydwen...');
  const [
    listData,
    html,
    { entries: existingPersonas, idByName: existingIdsByName, idBySourceId: existingIdsBySourceId },
  ] = await Promise.all([
    fetchJSON(PERSONA_LIST_PAGE_DATA),
    fetch(PERSONA_PAGE_HTML).then((r) => {
      if (!r.ok) throw new Error(`Failed to fetch ${PERSONA_PAGE_HTML}: ${r.status}`);
      return r.text();
    }),
    loadExistingPersonas(),
  ]);

  const nodes = listData?.result?.data?.allCharacters?.nodes;
  if (!Array.isArray(nodes) || nodes.length === 0) {
    throw new Error('Prydwen persona page-data shape changed: allCharacters.nodes missing/empty');
  }
  console.log(`  ${nodes.length} personas listed`);

  const unitIds = new Set(nodes.map((n) => String(n.unitId)));
  const imageByUnit = parsePersonaImages(html, unitIds);

  const clean = (s, fallback = '') => (s ?? fallback).trim();
  const personas = [];
  let imgCount = 0;
  const failedImages = [];

  // Pin map: Prydwen unitId → already-minted catalog id. Bootstrapped by name for entries generated
  // before `sourceId` existed, so the first run after that field landed re-pins them in place
  // instead of re-minting from the current name (design D4).
  const pinnedIds = new Map(existingIdsBySourceId);
  for (const node of nodes) {
    const key = String(node.unitId);
    if (!pinnedIds.has(key) && existingIdsByName.has(node.name)) {
      pinnedIds.set(key, existingIdsByName.get(node.name));
    }
  }
  const takenIds = new Map();

  for (const node of nodes) {
    const id = mintId({
      name: node.name,
      sourceId: node.unitId,
      pinned: pinnedIds,
      taken: takenIds,
      separator: '-',
      fallbackPrefix: 'persona',
    });
    const imageUrl = `/assets/persona-5-phantom-x/personas/${id}.webp`;
    const img = imageByUnit.get(String(node.unitId));

    if (img) {
      const result = await ensureAsset({
        localPath: imageUrl,
        label: `Icon for ${node.name}`,
        reupload: reuploadPersonas,
        mimeType: 'image/webp',
        fetchBuffer: async () => {
          const raw = await downloadImage(`${PRYDWEN_ORIGIN}${img.path}`);
          return sharp(raw).resize(256, 256, { fit: 'cover' }).webp().toBuffer();
        },
      });
      if (result === 'uploaded') imgCount++;
      if (result === 'failed') failedImages.push(id);
    } else {
      console.warn(`    No image found in rendered grid for ${node.name}`);
      failedImages.push(id);
    }

    const rarity = Number(node.rarity);
    personas.push({
      id,
      sourceId: String(node.unitId),
      name: clean(node.name),
      rarity: Number.isFinite(rarity) ? rarity : 0,
      role: clean(node.job, 'Unknown'),
      element: clean(node.element, 'Unknown'),
      imageUrl,
    });
  }

  // Sort: highest rarity first, then alphabetically within each rarity group.
  personas.sort((a, b) => {
    if (a.rarity !== b.rarity) return b.rarity - a.rarity;
    return a.name.localeCompare(b.name);
  });

  const outPath = resolve(ROOT, 'src/data/persona-5-phantom-x/personas.ts');
  await mkdir(resolve(ROOT, 'src/data/persona-5-phantom-x'), { recursive: true });
  await writeFile(outPath, generatePersonasTs(personas), 'utf-8');

  const { added, removed } = diffByKey(existingPersonas, personas, (p) => p.id);
  console.log(
    `  Personas: ${personas.length} total (${formatDiff(added, removed)}) — ${imgCount} images uploaded`,
  );
  for (const p of added) console.log(`    + ${p.name} [${p.rarity}★ ${p.role} · ${p.element}]`);
  for (const p of removed) console.log(`    - ${p.name} (removed from source)`);
  if (failedImages.length > 0) {
    console.warn(`  Missing persona images: ${failedImages.join(', ')}`);
  }
}

async function main() {
  console.log('Fetching P5X character list from Prydwen...');

  const [listData, existingThieves] = await Promise.all([
    fetchJSON(LIST_PAGE_DATA),
    loadExistingThieves(),
  ]);

  const listNodes = listData?.result?.data?.allCharacters?.nodes;
  if (!Array.isArray(listNodes) || listNodes.length === 0) {
    throw new Error('Prydwen list page-data shape changed: allCharacters.nodes missing/empty');
  }
  console.log(`  ${listNodes.length} characters listed`);

  // Fetch every detail page first so a mid-run source failure aborts before
  // any codegen — the catalog is only written from a complete dataset.
  const details = [];
  for (const node of listNodes) {
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

  const thieves = [];
  let imgCount = 0;
  const failedImages = [];

  for (const { node, unit, rarity } of details) {
    const id = node.slug;
    // Portraits live on ImageKit only — never written into public/assets
    // (the repo stores no game images; imagekit.ts resolves this path to the CDN).
    const imageUrl = `/assets/persona-5-phantom-x/thieves/${id}.webp`;
    // Card art (262×358) is the highest-res source; fall back to the square icon.
    const sourceUrl = gatsbyImagePath(unit.cardImage) ?? gatsbyImagePath(unit.smallImage);

    if (sourceUrl) {
      const result = await ensureAsset({
        localPath: imageUrl,
        label: `Image for ${unit.name}`,
        reupload: reuploadThieves,
        mimeType: 'image/webp',
        fetchBuffer: async () => {
          const raw = await downloadImage(sourceUrl);
          return sharp(raw).resize(256, 256, { fit: 'cover' }).webp().toBuffer();
        },
      });
      if (result === 'uploaded') imgCount++;
      if (result === 'failed') failedImages.push(id);
    } else {
      console.warn(`    No image node in page-data for ${id}`);
      failedImages.push(id);
    }

    // Source strings occasionally carry trailing whitespace — normalize.
    const clean = (s, fallback = '') => (s ?? fallback).trim();
    thieves.push({
      id,
      name: clean(unit.name),
      codename: clean(unit.codename, unit.name),
      personaName: clean(unit.persona),
      rarity,
      role: clean(unit.job, 'Unknown'),
      element: clean(unit.element, 'Unknown'),
      imageUrl,
    });
  }

  // Sort: 5-stars first, then alphabetically within each group
  thieves.sort((a, b) => {
    if (a.rarity !== b.rarity) return b.rarity - a.rarity;
    return a.name.localeCompare(b.name);
  });

  const outPath = resolve(ROOT, 'src/data/persona-5-phantom-x/thieves.ts');
  await mkdir(resolve(ROOT, 'src/data/persona-5-phantom-x'), { recursive: true });
  await writeFile(outPath, generateThievesTs(thieves), 'utf-8');

  const { added, removed } = diffByKey(existingThieves, thieves, (t) => t.id);
  console.log('\nDone!');
  console.log(
    `  Thieves : ${thieves.length} total (${formatDiff(added, removed)}) — ${imgCount} images uploaded`,
  );
  for (const t of added) console.log(`    + ${t.name} [${t.rarity}★ ${t.role} · ${t.element}]`);
  for (const t of removed) console.log(`    - ${t.name} (removed from source)`);
  if (failedImages.length > 0) {
    console.warn(`  Missing images: ${failedImages.join(', ')}`);
  }

  await processPersonas();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
