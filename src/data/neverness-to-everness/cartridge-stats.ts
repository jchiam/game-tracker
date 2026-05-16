// Auto-generated from everness.info GraphQL API — do not edit manually.
// Run `node scripts/update-n2e-data.mjs` or trigger the GitHub Actions workflow to update.

export const CARTRIDGE_MAIN_STATS = [
  'ATK %',
  'HP %',
  'DEF %',
  'CRIT Rate %',
  'CRIT DMG %',
  'Healing Bonus %',
  'Cosmos DMG Bonus %',
  'Anima DMG Bonus %',
  'Incantation DMG Bonus %',
  'Psyche DMG Bonus %',
  'Chaos DMG Bonus %',
  'Lakshana DMG Bonus %',
  'Mental DMG Bonus %',
  'Cycle Intensity',
  'Break Intensity',
] as const;

export const CARTRIDGE_SUB_STATS = [
  'ATK',
  'ATK %',
  'HP',
  'HP %',
  'DEF',
  'DEF %',
  'CRIT Rate %',
  'CRIT DMG %',
  'Universal DMG Bonus %',
  'Cycle Intensity',
  'Break Intensity',
] as const;

export const CARTRIDGE_RARITIES = ['B', 'A', 'S'] as const;

export type CartridgeMainStat = (typeof CARTRIDGE_MAIN_STATS)[number];
export type CartridgeSubStat = (typeof CARTRIDGE_SUB_STATS)[number];
export type CartridgeRarity = (typeof CARTRIDGE_RARITIES)[number];
