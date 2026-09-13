// Update script for the Digimon digivice / virtual-pet device catalog.
//
// The catalog is curated, not fetched: scripts/seeds/dgm-devices.json is the
// source of truth and is edited by hand in a normal PR; src/data/digimon/ is
// never hand-edited. Wikimon (MediaWiki api.php, CC BY-SA 3.0) is the fact
// source for release dates, shell lists, and product images; Humulos is
// reserved for evolution guides and is not a catalog source. See design D6 in
// the add-collectibles-home-modality change for the source study. The script:
//   - validates the seed (unique ids, required fields, region enum, 4-digit year)
//   - resolves `imageSource: "wikimon:<File name>"` to the file's URL via the
//     Wikimon API, then uploads each device image to ImageKit via the shared
//     pipeline (device images → ImageKit: /digimon/devices)
//   - regenerates src/data/digimon/devices.ts (ALL_DEVICES + DGM_LINES)
//
// Seed rows may carry `imageSource: null` when no image has been sourced yet;
// such rows are emitted with their local imageUrl (the card falls back to
// ui-avatars) and listed as missing. Rows may carry `wikimon: "<Page title>"`
// naming the Wikimon page that documents them — the sync report groups by it.
//
// --sync-wikimon is a report, never a write: it fetches every referenced
// Wikimon page and prints colourways the seed lacks, seed years the page does
// not list, version titles with no seed row, gallery image candidates for
// unsourced rows, and pages in Wikimon's List of Virtual Pets that no seed row
// references. A human folds what matters into the seed — the seed is curated
// (which colourways count as entries is the collector's call), so no source
// ever overwrites it.
//
// Usage:
//   node scripts/update-dgm-data.mjs                    # only upload missing assets
//   node scripts/update-dgm-data.mjs --reupload-all     # force reupload all assets
//   node scripts/update-dgm-data.mjs --reupload-devices # force reupload device images
//   node scripts/update-dgm-data.mjs --sync-wikimon     # drift report only; writes nothing

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
  jsStr,
  diffByKey,
  formatDiff,
  generatedHeader,
} from './lib/pipeline.mjs';

const SEED_PATH = resolve(ROOT, 'scripts/seeds/dgm-devices.json');
const OUT_DIR = resolve(ROOT, 'src/data/digimon');
const OUT_PATH = resolve(OUT_DIR, 'devices.ts');

const WIKIMON_API = 'https://wikimon.net/api.php';
const WIKIMON_LIST_PAGE = 'List of Virtual Pets';
const WIKIMON_UA = 'game-tracker/update-dgm-data.mjs (device catalog sync)';
const WIKIMON_PREFIX = 'wikimon:';
const WIKIMON_BATCH = 50;

const REGIONS = ['JP', 'NA', 'EU', 'ASIA'];
const REQUIRED = ['id', 'name', 'line', 'series', 'releaseYear', 'region', 'colorway'];

const SYNC_MODE = process.argv.includes('--sync-wikimon');

/** Throws naming the first offending row; writes nothing on failure. */
function validateSeed(rows) {
  if (!Array.isArray(rows)) throw new Error('Seed must be a JSON array');
  const seen = new Set();
  rows.forEach((row, i) => {
    const where = `seed row ${i}${row?.id ? ` (${row.id})` : ''}`;
    for (const key of REQUIRED) {
      if (row[key] === undefined || row[key] === null || row[key] === '') {
        throw new Error(`${where}: missing required field "${key}"`);
      }
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(row.id)) {
      throw new Error(`${where}: id must be a kebab-case slug`);
    }
    if (seen.has(row.id)) throw new Error(`${where}: duplicate id`);
    seen.add(row.id);
    if (!REGIONS.includes(row.region)) {
      throw new Error(`${where}: region "${row.region}" not in ${REGIONS.join('/')}`);
    }
    if (!Number.isInteger(row.releaseYear) || row.releaseYear < 1000 || row.releaseYear > 9999) {
      throw new Error(`${where}: releaseYear must be a four-digit integer`);
    }
    if (row.imageSource !== null && row.imageSource !== undefined) {
      const ok =
        typeof row.imageSource === 'string' &&
        (/^https?:\/\//.test(row.imageSource) ||
          (row.imageSource.startsWith(WIKIMON_PREFIX) &&
            row.imageSource.length > WIKIMON_PREFIX.length));
      if (!ok) {
        throw new Error(
          `${where}: imageSource must be an http(s) URL, "${WIKIMON_PREFIX}<File name>", or null`,
        );
      }
    }
    if (row.wikimon !== undefined && (typeof row.wikimon !== 'string' || row.wikimon === '')) {
      throw new Error(`${where}: wikimon must be a non-empty page title when present`);
    }
  });
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

/** Strip the wiki markup that shows up inside infobox values. */
function cleanWikitext(value) {
  return value
    .replace(/<ref[^>]*>[\s\S]*?<\/ref>/g, '')
    .replace(/<ref[^>]*\/>/g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
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
  const files = new Map();
  const captions = new Map();
  for (const m of wikitext.matchAll(/^\|i(\d+)=([^{\n]+?)\s*(?:\{\{!\}\}.*)?$/gm)) {
    files.set(m[1], m[2].trim());
  }
  for (const m of wikitext.matchAll(/^\|c(\d+)=(.*)$/gm)) {
    captions.set(m[1], cleanWikitext(m[2]).replace(/\n/g, ' '));
  }
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
async function syncWikimon(seed) {
  const byPage = new Map();
  for (const row of seed) {
    if (!row.wikimon) continue;
    if (!byPage.has(row.wikimon)) byPage.set(row.wikimon, []);
    byPage.get(row.wikimon).push(row);
  }
  const unreferencedRows = seed.filter((r) => !r.wikimon).map((r) => r.id);

  console.log(`Wikimon sync: ${byPage.size} pages referenced by ${seed.length} seed rows`);
  if (unreferencedRows.length > 0) {
    console.log(
      `  Rows without a wikimon page (${unreferencedRows.length}): ${unreferencedRows.join(', ')}`,
    );
  }

  const pages = await fetchWikimonPages([...byPage.keys(), WIKIMON_LIST_PAGE]);

  for (const [title, rows] of byPage) {
    const text = pages.get(title);
    console.log(`\n## ${title} (${rows.length} seed rows)`);
    if (!text) {
      console.log('  PAGE MISSING on Wikimon — check the title in the seed');
      continue;
    }
    const page = parseWikimonPage(text);
    const rowKeys = rows.map((r) => norm(`${r.name} ${r.colorway}`));

    const missingColors = page.colors.filter((c) => {
      const key = norm(c);
      return key && !rowKeys.some((k) => k.includes(key));
    });
    if (missingColors.length > 0) {
      console.log(`  Colourways on page with no seed row (${missingColors.length}):`);
      for (const c of missingColors) console.log(`    - ${c}`);
    }

    if (page.years.length > 0) {
      const offYear = rows.filter((r) => !page.years.includes(r.releaseYear));
      if (offYear.length > 0) {
        console.log(`  Seed years not listed on page (page lists ${page.years.join(', ')}):`);
        for (const r of offYear) console.log(`    - ${r.id}: ${r.releaseYear}`);
      }
    }

    const missingVersions = page.versions.filter((v) => {
      const key = norm(v);
      return key && !rowKeys.some((k) => k.includes(key));
    });
    if (missingVersions.length > 0) {
      console.log(`  Version titles on page with no seed row (${missingVersions.length}):`);
      for (const v of missingVersions) console.log(`    - ${v}`);
    }

    const unsourced = rows.filter((r) => !r.imageSource);
    if (unsourced.length > 0 && page.gallery.length > 0) {
      console.log(
        `  Unsourced rows (${unsourced.map((r) => r.id).join(', ')}) — gallery candidates on page:`,
      );
      for (const g of page.gallery.slice(0, 16)) {
        console.log(`    - ${WIKIMON_PREFIX}${g.file}${g.caption ? `  (${g.caption})` : ''}`);
      }
    }

    if (
      missingColors.length === 0 &&
      missingVersions.length === 0 &&
      (page.years.length === 0 || rows.every((r) => page.years.includes(r.releaseYear))) &&
      unsourced.length === 0
    ) {
      console.log('  in sync');
    }
  }

  const listText = pages.get(WIKIMON_LIST_PAGE);
  if (listText) {
    const referenced = new Set(byPage.keys());
    const unreferenced = parseVirtualPetList(listText).filter((t) => !referenced.has(t));
    console.log(
      `\n## ${WIKIMON_LIST_PAGE}: ${unreferenced.length} pages not referenced by any seed row`,
    );
    console.log(`  ${unreferenced.join(' | ')}`);
  }

  console.log('\nReport only — nothing was written. Fold changes into the seed by hand.');
}

// ---------------------------------------------------------------------------
// Catalog generation
// ---------------------------------------------------------------------------

async function loadExistingDevices() {
  try {
    const content = await readFile(OUT_PATH, 'utf-8');
    const entries = [];
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

/** Distinct `line` values in first-appearance order — what the Completion view iterates. */
function collectLines(devices) {
  const lines = [];
  for (const d of devices) if (!lines.includes(d.line)) lines.push(d.line);
  return lines;
}

function generateDevicesTs(devices) {
  const lines = [
    ...generatedHeader(
      'scripts/seeds/dgm-devices.json (curated seed; facts and images from Wikimon, CC BY-SA 3.0)',
      'update-dgm-data.mjs',
    ),
    '',
    'export interface DgmDevice {',
    '  id: string;',
    '  name: string;',
    '  /** Product line — open string; DGM_LINES lists the distinct values in catalog order. */',
    '  line: string;',
    '  /** Release within the line, e.g. "Ver.20th", "COLOR 1 Nature Spirits". */',
    '  series: string;',
    '  releaseYear: number;',
    "  region: 'JP' | 'NA' | 'EU' | 'ASIA';",
    '  colorway: string;',
    '  imageUrl: string;',
    '}',
    '',
    'export const ALL_DEVICES: DgmDevice[] = [',
  ];

  // jsStr() keeps the output Prettier-stable (see its definition in pipeline.mjs).
  const formatEntry = (d) =>
    [
      `  {`,
      `    id: '${d.id}',`,
      `    name: ${jsStr(d.name)},`,
      `    line: ${jsStr(d.line)},`,
      `    series: ${jsStr(d.series)},`,
      `    releaseYear: ${d.releaseYear},`,
      `    region: '${d.region}',`,
      `    colorway: ${jsStr(d.colorway)},`,
      `    imageUrl: '${d.imageUrl}',`,
      `  },`,
    ].join('\n');

  let currentLine = null;
  for (const d of devices) {
    if (d.line !== currentLine) {
      currentLine = d.line;
      lines.push(`  // ${currentLine}`);
    }
    lines.push(formatEntry(d));
  }

  lines.push('];', '');
  lines.push(
    '/** Distinct product lines in catalog (seed) order — iterated by the Completion view. */',
    'export const DGM_LINES: string[] = [',
    ...collectLines(devices).map((l) => `  ${jsStr(l)},`),
    '];',
    '',
  );
  return lines.join('\n');
}

async function main() {
  console.log('Reading device seed...');
  const seed = JSON.parse(await readFile(SEED_PATH, 'utf-8'));
  validateSeed(seed);
  console.log(`  ${seed.length} devices in seed`);

  if (SYNC_MODE) {
    await syncWikimon(seed);
    return;
  }

  loadLocalEnv();
  const { ensureAsset } = initImageKit();
  const { all: reuploadAll, flags: reuploadFlags } = parseReuploadFlags(['devices']);
  const reuploadDevices = reuploadAll || reuploadFlags.devices;

  const existingDevices = await loadExistingDevices();

  // One API round trip resolves every wikimon: file name to a URL.
  const wikimonFiles = seed
    .filter((r) => typeof r.imageSource === 'string' && r.imageSource.startsWith(WIKIMON_PREFIX))
    .map((r) => r.imageSource.slice(WIKIMON_PREFIX.length));
  const wikimonUrls = wikimonFiles.length > 0 ? await resolveWikimonFiles(wikimonFiles) : new Map();

  const devices = [];
  let imgCount = 0;
  const failedImages = [];
  const unsourcedImages = [];

  for (const row of seed) {
    // Images live on ImageKit only — never written into public/assets.
    const imageUrl = `/assets/digimon/devices/${row.id}.webp`;

    let sourceUrl = row.imageSource ?? null;
    if (sourceUrl?.startsWith(WIKIMON_PREFIX)) {
      sourceUrl = wikimonUrls.get(sourceUrl.slice(WIKIMON_PREFIX.length)) ?? null;
      if (!sourceUrl) {
        console.warn(`  ${row.id}: Wikimon file not found for ${row.imageSource}`);
        failedImages.push(row.id);
      }
    }

    if (sourceUrl) {
      const result = await ensureAsset({
        localPath: imageUrl,
        label: `Image for ${row.name}`,
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
      if (result === 'failed') failedImages.push(row.id);
    } else if (!row.imageSource) {
      unsourcedImages.push(row.id);
    }

    devices.push({
      id: row.id,
      name: row.name.trim(),
      line: row.line.trim(),
      series: row.series.trim(),
      releaseYear: row.releaseYear,
      region: row.region,
      colorway: row.colorway.trim(),
      imageUrl,
    });
  }

  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(OUT_PATH, generateDevicesTs(devices), 'utf-8');

  const { added, removed } = diffByKey(existingDevices, devices, (d) => d.id);
  console.log('\nDone!');
  console.log(
    `  Devices : ${devices.length} total (${formatDiff(added, removed)}) — ${imgCount} images uploaded`,
  );
  console.log(`  Lines   : ${collectLines(devices).join(', ')}`);
  for (const d of added) console.log(`    + ${d.name} [${d.line} · ${d.releaseYear} ${d.region}]`);
  for (const d of removed) console.log(`    - ${d.name} (removed from seed)`);
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
