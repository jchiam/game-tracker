import type { DgmVariant } from '@/data/digimon/products';
import type { DgmOwnership, DgmTrackedProduct } from '@/types';

/**
 * Ownership is derived from the variant state, never stored: owned if any
 * variant is owned, else wishlist if any is wishlisted, else interested (the
 * product is tracked but nothing is set — the collector wants to remember it).
 */
export function deriveOwnership(tracked: DgmTrackedProduct): DgmOwnership {
  const states = Object.values(tracked.variantState);
  if (states.some((s) => s.status === 'owned')) return 'owned';
  if (states.some((s) => s.status === 'wishlist')) return 'wishlist';
  return 'interested';
}

export function ownedVariantCount(tracked: DgmTrackedProduct): number {
  return tracked.variants.filter((v) => tracked.variantState[v.id]?.status === 'owned').length;
}

/** The card's picture: the first owned variant in catalog order, else the first variant. */
export function representativeVariant(tracked: DgmTrackedProduct): DgmVariant {
  return (
    tracked.variants.find((v) => tracked.variantState[v.id]?.status === 'owned') ??
    tracked.variants[0]
  );
}
