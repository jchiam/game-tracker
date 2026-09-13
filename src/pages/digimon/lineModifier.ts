/** Badge modifier for a product line: `dgm-line-{slug}`, coloured per known line in DeviceCard.css. */
export function lineModifier(line: string): string {
  return line
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
