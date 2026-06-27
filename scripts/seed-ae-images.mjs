// One-shot seed script for Arknights: Endfield operator portraits.
// Downloads operator portraits from prydwen.gg and uploads to ImageKit.
// Idempotent — skips operators whose images already exist in ImageKit.
//
// The OPERATORS id array below must stay in sync with ALL_OPERATORS in
// src/data/arknights-endfield/operators.ts. See the full manual-maintenance
// procedure in openspec/specs/ae-operator-catalog/spec.md.
//
// Usage:
//   node scripts/seed-ae-images.mjs                # skip already-uploaded
//   node scripts/seed-ae-images.mjs --reupload     # force reupload all

import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import ImageKit, { toFile } from '@imagekit/nodejs';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

try {
  process.loadEnvFile(resolve(ROOT, '.env.local'));
} catch {
  // No .env.local — rely on environment variables
}

const IMAGEKIT_PRIVATE_KEY =
  process.env.IMAGEKIT_PRIVATE_KEY ?? process.env.VITE_IMAGEKIT_PRIVATE_KEY ?? '';
const IMAGEKIT_PUBLIC_KEY =
  process.env.IMAGEKIT_PUBLIC_KEY ?? process.env.VITE_IMAGEKIT_PUBLIC_KEY ?? '';
const IMAGEKIT_URL_ENDPOINT =
  process.env.IMAGEKIT_URL_ENDPOINT ?? process.env.VITE_IMAGEKIT_URL_ENDPOINT ?? '';

const imagekitClient = IMAGEKIT_PRIVATE_KEY
  ? new ImageKit({
      privateKey: IMAGEKIT_PRIVATE_KEY,
      publicKey: IMAGEKIT_PUBLIC_KEY,
      urlEndpoint: IMAGEKIT_URL_ENDPOINT,
    })
  : null;

if (!imagekitClient) {
  console.error('ImageKit credentials not configured. Set IMAGEKIT_PRIVATE_KEY in .env.local');
  process.exit(1);
}

const IMAGEKIT_FOLDER = '/arknights_endfield/operators';
const REUPLOAD = process.argv.includes('--reupload');

const OPERATORS = [
  'akekuri',
  'alesh',
  'antal',
  'arclight',
  'ardelia',
  'avywenna',
  'camille',
  'catcher',
  'chen-qianyu',
  'da-pan',
  'ember',
  'endministrator',
  'estella',
  'fluorite',
  'gilberta',
  'laevatain',
  'last-rite',
  'lifeng',
  'mi-fu',
  'perlica',
  'pogranichnik',
  'rossi',
  'snowshine',
  'tangtang',
  'wulfgard',
  'xaihi',
  'yvonne',
  'zhuang-fangyi',
];

async function getExistingFiles() {
  try {
    const files = await imagekitClient.assets.list({ path: IMAGEKIT_FOLDER, limit: 200 });
    return new Set(files.map((f) => f.name));
  } catch {
    return new Set();
  }
}

async function downloadImage(operatorId) {
  const urls = [
    `https://cdn.prydwen.gg/images/arknights-endfield/characters/${operatorId}_icon.webp`,
    `https://cdn.prydwen.gg/images/arknights-endfield/characters/${operatorId}_card.webp`,
    `https://www.prydwen.gg/static/arknights-endfield/characters/${operatorId}_icon.webp`,
  ];
  for (const url of urls) {
    const res = await fetch(url);
    if (res.ok) {
      return Buffer.from(await res.arrayBuffer());
    }
  }
  console.warn(`  ⚠ Could not download image for ${operatorId}`);
  return null;
}

async function main() {
  console.log(`Seeding Endfield operator portraits to ImageKit...`);
  console.log(`Folder: ${IMAGEKIT_FOLDER}`);
  console.log(`Reupload: ${REUPLOAD}`);
  console.log('');

  const existing = REUPLOAD ? new Set() : await getExistingFiles();
  let uploaded = 0;
  let skipped = 0;
  let failed = 0;

  for (const id of OPERATORS) {
    const filename = `${id}.webp`;

    if (existing.has(filename)) {
      console.log(`  ✓ ${id} (exists, skipping)`);
      skipped++;
      continue;
    }

    const imgBuffer = await downloadImage(id);
    if (!imgBuffer) {
      failed++;
      continue;
    }

    // Convert to 256px square webp
    const processed = await sharp(imgBuffer).resize(256, 256, { fit: 'cover' }).webp().toBuffer();

    try {
      const uploadable = await toFile(processed, filename, { type: 'image/webp' });
      await imagekitClient.files.upload({
        file: uploadable,
        fileName: filename,
        folder: IMAGEKIT_FOLDER,
        useUniqueFileName: false,
      });
      console.log(`  ↑ ${id} (uploaded)`);
      uploaded++;
    } catch (err) {
      console.error(`  ✕ ${id} upload failed:`, err.message);
      failed++;
    }
  }

  console.log('');
  console.log(`Done: ${uploaded} uploaded, ${skipped} skipped, ${failed} failed`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
