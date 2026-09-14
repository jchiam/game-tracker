import type { DgmVariant } from '@/data/digimon/products';
import type { DgmOwnership, DgmTrackedProduct, DgmTrackedVariant } from '@/types';

/** A variant is owned when the collector holds at least one copy in any condition. */
export function variantOwned(state: DgmTrackedVariant | undefined): boolean {
  return !!state && state.copies.sealed + state.copies.boxed + state.copies.loose > 0;
}

/** A variant is playable when at least one copy is opened (boxed or loose); sealed copies cannot run. */
export function variantPlayable(state: DgmTrackedVariant | undefined): boolean {
  return !!state && state.copies.boxed + state.copies.loose > 0;
}

/**
 * Ownership is derived from the variant state, never stored: owned if any
 * variant holds a copy, else wishlist if any is wishlisted, else interested
 * (the product is tracked but nothing is set — the collector wants to remember
 * it). A wishlist flag on an owned variant does not lower ownership.
 */
export function deriveOwnership(tracked: DgmTrackedProduct): DgmOwnership {
  const states = Object.values(tracked.variantState);
  if (states.some(variantOwned)) return 'owned';
  if (states.some((s) => s.wishlist)) return 'wishlist';
  return 'interested';
}

/** The Game Progress gate: some variant has a copy that can actually be played. */
export function isPlayable(tracked: DgmTrackedProduct): boolean {
  return Object.values(tracked.variantState).some(variantPlayable);
}

export function ownedVariantCount(tracked: DgmTrackedProduct): number {
  return tracked.variants.filter((v) => variantOwned(tracked.variantState[v.id])).length;
}

/** Every copy of every variant, all conditions summed. */
export function copyCount(tracked: DgmTrackedProduct): number {
  return Object.values(tracked.variantState).reduce(
    (sum, s) => sum + s.copies.sealed + s.copies.boxed + s.copies.loose,
    0,
  );
}

/** The card's picture: the first owned variant in catalog order, else the first variant. */
export function representativeVariant(tracked: DgmTrackedProduct): DgmVariant {
  return (
    tracked.variants.find((v) => variantOwned(tracked.variantState[v.id])) ?? tracked.variants[0]
  );
}
