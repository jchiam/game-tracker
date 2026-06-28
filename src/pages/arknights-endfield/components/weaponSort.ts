import type { AeWeapon } from '@/data/arknights-endfield/weapons';

export function sortWeaponsForDisplay(weapons: AeWeapon[]): AeWeapon[] {
  return [...weapons].sort((a, b) => b.rarity - a.rarity || a.name.localeCompare(b.name));
}
