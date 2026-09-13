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

// Card mugshot chain: top-anchored square crop, then cap the side at 480px
// without upscaling. The roster card header is 250px tall in a 280px-min
// column, so 480 covers 2x displays; `c-at_max` leaves sources already smaller
// than that (HSR's 256px portraits) untouched instead of inflating them, while
// the full-resolution CN headicons R1999 stores drop from ~150 KB to ~50 KB.
const MUGSHOT_CROP = 'tr:fo-top,ar-1-1:w-480,c-at_max';

// Returns a fully-formed ImageKit URL for an arcanist mugshot.
// All mugshots live in /reverse_1999/arcanists_mugshots/ regardless of source.
// Pipeline: `MUGSHOT_CROP` — mugshots use CN headicons (full-resolution)
// as the primary source, with kornblume icon as fallback for unmatched characters.
// Falls back to the raw local path when ImageKit is not configured.
export function getMugshotUrl(localPath: string): string {
  if (!isImageKitEnabled) return localPath;
  return `${IMAGEKIT_URL_ENDPOINT}/${MUGSHOT_CROP}${toImageKitPath(localPath)}`;
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
// Personas share the thief image treatment (`MUGSHOT_CROP`).
// Falls back to the raw local path when ImageKit is not configured.
export function getPersonaMugshotUrl(localPath: string): string {
  if (!isImageKitEnabled) return localPath;
  return `${IMAGEKIT_URL_ENDPOINT}/${MUGSHOT_CROP}${toImageKitPath(localPath)}`;
}

// Returns a fully-formed ImageKit URL for a small P5X persona avatar (picker list).
// Face-centered crop at 128px — no upscale needed at this display size.
// Falls back to the raw local path when ImageKit is not configured.
export function getPersonaAvatarUrl(localPath: string): string {
  if (!isImageKitEnabled) return localPath;
  const tr = 'tr:w-128,h-128,fo-face,c-at_max';
  return `${IMAGEKIT_URL_ENDPOINT}/${tr}${toImageKitPath(localPath)}`;
}

// ZZZ agent crop, shared by the card mugshot and picker avatar below.
// Stored assets are the untouched Enka IconRole originals: full-body art on a
// large transparent canvas whose margins vary per agent. The chain: trim the
// transparent padding, then extract a top-anchored square whose side is 45% of
// the trimmed figure HEIGHT (relative `h-0.45` + `cm-extract`). Anchoring to
// height keeps the head-to-bust framing consistent across poses — a plain
// top square sides on the trimmed WIDTH, so wide poses (spread coats, held
// weapons) zoom out to tiny faces while narrow poses zoom in. Face-detection
// crops (`fo-face` / `fo-auto`) were rejected: detection fails on several
// agents' stylized art and falls back to headless torso crops.
const ZZZ_AGENT_CROP = 't-true:h-0.45,ar-1-1,cm-extract,fo-top';

// Returns a fully-formed ImageKit URL for a ZZZ agent card portrait.
// Falls back to the raw local path when ImageKit is not configured.
export function getZzzAgentMugshotUrl(localPath: string): string {
  if (!isImageKitEnabled) return localPath;
  const tr = `tr:${ZZZ_AGENT_CROP}:w-256`;
  return `${IMAGEKIT_URL_ENDPOINT}/${tr}${toImageKitPath(localPath)}`;
}

// Returns a fully-formed ImageKit URL for a small ZZZ agent avatar (picker
// lists, party slots) — same head-to-bust framing at 128px. Tighter head-only
// zooms were rejected: art with tall props above the head (Sigrid's spear)
// shifts the figure off the bbox centerline and clips the face at small crops.
// Falls back to the raw local path when ImageKit is not configured.
export function getZzzAgentAvatarUrl(localPath: string): string {
  if (!isImageKitEnabled) return localPath;
  const tr = `tr:${ZZZ_AGENT_CROP}:w-128`;
  return `${IMAGEKIT_URL_ENDPOINT}/${tr}${toImageKitPath(localPath)}`;
}

// Returns a fully-formed ImageKit URL for a ZZZ Drive Disc suit icon.
// Suit icons are already square Enka artwork — plain width resize, no crop.
// Falls back to the raw local path when ImageKit is not configured.
export function getZzzDiscSuitIconUrl(localPath: string): string {
  if (!isImageKitEnabled) return localPath;
  return `${IMAGEKIT_URL_ENDPOINT}/tr:w-128${toImageKitPath(localPath)}`;
}

// Returns a fully-formed ImageKit URL for a ZZZ W-Engine icon.
// Engine icons are already square Enka artwork — plain width resize, no crop.
// Falls back to the raw local path when ImageKit is not configured.
export function getZzzWEngineIconUrl(localPath: string): string {
  if (!isImageKitEnabled) return localPath;
  return `${IMAGEKIT_URL_ENDPOINT}/tr:w-128${toImageKitPath(localPath)}`;
}

// Returns a fully-formed ImageKit URL for a ZZZ Bangboo icon.
// Wiki bangboo icons are already square renders — plain width resize, no crop.
// Falls back to the raw local path when ImageKit is not configured.
export function getZzzBangbooIconUrl(localPath: string): string {
  if (!isImageKitEnabled) return localPath;
  return `${IMAGEKIT_URL_ENDPOINT}/tr:w-128${toImageKitPath(localPath)}`;
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

// Returns a fully-formed ImageKit URL for a Digimon device product shot.
// Devices are not portraits: keep the whole object visible (contain-fit inside
// a 480px box, no upscale) instead of the top-anchored mugshot crop.
// Falls back to the raw local path when ImageKit is not configured.
export function getDeviceImageUrl(localPath: string): string {
  if (!isImageKitEnabled) return localPath;
  const tr = 'tr:w-480,h-480,c-at_max';
  return `${IMAGEKIT_URL_ENDPOINT}/${tr}${toImageKitPath(localPath)}`;
}
