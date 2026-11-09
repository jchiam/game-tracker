import type { CznPartner } from '@/data/chaos-zero-nightmare/partners';

/**
 * Display order for every CZN Partner list (equip picker, preferred-Partners
 * options): rarity descending, then name ascending. Returns a new array — the
 * generated catalog's order is never mutated.
 */
export function sortPartnersForDisplay(partners: CznPartner[]): CznPartner[] {
  return [...partners].sort((a, b) => b.rarity - a.rarity || a.name.localeCompare(b.name));
}
