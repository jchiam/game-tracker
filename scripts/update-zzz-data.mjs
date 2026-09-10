// Auto-update script for Zenless Zone Zero catalog data.
// Fetches the latest data from the Enka.Network store (GitHub raw) and the
// HoyoLab wiki API, and regenerates:
//   - src/data/zenless-zone-zero/agents.ts
//   - src/data/zenless-zone-zero/disc_suits.ts
//   - src/data/zenless-zone-zero/wengines.ts
//   - src/data/zenless-zone-zero/bangboos.ts
// Downloads images from the Enka CDN / hoyoverse CDN and uploads to ImageKit:
//   - agent portraits → ImageKit: /zenless_zone_zero/agents
//   - disc suit icons → ImageKit: /zenless_zone_zero/disc-suits
//   - W-Engine icons → ImageKit: /zenless_zone_zero/wengines
//   - Bangboo icons → ImageKit: /zenless_zone_zero/bangboos
//
// Source notes: Hakush.in and its nankoa.cc revival are dead (NXDOMAIN, verified
// 2026-08-16); the Enka store is the maintained community source. Fallback if the
// store restructures: Dimbreath's ZenlessData mirror at git.mero.moe (raw game
// configs + TextMap — needs loc joins; FileCfg filenames are hash-obfuscated as
// of 2026-08-17). Bangboos come from the HoyoLab wiki API instead — the Enka
// store carries no bangboo file (verified 2026-08-17).
//
// Usage:
//   node scripts/update-zzz-data.mjs                      # only upload missing assets
//   node scripts/update-zzz-data.mjs --reupload-all       # force reupload all assets
//   node scripts/update-zzz-data.mjs --reupload-agents    # force reupload agent portraits
//   node scripts/update-zzz-data.mjs --reupload-discs     # force reupload disc suit icons
//   node scripts/update-zzz-data.mjs --reupload-wengines  # force reupload W-Engine icons
//   node scripts/update-zzz-data.mjs --reupload-bangboos  # force reupload Bangboo icons

import { readFile, writeFile, mkdir } from 'fs/promises';
import { resolve } from 'path';
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

const ENKA_STORE_BASE = 'https://raw.githubusercontent.com/EnkaNetwork/API-docs/master/store/zzz';
const ENKA_CDN_BASE = 'https://enka.network';
// HoyoLab wiki API — unauthenticated, but requires browser-like headers.
// Menu 15 is "Bangboo" under "Bangboo Database" (see get_menus).
const WIKI_API_BASE = 'https://sg-wiki-api.hoyolab.com/hoyowiki/zzz/wapi';
const WIKI_BANGBOO_MENU_ID = '15';
// The list endpoint rejects page_size > 30, so the fetch paginates.
const WIKI_PAGE_SIZE = 30;
const WIKI_HEADERS = {
  'Content-Type': 'application/json',
  Origin: 'https://wiki.hoyolab.com',
  Referer: 'https://wiki.hoyolab.com/',
  'X-Rpc-Wiki_app': 'zzz',
  'x-rpc-language': 'en-us',
};

loadLocalEnv();
const { ensureAsset } = initImageKit();

const { flags: reuploadFlags } = parseReuploadFlags(['agents', 'discs', 'wengines', 'bangboos']);
const reuploadAgents = reuploadFlags.agents;
const reuploadDiscs = reuploadFlags.discs;
const reuploadWEngines = reuploadFlags.wengines;
const reuploadBangboos = reuploadFlags.bangboos;

async function loadExistingAgents() {
  const filePath = resolve(ROOT, 'src/data/zenless-zone-zero/agents.ts');
  try {
    const content = await readFile(filePath, 'utf-8');
    const entries = [];
    // Matches the id (always single-quoted numeric string) and name (single- or
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

function generateAgentsTs(agents) {
  const sRanks = agents.filter((a) => a.rarity === 4);
  const aRanks = agents.filter((a) => a.rarity === 3);

  const lines = [
    ...generatedHeader(
      'Enka.Network store (github.com/EnkaNetwork/API-docs)',
      'update-zzz-data.mjs',
    ),
    '',
    'export interface ZzzAgent {',
    '  id: string;',
    '  name: string;',
    '  /** Enka rarity code: 4 = S-rank, 3 = A-rank. */',
    '  rarity: number;',
    '  /** Enka ProfessionType verbatim, e.g. Attack, Stun, Anomaly, Support, Defense, Rupture. */',
    '  specialty: string;',
    '  /** First Enka ElementTypes value verbatim, e.g. Elec, Physics, FireFrost, AuricEther. */',
    '  element: string;',
    '  imageUrl: string;',
    '}',
    '',
    'export const ALL_ZZZ_AGENTS: ZzzAgent[] = [',
  ];

  // jsStr() keeps the output Prettier-stable — the loadExistingAgents diff on
  // the next run depends on quoting matching what `npm run format` produces.
  const formatEntry = (a) =>
    [
      `  {`,
      `    id: '${a.id}',`,
      `    name: ${jsStr(a.name)},`,
      `    rarity: ${a.rarity},`,
      `    specialty: ${jsStr(a.specialty)},`,
      `    element: ${jsStr(a.element)},`,
      `    imageUrl: '${a.imageUrl}',`,
      `  },`,
    ].join('\n');

  if (sRanks.length > 0) {
    lines.push('  // S-Rank');
    lines.push(...sRanks.map(formatEntry));
  }
  if (aRanks.length > 0) {
    lines.push('  // A-Rank');
    lines.push(...aRanks.map(formatEntry));
  }

  lines.push('];', '');
  return lines.join('\n');
}

async function loadExistingSuits() {
  const filePath = resolve(ROOT, 'src/data/zenless-zone-zero/disc_suits.ts');
  try {
    const content = await readFile(filePath, 'utf-8');
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

function generateDiscSuitsTs(suits) {
  const lines = [
    ...generatedHeader(
      'Enka.Network store (github.com/EnkaNetwork/API-docs)',
      'update-zzz-data.mjs',
    ),
    '',
    'export interface ZzzDiscSuit {',
    '  id: string;',
    '  name: string;',
    '  icon: string;',
    '}',
    '',
    'export const ALL_ZZZ_DISC_SUITS: ZzzDiscSuit[] = [',
  ];

  for (const s of suits) {
    lines.push(
      `  {`,
      `    id: '${s.id}',`,
      `    name: ${jsStr(s.name)},`,
      `    icon: '${s.icon}',`,
      `  },`,
    );
  }

  lines.push('];', '');
  return lines.join('\n');
}

async function loadExistingWEngines() {
  const filePath = resolve(ROOT, 'src/data/zenless-zone-zero/wengines.ts');
  try {
    const content = await readFile(filePath, 'utf-8');
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

function generateWEnginesTs(wengines) {
  const lines = [
    ...generatedHeader(
      'Enka.Network store (github.com/EnkaNetwork/API-docs)',
      'update-zzz-data.mjs',
    ),
    '',
    'export interface ZzzWEngine {',
    '  id: string;',
    '  name: string;',
    '  /** Enka rarity code: 4 = S-rank, 3 = A-rank, 2 = B-rank. */',
    '  rarity: number;',
    '  /** Enka ProfessionType verbatim — same enum as the agent catalog. */',
    '  specialty: string;',
    '  imageUrl: string;',
    '}',
    '',
    'export const ALL_ZZZ_WENGINES: ZzzWEngine[] = [',
  ];

  const formatEntry = (w) =>
    [
      `  {`,
      `    id: '${w.id}',`,
      `    name: ${jsStr(w.name)},`,
      `    rarity: ${w.rarity},`,
      `    specialty: ${jsStr(w.specialty)},`,
      `    imageUrl: '${w.imageUrl}',`,
      `  },`,
    ].join('\n');

  lines.push(...wengines.map(formatEntry));
  lines.push('];', '');
  return lines.join('\n');
}

async function loadExistingBangboos() {
  const filePath = resolve(ROOT, 'src/data/zenless-zone-zero/bangboos.ts');
  try {
    const content = await readFile(filePath, 'utf-8');
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

// Paginated POST against the wiki list endpoint; follows `total` with an
// empty-page break so a source-side semantics change can't loop forever.
async function fetchBangbooEntries() {
  const entries = [];
  let total = Infinity;
  for (let pageNum = 1; entries.length < total; pageNum++) {
    const res = await fetchJSON(`${WIKI_API_BASE}/get_entry_page_list`, {
      method: 'POST',
      headers: WIKI_HEADERS,
      body: JSON.stringify({
        filters: [],
        menu_id: WIKI_BANGBOO_MENU_ID,
        page_num: pageNum,
        page_size: WIKI_PAGE_SIZE,
        use_es: true,
      }),
    });
    if (res.retcode !== 0 || !res.data) {
      throw new Error(`HoyoLab wiki API error: retcode ${res.retcode} (${res.message})`);
    }
    const list = res.data.list ?? [];
    if (list.length === 0) break;
    total = Number(res.data.total) || list.length;
    entries.push(...list);
  }
  return entries;
}

function generateBangboosTs(bangboos) {
  const lines = [
    ...generatedHeader('HoyoLab wiki API (sg-wiki-api.hoyolab.com)', 'update-zzz-data.mjs'),
    '',
    'export interface ZzzBangboo {',
    '  id: string;',
    '  name: string;',
    '  /** Wiki bangboo_rarity tag; null where the wiki leaves the Bangboo untagged. */',
    "  rarity: 'S' | 'A' | null;",
    '  imageUrl: string;',
    '}',
    '',
    'export const ALL_ZZZ_BANGBOOS: ZzzBangboo[] = [',
  ];

  const formatEntry = (b) =>
    [
      `  {`,
      `    id: '${b.id}',`,
      `    name: ${jsStr(b.name)},`,
      `    rarity: ${b.rarity === null ? 'null' : `'${b.rarity}'`},`,
      `    imageUrl: '${b.imageUrl}',`,
      `  },`,
    ].join('\n');

  lines.push(...bangboos.map(formatEntry));
  lines.push('];', '');
  return lines.join('\n');
}

async function main() {
  console.log('Fetching ZZZ data from the Enka.Network store and the HoyoLab wiki API...');

  const [
    avatars,
    equipments,
    weapons,
    locs,
    bangbooEntries,
    existingAgents,
    existingSuits,
    existingWEngines,
    existingBangboos,
  ] = await Promise.all([
    fetchJSON(`${ENKA_STORE_BASE}/avatars.json`),
    fetchJSON(`${ENKA_STORE_BASE}/equipments.json`),
    fetchJSON(`${ENKA_STORE_BASE}/weapons.json`),
    fetchJSON(`${ENKA_STORE_BASE}/locs.json`),
    fetchBangbooEntries(),
    loadExistingAgents(),
    loadExistingSuits(),
    loadExistingWEngines(),
    loadExistingBangboos(),
  ]);

  const en = locs?.en;
  const avatarIds = Object.keys(avatars ?? {});
  if (!en || avatarIds.length === 0) {
    throw new Error('Enka store shape changed: avatars.json empty or locs.json missing "en" table');
  }
  console.log(`  ${avatarIds.length} avatars listed`);

  const agents = [];
  let imgCount = 0;
  const failedImages = [];
  const skippedEntries = [];

  for (const id of avatarIds) {
    const avatar = avatars[id];
    const name = (en[avatar.Name] ?? '').trim();
    // Entries without a resolvable English display name are beta placeholders —
    // excluded rather than emitted with internal names.
    if (!name) {
      skippedEntries.push(`${id}:${avatar.Name}`);
      continue;
    }

    const element = avatar.ElementTypes?.[0];
    if (!avatar.ProfessionType || !element || !avatar.Image) {
      skippedEntries.push(`${id}:${name} (incomplete entry)`);
      continue;
    }

    // Originals are stored untouched (full-res PNG, transparent canvas and all).
    // Display crops (trim + top-anchored square / face crop) happen on the fly
    // via ImageKit transforms in src/lib/imagekit.ts — never baked into the asset.
    const imageUrl = `/assets/zenless-zone-zero/agents/${id}.png`;
    const result = await ensureAsset({
      localPath: imageUrl,
      label: `Portrait for ${name}`,
      reupload: reuploadAgents,
      mimeType: 'image/png',
      fetchBuffer: () => downloadImage(`${ENKA_CDN_BASE}${avatar.Image}`),
    });
    if (result === 'uploaded') imgCount++;
    if (result === 'failed') failedImages.push(id);

    agents.push({
      id,
      name,
      rarity: Number(avatar.Rarity),
      specialty: avatar.ProfessionType,
      element,
      imageUrl,
    });
  }

  // Sort: S-rank first, then alphabetically within each rarity group.
  agents.sort((a, b) => {
    if (a.rarity !== b.rarity) return b.rarity - a.rarity;
    return a.name.localeCompare(b.name);
  });

  // --- Drive Disc suits (Phase 2) ---
  const suitEntries = Object.entries(equipments?.Suits ?? {});
  if (suitEntries.length === 0) {
    throw new Error('Enka store shape changed: equipments.json missing "Suits" table');
  }
  console.log(`  ${suitEntries.length} disc suits listed`);

  const suits = [];
  let suitImgCount = 0;
  const failedSuitIcons = [];
  const skippedSuits = [];

  for (const [suitId, suit] of suitEntries) {
    const name = (en[suit.Name] ?? '').trim();
    if (!name || !suit.Icon) {
      skippedSuits.push(`${suitId}:${suit.Name}`);
      continue;
    }

    const icon = `/assets/zenless-zone-zero/disc-suits/${suitId}.png`;
    const result = await ensureAsset({
      localPath: icon,
      label: `Suit icon for ${name}`,
      reupload: reuploadDiscs,
      mimeType: 'image/png',
      fetchBuffer: () => downloadImage(`${ENKA_CDN_BASE}${suit.Icon}`),
    });
    if (result === 'uploaded') suitImgCount++;
    if (result === 'failed') failedSuitIcons.push(suitId);

    suits.push({ id: suitId, name, icon });
  }

  suits.sort((a, b) => a.name.localeCompare(b.name));

  // --- W-Engines (Phase 3) ---
  const weaponEntries = Object.entries(weapons ?? {});
  if (weaponEntries.length === 0) {
    throw new Error('Enka store shape changed: weapons.json empty');
  }
  console.log(`  ${weaponEntries.length} W-Engines listed`);

  const wengines = [];
  let wengineImgCount = 0;
  const failedWEngineIcons = [];
  const skippedWEngines = [];

  for (const [wengineId, weapon] of weaponEntries) {
    const name = (en[weapon.ItemName] ?? '').trim();
    if (!name || !weapon.ImagePath || !weapon.ProfessionType) {
      skippedWEngines.push(`${wengineId}:${weapon.ItemName}`);
      continue;
    }

    const imageUrl = `/assets/zenless-zone-zero/wengines/${wengineId}.png`;
    const result = await ensureAsset({
      localPath: imageUrl,
      label: `W-Engine icon for ${name}`,
      reupload: reuploadWEngines,
      mimeType: 'image/png',
      fetchBuffer: () => downloadImage(`${ENKA_CDN_BASE}${weapon.ImagePath}`),
    });
    if (result === 'uploaded') wengineImgCount++;
    if (result === 'failed') failedWEngineIcons.push(wengineId);

    wengines.push({
      id: wengineId,
      name,
      rarity: Number(weapon.Rarity),
      specialty: weapon.ProfessionType,
      imageUrl,
    });
  }

  // Sort: S-rank first, then alphabetically within each rarity band.
  wengines.sort((a, b) => {
    if (a.rarity !== b.rarity) return b.rarity - a.rarity;
    return a.name.localeCompare(b.name);
  });

  // --- Bangboos (Phase 4, HoyoLab wiki API) ---
  if (bangbooEntries.length === 0) {
    throw new Error('HoyoLab wiki API shape changed: Bangboo entry list empty');
  }
  console.log(`  ${bangbooEntries.length} Bangboos listed`);

  const bangboos = [];
  let bangbooImgCount = 0;
  const failedBangbooIcons = [];
  const skippedBangboos = [];

  for (const entry of bangbooEntries) {
    const id = entry.entry_page_id;
    const name = (entry.name ?? '').trim();
    if (!id || !name || !entry.icon_url) {
      skippedBangboos.push(`${id ?? '?'}:${entry.name ?? '?'}`);
      continue;
    }

    // Rarity tagging on the wiki is incomplete — untagged entries stay null
    // rather than guessed (renders as no badge in the picker).
    const rarityTag = entry.filter_values?.bangboo_rarity?.values?.[0];
    const rarity = rarityTag === 'S' || rarityTag === 'A' ? rarityTag : null;

    const imageUrl = `/assets/zenless-zone-zero/bangboos/${id}.png`;
    const result = await ensureAsset({
      localPath: imageUrl,
      label: `Bangboo icon for ${name}`,
      reupload: reuploadBangboos,
      mimeType: 'image/png',
      fetchBuffer: () => downloadImage(entry.icon_url),
    });
    if (result === 'uploaded') bangbooImgCount++;
    if (result === 'failed') failedBangbooIcons.push(id);

    bangboos.push({ id, name, rarity, imageUrl });
  }

  // Sort: S first, then A, untagged last; alphabetical within each band.
  const rarityRank = (r) => (r === 'S' ? 0 : r === 'A' ? 1 : 2);
  bangboos.sort((a, b) => {
    if (rarityRank(a.rarity) !== rarityRank(b.rarity))
      return rarityRank(a.rarity) - rarityRank(b.rarity);
    return a.name.localeCompare(b.name);
  });

  await mkdir(resolve(ROOT, 'src/data/zenless-zone-zero'), { recursive: true });
  await writeFile(
    resolve(ROOT, 'src/data/zenless-zone-zero/agents.ts'),
    generateAgentsTs(agents),
    'utf-8',
  );
  await writeFile(
    resolve(ROOT, 'src/data/zenless-zone-zero/disc_suits.ts'),
    generateDiscSuitsTs(suits),
    'utf-8',
  );
  await writeFile(
    resolve(ROOT, 'src/data/zenless-zone-zero/wengines.ts'),
    generateWEnginesTs(wengines),
    'utf-8',
  );
  await writeFile(
    resolve(ROOT, 'src/data/zenless-zone-zero/bangboos.ts'),
    generateBangboosTs(bangboos),
    'utf-8',
  );

  const { added, removed } = diffByKey(existingAgents, agents, (a) => a.id);
  const suitDiff = diffByKey(existingSuits, suits, (s) => s.id);
  const wengineDiff = diffByKey(existingWEngines, wengines, (w) => w.id);
  const bangbooDiff = diffByKey(existingBangboos, bangboos, (b) => b.id);
  console.log('\nDone!');
  console.log(
    `  Agents: ${agents.length} total (${formatDiff(added, removed)}) — ${imgCount} images uploaded`,
  );
  for (const a of added)
    console.log(`    + ${a.name} [${a.rarity === 4 ? 'S' : 'A'} ${a.specialty} · ${a.element}]`);
  for (const a of removed) console.log(`    - ${a.name} (removed from source)`);
  console.log(
    `  Disc suits: ${suits.length} total (${formatDiff(suitDiff.added, suitDiff.removed)}) — ${suitImgCount} icons uploaded`,
  );
  for (const s of suitDiff.added) console.log(`    + ${s.name}`);
  for (const s of suitDiff.removed) console.log(`    - ${s.name} (removed from source)`);
  console.log(
    `  W-Engines: ${wengines.length} total (${formatDiff(wengineDiff.added, wengineDiff.removed)}) — ${wengineImgCount} icons uploaded`,
  );
  for (const w of wengineDiff.added)
    console.log(
      `    + ${w.name} [${w.rarity === 4 ? 'S' : w.rarity === 3 ? 'A' : 'B'} ${w.specialty}]`,
    );
  for (const w of wengineDiff.removed) console.log(`    - ${w.name} (removed from source)`);
  console.log(
    `  Bangboos: ${bangboos.length} total (${formatDiff(bangbooDiff.added, bangbooDiff.removed)}) — ${bangbooImgCount} icons uploaded`,
  );
  for (const b of bangbooDiff.added) console.log(`    + ${b.name} [${b.rarity ?? '?'}]`);
  for (const b of bangbooDiff.removed) console.log(`    - ${b.name} (removed from source)`);
  if (skippedEntries.length > 0) {
    console.log(`  Skipped entries: ${skippedEntries.join(', ')}`);
  }
  if (skippedSuits.length > 0) {
    console.log(`  Skipped suits: ${skippedSuits.join(', ')}`);
  }
  if (skippedWEngines.length > 0) {
    console.log(`  Skipped W-Engines: ${skippedWEngines.join(', ')}`);
  }
  if (skippedBangboos.length > 0) {
    console.log(`  Skipped Bangboos: ${skippedBangboos.join(', ')}`);
  }
  if (failedImages.length > 0) {
    console.warn(`  Missing agent images: ${failedImages.join(', ')}`);
  }
  if (failedSuitIcons.length > 0) {
    console.warn(`  Missing suit icons: ${failedSuitIcons.join(', ')}`);
  }
  if (failedWEngineIcons.length > 0) {
    console.warn(`  Missing W-Engine icons: ${failedWEngineIcons.join(', ')}`);
  }
  if (failedBangbooIcons.length > 0) {
    console.warn(`  Missing Bangboo icons: ${failedBangbooIcons.join(', ')}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
