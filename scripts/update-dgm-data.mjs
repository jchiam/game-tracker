// Update script for the Digimon digivice / virtual-pet product catalog.
//
// The catalog is curated, not fetched: scripts/seeds/dgm-products.json is the
// source of truth and is edited by hand in a normal PR; src/data/digimon/ is
// never hand-edited. A product is one release (Digivice -25th COLOR
// EVOLUTION-, Digital Monster Ver.20th); its variants are the colourways and
// regional editions. Wikimon (MediaWiki api.php, CC BY-SA 3.0) is the fact
// source for release dates, shell lists, and product images. The script:
//   - validates the product seed (unique product and variant ids, required
//     fields, region enum, 4-digit variant years, ≥1 variant per product)
//   - reads scripts/seeds/dgm-guides/<productId>.json — one hand-written
//     progress guide per product that has one (tracks → groups → checkable
//     items with hints and prerequisites) — validates it, and attaches it to
//     the product. Guides are written once per game from the device and its
//     manual; Humulos's guides inform the transcription but are never fetched.
//   - resolves `imageSource: "wikimon:<File name>"` to the file's URL via the
//     Wikimon API, then uploads each variant image to ImageKit via the shared
//     pipeline (variant images → ImageKit: /digimon/devices — variant ids are
//     the former device ids, so no asset ever moves)
//   - regenerates src/data/digimon/products.ts (ALL_PRODUCTS + DGM_LINES)
//
// Variants may carry `imageSource: null` when no image has been sourced yet;
// such variants are emitted with their local imageUrl (the card falls back to
// ui-avatars) and listed as missing. Products carry `wikimon: "<Page title>"`
// naming the Wikimon page that documents them — the sync report groups by it.
//
// --sync-wikimon is a report, never a write: it fetches every referenced
// Wikimon page and prints colourways the seed lacks, variant years the page
// does not list, version titles with no variant, gallery image candidates for
// unsourced variants, and pages in Wikimon's List of Virtual Pets that no
// product references. A human folds what matters into the seed — the seed is
// curated (which colourways count as variants is the collector's call), so no
// source ever overwrites it.
//
// Usage:
//   node scripts/update-dgm-data.mjs                    # only upload missing assets
//   node scripts/update-dgm-data.mjs --reupload-all     # force reupload all assets
//   node scripts/update-dgm-data.mjs --reupload-devices # force reupload variant images
//   node scripts/update-dgm-data.mjs --sync-wikimon     # drift report only; writes nothing

import { readFile, writeFile, mkdir, readdir } from 'fs/promises';
import { resolve } from 'path';
import sharp from 'sharp';
import {
  ROOT,
  loadLocalEnv,
  initImageKit,
  parseReuploadFlags,
  fetchJSON,
  downloadImage,
  jsStr,
  diffByKey,
  formatDiff,
  generatedHeader,
} from './lib/pipeline.mjs';

const SEED_PATH = resolve(ROOT, 'scripts/seeds/dgm-products.json');
const GUIDE_DIR = resolve(ROOT, 'scripts/seeds/dgm-guides');
const OUT_DIR = resolve(ROOT, 'src/data/digimon');
const OUT_PATH = resolve(OUT_DIR, 'products.ts');

const WIKIMON_API = 'https://wikimon.net/api.php';
const WIKIMON_LIST_PAGE = 'List of Virtual Pets';
const WIKIMON_UA = 'game-tracker/update-dgm-data.mjs (device catalog sync)';
const WIKIMON_PREFIX = 'wikimon:';
const WIKIMON_BATCH = 50;

const REGIONS = ['JP', 'NA', 'EU', 'ASIA'];
const PRODUCT_REQUIRED = ['id', 'name', 'line', 'series', 'variants'];
const VARIANT_REQUIRED = ['id', 'colorway', 'releaseYear', 'region'];
const OVERALL_FORMULAS = ['track-mean', 'item-weighted'];
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const SYNC_MODE = process.argv.includes('--sync-wikimon');

const present = (v) => v !== undefined && v !== null && v !== '';

/** Throws naming the first offending product or variant; writes nothing on failure. */
function validateProductSeed(products) {
  if (!Array.isArray(products)) throw new Error('Seed must be a JSON array');
  const productIds = new Set();
  const variantIds = new Set();
  products.forEach((p, i) => {
    const where = `product ${i}${p?.id ? ` (${p.id})` : ''}`;
    for (const key of PRODUCT_REQUIRED) {
      if (!present(p[key])) throw new Error(`${where}: missing required field "${key}"`);
    }
    if (!SLUG.test(p.id)) throw new Error(`${where}: id must be a kebab-case slug`);
    if (productIds.has(p.id)) throw new Error(`${where}: duplicate product id`);
    productIds.add(p.id);
    if (p.wikimon !== undefined && (typeof p.wikimon !== 'string' || p.wikimon === '')) {
      throw new Error(`${where}: wikimon must be a non-empty page title when present`);
    }
    if (!Array.isArray(p.variants) || p.variants.length === 0) {
      throw new Error(`${where}: variants must be a non-empty array`);
    }
    p.variants.forEach((v, j) => {
      const vw = `${where} variant ${j}${v?.id ? ` (${v.id})` : ''}`;
      for (const key of VARIANT_REQUIRED) {
        if (!present(v[key])) throw new Error(`${vw}: missing required field "${key}"`);
      }
      if (!SLUG.test(v.id)) throw new Error(`${vw}: id must be a kebab-case slug`);
      if (variantIds.has(v.id)) throw new Error(`${vw}: duplicate variant id`);
      variantIds.add(v.id);
      if (!REGIONS.includes(v.region)) {
        throw new Error(`${vw}: region "${v.region}" not in ${REGIONS.join('/')}`);
      }
      if (!Number.isInteger(v.releaseYear) || v.releaseYear < 1000 || v.releaseYear > 9999) {
        throw new Error(`${vw}: releaseYear must be a four-digit integer`);
      }
      if (v.imageSource !== null && v.imageSource !== undefined) {
        const ok =
          typeof v.imageSource === 'string' &&
          (/^https?:\/\//.test(v.imageSource) ||
            (v.imageSource.startsWith(WIKIMON_PREFIX) &&
              v.imageSource.length > WIKIMON_PREFIX.length));
        if (!ok) {
          throw new Error(
            `${vw}: imageSource must be an http(s) URL, "${WIKIMON_PREFIX}<File name>", or null`,
          );
        }
      }
    });
  });
  return productIds;
}

// ---------------------------------------------------------------------------
// Progress guides — per-product checklists. Hand-written once per product; no
// network is involved anywhere in this section.
// ---------------------------------------------------------------------------

/** Reads every guide in filename order as { productId, file, guide }. [] when the directory is absent. */
async function loadGuides() {
  let files;
  try {
    files = (await readdir(GUIDE_DIR)).filter((f) => f.endsWith('.json')).sort();
  } catch {
    return [];
  }
  const guides = [];
  for (const file of files) {
    const guide = JSON.parse(await readFile(resolve(GUIDE_DIR, file), 'utf-8'));
    guides.push({ productId: file.replace(/\.json$/, ''), file, guide });
  }
  return guides;
}

/** Throws naming the file and the offending id; writes nothing on failure. */
function validateGuides(guides, productIds) {
  for (const { productId, file, guide } of guides) {
    const where = `guide ${file}`;
    if (!productIds.has(productId)) {
      throw new Error(`${where}: no product with id "${productId}" in the product seed`);
    }
    if (!OVERALL_FORMULAS.includes(guide.overall)) {
      throw new Error(`${where}: overall "${guide.overall}" not in ${OVERALL_FORMULAS.join('/')}`);
    }
    if (!Array.isArray(guide.tracks) || guide.tracks.length === 0) {
      throw new Error(`${where}: tracks must be a non-empty array`);
    }
    const itemIds = new Set();
    const requires = [];
    for (const track of guide.tracks) {
      if (!track.id || !track.label || !Array.isArray(track.groups)) {
        throw new Error(`${where}: track "${track?.id}" needs id, label, groups`);
      }
      for (const group of track.groups) {
        if (!group.id || !group.label || !Array.isArray(group.items)) {
          throw new Error(
            `${where}: group "${group?.id}" in track "${track.id}" needs id, label, items`,
          );
        }
        for (const item of group.items) {
          if (!item.id || !item.label) {
            throw new Error(`${where}: item in group "${group.id}" needs id and label`);
          }
          if (!item.id.startsWith(`${track.id}:`)) {
            throw new Error(
              `${where}: item "${item.id}" must be prefixed by its track id "${track.id}:"`,
            );
          }
          if (itemIds.has(item.id)) throw new Error(`${where}: duplicate item id "${item.id}"`);
          itemIds.add(item.id);
          if (item.requires !== undefined) {
            if (!Array.isArray(item.requires)) {
              throw new Error(`${where}: item "${item.id}" requires must be an array`);
            }
            for (const r of item.requires) requires.push([item.id, r]);
          }
        }
      }
    }
    if (itemIds.size === 0) throw new Error(`${where}: no track has any item`);
    for (const [from, to] of requires) {
      if (!itemIds.has(to)) {
        throw new Error(`${where}: item "${from}" requires unknown item "${to}"`);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Wikimon client — source-specific, so it lives here rather than in pipeline.mjs.
// ---------------------------------------------------------------------------

async function wikimonQuery(params) {
  const url = new URL(WIKIMON_API);
  url.search = new URLSearchParams({ format: 'json', formatversion: '2', ...params }).toString();
  return fetchJSON(url, { headers: { 'user-agent': WIKIMON_UA } });
}

function chunk(items, size) {
  const out = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

/**
 * Wikimon returns page titles in normalized form (underscores → spaces, first
 * letter capitalised); map them back to the titles we asked for.
 */
function denormalizer(query, requested) {
  const map = new Map(requested.map((t) => [t, t]));
  for (const n of query.normalized ?? []) map.set(n.to, n.from);
  return (title) => map.get(title) ?? title;
}

/** Resolve `File:` names to direct URLs. Missing files map to null. */
async function resolveWikimonFiles(fileNames) {
  const urls = new Map();
  for (const batch of chunk([...new Set(fileNames)], WIKIMON_BATCH)) {
    const titles = batch.map((f) => `File:${f}`);
    const { query } = await wikimonQuery({
      action: 'query',
      prop: 'imageinfo',
      iiprop: 'url',
      titles: titles.join('|'),
    });
    const back = denormalizer(query, titles);
    for (const page of query.pages ?? []) {
      const asked = back(page.title).replace(/^File:/, '');
      urls.set(asked, page.missing ? null : (page.imageinfo?.[0]?.url ?? null));
    }
    for (const f of batch) if (!urls.has(f)) urls.set(f, null);
  }
  return urls;
}

/** Fetch raw wikitext for page titles. Missing pages map to null. */
async function fetchWikimonPages(titles) {
  const texts = new Map();
  for (const batch of chunk([...new Set(titles)], WIKIMON_BATCH)) {
    const { query } = await wikimonQuery({
      action: 'query',
      prop: 'revisions',
      rvprop: 'content',
      rvslots: 'main',
      titles: batch.join('|'),
    });
    const back = denormalizer(query, batch);
    for (const page of query.pages ?? []) {
      texts.set(back(page.title), page.missing ? null : page.revisions?.[0]?.slots?.main?.content);
    }
    for (const t of batch) if (!texts.has(t)) texts.set(t, null);
  }
  return texts;
}

/**
 * Remove every match of `pattern` until nothing changes. A single pass can
 * leave a fresh match behind when removals join fragments (`<!-<!-- -->-`).
 */
function stripToFixpoint(value, pattern) {
  let prev;
  do {
    prev = value;
    value = value.replace(pattern, '');
  } while (value !== prev);
  return value;
}

/** Strip the wiki markup that shows up inside infobox values. */
function cleanWikitext(value) {
  value = stripToFixpoint(value, /<ref[^>]*>[\s\S]*?<\/ref>/g);
  value = stripToFixpoint(value, /<ref[^>]*\/>/g);
  value = stripToFixpoint(value, /<!--[\s\S]*?-->/g);
  return value
    .replace(/\{\{--\}\}/g, '')
    .replace(/\{\{[^}|]*\}\}/g, '')
    .replace(/\[\[([^\]|]*)\|([^\]]*)\]\]/g, '$2')
    .replace(/\[\[([^\]]*)\]\]/g, '$1')
    .replace(/'''?/g, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .trim();
}

/**
 * Pull the infobox facts the report needs from a Wikimon device page:
 * colourways, release years, gallery (file, caption) pairs, and the version
 * titles linked from `=Versions=` / collaboration tables.
 */
function parseWikimonPage(wikitext) {
  const field = (name) => {
    const m = wikitext.match(new RegExp(`^\\|${name}=(.*)$`, 'm'));
    return m ? m[1] : '';
  };

  // Bold runs in |color= are group headers ("Agumon Digitama"), not shells.
  const colorRaw = field('color').replace(/'''[^']*'''/g, '');
  const colors = cleanWikitext(colorRaw)
    .split(/\n|\/|,\s+/)
    .map((c) => c.trim())
    .filter(Boolean);

  const years = new Set();
  for (const name of ['rdate1', 'rdate2', 'rdate3']) {
    for (const y of cleanWikitext(field(name)).match(/\b(?:19|20)\d{2}\b/g) ?? []) {
      years.add(Number(y));
    }
  }

  const gallery = [];
  // Galleries repeat their index per block, so pair by position of first
  // appearance and dedupe by file.
  const seenFiles = new Set();
  for (const m of wikitext.matchAll(/^\|i(\d+)=([^{\n]+?)\s*(?:\{\{!\}\}.*)?$/gm)) {
    const file = m[2].trim();
    if (seenFiles.has(file)) continue;
    seenFiles.add(file);
    const after = wikitext.slice(m.index);
    const cap = after.match(new RegExp(`^\\|c${m[1]}=(.*)$`, 'm'));
    gallery.push({ file, caption: cap ? cleanWikitext(cap[1]).replace(/\n/g, ' ') : '' });
  }

  const versions = [];
  for (const m of wikitext.matchAll(
    /^\|(?:rowspan="\d+"\|\s*)?\[\[([^\]|]+)(?:\|[^\]]*)?\]\]\s*\|\|/gm,
  )) {
    versions.push(m[1].trim());
  }

  return { colors, years: [...years].sort(), gallery, versions };
}

function parseVirtualPetList(wikitext) {
  const titles = [];
  for (const m of wikitext.matchAll(/^\*\s*\[\[([^\]|]+)(?:\|[^\]]*)?\]\]/gm)) {
    titles.push(m[1].trim());
  }
  return titles;
}

const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '');

/**
 * Drift report. Reads Wikimon, prints differences, writes nothing. The seed
 * stays authoritative: a difference is information for the seed PR author.
 */
async function syncWikimon(products) {
  // One page per product; a variant may override the page (regional editions).
  const byPage = new Map();
  const variantCount = products.reduce((n, p) => n + p.variants.length, 0);
  for (const p of products) {
    for (const v of p.variants) {
      const page = v.wikimon ?? p.wikimon;
      if (!page) continue;
      if (!byPage.has(page)) byPage.set(page, []);
      byPage.get(page).push({ ...v, productName: p.name });
    }
  }
  const unreferenced = products.filter((p) => !p.wikimon).map((p) => p.id);

  console.log(`Wikimon sync: ${byPage.size} pages referenced by ${variantCount} variants`);
  if (unreferenced.length > 0) {
    console.log(
      `  Products without a wikimon page (${unreferenced.length}): ${unreferenced.join(', ')}`,
    );
  }

  const pages = await fetchWikimonPages([...byPage.keys(), WIKIMON_LIST_PAGE]);

  for (const [title, variants] of byPage) {
    const text = pages.get(title);
    console.log(`\n## ${title} (${variants.length} variants)`);
    if (!text) {
      console.log('  PAGE MISSING on Wikimon — check the title in the seed');
      continue;
    }
    const page = parseWikimonPage(text);
    const keys = variants.map((v) => norm(`${v.productName} ${v.colorway}`));

    const missingColors = page.colors.filter((c) => {
      const key = norm(c);
      return key && !keys.some((k) => k.includes(key));
    });
    if (missingColors.length > 0) {
      console.log(`  Colourways on page with no variant (${missingColors.length}):`);
      for (const c of missingColors) console.log(`    - ${c}`);
    }

    if (page.years.length > 0) {
      const offYear = variants.filter((v) => !page.years.includes(v.releaseYear));
      if (offYear.length > 0) {
        console.log(`  Variant years not listed on page (page lists ${page.years.join(', ')}):`);
        for (const v of offYear) console.log(`    - ${v.id}: ${v.releaseYear}`);
      }
    }

    const missingVersions = page.versions.filter((v) => {
      const key = norm(v);
      return key && !keys.some((k) => k.includes(key));
    });
    if (missingVersions.length > 0) {
      console.log(`  Version titles on page with no variant (${missingVersions.length}):`);
      for (const v of missingVersions) console.log(`    - ${v}`);
    }

    const unsourced = variants.filter((v) => !v.imageSource);
    if (unsourced.length > 0 && page.gallery.length > 0) {
      console.log(
        `  Unsourced variants (${unsourced.map((v) => v.id).join(', ')}) — gallery candidates on page:`,
      );
      for (const g of page.gallery.slice(0, 16)) {
        console.log(`    - ${WIKIMON_PREFIX}${g.file}${g.caption ? `  (${g.caption})` : ''}`);
      }
    }

    if (
      missingColors.length === 0 &&
      missingVersions.length === 0 &&
      (page.years.length === 0 || variants.every((v) => page.years.includes(v.releaseYear))) &&
      unsourced.length === 0
    ) {
      console.log('  in sync');
    }
  }

  const listText = pages.get(WIKIMON_LIST_PAGE);
  if (listText) {
    const referenced = new Set(byPage.keys());
    const unreferencedPages = parseVirtualPetList(listText).filter((t) => !referenced.has(t));
    console.log(
      `\n## ${WIKIMON_LIST_PAGE}: ${unreferencedPages.length} pages not referenced by any product`,
    );
    console.log(`  ${unreferencedPages.join(' | ')}`);
  }

  console.log('\nReport only — nothing was written. Fold changes into the seed by hand.');
}

// ---------------------------------------------------------------------------
// Codegen
// ---------------------------------------------------------------------------

/** Product ids and names in the current generated file, for the run summary diff. */
async function loadExistingProducts() {
  try {
    const content = await readFile(OUT_PATH, 'utf-8');
    const entries = [];
    // A product literal has `name:` right after `id:`; variant literals have no
    // `name`, so the lazy `[^}]*?` never crosses one.
    const regex = /^  {\n    id:\s*'([^']+)',\n    name:\s*(['"])((?:\\.|(?!\2)[^\\])*)\2/gm;
    let match;
    while ((match = regex.exec(content)) !== null) {
      entries.push({ id: match[1], name: match[3].replace(/\\(.)/g, '$1') });
    }
    return entries;
  } catch {
    return [];
  }
}

/** Distinct `line` values in first-appearance order — what the Completion view iterates. */
function collectLines(products) {
  const lines = [];
  for (const p of products) if (!lines.includes(p.line)) lines.push(p.line);
  return lines;
}

const pad = (n) => '  '.repeat(n);

/** Emits a guide literal at the given indent depth; Prettier-stable (see `requires`). */
function guideLines(guide, depth) {
  const out = [];
  out.push(`${pad(depth)}guide: {`);
  out.push(`${pad(depth + 1)}overall: '${guide.overall}',`);
  out.push(`${pad(depth + 1)}tracks: [`);
  for (const track of guide.tracks) {
    out.push(`${pad(depth + 2)}{`);
    out.push(`${pad(depth + 3)}id: ${jsStr(track.id)},`);
    out.push(`${pad(depth + 3)}label: ${jsStr(track.label)},`);
    out.push(`${pad(depth + 3)}groups: [`);
    for (const group of track.groups) {
      out.push(`${pad(depth + 4)}{`);
      out.push(`${pad(depth + 5)}id: ${jsStr(group.id)},`);
      out.push(`${pad(depth + 5)}label: ${jsStr(group.label)},`);
      out.push(`${pad(depth + 5)}items: [`);
      for (const item of group.items) {
        out.push(`${pad(depth + 6)}{`);
        out.push(`${pad(depth + 7)}id: ${jsStr(item.id)},`);
        out.push(`${pad(depth + 7)}label: ${jsStr(item.label)},`);
        if (item.hint) out.push(`${pad(depth + 7)}hint: ${jsStr(item.hint)},`);
        if (item.requires?.length) {
          // One line while it fits the 100-column print width, otherwise one id
          // per line — exactly how Prettier would break it.
          const oneLine = `${pad(depth + 7)}requires: [${item.requires.map(jsStr).join(', ')}],`;
          if (oneLine.length <= 100) {
            out.push(oneLine);
          } else {
            out.push(`${pad(depth + 7)}requires: [`);
            for (const r of item.requires) out.push(`${pad(depth + 8)}${jsStr(r)},`);
            out.push(`${pad(depth + 7)}],`);
          }
        }
        out.push(`${pad(depth + 6)}},`);
      }
      out.push(`${pad(depth + 5)}],`);
      out.push(`${pad(depth + 4)}},`);
    }
    out.push(`${pad(depth + 3)}],`);
    out.push(`${pad(depth + 2)}},`);
  }
  out.push(`${pad(depth + 1)}],`);
  out.push(`${pad(depth)}},`);
  return out;
}

function generateProductsTs(products) {
  const lines = [
    ...generatedHeader(
      'scripts/seeds/dgm-products.json and scripts/seeds/dgm-guides/*.json (curated seeds; facts and images from Wikimon, CC BY-SA 3.0; guides transcribed from each device and its manual, cross-checked against humulos.com/digimon)',
      'update-dgm-data.mjs',
    ),
    '',
    '/** One colourway or regional edition of a product. `id` doubles as the ImageKit asset name. */',
    'export interface DgmVariant {',
    '  id: string;',
    '  colorway: string;',
    '  releaseYear: number;',
    "  region: 'JP' | 'NA' | 'EU' | 'ASIA';",
    '  imageUrl: string;',
    '}',
    '',
    'export interface DgmProgressItem {',
    '  /** `${trackId}:${slug}`, unique within the guide. */',
    '  id: string;',
    '  label: string;',
    '  /** Short requirement or flavour text shown beside the item. */',
    '  hint?: string;',
    '  /** Item ids that must be checked first; checking pulls them in, unchecking drops dependents. */',
    '  requires?: string[];',
    '}',
    '',
    'export interface DgmProgressGroup {',
    '  id: string;',
    '  label: string;',
    '  items: DgmProgressItem[];',
    '}',
    '',
    'export interface DgmProgressTrack {',
    '  id: string;',
    '  label: string;',
    '  groups: DgmProgressGroup[];',
    '}',
    '',
    '/** The in-game checklist for a product — its Progress Tracks and the overall formula. */',
    'export interface DgmProgressGuide {',
    '  /** How the overall percentage is derived from the tracks — chosen per product in the seed. */',
    "  overall: 'track-mean' | 'item-weighted';",
    '  tracks: DgmProgressTrack[];',
    '}',
    '',
    '/** One release; its colourways and regional editions are `variants`. */',
    'export interface DgmProduct {',
    '  id: string;',
    '  name: string;',
    '  /** Product line — open string; DGM_LINES lists the distinct values in catalog order. */',
    '  line: string;',
    '  /** Release within the line, e.g. "Ver.20th", "COLOR 1 Nature Spirits". */',
    '  series: string;',
    '  /** Earliest variant release year. */',
    '  releaseYear: number;',
    '  variants: DgmVariant[];',
    '  /** Present only for products with a hand-written progress guide. */',
    '  guide?: DgmProgressGuide;',
    '}',
    '',
    'export const ALL_PRODUCTS: DgmProduct[] = [',
  ];

  let currentLine = null;
  for (const p of products) {
    if (p.line !== currentLine) {
      currentLine = p.line;
      lines.push(`  // ${currentLine}`);
    }
    lines.push(`  {`);
    lines.push(`    id: '${p.id}',`);
    lines.push(`    name: ${jsStr(p.name)},`);
    lines.push(`    line: ${jsStr(p.line)},`);
    lines.push(`    series: ${jsStr(p.series)},`);
    lines.push(`    releaseYear: ${p.releaseYear},`);
    lines.push(`    variants: [`);
    for (const v of p.variants) {
      lines.push(`      {`);
      lines.push(`        id: '${v.id}',`);
      lines.push(`        colorway: ${jsStr(v.colorway)},`);
      lines.push(`        releaseYear: ${v.releaseYear},`);
      lines.push(`        region: '${v.region}',`);
      lines.push(`        imageUrl: '${v.imageUrl}',`);
      lines.push(`      },`);
    }
    lines.push(`    ],`);
    if (p.guide) lines.push(...guideLines(p.guide, 2));
    lines.push(`  },`);
  }

  lines.push('];', '');
  lines.push(
    '/** Distinct product lines in catalog (seed) order — iterated by the Completion view. */',
    'export const DGM_LINES: string[] = [',
    ...collectLines(products).map((l) => `  ${jsStr(l)},`),
    '];',
    '',
  );
  return lines.join('\n');
}

async function main() {
  console.log('Reading product seed...');
  const seed = JSON.parse(await readFile(SEED_PATH, 'utf-8'));
  const productIds = validateProductSeed(seed);
  const variantTotal = seed.reduce((n, p) => n + p.variants.length, 0);
  console.log(`  ${seed.length} products, ${variantTotal} variants in seed`);

  console.log('Reading progress guides...');
  const guides = await loadGuides();
  validateGuides(guides, productIds);
  const guideById = new Map(guides.map((g) => [g.productId, g.guide]));
  console.log(`  ${guides.length} guides`);

  if (SYNC_MODE) {
    await syncWikimon(seed);
    return;
  }

  loadLocalEnv();
  const { ensureAsset } = initImageKit();
  const { all: reuploadAll, flags: reuploadFlags } = parseReuploadFlags(['devices']);
  const reuploadDevices = reuploadAll || reuploadFlags.devices;

  const existingProducts = await loadExistingProducts();

  // One API round trip resolves every wikimon: file name to a URL.
  const allVariants = seed.flatMap((p) => p.variants);
  const wikimonFiles = allVariants
    .filter((v) => typeof v.imageSource === 'string' && v.imageSource.startsWith(WIKIMON_PREFIX))
    .map((v) => v.imageSource.slice(WIKIMON_PREFIX.length));
  const wikimonUrls = wikimonFiles.length > 0 ? await resolveWikimonFiles(wikimonFiles) : new Map();

  const products = [];
  let imgCount = 0;
  const failedImages = [];
  const unsourcedImages = [];

  for (const p of seed) {
    const variants = [];
    for (const v of p.variants) {
      // Images live on ImageKit only — never written into public/assets.
      const imageUrl = `/assets/digimon/devices/${v.id}.webp`;

      let sourceUrl = v.imageSource ?? null;
      if (sourceUrl?.startsWith(WIKIMON_PREFIX)) {
        sourceUrl = wikimonUrls.get(sourceUrl.slice(WIKIMON_PREFIX.length)) ?? null;
        if (!sourceUrl) {
          console.warn(`  ${v.id}: Wikimon file not found for ${v.imageSource}`);
          failedImages.push(v.id);
        }
      }

      if (sourceUrl) {
        const result = await ensureAsset({
          localPath: imageUrl,
          label: `Image for ${p.name} (${v.colorway})`,
          reupload: reuploadDevices,
          mimeType: 'image/webp',
          fetchBuffer: async () => {
            const raw = await downloadImage(sourceUrl);
            // Product shots are contain-fit on the card, so keep the aspect and
            // just cap the long side.
            return sharp(raw).resize(512, 512, { fit: 'inside' }).webp().toBuffer();
          },
        });
        if (result === 'uploaded') imgCount++;
        if (result === 'failed') failedImages.push(v.id);
      } else if (!v.imageSource) {
        unsourcedImages.push(v.id);
      }

      variants.push({
        id: v.id,
        colorway: v.colorway.trim(),
        releaseYear: v.releaseYear,
        region: v.region,
        imageUrl,
      });
    }

    products.push({
      id: p.id,
      name: p.name.trim(),
      line: p.line.trim(),
      series: p.series.trim(),
      releaseYear: Math.min(...variants.map((v) => v.releaseYear)),
      variants,
      ...(guideById.has(p.id) ? { guide: guideById.get(p.id) } : {}),
    });
  }

  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(OUT_PATH, generateProductsTs(products), 'utf-8');

  const { added, removed } = diffByKey(existingProducts, products, (p) => p.id);
  console.log('\nDone!');
  console.log(
    `  Products: ${products.length} total, ${variantTotal} variants (${formatDiff(added, removed)}) — ${imgCount} images uploaded`,
  );
  console.log(`  Lines   : ${collectLines(products).join(', ')}`);
  console.log(
    `  Guides  : ${
      guides
        .map(
          ({ productId, guide }) =>
            `${productId} (${guide.tracks.reduce((n, t) => n + t.groups.reduce((m, g) => m + g.items.length, 0), 0)} items)`,
        )
        .join(', ') || 'none'
    }`,
  );
  for (const p of added) console.log(`    + ${p.name} [${p.line} · ${p.releaseYear}]`);
  for (const p of removed) console.log(`    - ${p.name} (removed from seed)`);
  if (unsourcedImages.length > 0) {
    console.warn(`  No imageSource yet (${unsourcedImages.length}): ${unsourcedImages.join(', ')}`);
  }
  if (failedImages.length > 0) {
    console.warn(`  Missing images: ${failedImages.join(', ')}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
