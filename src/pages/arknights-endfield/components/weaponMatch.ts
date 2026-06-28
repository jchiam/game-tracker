import { ALL_WEAPONS } from '@/data/arknights-endfield/weapons';

/**
 * Resolve the equipped weapon (stored by display name) to its rank in the
 * preference list (stored by id). Bridges the two identifier spaces via
 * ALL_WEAPONS. Returns the 0-based rank, or null when there is no weapon, the
 * name doesn't resolve to a catalog entry, or the weapon isn't in the list.
 * Never throws.
 */
export function resolveWeaponRank(
  weaponName: string | null,
  weaponPreferences: string[],
): number | null {
  if (!weaponName) return null;
  const weapon = ALL_WEAPONS.find((w) => w.name === weaponName);
  if (!weapon) return null;
  const idx = weaponPreferences.indexOf(weapon.id);
  return idx === -1 ? null : idx;
}
