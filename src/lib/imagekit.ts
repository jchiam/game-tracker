export const IMAGEKIT_URL_ENDPOINT = (import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT ?? '').trim();
console.log(
  IMAGEKIT_URL_ENDPOINT
    ? `ImageKit configured with endpoint: ${IMAGEKIT_URL_ENDPOINT}`
    : 'ImageKit not configured',
);

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
