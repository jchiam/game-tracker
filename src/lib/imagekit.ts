export const IMAGEKIT_URL_ENDPOINT = (import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT ?? '').trim();
if (!IMAGEKIT_URL_ENDPOINT)
  console.warn('ImageKit not configured: VITE_IMAGEKIT_URL_ENDPOINT is not set');

// Whether ImageKit is configured in this environment
export const isImageKitEnabled = IMAGEKIT_URL_ENDPOINT.length > 0;

// Convert a local asset path (/assets/...) to an ImageKit-relative path (/...)
// Hyphens in directory names are replaced with underscores (ImageKit folder limitation).
// The filename segment is left unchanged.
export function toImageKitPath(localPath: string): string {
  const segments = localPath.replace(/^\/assets/, '').split('/');
  return segments
    .map((seg, i) => (i < segments.length - 1 ? seg.replace(/[^a-zA-Z0-9]/g, '_') : seg))
    .join('/');
}

// Returns a fully-formed ImageKit URL for an arcanist mugshot.
// All mugshots live in /reverse_1999/arcanists_mugshots/ regardless of source.
// Pipeline: top-anchored square crop only — mugshots use CN headicons (full-resolution)
// as the primary source, with kornblume icon as fallback for unmatched characters.
// Falls back to the raw local path when ImageKit is not configured.
export function getMugshotUrl(localPath: string): string {
  if (!isImageKitEnabled) return localPath;
  const tr = 'tr:fo-top,ar-1-1';
  return `${IMAGEKIT_URL_ENDPOINT}/${tr}${toImageKitPath(localPath)}`;
}

// Returns a fully-formed ImageKit URL for a small arcanist avatar (e.g. modal list items).
// Uses face-centered crop at 128px — no upscale needed at this display size.
// Falls back to the raw local path when ImageKit is not configured.
export function getAvatarUrl(localPath: string): string {
  if (!isImageKitEnabled) return localPath;
  const tr = 'tr:w-128,h-128,fo-face,c-at_max';
  return `${IMAGEKIT_URL_ENDPOINT}/${tr}${toImageKitPath(localPath)}`;
}

// Returns a fully-formed ImageKit URL for a psychube icon.
// Psychube icons are already square artwork — no crop transform needed.
// Falls back to the raw local path when ImageKit is not configured.
export function getPsychubeUrl(localPath: string): string {
  if (!isImageKitEnabled) return localPath;
  return `${IMAGEKIT_URL_ENDPOINT}${toImageKitPath(localPath)}`;
}

// Returns a fully-formed ImageKit URL for an HSR relic set icon.
// Relic icons are already square PNG artwork — no crop transform needed.
// Falls back to the raw local path when ImageKit is not configured.
export function getRelicIconUrl(localPath: string): string {
  if (!isImageKitEnabled) return localPath;
  return `${IMAGEKIT_URL_ENDPOINT}${toImageKitPath(localPath)}`;
}
