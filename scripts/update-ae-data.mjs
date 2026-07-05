// Auto-update script for Arknights: Endfield operator data.
// Fetches structured operator data from Prydwen's Gatsby page-data endpoints
// (via the CloudFront origin — www.prydwen.gg blocks generic fetchers) and
// regenerates:
//   - src/data/arknights-endfield/operators.ts
// Downloads operator portraits and uploads to ImageKit CDN:
//   - operator portraits → ImageKit: /arknights_endfield/operators
//
// Unlike P5X, the list page-data already carries every catalog field
// (slug, name, rarity, class, element, weapon), so detail pages are only
// fetched lazily for portrait image URLs when an upload is actually needed.
// Prydwen's hashed /static/ image paths change per site build, so they are
// always resolved from freshly fetched page-data — never hardcoded here.
//
// Usage:
//   node scripts/update-ae-data.mjs                      # only upload missing assets
//   node scripts/update-ae-data.mjs --reupload-all       # force reupload all assets
//   node scripts/update-ae-data.mjs --reupload-operators # force reupload operator portraits

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
const LIST_PAGE_DATA = `${PRYDWEN_ORIGIN}/page-data/arknights-endfield/characters/page-data.json`;
const detailPageData = (slug) =>
  `${PRYDWEN_ORIGIN}/page-data/arknights-endfield/characters/${slug}/page-data.json`;

loadLocalEnv();
const { ensureAsset } = initImageKit();

const { all: reuploadAll, flags: reuploadFlags } = parseReuploadFlags(['operators']);
const reuploadOperators = reuploadAll || reuploadFlags.operators;

async function loadExistingOperators() {
  const filePath = resolve(ROOT, 'src/data/arknights-endfield/operators.ts');
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

function generateOperatorsTs(operators) {
  const byRarity = (r) => operators.filter((o) => o.rarity === r);

  const lines = [
    ...generatedHeader('Prydwen (prydwen.gg/arknights-endfield)', 'update-ae-data.mjs'),
    '',
    'export interface AeOperator {',
    '  id: string;',
    '  name: string;',
    '  rarity: 4 | 5 | 6;',
    '  class: string;',
    '  element: string;',
    // weapon values must keep string-matching AeWeapon.type in weapons.ts
    '  weapon: string;',
    '  imageUrl: string;',
    '}',
    '',
    'export const ALL_OPERATORS: AeOperator[] = [',
  ];

  // Single-quoted via esc() so the output is already Prettier-stable —
  // JSON.stringify's double quotes would be re-quoted by `npm run format`,
  // breaking the loadExistingOperators diff on the next run.
  const formatEntry = (o) =>
    [
      `  {`,
      `    id: '${o.id}',`,
      `    name: '${esc(o.name)}',`,
      `    rarity: ${o.rarity},`,
      `    class: '${esc(o.class)}',`,
      `    element: '${esc(o.element)}',`,
      `    weapon: '${esc(o.weapon)}',`,
      `    imageUrl: '${o.imageUrl}',`,
      `  },`,
    ].join('\n');

  for (const rarity of [6, 5, 4]) {
    const group = byRarity(rarity);
    if (group.length > 0) {
      lines.push(`  // ${rarity}-star`);
      lines.push(...group.map(formatEntry));
    }
  }

  lines.push('];', '');
  return lines.join('\n');
}

async function main() {
  console.log('Fetching Endfield operator list from Prydwen...');

  const [listData, existingOperators] = await Promise.all([
    fetchJSON(LIST_PAGE_DATA),
    loadExistingOperators(),
  ]);

  const listNodes = listData?.result?.data?.allCharacters?.nodes;
  if (!Array.isArray(listNodes) || listNodes.length === 0) {
    throw new Error('Prydwen list page-data shape changed: allCharacters.nodes missing/empty');
  }
  console.log(`  ${listNodes.length} operators listed`);

  const operators = [];
  let imgCount = 0;
  const failedImages = [];

  for (const node of listNodes) {
    const id = node.slug;
    const rarity = Number(node.rarity);
    if (rarity !== 4 && rarity !== 5 && rarity !== 6) {
      throw new Error(`Unexpected rarity "${node.rarity}" for ${id}`);
    }

    // Portraits live on ImageKit only — never written into public/assets
    // (the repo stores no game images; imagekit.ts resolves this path to the CDN).
    const imageUrl = `/assets/arknights-endfield/operators/${id}.webp`;

    const result = await ensureAsset({
      localPath: imageUrl,
      label: `Image for ${node.name}`,
      reupload: reuploadOperators,
      mimeType: 'image/webp',
      fetchBuffer: async () => {
        // Detail page-data is only needed for the hashed portrait URL.
        const detail = await fetchJSON(detailPageData(id));
        const unit = detail?.result?.data?.currentUnit?.nodes?.[0];
        // The square icon matches the originally seeded 256×256 portraits;
        // fall back to the card art.
        const sourceUrl = gatsbyImagePath(unit?.smallImage) ?? gatsbyImagePath(unit?.cardImage);
        if (!sourceUrl) {
          throw new Error(`no image node in detail page-data for ${id}`);
        }
        const raw = await downloadImage(sourceUrl);
        return sharp(raw).resize(256, 256, { fit: 'cover' }).webp().toBuffer();
      },
    });
    if (result === 'uploaded') imgCount++;
    if (result === 'failed') failedImages.push(id);

    // Source strings occasionally carry trailing whitespace — normalize.
    const clean = (s, fallback = 'Unknown') => (s ?? fallback).trim();
    operators.push({
      id,
      name: clean(node.name, ''),
      rarity,
      class: clean(node.class),
      element: clean(node.element),
      weapon: clean(node.weapon),
      imageUrl,
    });
  }

  // Sort: highest rarity first, then alphabetically within each group
  operators.sort((a, b) => {
    if (a.rarity !== b.rarity) return b.rarity - a.rarity;
    return a.name.localeCompare(b.name);
  });

  const outPath = resolve(ROOT, 'src/data/arknights-endfield/operators.ts');
  await mkdir(resolve(ROOT, 'src/data/arknights-endfield'), { recursive: true });
  await writeFile(outPath, generateOperatorsTs(operators), 'utf-8');

  const { added, removed } = diffByKey(existingOperators, operators, (o) => o.id);
  console.log('\nDone!');
  console.log(
    `  Operators : ${operators.length} total (${formatDiff(added, removed)}) — ${imgCount} images uploaded`,
  );
  for (const o of added) console.log(`    + ${o.name} [${o.rarity}★ ${o.class} · ${o.element}]`);
  for (const o of removed) console.log(`    - ${o.name} (removed from source)`);
  if (failedImages.length > 0) {
    console.warn(`  Missing images: ${failedImages.join(', ')}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
