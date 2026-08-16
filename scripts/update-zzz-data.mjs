// Auto-update script for Zenless Zone Zero agent data.
// Fetches the latest data from the Enka.Network store (GitHub raw) and regenerates:
//   - src/data/zenless-zone-zero/agents.ts
// Downloads agent portraits from the Enka CDN and uploads to ImageKit:
//   - agent portraits → ImageKit: /zenless_zone_zero/agents
//
// Source notes: Hakush.in and its nankoa.cc revival are dead (NXDOMAIN, verified
// 2026-08-16); the Enka store is the maintained community source. Fallback if the
// store restructures: Dimbreath's ZenlessData mirror at git.mero.moe (raw game
// configs + TextMap — needs loc joins).
//
// Phases 2–3 extend this script with Drive Disc suits (store/zzz/equipments.json)
// and W-Engines (store/zzz/weapons.json, store/zzz/property.json for stat names)
// as additional fetch + map + emit sections reusing the same loc resolution and
// ensureAsset plumbing.
//
// Usage:
//   node scripts/update-zzz-data.mjs                   # only upload missing assets
//   node scripts/update-zzz-data.mjs --reupload-all    # force reupload all assets
//   node scripts/update-zzz-data.mjs --reupload-agents # force reupload agent portraits

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

loadLocalEnv();
const { ensureAsset } = initImageKit();

const { flags: reuploadFlags } = parseReuploadFlags(['agents']);
const reuploadAgents = reuploadFlags.agents;

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

async function main() {
  console.log('Fetching ZZZ agent data from the Enka.Network store...');

  const [avatars, locs, existingAgents] = await Promise.all([
    fetchJSON(`${ENKA_STORE_BASE}/avatars.json`),
    fetchJSON(`${ENKA_STORE_BASE}/locs.json`),
    loadExistingAgents(),
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

  const outPath = resolve(ROOT, 'src/data/zenless-zone-zero/agents.ts');
  await mkdir(resolve(ROOT, 'src/data/zenless-zone-zero'), { recursive: true });
  await writeFile(outPath, generateAgentsTs(agents), 'utf-8');

  const { added, removed } = diffByKey(existingAgents, agents, (a) => a.id);
  console.log('\nDone!');
  console.log(
    `  Agents: ${agents.length} total (${formatDiff(added, removed)}) — ${imgCount} images uploaded`,
  );
  for (const a of added)
    console.log(`    + ${a.name} [${a.rarity === 4 ? 'S' : 'A'} ${a.specialty} · ${a.element}]`);
  for (const a of removed) console.log(`    - ${a.name} (removed from source)`);
  if (skippedEntries.length > 0) {
    console.log(`  Skipped entries: ${skippedEntries.join(', ')}`);
  }
  if (failedImages.length > 0) {
    console.warn(`  Missing agent images: ${failedImages.join(', ')}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
