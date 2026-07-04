// Shared plumbing for the per-game update scripts (scripts/update-*-data.mjs).
// Game-specific fetching, data mapping, and codegen stay in each script; this
// module owns only the pipeline mechanics that were previously copied verbatim:
// env loading, ImageKit init/existence-check/upload, asset-path derivation,
// reupload-flag parsing, fetch/download, slugify/esc, catalog diffing, and the
// generated-file banner.

import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import ImageKit, { toFile } from '@imagekit/nodejs';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** Repo root (scripts/lib → ../..). */
export const ROOT = resolve(__dirname, '..', '..');

/** Load .env.local if present (Node 22+ built-in). Call before initImageKit. */
export function loadLocalEnv() {
  try {
    process.loadEnvFile(resolve(ROOT, '.env.local'));
  } catch {
    // No .env.local — rely on environment variables already set (e.g. CI secrets)
  }
}

// Derive ImageKit folder and fileName from a local asset path.
// Path mapping mirrors toImageKitPath() from src/lib/imagekit.ts.
export function toImageKitLocation(localAssetPath) {
  const normalized = localAssetPath.replace(/\\/g, '/');
  const assetsIdx = normalized.indexOf('/assets/');
  if (assetsIdx === -1) return null;
  const segments = normalized
    .slice(assetsIdx)
    .replace(/^\/assets/, '')
    .split('/');
  const mapped = segments.map((seg, i) =>
    i < segments.length - 1 ? seg.replace(/[^a-zA-Z0-9]/g, '_') : seg,
  );
  return {
    fileName: mapped[mapped.length - 1],
    folder: '/' + mapped.slice(0, -1).filter(Boolean).join('/'),
  };
}

/**
 * Reads the IMAGEKIT_* / VITE_IMAGEKIT_* fallback chain at call time, logs
 * whether uploads are enabled, and returns { enabled, existsOnImageKit,
 * uploadToImageKit } closed over the client (or null when no private key).
 */
export function initImageKit() {
  const privateKey =
    process.env.IMAGEKIT_PRIVATE_KEY ?? process.env.VITE_IMAGEKIT_PRIVATE_KEY ?? '';
  const publicKey = process.env.IMAGEKIT_PUBLIC_KEY ?? process.env.VITE_IMAGEKIT_PUBLIC_KEY ?? '';
  const urlEndpoint =
    process.env.IMAGEKIT_URL_ENDPOINT ?? process.env.VITE_IMAGEKIT_URL_ENDPOINT ?? '';

  const client = privateKey ? new ImageKit({ privateKey, publicKey, urlEndpoint }) : null;

  if (client) {
    console.log('ImageKit uploads enabled');
  } else {
    console.log('ImageKit uploads skipped (IMAGEKIT_PRIVATE_KEY not set)');
  }

  // Check whether a file already exists on ImageKit. False when not configured.
  async function existsOnImageKit(localAssetPath) {
    if (!client) return false;
    const loc = toImageKitLocation(localAssetPath);
    if (!loc) return false;
    try {
      const existing = await client.assets.list({
        path: loc.folder,
        searchQuery: `name = "${loc.fileName}"`,
        limit: 1,
      });
      return existing.length > 0;
    } catch {
      return false;
    }
  }

  // Upload a buffer to ImageKit using the path derived from a local asset path.
  async function uploadToImageKit(buffer, localAssetPath, mimeType = 'image/webp') {
    if (!client) return;
    const loc = toImageKitLocation(localAssetPath);
    if (!loc) {
      console.warn(`    ImageKit: could not derive asset path from ${localAssetPath}`);
      return;
    }
    try {
      const uploadable = await toFile(buffer, loc.fileName, { type: mimeType });
      await client.files.upload({
        file: uploadable,
        fileName: loc.fileName,
        folder: loc.folder,
        useUniqueFileName: false,
      });
      console.log(`    Uploaded to ImageKit: ${loc.folder}/${loc.fileName}`);
    } catch (e) {
      console.warn(`    ImageKit upload failed: ${e?.message ?? String(e)}`);
    }
  }

  return { enabled: !!client, existsOnImageKit, uploadToImageKit };
}

/**
 * Parses --reupload-all and --reupload-{type} flags. Returns { all, flags }
 * where flags[type] is true when that type (or all) was requested. Logs the
 * active reupload mode.
 */
export function parseReuploadFlags(types, argv = process.argv.slice(2)) {
  const args = new Set(argv);
  const all = args.has('--reupload-all');
  const flags = {};
  for (const type of types) {
    flags[type] = all || args.has(`--reupload-${type}`);
  }
  if (all) {
    console.log('Reupload mode: all assets');
  } else {
    const active = types.filter((t) => flags[t]);
    if (active.length > 0) console.log(`Reupload mode: ${active.join(' + ')}`);
  }
  return { all, flags };
}

export async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return res.json();
}

// Download a raw image and return the buffer.
export async function downloadImage(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

// Slugs are Supabase FK ids — output must stay stable across runs.
export function slugify(name, separator = '_') {
  const collapse = new RegExp(`\\${separator}+`, 'g');
  const trim = new RegExp(`^\\${separator}|\\${separator}$`, 'g');
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, separator)
    .replace(collapse, separator)
    .replace(trim, '');
}

// Escape single quotes so they're safe inside single-quoted JS string literals.
export function esc(str) {
  return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

/** Diff two catalog arrays by key: entries in next but not existing are added, and vice versa. */
export function diffByKey(existing, next, keyFn) {
  const existingKeys = new Set(existing.map(keyFn));
  const nextKeys = new Set(next.map(keyFn));
  return {
    added: next.filter((item) => !existingKeys.has(keyFn(item))),
    removed: existing.filter((item) => !nextKeys.has(keyFn(item))),
  };
}

export function formatDiff(added, removed) {
  return added.length || removed.length
    ? `+${added.length} added, -${removed.length} removed`
    : 'no changes';
}

/** The two banner lines every generated src/data file starts with. */
export function generatedHeader(source, scriptName) {
  return [
    `// Auto-generated from ${source} — do not edit manually.`,
    `// Run \`node scripts/${scriptName}\` or trigger the GitHub Actions workflow to update.`,
  ];
}
