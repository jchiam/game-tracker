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

// Returns a fully-formed ImageKit URL for a P5X persona mugshot.
// Personas share the thief image treatment: top-anchored square crop.
// Falls back to the raw local path when ImageKit is not configured.
export function getPersonaMugshotUrl(localPath: string): string {
  if (!isImageKitEnabled) return localPath;
  const tr = 'tr:fo-top,ar-1-1';
  return `${IMAGEKIT_URL_ENDPOINT}/${tr}${toImageKitPath(localPath)}`;
}

// Returns a fully-formed ImageKit URL for a small P5X persona avatar (picker list).
// Face-centered crop at 128px — no upscale needed at this display size.
// Falls back to the raw local path when ImageKit is not configured.
export function getPersonaAvatarUrl(localPath: string): string {
  if (!isImageKitEnabled) return localPath;
  const tr = 'tr:w-128,h-128,fo-face,c-at_max';
  return `${IMAGEKIT_URL_ENDPOINT}/${tr}${toImageKitPath(localPath)}`;
}

// Returns a fully-formed ImageKit URL for a ZZZ agent card portrait.
// Stored assets are the untouched Enka IconRole originals: full-body art on a
// large transparent canvas whose margins vary per agent. The chained transform
// first trims the transparent padding, then takes a top-anchored square so
// heads always survive — a plain center crop beheads agents whose art fills
// the canvas. Falls back to the raw local path when ImageKit is not configured.
export function getZzzAgentMugshotUrl(localPath: string): string {
  if (!isImageKitEnabled) return localPath;
  const tr = 'tr:t-true:ar-1-1,fo-top,w-256';
  return `${IMAGEKIT_URL_ENDPOINT}/${tr}${toImageKitPath(localPath)}`;
}

// Returns a fully-formed ImageKit URL for a small ZZZ agent avatar (picker
// lists, party slots). Trims the transparent canvas, then face-centered crop
// at 128px. Falls back to the raw local path when ImageKit is not configured.
export function getZzzAgentAvatarUrl(localPath: string): string {
  if (!isImageKitEnabled) return localPath;
  const tr = 'tr:t-true:w-128,h-128,fo-face,c-at_max';
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

// Returns a fully-formed ImageKit URL for an HSR light cone icon.
// Light cone icons are already square 128px artwork — no crop transform needed.
// Falls back to the raw local path when ImageKit is not configured.
export function getLightConeUrl(localPath: string): string {
  if (!isImageKitEnabled) return localPath;
  return `${IMAGEKIT_URL_ENDPOINT}${toImageKitPath(localPath)}`;
}
