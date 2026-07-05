// Auto-update script for Persona 5: The Phantom X (P5X) Thief data.
// Fetches structured character data from Prydwen's Gatsby page-data endpoints
// (via the CloudFront origin — www.prydwen.gg blocks generic fetchers) and
// regenerates:
//   - src/data/persona-5-phantom-x/thieves.ts
// Downloads Thief card portraits and uploads to ImageKit CDN:
//   - thief portraits → ImageKit: /persona_5_phantom_x/thieves
//
// Image URLs are parsed from each run's freshly fetched page-data JSON —
// Prydwen's hashed /static/ paths change per site build, so they are never
// hardcoded here.
//
// Usage:
//   node scripts/update-p5x-data.mjs                    # only upload missing assets
//   node scripts/update-p5x-data.mjs --reupload-all     # force reupload all assets
//   node scripts/update-p5x-data.mjs --reupload-thieves # force reupload thief portraits

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
  esc,
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

loadLocalEnv();
const { ensureAsset } = initImageKit();

const { all: reuploadAll, flags: reuploadFlags } = parseReuploadFlags(['thieves']);
const reuploadThieves = reuploadAll || reuploadFlags.thieves;

async function loadExistingThieves() {
  const filePath = resolve(ROOT, 'src/data/persona-5-phantom-x/thieves.ts');
  try {
    const content = await readFile(filePath, 'utf-8');
    const entries = [];
    // Matches the single-quoted, esc()-escaped strings formatEntry emits.
    const regex = /id:\s*'([^']+)'[^}]*?name:\s*'((?:\\.|[^'\\])*)'/gs;
    let match;
    while ((match = regex.exec(content)) !== null) {
      entries.push({ id: match[1], name: match[2].replace(/\\(.)/g, '$1') });
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

  // Single-quoted via esc() so the output is already Prettier-stable —
  // JSON.stringify's double quotes would be re-quoted by `npm run format`,
  // breaking the loadExistingThieves diff on the next run.
  const formatEntry = (t) =>
    [
      `  {`,
      `    id: '${t.id}',`,
      `    name: '${esc(t.name)}',`,
      `    codename: '${esc(t.codename)}',`,
      `    personaName: '${esc(t.personaName)}',`,
      `    rarity: ${t.rarity},`,
      `    role: '${esc(t.role)}',`,
      `    element: '${esc(t.element)}',`,
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
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
